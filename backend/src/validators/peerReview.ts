import type { PeerReviewData, ValidationContext } from '../types/formData';
import type { ReportItem } from '../types/report';
import { checkUrl, declaration } from './shared';

const SECTION = 'Peer Review';

export async function validatePeerReview(
  data: PeerReviewData,
  language?: string,
  _context?: ValidationContext
): Promise<ReportItem[]> {
  const review = await checkUrl(
    data.peerReviewPolicyUrl,
    SECTION,
    'peerReviewPolicyUrl',
    'Does this page describe the journal\'s peer review (hakemlik) process, including that each article is reviewed by at least two reviewers and what kind of blinding is used (single, double or open)? The page may be in Turkish or English.',
    {
      tr: 'Hakemlik sürecini (en az iki hakem, körleme türü, değerlendirme adımları) anlatan bir sayfa yayımlayın. (K 15)',
      en: 'Publish a page describing the peer review process (at least two reviewers, type of blinding, review steps). (K 15)',
    },
    language,
    { ref: 'K 15' }
  );

  const results: ReportItem[] = [
    review,
    declaration({
      section: SECTION,
      field: 'minTwoReviewers',
      ok: data.minTwoReviewers,
      severity: 'fail',
      language,
      pass: {
        tr: 'Her makale en az iki hakem tarafından değerlendiriliyor. (K 15)',
        en: 'Every article is reviewed by at least two reviewers. (K 15)',
      },
      fail: {
        tr: 'Her makalenin en az iki hakem tarafından değerlendirildiği beyan edilmedi. (K 15)',
        en: 'It was not declared that every article is reviewed by at least two reviewers. (K 15)',
      },
      suggestion: {
        tr: 'Her makale için en az iki bağımsız hakem görevlendirin.',
        en: 'Assign at least two independent reviewers to every article.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'reviewersFromDifferentInstitutions',
      ok: data.reviewersFromDifferentInstitutions,
      severity: 'fail',
      language,
      pass: {
        tr: 'Hakemler birbirinden ve yazarlardan farklı kurumlardan seçiliyor. (K 6, K 15)',
        en: 'Reviewers come from different institutions from each other and from the authors. (K 6, K 15)',
      },
      fail: {
        tr: 'Hakemlerin farklı kurumlardan seçildiği beyan edilmedi. (K 6, K 15)',
        en: 'It was not declared that reviewers come from different institutions. (K 6, K 15)',
      },
      suggestion: {
        tr: 'Hakemleri farklı kurumlardan seçin; yazarlarla ve birbirleriyle aynı kurumda çalışan hakemler görevlendirmeyin.',
        en: 'Select reviewers from different institutions; do not assign reviewers from the authors’ institution or from the same institution as each other.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'thirdReviewerOnDisagreement',
      ok: data.thirdReviewerOnDisagreement,
      severity: 'warning',
      language,
      pass: {
        tr: 'Hakem görüşleri çeliştiğinde üçüncü bir hakem görevlendiriliyor. (GH 14)',
        en: 'A third reviewer is appointed when reviewers disagree. (GH 14)',
      },
      fail: {
        tr: 'Hakem görüşleri çeliştiğinde üçüncü hakem görevlendirildiği beyan edilmedi. (GH 14)',
        en: 'It was not declared that a third reviewer is appointed when reviewers disagree. (GH 14)',
      },
      suggestion: {
        tr: 'Hakem raporları birbiriyle çeliştiğinde üçüncü bir hakemden görüş alınmasını hakemlik politikanıza ekleyin.',
        en: 'Add to your review policy that a third reviewer is consulted when reviewer reports conflict.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'reportsKeptFiveYears',
      ok: data.reportsKeptFiveYears,
      severity: 'fail',
      language,
      pass: {
        tr: 'Hakem raporları en az beş yıl saklanıyor. (GH 4)',
        en: 'Review reports are kept for at least five years. (GH 4)',
      },
      fail: {
        tr: 'Hakem raporlarının en az beş yıl saklandığı beyan edilmedi. (GH 4)',
        en: 'It was not declared that review reports are kept for at least five years. (GH 4)',
      },
      suggestion: {
        tr: 'Hakem raporlarını ve değerlendirme sürecine ait kayıtları en az beş yıl saklayın.',
        en: 'Keep review reports and process records for at least five years.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'reportsShowScientificEvaluation',
      ok: data.reportsShowScientificEvaluation,
      severity: 'fail',
      language,
      pass: {
        tr: 'Hakem raporları yalnızca biçim denetimi değil, bilimsel değerlendirme içeriyor. (K 16)',
        en: 'Review reports contain a scientific evaluation, not just a format check. (K 16)',
      },
      fail: {
        tr: 'Hakem raporlarının bilimsel değerlendirme içerdiği beyan edilmedi. (K 16)',
        en: 'It was not declared that review reports contain a scientific evaluation. (K 16)',
      },
      suggestion: {
        tr: 'Hakem raporlarında makalenin yöntemi, bulguları ve katkısına ilişkin bilimsel değerlendirme bulunduğundan emin olun; yalnızca yazım/biçim denetimi yeterli değildir.',
        en: 'Make sure reports evaluate the method, findings and contribution of the article; a spelling or format check alone is not enough.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'canUploadReviewReportsPdf',
      ok: data.canUploadReviewReportsPdf,
      severity: 'warning',
      language,
      pass: {
        tr: 'Hakemlik sürecinin tamamı tek bir PDF olarak sunulabiliyor. (K 16)',
        en: 'The full review process can be supplied as a single PDF. (K 16)',
      },
      fail: {
        tr: 'Hakemlik sürecinin tamamının tek PDF olarak sunulabildiği beyan edilmedi. (K 16)',
        en: 'It was not declared that the full review process can be supplied as a single PDF. (K 16)',
      },
      suggestion: {
        tr: 'İlk gönderim, iki hakem raporu, düzeltmeler, hakem adları ve tarihleri tek bir PDF’te toplayabilecek şekilde kayıtları düzenleyin.',
        en: 'Organise records so that the original submission, both reports, revisions, reviewer names and dates can be compiled in one PDF.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'screensPlagiarism',
      ok: data.screensPlagiarism,
      severity: 'warning',
      language,
      pass: {
        tr: 'Makaleler intihal denetiminden geçiriliyor. (T 3)',
        en: 'Articles are screened for plagiarism. (T 3)',
      },
      fail: {
        tr: 'Makalelerin intihal denetiminden geçirildiği beyan edilmedi. (T 3)',
        en: 'It was not declared that articles are screened for plagiarism. (T 3)',
      },
      suggestion: {
        tr: 'Makaleleri iThenticate veya benzeri bir yazılımla taratın ve intihal politikanızı yayımlayın.',
        en: 'Screen articles with iThenticate or a similar tool and publish your plagiarism policy.',
      },
    }),
  ];

  if (data.screensPlagiarism === true && data.plagiarismPolicyUrl) {
    results.push(
      await checkUrl(
        data.plagiarismPolicyUrl,
        SECTION,
        'plagiarismPolicyUrl',
        'Does this page describe the journal\'s plagiarism screening policy (intihal politikası), for example the software used and the similarity threshold or actions taken? The page may be in Turkish or English.',
        {
          tr: 'İntihal denetiminin nasıl yapıldığını (kullanılan yazılım, benzerlik sınırı, uygulanan işlemler) açıklayan bir sayfa yayımlayın. (T 3)',
          en: 'Publish a page explaining how plagiarism is screened (software, similarity threshold, actions taken). (T 3)',
        },
        language,
        { required: false, ref: 'T 3' }
      )
    );
  }

  results.push(
    declaration({
      section: SECTION,
      field: 'publishesReviewerList',
      ok: data.publishesReviewerList,
      severity: 'warning',
      language,
      pass: {
        tr: 'Hakem listesi yayımlanıyor. (T 1)',
        en: 'A list of reviewers is published. (T 1)',
      },
      fail: {
        tr: 'Hakem listesinin yayımlandığı beyan edilmedi. (T 1)',
        en: 'It was not declared that a reviewer list is published. (T 1)',
      },
      suggestion: {
        tr: 'Dergiye katkı veren hakemlerin listesini (adlarıyla) düzenli aralıklarla yayımlayın.',
        en: 'Publish a list of the reviewers who contributed to the journal at regular intervals.',
      },
    })
  );
  return results;
}
