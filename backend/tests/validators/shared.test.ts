import { describe, it, expect } from 'vitest';
import { expandRefs, pick, withRef } from '../../src/validators/shared';

describe('expandRefs', () => {
  it('spells out a single code in Turkish and English', () => {
    expect(expandRefs('Eksik. (ÖK 8)', 'tr')).toBe('Eksik. (Ön Koşul 8)');
    expect(expandRefs('Missing. (ÖK 8)', 'en')).toBe('Missing. (Prerequisite 8)');
    expect(expandRefs('x (K 12)', 'tr')).toBe('x (Kriter 12)');
    expect(expandRefs('x (K 12)', 'en')).toBe('x (Criterion 12)');
    expect(expandRefs('x (GH 4)', 'tr')).toBe('x (Genel Husus 4)');
    expect(expandRefs('x (GH 4)', 'en')).toBe('x (General Point 4)');
    expect(expandRefs('x (T 3)', 'tr')).toBe('x (Tavsiye 3)');
    expect(expandRefs('x (T 3)', 'en')).toBe('x (Recommendation 3)');
  });

  it('defaults to Turkish when no language is given', () => {
    expect(expandRefs('(ÖK 1)')).toBe('(Ön Koşul 1)');
  });

  it('keeps the dash of a range', () => {
    expect(expandRefs('(ÖK 10–14)', 'tr')).toBe('(Ön Koşul 10–14)');
    expect(expandRefs('(K 8.3–8.5)', 'en')).toBe('(Criterion 8.3–8.5)');
  });

  it('keeps the commas of a list', () => {
    expect(expandRefs('(ÖK 10–14, GH 8, GH 11)', 'tr')).toBe(
      '(Ön Koşul 10–14, Genel Husus 8, Genel Husus 11)'
    );
    expect(expandRefs('(K 8.1, K 8.2)', 'en')).toBe('(Criterion 8.1, Criterion 8.2)');
  });

  it('handles decimal criteria such as K 8.2', () => {
    expect(expandRefs('(K 8.2)', 'tr')).toBe('(Kriter 8.2)');
    expect(expandRefs('(K 18.3)', 'en')).toBe('(Criterion 18.3)');
  });

  it('handles Sözleşme references', () => {
    expect(expandRefs('(Sözleşme 13/14)', 'tr')).toBe('(Başvuru Sözleşmesi 13/14)');
    expect(expandRefs('(Sözleşme 13, 14)', 'tr')).toBe('(Başvuru Sözleşmesi 13, 14)');
    expect(expandRefs('(Sözleşme 13/14)', 'en')).toBe('(Application Agreement 13/14)');
  });

  it('leaves URLs and unrelated parentheses untouched', () => {
    const text = 'Bkz. https://example.com/wiki/Page_(K1)/k-12?x=(T3) (https://example.com/ok-8)';
    expect(expandRefs(text, 'tr')).toBe(text);
    expect(expandRefs('(Derleme ve Olgu Sunumu Dergileri 1)', 'tr')).toBe(
      '(Derleme ve Olgu Sunumu Dergileri 1)'
    );
    expect(expandRefs('Evidence (see K 4 above)', 'en')).toBe('Evidence (see K 4 above)');
    expect(expandRefs('(example.com)', 'en')).toBe('(example.com)');
  });

  it('is idempotent', () => {
    const once = expandRefs('(ÖK 2, K 3)', 'en');
    expect(expandRefs(once, 'en')).toBe(once);
  });
});

describe('pick and withRef', () => {
  it('pick expands refs for the chosen language only', () => {
    const text = { tr: 'Eksik (ÖK 6)', en: 'Missing (ÖK 6)' };
    expect(pick('tr', text)).toBe('Eksik (Ön Koşul 6)');
    expect(pick('en', text)).toBe('Missing (Prerequisite 6)');
  });

  it('withRef appends the spelled-out reference', () => {
    expect(withRef('Message.', 'K 15', 'tr')).toBe('Message. (Kriter 15)');
    expect(withRef('Message.', 'K 15', 'en')).toBe('Message. (Criterion 15)');
    expect(withRef('Message.', undefined, 'en')).toBe('Message.');
  });
});
