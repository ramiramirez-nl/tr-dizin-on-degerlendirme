import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

import { scrapeUrl, validatePublicUrl } from '../../src/scraper/pageScraper';

const htmlResponse = (html: string, status = 200) => ({
  status,
  data: html,
});

describe('validatePublicUrl', () => {
  it('accepts a normal public https URL', () => {
    expect(validatePublicUrl('https://example.com/license')).toContain('example.com');
  });

  it.each([
    'http://localhost/admin',
    'http://127.0.0.1/',
    'http://10.0.0.5/',
    'http://172.16.1.1/',
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://metadata.google.internal/',
  ])('blocks internal/private target %s', (url) => {
    expect(() => validatePublicUrl(url)).toThrow();
  });

  it('blocks non-http protocols', () => {
    expect(() => validatePublicUrl('ftp://example.com/file')).toThrow();
    expect(() => validatePublicUrl('file:///etc/passwd')).toThrow();
  });

  it('rejects malformed URLs', () => {
    expect(() => validatePublicUrl('not a url')).toThrow();
  });
});

describe('scrapeUrl', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns page text and links', async () => {
    vi.mocked(axios.get).mockResolvedValue(
      htmlResponse(
        '<html><body><p>Creative Commons BY license</p>' +
          '<a href="https://creativecommons.org/licenses/by/4.0/">CC BY</a></body></html>'
      )
    );
    const result = await scrapeUrl('https://example.com/license');
    expect(result.text).toContain('Creative Commons BY license');
    expect(result.links).toContain('https://creativecommons.org/licenses/by/4.0/');
    expect(result.accessible).toBe(true);
    expect(result.statusCode).toBe(200);
  });

  it('returns accessible false on HTTP error status', async () => {
    vi.mocked(axios.get).mockResolvedValue(htmlResponse('Not Found', 404));
    const result = await scrapeUrl('https://example.com/missing');
    expect(result.accessible).toBe(false);
    expect(result.statusCode).toBe(404);
    expect(result.errorType).toBe('http');
  });

  it('returns accessible false with timeout errorType on timeout', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('timeout of 15000ms exceeded'));
    const result = await scrapeUrl('https://slow.example.com');
    expect(result.accessible).toBe(false);
    expect(result.errorType).toBe('timeout');
  });

  it('returns accessible false on network error', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await scrapeUrl('https://broken-url.example.com');
    expect(result.accessible).toBe(false);
    expect(result.text).toBe('');
    expect(result.errorType).toBe('network');
  });

  it('blocks private URLs without making a request', async () => {
    const result = await scrapeUrl('http://192.168.1.1/internal');
    expect(result.accessible).toBe(false);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
