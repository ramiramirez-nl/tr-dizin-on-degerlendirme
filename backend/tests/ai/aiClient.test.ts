import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

import { analyzePageContent, verbatimQuote } from '../../src/ai/aiClient';

const aiResponse = (content: string) => ({
  data: { choices: [{ message: { content } }] },
});

const validPayload = JSON.stringify({
  found: true,
  confidence: 'high',
  evidence: 'Page contains "Creative Commons BY 4.0" text',
  issues: [],
});

describe('analyzePageContent', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    vi.mocked(axios.post).mockResolvedValue(aiResponse(validPayload));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('returns a skipped warning result when no API key is configured', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY', '');
    const result = await analyzePageContent({
      pageText: 'Some page content',
      criteria: 'Does this page have an open access statement?',
      url: 'https://example.com',
    });
    expect(result.found).toBe(false);
    expect(result.skipped).toBe(true);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('returns found true when content matches criteria', async () => {
    const result = await analyzePageContent({
      pageText: 'This work is licensed under Creative Commons BY 4.0',
      criteria: 'Does this page display a Creative Commons license?',
      url: 'https://example.com/license',
    });
    expect(result.found).toBe(true);
    expect(result.confidence).toBe('high');
  });

  it('keeps evidence that is a verbatim quote from the page', async () => {
    vi.mocked(axios.post).mockResolvedValue(
      aiResponse(JSON.stringify({ found: true, confidence: 'high', evidence: 'Yayın Dili: Türkçe', issues: [] }))
    );
    const result = await analyzePageContent({
      pageText: 'Dergi Bilgileri yayın dili:  türkçe, İngilizce ISSN 1234',
      criteria: 'verbatim-keep',
      url: 'https://example.com',
    });
    expect(result.evidence).toBe('Yayın Dili: Türkçe');
  });

  it('clears evidence that is a paraphrase or not on the page', async () => {
    vi.mocked(axios.post).mockResolvedValue(
      aiResponse(JSON.stringify({ found: false, confidence: 'high', evidence: 'Sayfada yayın dili belirtilmemiştir.', issues: [] }))
    );
    const result = await analyzePageContent({
      pageText: 'Dergi Bilgileri ISSN 1234',
      criteria: 'verbatim-clear',
      url: 'https://example.com',
    });
    expect(result.found).toBe(false);
    expect(result.evidence).toBe('');
  });

  it('returns structured JSON response', async () => {
    const result = await analyzePageContent({
      pageText: 'Some page content',
      criteria: 'Does this page have an open access statement?',
      url: 'https://example.com',
    });
    expect(result).toHaveProperty('found');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('issues');
  });

  it('returns skipped result when AI response is not JSON', async () => {
    vi.mocked(axios.post).mockResolvedValue(aiResponse('Sorry, I cannot help with that.'));
    const result = await analyzePageContent({
      pageText: 'content',
      criteria: 'criterion',
      url: 'https://example.com',
    });
    expect(result.found).toBe(false);
    expect(result.skipped).toBe(true);
  });

  it('returns skipped result when AI JSON is missing required fields', async () => {
    vi.mocked(axios.post).mockResolvedValue(
      aiResponse(JSON.stringify({ found: 'yes', notes: 'malformed' }))
    );
    const result = await analyzePageContent({
      pageText: 'content',
      criteria: 'criterion',
      url: 'https://example.com',
    });
    expect(result.found).toBe(false);
    expect(result.skipped).toBe(true);
    expect(result.issues).toContain('AI analysis returned malformed result');
  });

  it('returns skipped result when the AI service errors', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('timeout of 20000ms exceeded'));
    const result = await analyzePageContent({
      pageText: 'content',
      criteria: 'criterion',
      url: 'https://example.com',
    });
    expect(result.found).toBe(false);
    expect(result.skipped).toBe(true);
  });
});

describe('verbatimQuote', () => {
  const page = 'Amaç ve Kapsam: Dergi, Edebiyat ve Tarih alanlarında çalışmalar yayımlar. İletişim: info@example.com';

  it('accepts a quote regardless of case and whitespace', () => {
    expect(verbatimQuote('"edebiyat   ve tarih alanlarında"', page)).toBe('"edebiyat   ve tarih alanlarında"');
  });

  it('accepts ellipsis-joined fragments that all occur on the page', () => {
    expect(verbatimQuote('Amaç ve Kapsam ... info@example.com', page)).not.toBe('');
  });

  it('rejects a quote with one fragment missing from the page', () => {
    expect(verbatimQuote('Amaç ve Kapsam ... yayın dili Türkçe', page)).toBe('');
  });

  it('returns an empty string for empty input', () => {
    expect(verbatimQuote('  ', page)).toBe('');
    expect(verbatimQuote('...', page)).toBe('');
  });
});
