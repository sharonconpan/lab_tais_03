/**
 * Contrato del cliente de PokéAPI.
 * La capa de aplicación solo conoce esta interfaz, nunca la implementación concreta.
 * Esto permite sustituirla por un mock en pruebas (principio P-03).
 */

import type {
  PokemonEntry,
  PokemonDetail,
  AbilityDetail,
  PokemonType,
} from '../src/domain/types';

export interface FetchOptions {
  /** Si es true, ignora la caché y fuerza una petición nueva (principio R-04) */
  forceRefresh?: boolean;
}

export interface IPokeApiClient {
  /**
   * Obtiene el índice completo de criaturas.
   * Se cachea en sesión; una sola petición de red por sesión (principio R-05).
   */
  getPokemonIndex(options?: FetchOptions): Promise<PokemonEntry[]>;

  /**
   * Obtiene el detalle de una criatura por id o nombre.
   * @throws {NotFoundError} si el id/nombre no existe (404)
   * @throws {TimeoutError} si la petición supera 10 segundos (RF-025)
   * @throws {NetworkError} si no hay conectividad
   */
  getPokemonDetail(idOrName: number | string, options?: FetchOptions): Promise<PokemonDetail>;

  /**
   * Obtiene la lista de todos los tipos disponibles.
   */
  getTypeList(options?: FetchOptions): Promise<PokemonType[]>;

  /**
   * Obtiene las criaturas que pertenecen a un tipo.
   * Usado para implementar el filtro OR (NC-01 / RF-014).
   */
  getPokemonByType(typeName: PokemonType, options?: FetchOptions): Promise<PokemonEntry[]>;

  /**
   * Obtiene el detalle de una habilidad.
   * Incluye la descripción en español si está disponible; si no, en inglés (NC-02 / RF-018).
   * @throws {NotFoundError} si la habilidad no existe
   * @throws {TimeoutError} si la petición supera 10 segundos
   */
  getAbility(name: string, options?: FetchOptions): Promise<AbilityDetail>;

  /**
   * Cancela todas las peticiones en curso.
   * Llamar al desmontar una vista para evitar actualizaciones de estado fantasma.
   */
  cancelAll(): void;
}
