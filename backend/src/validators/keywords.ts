/**
 * Keywords that locate the passages each page check needs on a long page
 * (see `selectPassages()` in `../scraper/passages.ts`). Turkish and English,
 * matched at the start of a word, case-insensitive. Stems are fine:
 * "sorumlulu" matches "Sorumlulukları".
 */
export const KEYWORDS = {
  aimsAndScope: ['amaç', 'amac', 'kapsam', 'aim', 'aims', 'scope', 'yayımla', 'yayınla', 'publish'],
  authorGuidelines: [
    'yazım kural', 'yazım', 'kural', 'şablon', 'atıf', 'kaynak gösterme', 'kaynakça', 'apa', 'mla', 'chicago',
    'isnad', 'özet', 'tablo', 'şekil', 'kelime', 'guideline', 'template', 'citation', 'reference', 'abstract',
  ],
  publicationPolicy: [
    'yayın politika', 'açık erişim', 'open access', 'lisans', 'license', 'creative commons', 'cc by', 'süre',
    'değerlendirme süreci', 'hakem', 'publication policy', 'review',
  ],
  feePolicy: ['ücret', 'ücretsiz', 'fee', 'fees', 'charge', 'apc', 'ödeme', 'masraf', 'free of charge', 'payment'],
  editorialBoard: ['editör', 'kurul', 'üniversite', 'university', 'board', 'editor', 'prof', 'doç', 'dr'],
  peerReview: [
    'hakem', 'değerlendir', 'kör', 'blind', 'review', 'referee', 'iki', 'two', 'çift', 'double',
  ],
  peerReviewDetail: [
    'hakem', 'değerlendir', 'kör', 'çift', 'blind', 'süre', 'gün', 'hafta', 'karar', 'aşama', 'adım',
    'ön inceleme', 'editör', 'review', 'days', 'weeks', 'decision', 'stage', 'step',
  ],
  plagiarism: ['intihal', 'benzerlik', 'ithenticate', 'turnitin', 'intihal.net', 'plagiarism', 'similarity'],
  sampleArticle: [
    'özet', 'öz', 'abstract', 'anahtar kelime', 'keywords', 'geliş', 'kabul', 'received', 'accepted', 'orcid',
    'üniversite', 'university', 'kaynakça', 'kaynaklar', 'references', 'araştırma makalesi', 'research article',
    'derleme', 'makale türü',
  ],
  /** First pages of an article PDF: cover, abstracts, keywords, dates, citation line. */
  articleFrontMatter: [
    'keywords', 'key words', 'anahtar kelime', 'anahtar sözcük', 'abstract', 'öz', 'özet', 'received', 'accepted',
    'geliş', 'kabul', 'orcid', 'research article', 'araştırma makalesi', 'review article', 'derleme', 'makale türü',
    'article type', 'cite', 'atıf', 'citation', 'doi', 'university', 'üniversite', 'jel',
  ],
  ethics: [
    'etik', 'ethic', 'cope', 'icmje', 'sorumlulu', 'responsibilit', 'bildirge', 'yazar', 'hakem', 'editör',
    'author', 'reviewer', 'editor', 'araştırma ve yayın etiği',
  ],
} as const;
