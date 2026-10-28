import type { ArticleFormatData, ValidationContext } from '../types/formData';
import type { ReportItem } from '../types/report';
import { checkUrl, declaration, pick } from './shared';

const SECTION = 'Article Format';

type BoolKey = {
  [K in keyof ArticleFormatData]: ArticleFormatData[K] extends boolean ? K : never;
}[keyof ArticleFormatData];

interface Row {
  field: BoolKey;
  severity: 'fail' | 'warning';
  ref: string;
  /** [pass message, fail message, suggestion] */
  tr: [string, string, string];
  en: [string, string, string];
}

const ROWS: Row[] = [
  {
    field: 'abstractAndKeywordsInArticleLanguage',
    severity: 'fail',
    ref: 'ÖK 10',
    tr: [
      'Her makalede makalenin yazıldığı dilde özet ve anahtar sözcükler bulunuyor.',
      'Makalelerin, yazıldıkları dilde özet ve anahtar sözcük içerdiği beyan edilmedi.',
      'Her makaleye, makalenin yazıldığı dilde özet ve anahtar sözcükler ekleyin.',
    ],
    en: [
      'Every article has an abstract and keywords in the language of the article.',
      'It was not declared that articles include an abstract and keywords in their own language.',
      'Add an abstract and keywords in the article language to every article.',
    ],
  },
  {
    field: 'abstractWordLimitStated',
    severity: 'fail',
    ref: 'ÖK 10',
    tr: [
      'Özetler için kelime sınırı yazım kurallarında belirtilmiş.',
      'Özet kelime sınırının yazım kurallarında belirtildiği beyan edilmedi.',
      'Yazım kurallarında özet için kelime sınırını (ör. 150–250 kelime) açıkça belirtin.',
    ],
    en: [
      'The abstract word limit is stated in the author guidelines.',
      'It was not declared that an abstract word limit is stated in the author guidelines.',
      'State the abstract word limit (e.g. 150–250 words) explicitly in the author guidelines.',
    ],
  },
  {
    field: 'articleTypeOnTocAndFirstPage',
    severity: 'fail',
    ref: 'ÖK 12',
    tr: [
      'Makale türü içindekiler sayfasında ve makalenin ilk sayfasında belirtiliyor.',
      'Makale türünün içindekiler ve ilk sayfada belirtildiği beyan edilmedi.',
      'Her makalenin türünü (araştırma makalesi, derleme, olgu sunumu vb.) içindekiler sayfasında ve ilk sayfasında belirtin.',
    ],
    en: [
      'The article type is shown in the table of contents and on the first page.',
      'It was not declared that the article type is shown in the table of contents and on the first page.',
      'Label each article’s type (research article, review, case report, etc.) in the table of contents and on its first page.',
    ],
  },
  {
    field: 'datesSubmissionAcceptanceShown',
    severity: 'fail',
    ref: 'ÖK 13',
    tr: [
      'Makalelerde geliş ve kabul tarihleri gösteriliyor.',
      'Makalelerde geliş ve kabul tarihlerinin gösterildiği beyan edilmedi.',
      'Her makalede geliş (başvuru) ve kabul tarihlerini belirtin.',
    ],
    en: [
      'Submission and acceptance dates are shown in the articles.',
      'It was not declared that submission and acceptance dates are shown in the articles.',
      'Show the submission and acceptance dates in every article.',
    ],
  },
  {
    field: 'affiliationsAndOrcidShown',
    severity: 'fail',
    ref: 'ÖK 13',
    tr: [
      'Yazar kurum bilgileri ve ORCID numaraları makalelerde gösteriliyor.',
      'Yazar kurum bilgileri ve ORCID numaralarının gösterildiği beyan edilmedi.',
      'Her yazar için kurum bilgisini ve ORCID numarasını makalede belirtin.',
    ],
    en: [
      'Author affiliations and ORCID iDs are shown in the articles.',
      'It was not declared that author affiliations and ORCID iDs are shown.',
      'Show each author’s affiliation and ORCID iD in the article.',
    ],
  },
  {
    field: 'noAdsInsideArticles',
    severity: 'fail',
    ref: 'ÖK 14',
    tr: [
      'Makale sayfalarının içinde reklam bulunmuyor.',
      'Makale sayfalarında reklam bulunmadığı beyan edilmedi.',
      'Makale sayfaları içinden reklamları kaldırın.',
    ],
    en: [
      'There are no advertisements inside the article pages.',
      'It was not declared that article pages are free of advertisements.',
      'Remove advertisements from within the article pages.',
    ],
  },
  {
    field: 'referencesLatinScript',
    severity: 'fail',
    ref: 'GH 8',
    tr: [
      'Kaynakça Latin alfabesiyle de verilmiş.',
      'Kaynakçanın Latin alfabesiyle verildiği beyan edilmedi.',
      'Kaynakçayı Latin alfabesiyle (gerekirse çeviri yazı ile) verin.',
    ],
    en: [
      'References are given in Latin script.',
      'It was not declared that references are given in Latin script.',
      'Provide the reference list in Latin script (transliterated if necessary).',
    ],
  },
  {
    field: 'footnoteReferencesListed',
    severity: 'warning',
    ref: 'GH 10',
    tr: [
      'Dipnotta verilen kaynaklar kaynakçada da listeleniyor.',
      'Dipnot kaynaklarının kaynakçada da listelendiği beyan edilmedi.',
      'Dipnotlarda anılan tüm kaynakları kaynakça bölümünde de listeleyin.',
    ],
    en: [
      'Sources cited in footnotes are also listed in the reference list.',
      'It was not declared that footnote sources are also listed in the reference list.',
      'List every source cited in footnotes in the reference list as well.',
    ],
  },
  {
    field: 'citationLineOnFirstPage',
    severity: 'warning',
    ref: 'GH 11',
    tr: [
      'Makalenin ilk sayfasında atıf için künye satırı bulunuyor.',
      'İlk sayfada atıf (künye) satırı bulunduğu beyan edilmedi.',
      'Makalenin ilk sayfasına dergi adı, yıl, cilt, sayı ve sayfa aralığını içeren bir künye satırı ekleyin (tercih edilir).',
    ],
    en: [
      'The first page carries a bibliographic citation line.',
      'It was not declared that a citation line appears on the first page.',
      'Add a citation line (journal name, year, volume, issue, pages) to the first page (preferred).',
    ],
  },
  {
    field: 'issueCoverHasNameYearVolumeIssue',
    severity: 'fail',
    ref: 'GH 5',
    tr: [
      'Sayı kapağında dergi adı, yıl, cilt ve sayı bilgisi yer alıyor.',
      'Sayı kapağında dergi adı, yıl, cilt ve sayı bilgisinin yer aldığı beyan edilmedi.',
      'Her sayının kapağında dergi adını, yılı, cildi ve sayı numarasını belirtin.',
    ],
    en: [
      'The issue cover shows the journal name, year, volume and issue.',
      'It was not declared that the issue cover shows journal name, year, volume and issue.',
      'Show the journal name, year, volume and issue number on every issue cover.',
    ],
  },
  {
    field: 'pageNumberingContinuous',
    severity: 'fail',
    ref: 'K 14',
    tr: [
      'Sayfa numaraları cilt içinde ardışık ilerliyor.',
      'Sayfa numaralandırmasının ardışık olduğu beyan edilmedi.',
      'Sayfa numaralarını bir cilt boyunca kesintisiz ve ardışık verin.',
    ],
    en: [
      'Page numbering is continuous.',
      'It was not declared that page numbering is continuous.',
      'Number pages continuously and consecutively throughout a volume.',
    ],
  },
  {
    field: 'pdfTextCopyable',
    severity: 'fail',
    ref: 'Başvuru Süreci 1.3',
    tr: [
      'Sayı PDF içeriği kopyalanabilir.',
      'Sayı PDF içeriğinin kopyalanabilir olduğu beyan edilmedi.',
      'PDF dosyalarını taranmış görüntü olarak değil, metni seçilip kopyalanabilir biçimde hazırlayın.',
    ],
    en: [
      'The text of the issue PDFs can be copied.',
      'It was not declared that the issue PDF text can be copied.',
      'Produce PDFs with selectable, copyable text rather than scanned images.',
    ],
  },
  {
    field: 'bilingualTitleAbstractKeywords',
    severity: 'warning',
    ref: 'T 5',
    tr: [
      'Makale başlığı, özet ve anahtar sözcükler iki dilde verilmiş.',
      'Başlık, özet ve anahtar sözcüklerin iki dilde verildiği beyan edilmedi (yalnızca İngilizce yayımlayan dergiler için zorunlu değildir).',
      'Başlık, özet ve anahtar sözcükleri hem Türkçe hem İngilizce verin.',
    ],
    en: [
      'Title, abstract and keywords are provided in two languages.',
      'It was not declared that title, abstract and keywords are given in two languages (not required for English-only journals).',
      'Provide the title, abstract and keywords in both Turkish and English.',
    ],
  },
  {
    field: 'bilingualTocTitles',
    severity: 'warning',
    ref: 'T 2',
    tr: [
      'İçindekiler sayfasında makale başlıkları iki dilde verilmiş.',
      'İçindekiler sayfasında başlıkların iki dilde verildiği beyan edilmedi.',
      'İçindekiler sayfasında makale başlıklarını iki dilde verin.',
    ],
    en: [
      'Article titles in the table of contents are bilingual.',
      'It was not declared that table-of-contents titles are bilingual.',
      'Give article titles in two languages in the table of contents.',
    ],
  },
];

