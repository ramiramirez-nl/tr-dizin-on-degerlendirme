/**
 * Small in-memory TTL cache with LRU eviction. Single-instance deployment
 * (Render free tier), so process memory is the only store we need.
 */
export class TtlCache<V> {
  private map = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    private ttlMs: number,
    private maxEntries: number
  ) {}

  get(key: string): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    // Re-insert to mark as most recently used.
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
