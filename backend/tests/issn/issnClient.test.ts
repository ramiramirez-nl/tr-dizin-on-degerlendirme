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

  it('reports a bot challenge page as a failed lookup, not a registered title', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      status: 200,
      data: '<html><head><title>Making sure you&#39;re not a bot!</title></head><body></body></html>',
    });
    const result = await lookupIssn('2651-4117');
    expect(result.valid).toBe(false);
    expect(result.lookupFailed).toBe(true);
    expect(result.registeredTitle).toBe('');
  });

  it('does not cache a failed lookup', async () => {
    vi.mocked(axios.get)
      .mockResolvedValueOnce({ status: 200, data: '<title>Making sure you&#39;re not a bot!</title>' })
      .mockResolvedValueOnce({ status: 200, data: '<title>ISSN 2651-4118 - Real Journal (Online)</title>' });
    expect((await lookupIssn('2651-4118')).lookupFailed).toBe(true);
    const second = await lookupIssn('2651-4118');
    expect(second.valid).toBe(true);
    expect(second.registeredTitle).toBe('Real Journal');
  });

  it('decodes HTML entities in the registered title', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      status: 200,
      data: '<title>ISSN 1111-2222 - Journal of Law &amp; Society&#39;s Review (Print)</title>',
    });
    const result = await lookupIssn('1111-2222');
    expect(result.registeredTitle).toBe("Journal of Law & Society's Review");
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
