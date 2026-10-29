import type { ScrapeResult } from '../scraper/pageScraper';
import { scrapeUrl } from '../scraper/pageScraper';
import { analyzePageContent } from '../ai/aiClient';
import type { CheckStatus, ReportItem } from '../types/report';

/**
 * Helpers shared by all section validators.
 *
 * Report text is produced in the UI language (Turkish by default, English
 * otherwise) so the report reads naturally for TR Dizin's Turkish-speaking
 * editors. AI criteria strings stay in English because they are instructions
 * for the model, not user-facing text.
 */

export interface Bilingual {
  tr: string;
  en: string;
}

const REF_NUM = '\\d+(?:\\.\\d+)?';
const REF_TOKEN = new RegExp(
  `(?:ÖK|GH|K|T) ${REF_NUM}(?:\\s*[–-]\\s*${REF_NUM})?|Sözleşme \\d+(?:\\s*[/,]\\s*\\d+)*`,
  'g'
);
const REF_NAMES: Record<string, Bilingual> = {
  ÖK: { tr: 'Ön Koşul', en: 'Prerequisite' },
  K: { tr: 'Kriter', en: 'Criterion' },
  GH: { tr: 'Genel Husus', en: 'General Point' },
  T: { tr: 'Tavsiye', en: 'Recommendation' },
  Sözleşme: { tr: 'Başvuru Sözleşmesi', en: 'Application Agreement' },
};

/**
 * Spell out criterion shorthand for readers. Every parenthesised group made
 * only of codes (`ÖK n`, `K n`, `K 8.2`, `GH n`, `T n`, `Sözleşme 13/14`,
 * ranges and comma lists) is rewritten, e.g. `(ÖK 10–14, GH 8)` becomes
 * `(Ön Koşul 10–14, Genel Husus 8)`. Other parentheses and URLs are untouched.
 */
export function expandRefs(text: string, language?: string): string {
  const lang = language === 'en' ? 'en' : 'tr';
  return text.replace(/\(([^()]*)\)/g, (whole, inner: string) => {
    const rest = inner.replace(REF_TOKEN, '');
    if (rest === inner || /[^\s,;]/.test(rest)) return whole;
    const expanded = inner.replace(REF_TOKEN, (token) => {
      const code = token.startsWith('Sözleşme') ? 'Sözleşme' : token.slice(0, token.indexOf(' '));
      return `${REF_NAMES[code][lang]}${token.slice(code.length)}`;
    });
    return `(${expanded})`;
  });
}

export function pick(language: string | undefined, text: Bilingual): string {
  return expandRefs(language === 'en' ? text.en : text.tr, language);
}

/** Append a criterion reference such as `(K 15)` to a report message, spelled out for the reader. */
export function withRef(message: string, ref?: string, language?: string): string {
  return ref ? `${message} ${expandRefs(`(${ref})`, language)}` : message;
}

export interface AccessFailure {
  message: string;
  suggestion: string;
}

export function describeAccessFailure(
  url: string,
  scraped: ScrapeResult,
  language?: string,
  ref?: string
): AccessFailure {
  switch (scraped.errorType) {
    case 'timeout':
      return {
        message: withRef(
          pick(language, {
            tr: `${url} adresi 15 saniye içinde yanıt vermedi (zaman aşımı). Sayfa yavaş veya geçici olarak erişilemez olabilir; bu, sayfanın eksik olduğunu kanıtlamaz.`,
            en: `The URL ${url} did not respond within 15 seconds (timeout). It may be slow or temporarily down; this is not proof the page is missing.`,
          }),
          ref,
          language
        ),
        suggestion: pick(language, {
          tr: 'Sayfanın normal bir tarayıcıda hızlı yüklendiğini doğrulayın ve değerlendirmeyi yeniden çalıştırın. Yavaş yüklenen sayfalar TR Dizin uzman incelemesinde de sorun yaratabilir.',
          en: 'Verify the page loads quickly from a regular browser and re-run the assessment. Slow-loading pages may also cause problems during TR Dizin expert review.',
        }),
      };
    case 'http':
      return {
        message: withRef(
          pick(language, {
            tr: `${url} adresi HTTP ${scraped.statusCode} döndürdü.`,
            en: `The URL ${url} returned HTTP ${scraped.statusCode}.`,
          }),
          ref,
          language
        ),
        suggestion: pick(language, {
          tr: 'Kırık bağlantıyı düzeltin: sayfa giriş yapmadan herkese açık olmalı ve HTTP 200 döndürmelidir.',
          en: 'Fix the broken link: the page must be publicly accessible without login and return HTTP 200.',
        }),
      };
    default:
      return {
        message: withRef(
          pick(language, {
            tr: `${url} adresine ulaşılamadı (ağ hatası veya geçersiz adres).`,
            en: `The URL ${url} could not be reached (network error or invalid address).`,
          }),
          ref,
          language
        ),
        suggestion: pick(language, {
          tr: 'URL’de yazım hatası olup olmadığını kontrol edin; sitenin çevrimiçi ve giriş gerektirmeden erişilebilir olduğundan emin olun.',
          en: 'Check the URL for typos and ensure the site is online and publicly accessible without login.',
        }),
      };
  }
}

