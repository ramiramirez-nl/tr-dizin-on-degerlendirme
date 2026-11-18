import { describe, it, expect } from 'vitest';
import { foldCase, selectPassages } from '../../src/scraper/passages';
import { KEYWORDS } from '../../src/validators/keywords';

const filler = (label: string, n: number) =>
  Array.from({ length: n }, (_v, i) => `${label} paragraf ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.`).join('\n');

// Shape of a DergiPark "Yazar Rehberi" page: menu lines, then long collapsed
// sections, with the review process far below the first few thousand characters.
const authorGuidePage = [
  'DergiPark',
  'Türkçe',
  'İngilizce',
  'Keşfet',
  'Arşiv',
  'Amaç ve Kapsam',
  'Hakem Süreci İlkeleri',
  'Yazar Rehberi',
  'Atıf Sistemi',
  'Yazım kurallarının detayları ve atıf gösterme biçimine buradan ulaşabilirsiniz.',
  'Genel Bilgiler',
  filler('Genel', 70),
  'Çalışmaların Kelime Sayısı Sınırları',
  filler('Sınır', 20),
  'Çalışmanın Değerlendirilmesi',
  'Dergiye gönderilen çalışmalar ön incelemeden sonra en az iki hakemin değerlendirmesine sunulur. Değerlendirme çift taraflı kör hakemlik ile yapılır.',
  'Makale Geri Çekme İşlemi',
  filler('Geri çekme', 10),
].join('\n');

describe('selectPassages', () => {
  it('returns short text unchanged', () => {
    expect(selectPassages('kısa metin', ['hakem'], 4000)).toEqual({ text: 'kısa metin', partial: false });
  });

  it('finds the review process far below the start of a long page', () => {
    expect(authorGuidePage.length).toBeGreaterThan(8000);
    const { text, partial } = selectPassages(authorGuidePage, [...KEYWORDS.peerReview], 4000);
    expect(text.length).toBeLessThanOrEqual(4000);
    expect(text).toContain('en az iki hakemin değerlendirmesine sunulur');
    expect(text).toContain('Çalışmanın Değerlendirilmesi');
    expect(partial).toBe(false);
  });

  it('keeps the original order and marks omitted parts', () => {
    const { text } = selectPassages(authorGuidePage, ['atıf', 'hakem'], 4000);
    expect(text).toContain('[...]');
    expect(text.indexOf('Atıf Sistemi')).toBeLessThan(text.indexOf('Çalışmanın Değerlendirilmesi'));
  });

  it('flags the selection as partial when matching blocks do not fit', () => {
    const many = Array.from({ length: 200 }, (_v, i) => `Hakem raporu ${i} ile ilgili uzun bir açıklama cümlesi burada yer alıyor.`).join('\n');
    expect(selectPassages(many, ['hakem'], 1000).partial).toBe(true);
  });

  it('falls back to the start of the page when no keyword matches', () => {
    const { text, partial } = selectPassages(filler('X', 100), ['hakem'], 500);
    expect(text.length).toBe(500);
    expect(partial).toBe(false);
  });

  it('matches across Turkish dotted and dotless I', () => {
    expect(foldCase('ISSN')).toBe(foldCase('issn'));
    expect(foldCase('İNGİLİZCE')).toBe('ingilizce');
    const page = `${filler('A', 80)}\ne-ISSN: 2651-4117\n${filler('B', 80)}`;
    expect(selectPassages(page, ['issn'], 2000).text).toContain('e-ISSN: 2651-4117');
  });

  it('keeps role headings even when keyword-heavy body paragraphs exceed the budget', () => {
    const body = (role: string) =>
      Array.from({ length: 12 }, (_v, i) =>
        `${role} ${i}: Yazar, hakem ve editör etik ilkelere uymalıdır; editör yazarın ve hakemin haklarını korur, hakem yazar ile editör arasındaki gizliliğe uyar ve etik ihlalleri editöre bildirir.`
      ).join('\n');
    const ethics = [
      'Yayın Etiği',
      'Dergi, COPE tarafından hazırlanan Yürütme Kılavuzu ve Uygulama Rehberini izlemeyi taahhüt eder.',
      'Yayın Etiği Bildirgesi',
      'Editör ve Editör Kurulunun Sorumlulukları',
      body('Editör'),
      'Yayın Kurulunun Sorumlulukları',
      body('Kurul'),
      'Hakemlerin Sorumlulukları',
      body('Hakem'),
      'Yazarların Sorumlulukları',
      body('Yazar'),
    ].join('\n');
    expect(ethics.length).toBeGreaterThan(8000);
    const { text } = selectPassages(ethics, [...KEYWORDS.ethics], 4000);
    for (const heading of ['Yayın Etiği Bildirgesi', 'Editör ve Editör Kurulunun Sorumlulukları', 'Hakemlerin Sorumlulukları', 'Yazarların Sorumlulukları', 'COPE']) {
      expect(text).toContain(heading);
    }
  });

  it('finds every role section of a long ethics page', () => {
    const ethics = [
      'Yayın Etiği',
      'Dergi, COPE tarafından hazırlanan Yürütme Kılavuzu ve Uygulama Rehberini izlemeyi taahhüt eder.',
      'Yayın Etiği Bildirgesi',
      'Editör ve Editör Kurulunun Sorumlulukları',
      filler('Editör görevi', 30),
      'Hakemlerin Sorumlulukları',
      filler('Hakem görevi', 30),
      'Yazarların Sorumlulukları',
      filler('Yazar görevi', 30),
    ].join('\n');
    const { text } = selectPassages(ethics, [...KEYWORDS.ethics], 4000);
    for (const heading of ['COPE', 'Editör ve Editör Kurulunun Sorumlulukları', 'Hakemlerin Sorumlulukları', 'Yazarların Sorumlulukları']) {
      expect(text).toContain(heading);
    }
  });
});

describe('pdfExcerpt', () => {
  const abstractTr = 'Öz\n' + 'Bu çalışma Avrupa ülkelerinde bilgi ve iletişim teknolojileri performansını karşılaştırmalı olarak değerlendirmektedir. '.repeat(14);
  const abstractEn = 'Abstract\n' + 'This study compares the ICT performance of European countries with a hybrid multi-criteria decision making framework. '.repeat(14);

  it('reaches the English keywords on page 3 when cover and abstracts span three pages', async () => {
    const { pdfExcerpt } = await import('../../src/validators/sampleArticle');
    const pages = [
      'Araştırma Makalesi / Research Article\nGeliş: 02.04.2026 Kabul: 05.06.2026\nAtıf: Onat, K. T. (2026). Dergi, 28(Özel Sayı), 1-20.',
      `${abstractTr}\nAnahtar Kelimeler: Dijital Rekabetçilik, BİT`,
      `${abstractEn}\nKeywords: Digital Competitiveness, ICT, Europe, MCDM`,
      'Giriş\n' + 'Gövde. '.repeat(400),
      'Kaynakça\nSmith, J. (2020). Title.',
    ];
    expect(pages[1].length + pages[2].length).toBeGreaterThan(3000);
    const { text, partial } = pdfExcerpt(pages);
    expect(text).toContain('Keywords: Digital Competitiveness');
    expect(text).toContain('Anahtar Kelimeler: Dijital Rekabetçilik');
    expect(text).toContain('Geliş: 02.04.2026');
    expect(text).toContain('--- Sayfa / Page 3 ---');
    expect(partial).toBe(false);
  });
});
