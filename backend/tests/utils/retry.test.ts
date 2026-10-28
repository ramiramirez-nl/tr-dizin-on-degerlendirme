import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '../../src/utils/retry';

describe('withRetry', () => {
  it('returns the result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn, { attempts: 2, baseDelayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries once on transient failure then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce('ok');
    await expect(withRetry(fn, { attempts: 2, baseDelayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));
    await expect(withRetry(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('fails fast when shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal'));
    await expect(
      withRetry(fn, { attempts: 3, baseDelayMs: 1, shouldRetry: () => false })
    ).rejects.toThrow('fatal');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
