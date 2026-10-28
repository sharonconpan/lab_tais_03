/**
 * Contrato del almacén de caché en memoria.
 * Vigencia mínima de 5 minutos por entrada (principio R-04).
 * Las entradas erróneas no se almacenan.
 */
export interface ICacheStore {
  /**
   * Recupera una entrada si existe y no ha expirado.
   * @returns el valor almacenado, o undefined si no existe o expiró.
   */
  get<T>(key: string): T | undefined;

  /**
   * Almacena un valor con un TTL en milisegundos.
   * @param ttlMs tiempo de vida mínimo; por defecto 5 * 60 * 1000 (5 minutos)
   */
  set<T>(key: string, value: T, ttlMs?: number): void;

  /**
   * Invalida una entrada específica.
   * Usar cuando el usuario solicita un refresco explícito (principio R-04).
   */
  invalidate(key: string): void;

  /** Limpia todas las entradas (útil en pruebas). */
  clear(): void;
}
