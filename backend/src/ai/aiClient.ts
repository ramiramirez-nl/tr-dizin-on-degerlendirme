import axios from 'axios';
import { createHash } from 'crypto';
import { withRetry } from '../utils/retry';
import { TtlCache } from '../utils/ttlCache';

/**
 * AI client. OpenAI-compatible REST API.
 * Defaults to freemodel.dev free models, but works with any OpenAI-compatible
 * endpoint (set OPENAI_BASE_URL + OPENAI_API_KEY).
 *
 * Env vars:
 *  - OPENAI_API_KEY   (required)
 *  - OPENAI_BASE_URL  (default https://api.freemodel.dev/v1)
 *  - AI_MODEL         (default gpt-4o-mini)
 *
 * Legacy fallback: GEMINI_API_KEY still read so existing deployments keep working
 * (treated as OPENAI_API_KEY if OPENAI_API_KEY missing).
 */

const BASE_URL = process.env.OPENAI_BASE_URL ?? 'https://api.freemodel.dev/v1';
const MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini';
const API_KEY = process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';

/** Characters of page text sent to the model. */
const PAGE_TEXT_LIMIT = 8000;

export interface AnalysisInput {
  pageText: string;
  /** Declared language metadata from the page head (html lang, hreflang, ...). */
  pageMeta?: string;
  criteria: string;
  url: string;
  language?: string;
}

export interface AnalysisResult {
  found: boolean;
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
  issues: string[];
  /** True when the AI check could not run (no API key / service error). */
  skipped?: boolean;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY ?? process.env.GEMINI_API_KEY);
}

function isValidAnalysisResult(value: unknown): value is AnalysisResult {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.found === 'boolean' &&
    (v.confidence === 'high' || v.confidence === 'medium' || v.confidence === 'low') &&
    typeof v.evidence === 'string' &&
    Array.isArray(v.issues) &&
    v.issues.every((i) => typeof i === 'string')
  );
}

// Successful analyses only (skipped/error results are never cached) —
// identical page + criterion pairs skip the paid AI round-trip for 24h.
const analysisCache = new TtlCache<AnalysisResult>(24 * 60 * 60 * 1000, 500);

export function clearAnalysisCache(): void {
  analysisCache.clear();
}

export async function analyzePageContent(
  input: AnalysisInput
): Promise<AnalysisResult> {
  if (!isAiConfigured()) {
    return {
      found: false,
      confidence: 'low',
      evidence: 'AI verification skipped: no API key configured (OPENAI_API_KEY or GEMINI_API_KEY).',
      issues: ['AI verification skipped'],
      skipped: true,
    };
  }

  const cacheKey = createHash('sha256')
    .update([MODEL, input.language ?? '', input.criteria, input.pageMeta ?? '', input.pageText.slice(0, PAGE_TEXT_LIMIT)].join('|'))
    .digest('hex');
  const cached = analysisCache.get(cacheKey);
  if (cached) return cached;

  const langInstruction =
    input.language && input.language !== 'en'
      ? `\nIMPORTANT: Write the "evidence" and "issues" fields in the language identified by ISO 639-1 code "${input.language}". Do NOT translate the JSON keys, only the values.`
      : '';

  const prompt = `You are a compliance checker for TR Dizin, the Turkish national academic journal index run by TÜBİTAK ULAKBİM. Journal pages are usually in Turkish, sometimes in English; evaluate the content in whichever language it is written.

Analyze the following webpage content and check if it meets this criterion:
CRITERION: ${input.criteria}
URL: ${input.url}
${langInstruction}
${input.pageMeta ? `PAGE LANGUAGE METADATA (hints only; html lang and hreflang describe the website interface, not necessarily the journal's publication language): ${input.pageMeta}\n` : ''}PAGE CONTENT (first ${PAGE_TEXT_LIMIT} chars; navigation and menu text are included and the page may be cut off):
${input.pageText.slice(0, PAGE_TEXT_LIMIT)}

If you cannot find the requirement, say it was not found in the provided excerpt. Do not claim the whole page lacks it.

Respond ONLY with valid JSON in this exact format, no markdown fences:
{
  "found": true/false,
  "confidence": "high"/"medium"/"low",
  "evidence": "Quote or description of what you found (or did not find)",
  "issues": ["List of specific problems if any, empty array if none"]
}`;

  try {
    const doPost = () =>
      axios.post(
        `${BASE_URL}/chat/completions`,
        {
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
          },
          // 20s per AI call keeps the worst-case validator (4 sequential
          // scrape+AI checks) inside the 150s overall assessment budget.
          timeout: 20000,
        }
      );

    // Retry once on transient failures: no HTTP response (timeout / network)
    // or a retryable status (429 rate limit, 5xx).
    const response = await withRetry(doPost, {
      attempts: 2,
      shouldRetry: (err) => {
        if (!axios.isAxiosError(err)) return false;
        if (!err.response) return true;
        return err.response.status === 429 || err.response.status >= 500;
      },
    });

    const text: string =
      response.data?.choices?.[0]?.message?.content ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        found: false,
        confidence: 'low',
        evidence: `Could not parse AI response: ${text.slice(0, 200)}`,
        issues: ['AI analysis failed'],
        skipped: true,
      };
    }
    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!isValidAnalysisResult(parsed)) {
      return {
        found: false,
        confidence: 'low',
        evidence: `AI response missing required fields: ${jsonMatch[0].slice(0, 200)}`,
        issues: ['AI analysis returned malformed result'],
        skipped: true,
      };
    }
    analysisCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const keyHint = API_KEY
      ? `key set (len=${API_KEY.length})`
      : 'OPENAI_API_KEY missing';
    return {
      found: false,
      confidence: 'low',
      evidence: `AI service error: ${message.slice(0, 300)} [${keyHint}, model=${MODEL}]`,
      issues: [`AI check skipped: ${message.slice(0, 200)}`],
      skipped: true,
    };
  }
}
