export interface RetryOptions {
  /** Total attempts including the first call. */
  attempts?: number;
  baseDelayMs?: number;
  /** Return false to fail fast (e.g. on non-retryable HTTP errors). */
  shouldRetry?: (err: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = opts.attempts ?? 2;
  const baseDelayMs = opts.baseDelayMs ?? 750;
  const shouldRetry = opts.shouldRetry ?? (() => true);

  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === attempts - 1 || !shouldRetry(err)) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, baseDelayMs * 2 ** attempt)
      );
    }
  }
  throw lastErr;
}
