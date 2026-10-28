import { describe, it, expect, vi, afterEach } from 'vitest';
import { TtlCache } from '../../src/utils/ttlCache';

describe('TtlCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves values', () => {
    const cache = new TtlCache<string>(1000, 10);
    cache.set('a', 'value');
    expect(cache.get('a')).toBe('value');
    expect(cache.get('missing')).toBeUndefined();
  });

  it('expires entries after the TTL', () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1000, 10);
    cache.set('a', 'value');
    vi.advanceTimersByTime(1001);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('evicts the least recently used entry at capacity', () => {
    const cache = new TtlCache<number>(60_000, 2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // refresh a → b is now oldest
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('clear empties the cache', () => {
    const cache = new TtlCache<number>(60_000, 10);
    cache.set('a', 1);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });
});
