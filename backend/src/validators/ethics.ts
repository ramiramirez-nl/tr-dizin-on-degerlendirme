import type { EthicsData, ValidationContext } from '../types/formData';
import type { ReportItem } from '../types/report';
import { checkUrl, declaration } from './shared';

const SECTION = 'Ethics';

export async function validateEthics(
  data: EthicsData,
  language?: string,
  context?: ValidationContext
): Promise<ReportItem[]> {
  const policy = await checkUrl(
    data.ethicsPolicyUrl,
    SECTION,
    'ethicsPolicyUrl',
    'Does this page publish the journal\'s publication ethics principles (yayın etiği) under a separate heading, with separate sections for authors, reviewers and editors, reference COPE and/or ICMJE guidelines, and state that the articles comply with research and publication ethics? The page may be in Turkish or English.',
    {
      tr: 'Yayın etiği ilkelerini ayrı bir başlık altında yayımlayın; yazar, hakem ve editör için ayrı bölümler ekleyin, COPE ve/veya ICMJE’ye atıf yapın ve makalelerin araştırma ve yayın etiğine uygun olduğunu belirtin. (K 8.3, K 8.4, K 8.5)',
      en: 'Publish the ethics principles under a separate heading with separate sections for authors, reviewers and editors, refer to COPE and/or ICMJE, and state that articles comply with research and publication ethics. (K 8.3, K 8.4, K 8.5)',
    },
    language,
    { ref: 'K 8.3, K 8.4, K 8.5' }
  );

  const consentSevere =
    context?.subjectArea === 'health' || context?.subjectArea === 'case_report_only';

  return [
    policy,
    declaration({
      section: SECTION,
      field: 'separateSectionsForRoles',
      ok: data.separateSectionsForRoles,
      severity: 'fail',
      language,
      pass: {
        tr: 'Etik ilkeler yazar, hakem ve editör için ayrı bölümler hâlinde yayımlanıyor. (K 8.4)',
        en: 'Ethics principles have separate sections for authors, reviewers and editors. (K 8.4)',
      },
      fail: {
        tr: 'Etik ilkelerin yazar, hakem ve editör için ayrı bölümler hâlinde yayımlandığı beyan edilmedi. (K 8.4)',
        en: 'It was not declared that the ethics principles have separate sections for authors, reviewers and editors. (K 8.4)',
      },
      suggestion: {
        tr: 'Yayın etiği sayfasında yazarların, hakemlerin ve editörlerin sorumluluklarını ayrı başlıklar altında açıklayın.',
        en: 'Describe the responsibilities of authors, reviewers and editors under separate headings on the ethics page.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'referencesCopeOrIcmje',
      ok: data.referencesCopeOrIcmje,
      severity: 'fail',
      language,
      pass: {
        tr: 'Etik ilkeler COPE ve/veya ICMJE rehberlerine atıf yapıyor. (K 8.5)',
        en: 'The ethics principles refer to COPE and/or ICMJE guidelines. (K 8.5)',
      },
      fail: {
        tr: 'Etik ilkelerin COPE veya ICMJE rehberlerine atıf yaptığı beyan edilmedi. (K 8.5)',
        en: 'It was not declared that the ethics principles refer to COPE or ICMJE. (K 8.5)',
      },
      suggestion: {
        tr: 'Yayın etiği sayfasında COPE ve/veya ICMJE rehberlerine açıkça atıf yapın ve bağlantılarını verin.',
        en: 'Refer explicitly to the COPE and/or ICMJE guidelines on the ethics page and link to them.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'statesResearchPublicationEthicsCompliance',
      ok: data.statesResearchPublicationEthicsCompliance,
      severity: 'fail',
      language,
      pass: {
        tr: 'Makalelerin araştırma ve yayın etiğine uygun olduğu belirtiliyor. (K 8.3)',
        en: 'It is stated that articles comply with research and publication ethics. (K 8.3)',
      },
      fail: {
        tr: 'Makalelerin araştırma ve yayın etiğine uygun olduğunun belirtildiği beyan edilmedi. (K 8.3)',
        en: 'It was not declared that articles are stated to comply with research and publication ethics. (K 8.3)',
      },
      suggestion: {
        tr: 'Dergide yayımlanan makalelerin araştırma ve yayın etiği ilkelerine uygun olduğunu açıkça belirten bir ifade ekleyin.',
        en: 'Add an explicit statement that published articles comply with research and publication ethics.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'requiresEthicsCommitteeApproval',
      ok: data.requiresEthicsCommitteeApproval,
      severity: 'fail',
      language,
      pass: {
        tr: 'Gerekli çalışmalarda etik kurul onayı (kurul adı, tarih, sayı) isteniyor ve makalede belirtiliyor. (K 8.1, K 8.2)',
        en: 'Ethics committee approval (committee name, date, number) is required and shown in the article. (K 8.1, K 8.2)',
      },
      fail: {
        tr: 'Etik kurul onayının (kurul adı, tarih ve sayı) istendiği ve makalede belirtildiği beyan edilmedi. (K 8.1, K 8.2)',
        en: 'It was not declared that ethics committee approval (name, date, number) is required and shown in the article. (K 8.1, K 8.2)',
      },
      suggestion: {
        tr: 'Etik kurul izni gerektiren çalışmalar için kurul adı, tarih ve sayı bilgisinin yöntem bölümünde ve makalenin ilk/son sayfasında belirtilmesini zorunlu kılın.',
        en: 'Require committee name, date and number for studies needing ethics approval, in the method section and on the first or last page of the article.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'requiresInformedConsentForCaseReports',
      ok: data.requiresInformedConsentForCaseReports,
      severity: consentSevere ? 'fail' : 'warning',
      language,
      pass: {
        tr: 'Olgu sunumlarında bilgilendirilmiş onam isteniyor. (K 8.2)',
        en: 'Informed consent is required for case reports. (K 8.2)',
      },
      fail: {
        tr: 'Olgu sunumlarında bilgilendirilmiş onam alındığı beyan edilmedi. (K 8.2)',
        en: 'It was not declared that informed consent is required for case reports. (K 8.2)',
      },
      suggestion: {
        tr: 'Olgu sunumlarında hastalardan alınan bilgilendirilmiş onam formunun varlığını makalede belirtmeyi zorunlu kılın.',
        en: 'Require authors of case reports to state in the article that informed consent was obtained from the patients.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'requiresDeclarationsAtArticleEnd',
      ok: data.requiresDeclarationsAtArticleEnd,
      severity: 'fail',
      language,
      pass: {
        tr: 'Makale sonunda katkı oranı, destek/teşekkür ve çıkar çatışması beyanları isteniyor. (K 13)',
        en: 'Contribution rates, funding/acknowledgements and conflict-of-interest declarations are required at the end of articles. (K 13)',
      },
      fail: {
        tr: 'Makale sonunda katkı oranı, destek/teşekkür ve çıkar çatışması beyanlarının istendiği beyan edilmedi. (K 13)',
        en: 'It was not declared that contribution, funding and conflict-of-interest declarations are required at the end of articles. (K 13)',
      },
      suggestion: {
        tr: 'Her makalenin sonuna yazar katkı oranı, destek/teşekkür ve çıkar çatışması beyanı bölümlerini ekleyin.',
        en: 'Add author contribution, funding/acknowledgement and conflict-of-interest sections at the end of every article.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'respectsCopyrightForWorksUsed',
      ok: data.respectsCopyrightForWorksUsed,
      severity: 'warning',
      language,
      pass: {
        tr: 'Makalelerde kullanılan eserlerin telif haklarına uyulduğu belirtiliyor. (K 8.6)',
        en: 'Copyright of works used in articles is respected. (K 8.6)',
      },
      fail: {
        tr: 'Kullanılan eserlerin telif haklarına uyulduğu beyan edilmedi. (K 8.6)',
        en: 'It was not declared that copyright of works used in articles is respected. (K 8.6)',
      },
      suggestion: {
        tr: 'Makalelerde kullanılan şekil, tablo ve alıntılar için telif haklarına uyulduğunu ve gerekli izinlerin alındığını politikanızda belirtin.',
        en: 'State in your policy that copyright is respected and permissions are obtained for figures, tables and quotations used in articles.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'editorialTeamDoesNotPublish',
      ok: data.editorialTeamDoesNotPublish,
      severity: 'warning',
      language,
      pass: {
        tr: 'Baş editör, editör, editör yardımcıları ve yayıncı dergide yayın yapmıyor. (K 8)',
        en: 'The editor in chief, editors, assistant editors and the publisher do not publish in the journal. (K 8)',
      },
      fail: {
        tr: 'Baş editör, editör, editör yardımcıları ve yayıncının dergide yayın yapmadığı beyan edilmedi. (K 8)',
        en: 'It was not declared that the editor in chief, editors, assistant editors and the publisher do not publish in the journal. (K 8)',
      },
      suggestion: {
        tr: 'Dergi yönetiminde görevli kişilerin makalelerini kendi dergilerinde yayımlamaktan kaçınmalarını sağlayın.',
        en: 'Ensure that people who run the journal avoid publishing their own articles in it.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'editorsOwnArticlesIndependentlyReviewed',
      ok: data.editorsOwnArticlesIndependentlyReviewed,
      severity: 'warning',
      language,
      pass: {
        tr: 'Kurul üyelerine ait makaleler süreci yönetmeyen bir editör ve bağımsız hakemler aracılığıyla değerlendiriliyor. Bu politika web sitesinde paylaşılıyor. (K 8)',
        en: 'Articles by board members are handled by an editor outside the conflict and by independent reviewers. This policy is shared on the website. (K 8)',
      },
      fail: {
        tr: 'Kurul üyelerine ait makalelerin bağımsız değerlendirildiği ve bu politikanın web sitesinde paylaşıldığı beyan edilmedi. (K 8)',
        en: 'It was not declared that articles by board members are reviewed independently and that this policy is shared on the website. (K 8)',
      },
      suggestion: {
        tr: 'Kurul üyelerinin makalelerini süreci yönetmeyen bir editör ve bağımsız hakemlerle değerlendirin ve bu politikayı web sitesinde yayımlayın.',
        en: 'Handle board members\' articles through an editor outside the conflict and independent reviewers, and publish this policy on the website.',
      },
    }),
  ];
}
