import { describe, it, expect } from 'vitest';
import { initialLanguage } from './language';

describe('initialLanguage', () => {
  it('defaults to Turkish when nothing was chosen, whatever the browser language', () => {
    expect(initialLanguage(null)).toBe('tr');
  });

  it('keeps an English choice made with the language selector', () => {
    expect(initialLanguage('en')).toBe('en');
  });

  it('ignores an unsupported saved value', () => {
    expect(initialLanguage('de')).toBe('tr');
  });
});
