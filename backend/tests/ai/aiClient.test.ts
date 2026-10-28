import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

import { analyzePageContent } from '../../src/ai/aiClient';

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