export interface CheckUrlOptions {
  /** When false, a missing URL yields a warning instead of a fail. */
  required?: boolean;
  /** Criterion reference appended to every message, e.g. `K 15` or `ÖK 9`. */
  ref?: string;
}

/**
 * Scrape a URL, run an AI content check against `aiCriteria`, and return a
 * single report item. Inaccessible pages are a fail (HTTP/network) or a
 * warning (timeout); pages where the AI check cannot run are a warning so the
 * editor verifies manually.
 */
export async function checkUrl(
  url: string,
  section: string,
  field: string,
  aiCriteria: string,
  failSuggestion: Bilingual,
  language?: string,
  options: CheckUrlOptions = {}
): Promise<ReportItem> {
  const required = options.required ?? true;
  if (!url) {
    return {
      section,
      field,
      status: required ? 'fail' : 'warning',
      message: withRef(
        pick(language, {
          tr: 'Bu kontrol için URL verilmedi.',
          en: 'No URL was provided for this check.',
        }),
        options.ref,
        language
      ),
      suggestion: pick(language, failSuggestion),
    };
  }
  const scraped = await scrapeUrl(url);
  if (!scraped.accessible) {
    const failure = describeAccessFailure(url, scraped, language, options.ref);
    return {
      section,
      field,
      status: scraped.errorType === 'timeout' ? 'warning' : 'fail',
      message: failure.message,
      suggestion: failure.suggestion,
      url,
    };
  }
  const analysis = await analyzePageContent({
    pageText: scraped.text,
    pageMeta: scraped.meta,
    criteria: aiCriteria,
    url,
    language,
  });
  const status: CheckStatus = analysis.found ? 'pass' : analysis.skipped ? 'warning' : 'fail';
  const rawMessage = analysis.found
    ? pick(language, {
        tr: `Gerekli içerik ${url} adresinde bulundu.`,
        en: `Required content found at ${url}.`,
      })
    : analysis.skipped
      ? pick(language, {
          tr: `Sayfa erişilebilir, ancak içeriğin yapay zeka ile doğrulanması çalıştırılamadı. ${analysis.evidence}`,
          en: `The page is accessible, but AI verification of its content could not run. ${analysis.evidence}`,
        })
      : pick(language, {
          tr: 'Gerekli içerik bulunamadı.',
          en: 'Required content not found.',
        });
  const message = withRef(rawMessage, options.ref, language);
  const suggestion = analysis.found
    ? ''
    : analysis.skipped
      ? pick(language, {
          tr: `Sayfa içeriğini elle doğrulayın. ${failSuggestion.tr}`,
          en: `Verify the page content manually. ${failSuggestion.en}`,
        })
      : pick(language, failSuggestion);
  return {
    section,
    field,
    status,
    message,
    suggestion,
    url,
    confidence: analysis.skipped ? undefined : analysis.confidence,
    evidence: analysis.skipped ? undefined : analysis.evidence,
  };
}

export interface DeclarationOptions {
  section: string;
  field: string;
  /** The editor's self-declaration; `undefined` counts as not declared. */
  ok: boolean | undefined;
  /** Status when the declaration is false: hard criterion → fail, recommendation → warning. */
  severity: 'fail' | 'warning';
  language?: string;
  pass: Bilingual;
  fail: Bilingual;
  suggestion: Bilingual;
}

/** Build a report item from a yes/no self-declaration. */
export function declaration(opts: DeclarationOptions): ReportItem {
  const ok = opts.ok === true;
  return {
    section: opts.section,
    field: opts.field,
    status: ok ? 'pass' : opts.severity,
    message: pick(opts.language, ok ? opts.pass : opts.fail),
    suggestion: ok ? '' : pick(opts.language, opts.suggestion),
  };
}
