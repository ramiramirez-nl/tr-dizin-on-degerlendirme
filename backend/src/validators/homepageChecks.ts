import type { Bilingual } from './shared';

export interface HomepageCheck {
  field: string;
  criteria: string;
  pass: Bilingual;
  fail: Bilingual;
  suggestion: Bilingual;
  unverified: Bilingual;
  /** Criterion reference appended to this check's messages, e.g. `ÖK 6`. */
  ref: string;
}

export const HOMEPAGE_CHECKS: HomepageCheck[] = [
  {
    field: 'issnOnHomepage',
    ref: 'ÖK 6',
    criteria:
      'Is an ISSN and/or e-ISSN number visibly displayed on this page (for example "ISSN: 1234-5678" or "e-ISSN: 1234-5678" in the header, footer or journal information box)? The page may be in Turkish or English.',
    pass: {
      tr: 'ISSN ve/veya e-ISSN numarası dergi ana sayfasında görünür biçimde yer alıyor. (ÖK 6)',
      en: 'The ISSN and/or e-ISSN is visibly displayed on the journal homepage. (ÖK 6)',
    },
    fail: {
      tr: 'ISSN veya e-ISSN numarası dergi ana sayfasında görünür biçimde bulunamadı. (ÖK 6)',
      en: 'No visible ISSN or e-ISSN was found on the journal homepage. (ÖK 6)',
    },
    suggestion: {
      tr: 'Dergi ana sayfasında (başlık, alt bilgi veya dergi bilgi kutusunda) ISSN ve/veya e-ISSN numarasını açıkça gösterin.',
      en: 'Display the ISSN and/or e-ISSN clearly on the homepage (header, footer or journal information box).',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için ISSN numarasının sayfada görüntülendiği doğrulanamadı. (ÖK 6)',
      en: 'The homepage could not be reached, so the visibility of the ISSN could not be verified. (ÖK 6)',
    },
  },
  {
    field: 'peerReviewedStatement',
    ref: 'ÖK 7',
    criteria:
      'Does the page state that the journal is a peer-reviewed (hakemli) scientific journal, for example "hakemli bilimsel dergi", "çift kör hakemlik" or "peer-reviewed scholarly journal"? The page may be in Turkish or English.',
    pass: {
      tr: 'Ana sayfada derginin hakemli bir bilimsel dergi olduğu belirtiliyor. (ÖK 7)',
      en: 'The homepage states that the journal is a peer-reviewed scientific journal. (ÖK 7)',
    },
    fail: {
      tr: 'Ana sayfada derginin hakemli bir bilimsel dergi olduğuna dair bir ifade bulunamadı. (ÖK 7)',
      en: 'No statement that the journal is peer-reviewed and scientific was found on the homepage. (ÖK 7)',
    },
    suggestion: {
      tr: 'Ana sayfada derginin hakemli (bilimsel hakem sistemiyle yayımlanan) bir bilimsel dergi olduğunu açıkça belirtin.',
      en: 'State clearly on the homepage that the journal is a peer-reviewed scientific journal.',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için hakemli dergi ifadesi doğrulanamadı. (ÖK 7)',
      en: 'The homepage could not be reached, so the peer-review statement could not be verified. (ÖK 7)',
    },
  },
  {
    field: 'publicationLanguageStated',
    ref: 'ÖK 8',
    criteria:
      'Does the page state the journal\'s publication language(s), meaning the language(s) in which articles are published (for example "Yayın dili: Türkçe, İngilizce", "Yayın Dili", "Dil: Türkçe", "Languages: Turkish, English" or "Publication language: English")? A website interface language switcher (such as TR/EN buttons) or an html lang attribute alone does NOT count. The page may be in Turkish or English.',
    pass: {
      tr: 'Derginin yayın dili/dilleri ana sayfada belirtiliyor. (ÖK 8)',
      en: "The journal's publication language(s) are stated on the homepage. (ÖK 8)",
    },
    fail: {
      tr: 'Derginin yayın dili/dilleri ana sayfada belirtilmiyor. (ÖK 8)',
      en: "The journal's publication language(s) are not stated on the homepage. (ÖK 8)",
    },
    suggestion: {
      tr: 'Dergi ana sayfasında yayın dilini veya dillerini açıkça belirtin.',
      en: 'State the publication language(s) clearly on the journal homepage.',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için yayın dilinin belirtildiği doğrulanamadı. (ÖK 8)',
      en: 'The homepage could not be reached, so the stated publication language could not be verified. (ÖK 8)',
    },
  },
  {
    field: 'ethicsOnHomepage',
    ref: 'K 8.3',
    criteria:
      'Does the page, including its menus and links, show a separate heading, menu item or link for the journal\'s publication ethics principles (for example "Etik İlkeler", "Yayın Etiği", "Etik İlkeler ve Yayın Politikası" or "Publication Ethics")? The page may be in Turkish or English.',
    pass: {
      tr: 'Yayın etiği ilkelerine ana sayfadan ayrı bir başlık veya bağlantı ile ulaşılabiliyor. (K 8.3)',
      en: 'The publication ethics principles are reachable from the homepage under a separate heading or link. (K 8.3)',
    },
    fail: {
      tr: 'Ana sayfada yayın etiği ilkeleri için ayrı bir başlık veya bağlantı bulunamadı. (K 8.3)',
      en: 'No separate heading or link for the publication ethics principles was found on the homepage. (K 8.3)',
    },
    suggestion: {
      tr: 'Ana sayfada (menüde veya dergi bilgileri bölümünde) görünür bir "Etik İlkeler" başlığı veya bağlantısı ekleyin.',
      en: 'Add a visible "Ethics" heading or link to the homepage menu or journal information section.',
    },
    unverified: {
      tr: 'Ana sayfaya erişilemediği için etik ilkeler başlığının varlığı doğrulanamadı. (K 8.3)',
      en: 'The homepage could not be reached, so the ethics heading could not be verified. (K 8.3)',
    },
  },
];
