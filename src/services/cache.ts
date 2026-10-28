import type { ICacheStore } from '../../contracts/ICacheStore';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutos

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class MemoryCache implements ICacheStore {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    // No almacenar errores (constitución R-04)
    if (value instanceof Error) return;
    this.store.set(key, { data: value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