export async function validateArticleFormat(
  data: ArticleFormatData,
  language?: string,
  _context?: ValidationContext
): Promise<ReportItem[]> {
  const sample = await checkUrl(
    data.sampleArticleUrl,
    SECTION,
    'sampleArticleUrl',
    'Examine this sample article (HTML page or PDF text). Does it show ALL of the following: an abstract and keywords in the language of the article; an article type label (e.g. research article, review); submission and acceptance dates; author affiliations; ORCID iDs; a reference list in Latin script; and a bibliographic citation line (journal name, year, volume, issue, pages)? The page may be in Turkish or English.',
    {
      tr: 'Örnek makalenin özet ve anahtar sözcükleri, makale türünü, geliş/kabul tarihlerini, yazar kurumlarını, ORCID numaralarını, Latin alfabeli kaynakçayı ve künye satırını içerdiğinden emin olun. (ÖK 10–13, GH 8, GH 11)',
      en: 'Make sure the sample article shows the abstract and keywords, article type, submission/acceptance dates, author affiliations, ORCID iDs, a Latin-script reference list and a citation line. (ÖK 10–13, GH 8, GH 11)',
    },
    language,
    { ref: 'ÖK 10–13, GH 8, GH 11' }
  );

  const results: ReportItem[] = [sample];
  const toItem = (row: Row) =>
    declaration({
      section: SECTION,
      field: row.field,
      ok: data[row.field],
      severity: row.severity,
      language,
      pass: { tr: `${row.tr[0]} (${row.ref})`, en: `${row.en[0]} (${row.ref})` },
      fail: { tr: `${row.tr[1]} (${row.ref})`, en: `${row.en[1]} (${row.ref})` },
      suggestion: { tr: row.tr[2], en: row.en[2] },
    });
  const rowFor = (field: BoolKey) => ROWS.find((r) => r.field === field)!;

  results.push(toItem(rowFor('abstractAndKeywordsInArticleLanguage')));
  results.push(toItem(rowFor('abstractWordLimitStated')));

  if (data.publishesNonLatinScript === true) {
    results.push(
      declaration({
        section: SECTION,
        field: 'latinScriptForNonLatin',
        ok: data.latinScriptForNonLatin,
        severity: 'fail',
        language,
        pass: {
          tr: 'Latin alfabesi dışında yayımlanan makalelerde Latin alfabesiyle başlık, özet ve kaynakça sunuluyor. (ÖK 11)',
          en: 'Articles in non-Latin script also provide a Latin-script title, abstract and references. (ÖK 11)',
        },
        fail: {
          tr: 'Latin alfabesi dışında yayımlanan makalelerin Latin alfabesiyle de sunulduğu beyan edilmedi. (ÖK 11)',
          en: 'It was not declared that non-Latin-script articles are also provided in Latin script. (ÖK 11)',
        },
        suggestion: {
          tr: 'Latin dışı alfabeyle yayımlanan makaleler için başlık, özet ve kaynakçayı Latin alfabesiyle de verin.',
          en: 'For articles published in a non-Latin script, also provide title, abstract and references in Latin script.',
        },
      })
    );
  } else {
    results.push({
      section: SECTION,
      field: 'latinScriptForNonLatin',
      status: 'pass',
      message: pick(language, {
        tr: 'Latin alfabesi dışında yayın yapılmıyor; bu kontrol uygulanmaz. (ÖK 11)',
        en: 'The journal does not publish in a non-Latin script; this check does not apply. (ÖK 11)',
      }),
      suggestion: '',
    });
  }

  for (const field of [
    'articleTypeOnTocAndFirstPage',
    'datesSubmissionAcceptanceShown',
    'affiliationsAndOrcidShown',
    'noAdsInsideArticles',
  ] as const) {
    results.push(toItem(rowFor(field)));
  }

  const hasStyle = Boolean(data.referenceStyle && data.referenceStyle.trim());
  results.push({
    section: SECTION,
    field: 'referenceStyle',
    status: hasStyle ? 'pass' : 'fail',
    message: hasStyle
      ? pick(language, {
          tr: `Atıf stili belirtilmiş: ${data.referenceStyle}. (GH 9)`,
          en: `Citation style stated: ${data.referenceStyle}. (GH 9)`,
        })
      : pick(language, {
          tr: 'Dergide kullanılan atıf stili belirtilmedi. (GH 9)',
          en: 'No citation style was stated. (GH 9)',
        }),
    suggestion: hasStyle
      ? ''
      : pick(language, {
          tr: 'APA, MLA, AIP, NLM, AMA, ACS, Chicago gibi bir atıf stilini seçin ve yazım kurallarında belirtin.',
          en: 'Choose a citation style such as APA, MLA, AIP, NLM, AMA, ACS or Chicago and state it in the author guidelines.',
        }),
  });

  for (const field of [
    'referencesLatinScript',
    'footnoteReferencesListed',
    'citationLineOnFirstPage',
    'issueCoverHasNameYearVolumeIssue',
    'pageNumberingContinuous',
    'pdfTextCopyable',
    'bilingualTitleAbstractKeywords',
    'bilingualTocTitles',
  ] as const) {
    results.push(toItem(rowFor(field)));
  }
  return results;
}
