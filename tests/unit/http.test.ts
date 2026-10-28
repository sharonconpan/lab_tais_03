import { describe, it, expect, vi, afterEach } from 'vitest';
import { httpGet } from '../../src/services/http';
import { NetworkError, NotFoundError, TimeoutError } from '../../src/services/errors';

const mockFetch = (response: Partial<Response>) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
};

const mockFetchReject = (err: Error) => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(err));
};

afterEach(() => vi.unstubAllGlobals());

describe('httpGet', () => {
  it('devuelve JSON en respuesta 200', async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ id: 1 }) } as Response);
    const result = await httpGet<{ id: number }>('https://example.com');
    expect(result.id).toBe(1);
  });

  it('lanza NotFoundError ante 404', async () => {
    mockFetch({ ok: false, status: 404 } as Response);
    await expect(httpGet('https://example.com')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lanza NetworkError ante error de red (TypeError)', async () => {
    mockFetchReject(new TypeError('Failed to fetch'));
    await expect(httpGet('https://example.com')).rejects.toBeInstanceOf(NetworkError);
  });

  it('lanza TimeoutError cuando el AbortController aborta por timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        () => new Promise((_res, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), { name: 'AbortError', message: 'timeout' })), 20_000))
      )
    );
    const promise = httpGet('https://example.com');
    vi.advanceTimersByTime(10_001);
    await expect(promise).rejects.toBeInstanceOf(TimeoutError);
    vi.useRealTimers();
  });
});
