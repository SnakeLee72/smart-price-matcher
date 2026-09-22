interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private static memoryStore = new Map<string, CacheEntry<unknown>>();

  /**
   * Get an item from cache
   */
  public static async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set an item with TTL in seconds
   */
  public static async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  /**
   * Delete an item
   */
  public static async delete(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  /**
   * Clear all items in memory cache
   */
  public static async clear(): Promise<void> {
    this.memoryStore.clear();
  }
}
