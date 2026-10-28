import axios from 'axios';
import { withRetry } from '../utils/retry';
import { TtlCache } from '../utils/ttlCache';

export interface IssnLookupResult {
  valid: boolean;
  registeredTitle: string;
  issn: string;
  /** True when issn.org could not be reached — validity is unknown, not refuted. */
  lookupFailed?: boolean;
}

/**
 * Look up an ISSN at portal.issn.org.
 * portal.issn.org no longer exposes ?format=json publicly — instead we fetch
 * the public HTML page and parse the <title> tag, which contains:
 *   "ISSN 1234-5678 - Journal Title (Print|Online)"
 * Missing/unregistered ISSNs return a "Page not found" title (or 404).
 */
// Registered ISSN metadata rarely changes — cache definitive lookups for 24h
// (failed lookups are never cached so transient outages self-heal).
const issnCache = new TtlCache<IssnLookupResult>(24 * 60 * 60 * 1000, 500);

export function clearIssnCache(): void {
  issnCache.clear();
}

export async function lookupIssn(issn: string): Promise<IssnLookupResult> {
  const cleanIssn = issn.replace(/[^0-9X-]/gi, '').toUpperCase();

  // Add the hyphen back if missing (8 digits -> 1234-5678)
  const formatted =
    cleanIssn.length === 8 && !cleanIssn.includes('-')
      ? `${cleanIssn.slice(0, 4)}-${cleanIssn.slice(4)}`
      : cleanIssn;

  const cached = issnCache.get(formatted);
  if (cached) return cached;

  try {
    const url = `https://portal.issn.org/resource/ISSN/${formatted}`;
    // Retry once when no HTTP response arrived (timeout / connection error).
    const response = await withRetry(
      () =>
        axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
          validateStatus: (s) => s < 500,
          responseType: 'text',
        }),
      {
        attempts: 2,
        shouldRetry: (err) => axios.isAxiosError(err) && !err.response,
      }
    );

    const html = String(response.data ?? '');

    const remember = (result: IssnLookupResult): IssnLookupResult => {
      issnCache.set(formatted, result);
      return result;
    };

    // 404 / not-found page
    if (
      response.status === 404 ||
      /Resource not found|Page not found/i.test(html)
    ) {
      return remember({ valid: false, registeredTitle: '', issn: formatted });
    }

    // Parse <title>ISSN 2636-8536 - Eskiyeni (Online)</title>
    const titleMatch = html.match(/<title>\s*([^<]+?)\s*<\/title>/i);
    if (!titleMatch) {
      return remember({ valid: false, registeredTitle: '', issn: formatted });
    }

    const title = titleMatch[1].trim();
    // Strip leading "ISSN xxxx-xxxx - " and trailing "(Online|Print)"
    const cleaned = title
      .replace(/^ISSN\s+[0-9]{4}-[0-9]{3}[0-9X]\s*-\s*/i, '')
      .replace(/\s*\((Online|Print|Electronic|Linking)\)\s*$/i, '')
      .trim();

    if (!cleaned || /not found/i.test(cleaned)) {
      return remember({ valid: false, registeredTitle: '', issn: formatted });
    }

    return remember({
      valid: true,
      registeredTitle: cleaned,
      issn: formatted,
    });
  } catch (err) {
    if (axios.isAxiosError(err) && err.response && err.response.status < 500) {
      return { valid: false, registeredTitle: '', issn: cleanIssn };
    }
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`ISSN lookup failed for ${cleanIssn}: ${message.slice(0, 200)}`);
    return { valid: false, registeredTitle: '', issn: cleanIssn, lookupFailed: true };
  }
}
