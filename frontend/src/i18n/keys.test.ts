import { describe, it, expect } from 'vitest';
import tr from './tr.json';
import en from './en.json';

// tr.json is the reference locale; en.json must mirror its key set exactly.
const referenceKeys = new Set(Object.keys(tr));

describe('i18n key parity', () => {
  it('en.json has the same keys as tr.json', () => {
    const keys = new Set(Object.keys(en));
    const missing = [...referenceKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !referenceKeys.has(k));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });
});
