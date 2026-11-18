import type { ValidationContext, WebsiteData } from '../types/formData';
import type { ReportItem } from '../types/report';
import { checkUrl, declaration, pick } from './shared';
import { KEYWORDS } from './keywords';

const SECTION = 'Website';

export async function validateWebsite(
  data: WebsiteData,
  language?: string,
  context?: ValidationContext
): Promise<ReportItem[]> {
  const declaredStyle = context?.referenceStyle && context.referenceStyle !== 'Other' ? context.referenceStyle : '';
  const [aims, guidelines, policy, fee] = await Promise.all([
    checkUrl(
      data.aimsAndScopeUrl,
      SECTION,
      'aimsAndScopeUrl',
      'Does this page contain a detailed statement of the journal\'s aims and scope (amaç ve kapsam), describing the subject fields the journal covers and the kinds of articles it publishes? The page may be in Turkish or English.',
      {
        tr: 'Derginin amaç ve kapsamını ayrıntılı biçimde açıklayan, herkese açık bir sayfa ekleyin. (ÖK 9)',
        en: 'Add a publicly accessible page that describes the journal’s aims and scope in detail. (ÖK 9)',
      },
      language,
      { ref: 'ÖK 9', keywords: [...KEYWORDS.aimsAndScope] }
    ),
    checkUrl(
      data.authorGuidelinesUrl,
      SECTION,
      'authorGuidelinesUrl',
      `Does this page contain (1) author guidelines (yazım kuralları) on the format of the manuscript, such as tables, figures, headings, abstract and references, and (2) the citation style, such as APA, MLA, AIP, NLM, AMA, ACS, Chicago or ISNAD? A link to the official guide of a style (for example apastyle.apa.org) counts as naming that style; links appear as "text (address)". A link to a downloadable template or guideline file counts as giving the guidelines.${declaredStyle ? ` The editor declared the citation style as ${declaredStyle}.` : ''} The page may be in Turkish or English.`,
      {
        tr: 'Yazım kurallarını (makale biçimi, tablo/şekil, başlıklar, özet ve kaynakça düzeni) ayrıntılı biçimde yayımlayın ve kullanılan atıf stilini (APA, MLA, AIP, NLM, AMA, ACS, Chicago, ISNAD vb.) açıkça belirtin. (K 11, GH 9)',
        en: 'Publish detailed author guidelines (manuscript format, tables/figures, headings, abstract, reference layout) and name the citation style used (APA, MLA, AIP, NLM, AMA, ACS, Chicago, ISNAD, etc.). (K 11, GH 9)',
      },
      language,
      { ref: 'K 11, GH 9', keywords: [...KEYWORDS.authorGuidelines] }
    ),
    checkUrl(
      data.publicationPolicyUrl,
      SECTION,
      'publicationPolicyUrl',
      'Does this page describe the journal\'s publication policy, including (1) open access information and (2) the review process or the expected review duration? Fee information is checked separately. The page may be in Turkish or English.',
      {
        tr: '"Yayın politikası" başlığı altında açık erişim bilgisini ve makale değerlendirme sürecini ve süresini ayrıntılı biçimde verin. (K 12)',
        en: 'Under a "publication policy" heading, give open access information and the article review process and duration in detail. (K 12)',
      },
      language,
      { ref: 'K 12', keywords: [...KEYWORDS.publicationPolicy] }
    ),
    feePolicyItem(data, language),
  ]);

  // Detailed rules often live in a downloadable template the tool cannot
  // read, so a miss here is a warning for the editor to confirm.
  const results: ReportItem[] = [
    aims,
    guidelines.status === 'fail' && guidelines.confidence ? { ...guidelines, status: 'warning' } : guidelines,
    policy,
    fee,
  ];

  results.push(
    declaration({
      section: SECTION,
      field: 'journalInfoComplete',
      ok: data.journalInfoComplete,
      severity: 'warning',
      language,
      pass: {
        tr: 'Dergi bilgileri web sitesinde eksiksiz yer alıyor. (ÖK 8)',
        en: 'The journal information is complete on the website. (ÖK 8)',
      },
      fail: {
        tr: 'Dergi bilgilerinin web sitesinde eksiksiz yer aldığı beyan edilmedi. (ÖK 8)',
        en: 'It was not declared that the journal information is complete on the website. (ÖK 8)',
      },
      suggestion: {
        tr: 'Dergi adı, diğer dildeki adı, kısaltması, ISSN/e-ISSN, adres, yayın dili, yayın sıklığı, iletişim e-postası, yayıncı ve kurul bilgilerini web sitesinde yayımlayın.',
        en: 'Publish the full name, name in other languages, abbreviation, ISSN/e-ISSN, address, language, frequency, contact e-mail, publisher and board information on the website.',
      },
    })
  );

  if (data.nameChanged === true) {
    const ok = data.hasJournalHistory === true;
    results.push(
      declaration({
        section: SECTION,
        field: 'hasJournalHistory',
        ok,
        severity: 'fail',
        language,
        pass: {
          tr: 'Dergi adı değişmiş ve değişiklikler “Dergi Tarihçesi” bölümünde belirtilmiş. (GH 2)',
          en: 'The journal name has changed and the changes are documented in a journal history section. (GH 2)',
        },
        fail: {
          tr: 'Dergi adı değişmiş, ancak değişiklikler “Dergi Tarihçesi” bölümünde belirtilmemiş. (GH 2)',
          en: 'The journal name has changed, but the changes are not documented in a journal history section. (GH 2)',
        },
        suggestion: {
          tr: 'Dergi adı ve ISSN değişikliklerini web sitesinde “Dergi Tarihçesi” başlığı altında tarihleriyle birlikte yayımlayın.',
          en: 'Document all name and ISSN changes with dates in a “Journal History” section on the website.',
        },
      })
    );
  } else {
    results.push({
      section: SECTION,
      field: 'hasJournalHistory',
      status: 'pass',
      message: pick(language, {
        tr: 'Dergi adında değişiklik olmadığı beyan edildi. (GH 2)',
        en: 'No name change was declared. (GH 2)',
      }),
      suggestion: '',
    });
  }

  results.push(
    declaration({
      section: SECTION,
      field: 'indexingClaimsAccurate',
      ok: data.indexingClaimsAccurate,
      severity: 'fail',
      language,
      pass: {
        tr: 'Web sitesindeki dizin bilgileri doğru ve yanıltıcı değil. (GH 13)',
        en: 'The indexing information on the website is accurate and not misleading. (GH 13)',
      },
      fail: {
        tr: 'Web sitesindeki dizin/indeks bilgilerinin doğru olduğu beyan edilmedi. (GH 13)',
        en: 'It was not declared that the indexing information on the website is accurate. (GH 13)',
      },
      suggestion: {
        tr: 'Yalnızca gerçekten dizinlenilen kaynakları “Dizinlenen Kaynaklar” olarak gösterin; yanıltıcı veya doğrulanamayan dizin ifadelerini kaldırın.',
        en: 'List only the databases that really index the journal; remove misleading or unverifiable indexing claims.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'abbreviationShown',
      ok: data.abbreviationShown,
      severity: 'warning',
      language,
      pass: {
        tr: 'Dergi kısaltması web sitesinde gösteriliyor. (T 4)',
        en: 'The journal abbreviation is shown on the website. (T 4)',
      },
      fail: {
        tr: 'Dergi kısaltmasının web sitesinde gösterildiği beyan edilmedi. (T 4)',
        en: 'It was not declared that the journal abbreviation is shown on the website. (T 4)',
      },
      suggestion: {
        tr: 'Dergi kısaltmasını (ISO 4 uyumlu) web sitesinde ve makalelerde gösterin.',
        en: 'Show the journal abbreviation (ISO 4 compliant) on the website and in the articles.',
      },
    })
  );
  return results;
}

/**
 * K 12 lists the fee policy under the "yayın politikası" heading. DergiPark
 * shows it on its own "Ücret Politikası" tab, so a separate page is accepted,
 * with a note to link it from the publication policy.
 */
async function feePolicyItem(data: WebsiteData, language?: string): Promise<ReportItem> {
  const separate = Boolean(data.feePolicyUrl && data.feePolicyUrl.trim());
  const item = await checkUrl(
    separate ? data.feePolicyUrl : data.publicationPolicyUrl,
    SECTION,
    'feePolicyUrl',
    'Does this page state the journal\'s fee policy: whether submission, processing or publication charges apply (and how much), or that no fees are charged? The page may be in Turkish or English.',
    {
      tr: 'Ücret politikasını (başvuru, işlem veya yayın ücreti alınıp alınmadığı, alınıyorsa tutarı) açıkça belirtin ve yayın politikası bölümünde bu bilgiye yer verin veya bağlantı verin. (K 12)',
      en: 'State the fee policy clearly (whether submission, processing or publication charges apply, and how much) and include it in, or link it from, the publication policy section. (K 12)',
    },
    language,
    { ref: 'K 12', keywords: [...KEYWORDS.feePolicy] }
  );
  if (separate && item.status === 'pass') {
    return {
      ...item,
      message: pick(language, {
        tr: 'Ücret politikası ayrı bir sayfada bulundu. Kriter 12 bu bilgiyi "yayın politikası" başlığı altında saydığı için yayın politikası bölümünden bu sayfaya bağlantı verilmesi önerilir. (K 12)',
        en: 'The fee policy was found on a separate page. Criterion 12 lists it under the "publication policy" heading, so linking this page from the publication policy section is recommended. (K 12)',
      }),
    };
  }
  return item;
}
