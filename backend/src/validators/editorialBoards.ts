import type { EditorialBoardsData, ValidationContext } from '../types/formData';
import type { ReportItem } from '../types/report';
import { checkUrl, declaration } from './shared';

const SECTION = 'Editorial Boards';

export async function validateEditorialBoards(
  data: EditorialBoardsData,
  language?: string,
  _context?: ValidationContext
): Promise<ReportItem[]> {
  const board = await checkUrl(
    data.editorialBoardUrl,
    SECTION,
    'editorialBoardUrl',
    'Does this page list the editorial board (yayın kurulu) members, giving the institution of each member (or at least the city and country)? The page may be in Turkish or English.',
    {
      tr: 'Yayın kurulu üyelerini, her üyenin kurumuyla (en azından şehir ve ülke bilgisiyle) birlikte listeleyen bir sayfa yayımlayın. (K 4)',
      en: 'Publish a page listing the editorial board members with their institutions (at least city and country). (K 4)',
    },
    language,
    { ref: 'K 4' }
  );

  return [
    board,
    declaration({
      section: SECTION,
      field: 'boardOneThirdExternal',
      ok: data.boardOneThirdExternal,
      severity: 'fail',
      language,
      pass: {
        tr: 'Yayın kurulunun en az üçte biri dergiyi yayımlayan kurum dışından üyelerden oluşuyor. (K 4)',
        en: 'At least one third of the editorial board is external to the publishing institution. (K 4)',
      },
      fail: {
        tr: 'Yayın kurulunun en az üçte birinin kurum dışından olduğu beyan edilmedi. (K 4)',
        en: 'It was not declared that at least one third of the editorial board is external. (K 4)',
      },
      suggestion: {
        tr: 'Yayın kurulunun en az üçte birini, dergiyi yayımlayan kurum dışındaki üyelerden oluşturun.',
        en: 'Make sure at least one third of the board members come from outside the publishing institution.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'hasFieldEditors',
      ok: data.hasFieldEditors,
      severity: 'warning',
      language,
      pass: {
        tr: 'Alan editörleri belirlenmiş. (K 2)',
        en: 'Field editors have been appointed. (K 2)',
      },
      fail: {
        tr: 'Alan editörlerinin belirlendiği beyan edilmedi. (K 2)',
        en: 'It was not declared that field editors have been appointed. (K 2)',
      },
      suggestion: {
        tr: 'Kapsamı geniş dergilerde, konu alanlarına göre alan editörleri görevlendirin ve web sitesinde belirtin.',
        en: 'For journals with a broad scope, appoint field editors per subject area and list them on the website.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'hasLanguageEditors',
      ok: data.hasLanguageEditors,
      severity: 'fail',
      language,
      pass: {
        tr: 'Dil editörleri belirlenmiş. (K 3)',
        en: 'Language editors have been appointed. (K 3)',
      },
      fail: {
        tr: 'Dil editörlerinin belirlendiği beyan edilmedi. (K 3)',
        en: 'It was not declared that language editors have been appointed. (K 3)',
      },
      suggestion: {
        tr: 'Derginin yayın dil(ler)i için dil editörü görevlendirin ve adlarını yayın kurulu sayfasında belirtin.',
        en: 'Appoint language editors for the journal’s publication language(s) and list them on the editorial board page.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'hasAdvisoryBoard',
      ok: data.hasAdvisoryBoard,
      severity: 'warning',
      language,
      pass: {
        tr: 'Danışma kurulu bulunuyor. (K 4)',
        en: 'An advisory board exists. (K 4)',
      },
      fail: {
        tr: 'Danışma kurulunun bulunduğu beyan edilmedi. (K 4)',
        en: 'It was not declared that an advisory board exists. (K 4)',
      },
      suggestion: {
        tr: 'Varsa danışma kurulunu üyeleriyle birlikte web sitesinde yayımlayın.',
        en: 'If you have an advisory board, publish it with its members on the website.',
      },
    }),
    declaration({
      section: SECTION,
      field: 'boardCompetenceStated',
      ok: data.boardCompetenceStated,
      severity: 'warning',
      language,
      pass: {
        tr: 'Kurul üyelerinin uzmanlık alanları ve yayınları görülebiliyor. (K 5)',
        en: 'Board members’ expertise and publications are visible. (K 5)',
      },
      fail: {
        tr: 'Kurul üyelerinin yetkinliğinin (uzmanlık alanı, yayınları) görülebildiği beyan edilmedi. (K 5)',
        en: 'It was not declared that board members’ competence (expertise, publications) is visible. (K 5)',
      },
      suggestion: {
        tr: 'Kurul üyelerinin uzmanlık alanlarını ve ORCID/akademik profil bağlantılarını göstererek yetkinliklerini izlenebilir kılın.',
        en: 'Show board members’ areas of expertise and ORCID/academic profile links so their competence can be traced.',
      },
    }),
  ];
}
