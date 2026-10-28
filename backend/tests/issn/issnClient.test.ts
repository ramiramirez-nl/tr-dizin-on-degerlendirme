import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

import { lookupIssn } from '../../src/issn/issnClient';

describe('lookupIssn', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid true when ISSN exists at issn.org', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      status: 200,
      data: '<html><head><title>ISSN 1234-5678 - Test Journal (Online)</title></head><body></body></html>',
    });
    const result = await lookupIssn('1234-5678');
    expect(result.valid).toBe(true);
    expect(result.registeredTitle).toBe('Test Journal');
  });

  it('returns valid false when ISSN not found', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      status: 404,
      data: '<html><head><title>Page not found</title></head></html>',
    });
    const result = await lookupIssn('0000-0000');
    expect(result.valid).toBe(false);
    expect(result.lookupFailed).toBeUndefined();
  });

  it('returns valid false with lookupFailed on network error', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));
    const result = await lookupIssn('9999-9999');
    expect(result.valid).toBe(false);
    expect(result.lookupFailed).toBe(true);
  });

  it('normalizes an unhyphenated ISSN before lookup', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      status: 200,
      data: '<title>ISSN 1234-5678 - Another Journal (Print)</title>',
    });
    const result = await lookupIssn('12345678');
    expect(result.issn).toBe('1234-5678');
    expect(result.valid).toBe(true);
  });
});
