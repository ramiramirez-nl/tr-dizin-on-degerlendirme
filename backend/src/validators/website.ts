import type { ValidationContext, WebsiteData } from '../types/formData';
import type { ReportItem } from '../types/report';
import { checkUrl, declaration, pick } from './shared';

const SECTION = 'Website';

export async function validateWebsite(
  data: WebsiteData,
  language?: string,
  _context?: ValidationContext
): Promise<ReportItem[]> {
  const [aims, guidelines, policy] = await Promise.all([
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
      { ref: 'ÖK 9' }
    ),
    checkUrl(
      data.authorGuidelinesUrl,
      SECTION,
      'authorGuidelinesUrl',
      'Does this page contain detailed author guidelines (yazım kuralları) covering the format of the manuscript, tables, figures, headings, abstract and references, AND does it name a citation style such as APA, MLA, AIP, NLM, AMA, ACS or Chicago? The page may be in Turkish or English.',
      {
        tr: 'Yazım kurallarını (makale biçimi, tablo/şekil, başlıklar, özet ve kaynakça düzeni) ayrıntılı biçimde yayımlayın ve kullanılan atıf stilini (APA, MLA, AIP, NLM, AMA, ACS, Chicago vb.) açıkça belirtin. (K 11, GH 9)',
        en: 'Publish detailed author guidelines (manuscript format, tables/figures, headings, abstract, reference layout) and name the citation style used (APA, MLA, AIP, NLM, AMA, ACS, Chicago, etc.). (K 11, GH 9)',
      },
      language,
      { ref: 'K 11, GH 9' }
    ),
    checkUrl(
      data.publicationPolicyUrl,
      SECTION,
      'publicationPolicyUrl',
      'Does this page describe the journal\'s publication policy, including open access information, the fee policy (article processing charges, or a statement that no fees are charged) and the review process or expected review duration? The page may be in Turkish or English.',
      {
        tr: 'Yayın politikasını (açık erişim bilgisi, ücret politikası veya ücret alınmadığına dair beyan, değerlendirme süreci/süresi) içeren bir sayfa yayımlayın. (K 12)',
        en: 'Publish a publication policy page covering open access, the fee policy (or a statement that no fees are charged) and the review process/duration. (K 12)',
      },
      language,
      { ref: 'K 12' }
    ),
  ]);

  const results: ReportItem[] = [aims, guidelines, policy];

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
