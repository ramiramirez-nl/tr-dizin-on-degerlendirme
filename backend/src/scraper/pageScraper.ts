import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { withRetry } from '../utils/retry';
import { TtlCache } from '../utils/ttlCache';

export type ScrapeErrorType = 'timeout' | 'network' | 'http';

export interface ScrapeResult {
  accessible: boolean;
  text: string;
  links: string[];
  statusCode: number;
  errorType?: ScrapeErrorType;
}

export function validatePublicUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`URL protocol not allowed: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    throw new Error(`Internal URL not allowed: ${hostname}`);
  }

  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^100\.64\./,
    /^0\./,
    /^fc[0-9a-f]{2}:/i,
    /^fe80:/i,
  ];
  if (privateRanges.some((r) => r.test(hostname))) {
    throw new Error(`Private/internal URL not allowed: ${hostname}`);
  }

  const blockedHostnames = ['metadata.google.internal', 'instance-data'];
  if (blockedHostnames.includes(hostname)) {
    throw new Error(`Blocked hostname: ${hostname}`);
  }

  return parsed.toString();
}

const REAL_BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,tr;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

// Successful scrape results only — repeat submissions for the same journal
// skip the network round-trip. 24h TTL, capped to bound memory.
const scrapeCache = new TtlCache<ScrapeResult>(24 * 60 * 60 * 1000, 200);

export function clearScrapeCache(): void {
  scrapeCache.clear();
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  let safeUrl: string;
  try {
    safeUrl = validatePublicUrl(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[scraper] Blocked unsafe URL: ${msg}`);
    return { accessible: false, text: '', links: [], statusCode: 0, errorType: 'network' };
  }

  const cached = scrapeCache.get(safeUrl);
  if (cached) return cached;

  try {
    const doGet = () => axios.get(safeUrl, {
      headers: REAL_BROWSER_HEADERS,
      timeout: 15000,
      maxRedirects: 3,
      // Re-validate every redirect target so a public URL cannot bounce the
      // request into a private/internal address (SSRF via redirect).
      beforeRedirect: (options: { protocol?: string; hostname?: string; path?: string; href?: string }) => {
        const target =
          options.href ?? `${options.protocol ?? 'http:'}//${options.hostname ?? ''}${options.path ?? ''}`;
        validatePublicUrl(target);
      },
      validateStatus: (status) => status < 500,
      responseType: 'text',
      maxContentLength: MAX_RESPONSE_BYTES,
      maxBodyLength: MAX_RESPONSE_BYTES,
    });

    // Retry once on transient failures (timeout / connection reset).
    // HTTP 4xx resolves normally (validateStatus) so it is never retried;
    // SSRF blocks throw non-retryable errors and fail fast.
    const response = await withRetry(doGet, {
      attempts: 2,
      shouldRetry: (err) =>
        err instanceof Error && !/not allowed|Blocked hostname|Invalid URL/i.test(err.message),
    });

    const statusCode = response.status;
    const html = String(response.data ?? '');

    if (statusCode >= 400) {
      return { accessible: false, text: '', links: [], statusCode, errorType: 'http' };
    }

    const $ = cheerio.load(html);
    $('script, style, nav, footer, noscript, iframe').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    const links: string[] = [];
    $('a[href]').each((_i, el) => {
      const href = $(el).attr('href') ?? '';
      if (href.startsWith('http')) links.push(href);
    });

    const result: ScrapeResult = { accessible: true, text, links, statusCode };
    scrapeCache.set(safeUrl, result);
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorType: ScrapeErrorType =
      err instanceof Error && (err.name === 'TimeoutError' || /timeout/i.test(message))
        ? 'timeout'
        : 'network';
    console.warn(`Scrape failed for ${url}: ${message.slice(0, 200)}`);
    return { accessible: false, text: '', links: [], statusCode: 0, errorType };
  }
}
