import { scrapeUrl } from '../scraper/pageScraper';
import type { ReportItem } from '../types/report';
import { KEYWORDS } from './keywords';
import { checkUrl, pick } from './shared';

const SECTION = 'Article Format';
const REF = 'ÖK 10–13, GH 8, GH 11';

/** Below this many characters across all pages, the PDF has no usable text layer. */
const MIN_TEXT_CHARS = 200;

const REFERENCES_HEADING = /^\s*(kaynakça|kaynaklar|yararlanılan kaynaklar|references|bibliography|bibliyografya)(?=\s|$|[:/])/im;

export interface SampleArticleResult {
  items: ReportItem[];
  /** Set only when the URL served a PDF: whether its text could be extracted. */
  pdfTextCopyable?: boolean;
}

/**
 * The parts of an article PDF that TR Dizin rules talk about: the first page
 * (type, dates, affiliations, ORCID, abstract, citation line), the end of the
 * article before the references (declarations, ethics approval), the start of
 * the reference list and the last page. Kept within the AI text budget.
 */
export function pdfExcerpt(pages: string[]): string {
  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)} [...]` : s);
  const parts = [`=== İLK SAYFA / FIRST PAGE ===\n${clip(pages[0] ?? '', 1800)}`];
  const body = pages.slice(1).join('\n');
  const match = REFERENCES_HEADING.exec(body);
  if (match) {
    const before = body.slice(Math.max(0, match.index - 1000), match.index);
    parts.push(`=== KAYNAKÇADAN ÖNCE / BEFORE THE REFERENCES ===\n${before.trim()}`);
    parts.push(`=== KAYNAKÇA BAŞLANGICI / START OF REFERENCES ===\n${clip(body.slice(match.index), 500)}`);
  }
  if (pages.length > 1) {
    parts.push(`=== SON SAYFA / LAST PAGE ===\n${clip(pages[pages.length - 1], match ? 500 : 1800)}`);
  }
  return parts.join('\n');
}

export async function sampleArticleItems(url: string, language?: string): Promise<SampleArticleResult> {
  const scraped = url ? await scrapeUrl(url) : undefined;
  const pages = scraped?.accessible ? scraped.pdfPages : undefined;

  if (!pages) return htmlSampleItems(url, language, Boolean(scraped?.accessible));

  if (pages.join('').trim().length < MIN_TEXT_CHARS) {
    return {
      pdfTextCopyable: false,
      items: [
        {
          section: SECTION,
          field: 'sampleArticleUrl',
          status: 'warning',
          message: pick(language, {
            tr: `PDF dosyasından metin çıkarılamadı, makale içeriği incelenemedi. Dosya taranmış görüntülerden oluşuyor olabilir. (${REF})`,
            en: `No text could be extracted from the PDF, so the article could not be examined. The file may consist of scanned images. (${REF})`,
          }),
          suggestion: pick(language, {
            tr: 'Makaleleri metni seçilip kopyalanabilir PDF olarak yayımlayın.',
            en: 'Publish articles as PDFs with selectable, copyable text.',
          }),
          url,
        },
      ],
    };
  }

  const textFrom = () => pdfExcerpt(pages);
  const [article, declarations] = await Promise.all([
    checkUrl(
      url,
      SECTION,
      'sampleArticleUrl',
      'This is text from a published article PDF, in labelled parts (first page, the part before the references, the start of the references, last page). Does it show ALL of the following: (1) an abstract and keywords in the language of the article; (2) an article type label such as research article or review; (3) submission (received) and acceptance dates; (4) author affiliations; (5) ORCID iDs; (6) a reference list in Latin script; (7) a citation line on the FIRST PAGE giving journal name, year, volume or issue, and pages? The article may be in Turkish or English.',
      {
        tr: `Makalenin özet ve anahtar kelimeleri, makale türünü, geliş/kabul tarihlerini, yazar kurumlarını, ORCID numaralarını, Latin alfabeli kaynakçayı ve ilk sayfada atıf satırını içerdiğinden emin olun. (${REF})`,
        en: `Make sure the article shows the abstract and keywords, article type, received/accepted dates, author affiliations, ORCID iDs, a Latin-script reference list and a citation line on the first page. (${REF})`,
      },
      language,
      { ref: REF, keywords: [...KEYWORDS.sampleArticle], textFrom }
    ),
    checkUrl(
      url,
      SECTION,
      'sampleArticleDeclarations',
      'This is text from a published article PDF, in labelled parts. Does the article give, at its end (before the references or on the last page), declarations on author contribution, conflict of interest, and funding or acknowledgement? And does it give ethics committee approval details (committee name, date and number) on the first or last page, or state that ethics approval was not required? The article may be in Turkish or English.',
      {
        tr: 'Makale sonunda yazar katkı oranı, çıkar çatışması ve destek/teşekkür beyanlarına; ilk veya son sayfada etik kurul bilgisine (kurul adı, tarih, sayı) ya da etik kurul gerekmediği beyanına yer verin. (K 13, K 8.1)',
        en: 'Give author contribution, conflict of interest and funding/acknowledgement declarations at the end of the article, and ethics committee details (name, date, number) or a statement that approval was not required on the first or last page. (K 13, K 8.1)',
      },
      language,
      { ref: 'K 13, K 8.1', keywords: [...KEYWORDS.sampleArticle], textFrom }
    ),
  ]);

  // One sample article cannot prove a journal-wide rule, and some articles
  // need no ethics approval: a miss here is a prompt to check, not a fail.
  const declarationsItem: ReportItem =
    declarations.status === 'fail' && declarations.confidence ? { ...declarations, status: 'warning' } : declarations;

  return { pdfTextCopyable: true, items: [article, declarationsItem] };
}

async function htmlSampleItems(url: string, language: string | undefined, accessible: boolean): Promise<SampleArticleResult> {
  const article = await checkUrl(
    url,
    SECTION,
    'sampleArticleUrl',
    'This is a published article page (for example a DergiPark article page). Does it show ALL of the following: (1) an abstract and keywords; (2) an article type label such as research article or review; (3) submission (received) and acceptance dates; (4) author affiliations; (5) ORCID iDs; (6) a reference list in Latin script? The page may be in Turkish or English.',
    {
      tr: `Makale sayfasında özet ve anahtar kelimelerin, makale türünün, geliş/kabul tarihlerinin, yazar kurumlarının, ORCID numaralarının ve Latin alfabeli kaynakçanın yer aldığından emin olun. (${REF})`,
      en: `Make sure the article page shows the abstract and keywords, article type, received/accepted dates, author affiliations, ORCID iDs and a Latin-script reference list. (${REF})`,
    },
    language,
    { ref: REF, keywords: [...KEYWORDS.sampleArticle] }
  );
  if (!accessible) return { items: [article] };
  return {
    items: [
      article,
      {
        section: SECTION,
        field: 'sampleArticlePdf',
        status: 'warning',
        message: pick(language, {
          tr: 'Makale PDF bağlantısı verilmediği için ilk sayfadaki atıf satırı, makale sonu beyanları, etik kurul bilgisi ve PDF metninin kopyalanabilirliği doğrulanamadı. (GH 11, K 13, K 8.1)',
          en: 'No article PDF link was given, so the citation line on the first page, the end-of-article declarations, the ethics committee details and whether the PDF text can be copied could not be verified. (GH 11, K 13, K 8.1)',
        }),
        suggestion: pick(language, {
          tr: 'Örnek makale alanına makalenin PDF bağlantısını girin. DergiPark\'ta makale sayfasındaki PDF düğmesine sağ tıklayıp "Bağlantı adresini kopyala" seçeneğiyle alabilirsiniz.',
          en: 'Enter the article\'s PDF link in the sample article field. On DergiPark, right-click the PDF button on the article page and choose "Copy link address".',
        }),
        url,
      },
    ],
  };
}
