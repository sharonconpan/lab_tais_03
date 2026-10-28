import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryCache } from '../../src/services/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('almacena y recupera un valor antes del TTL', () => {
    cache.set('k', 42, 5000);
    expect(cache.get<number>('k')).toBe(42);
  });

  it('devuelve undefined tras expirar el TTL', () => {
    cache.set('k', 'hola', 1000);
    vi.advanceTimersByTime(1001);
    expect(cache.get('k')).toBeUndefined();
  });

  it('invalida una entrada específica', () => {
    cache.set('k', 1);
    cache.invalidate('k');
    expect(cache.get('k')).toBeUndefined();
  });

  it('clear elimina todas las entradas', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });

  it('no almacena instancias de Error', () => {
    cache.set('err', new Error('fallo'));
    expect(cache.get('err')).toBeUndefined();
  });

  it('devuelve undefined para clave inexistente', () => {
    expect(cache.get('nope')).toBeUndefined();
  });
});
