import { NetworkError, NotFoundError, TimeoutError } from './errors';

const TIMEOUT_MS = 10_000;

/**
 * Realiza GET a `url` con timeout de 10 s y cancelación externa.
 * Lanza TypedError según el tipo de fallo (RF-024, RF-025).
 */
export async function httpGet<T>(url: string, externalSignal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);

  // Propagar cancelación externa
  externalSignal?.addEventListener('abort', () => controller.abort(externalSignal.reason));

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status === 404) throw new NotFoundError(url);
    if (!response.ok) throw new NetworkError(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      if (err.message === 'timeout' || (err as { reason?: string }).reason === 'timeout') {
        throw new TimeoutError();
      }
      // Cancelación externa — relanzar como NetworkError retryable
      throw new NetworkError('Petición cancelada.');
    }
    if (err instanceof TypeError) throw new NetworkError(err.message);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
