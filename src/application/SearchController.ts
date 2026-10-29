/**
 * HU02-05 — Controlador SearchController
 * RF-004: búsqueda por nombre parcial/completo, sin distinción de mayúsculas
 * RF-005: búsqueda por número nacional exacto
 * RF-006: nombres con caracteres especiales
 * RF-007: sin resultados → success con array vacío
 * RF-008: campo vacío → devuelve ValidationResult sin modificar el estado
 * RF-009: solo símbolos → devuelve ValidationResult sin modificar el estado
 * RF-010: número inexistente → error con mensaje específico
 * RF-011: la lógica de debounce reside en SearchBar; el controller no la duplica
 * RF-027: paginación sobre el conjunto filtrado completo
 *
 * Implementa IController<PokemonEntry[]>.
 */
import type { IController } from '../../contracts/IController';
import type { IPokeApiClient } from '../../contracts/IPokeApiClient';
import type { AsyncState, PaginationParams, PokemonEntry } from '../domain/types';
import { validateSearchTerm, type ValidationResult } from './searchValidation';
import { filterIndex } from './searchFilter';
import { i18n } from '../i18n/es';

export interface SearchControllerOptions {
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export class SearchController implements IController<PokemonEntry[]> {
  private _state: AsyncState<PokemonEntry[]> = { status: 'idle' };
  private _listeners: Array<(state: AsyncState<PokemonEntry[]>) => void> = [];

  /** Índice completo, cargado una sola vez */
  private _index: PokemonEntry[] = [];
  /** Resultados del filtro actual (subconjunto del índice) */
  private _filtered: PokemonEntry[] = [];
  private _page = 1;
  private readonly _pageSize: number;
  private readonly _api: IPokeApiClient;

  constructor(api: IPokeApiClient, options?: SearchControllerOptions) {
    this._api = api;
    this._pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  }

  // ------------------------------------------------------------------ //
  // IController implementation                                           //
  // ------------------------------------------------------------------ //

  get state(): AsyncState<PokemonEntry[]> {
    return this._state;
  }

  subscribe(listener: (state: AsyncState<PokemonEntry[]>) => void): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter((l) => l !== listener);
    };
  }

  destroy(): void {
    this._listeners = [];
    this._api.cancelAll();
  }

  // ------------------------------------------------------------------ //
  // Paginación                                                           //
  // ------------------------------------------------------------------ //

  get pagination(): PaginationParams {
    return {
      page: this._page,
      pageSize: this._pageSize,
      total: this._filtered.length,
    };
  }

  // ------------------------------------------------------------------ //
  // Operaciones                                                          //
  // ------------------------------------------------------------------ //

  /**
   * Ejecuta una búsqueda sobre el índice completo.
   *
   * - Valida el término antes de tocar la API. Si es inválido devuelve
   *   ValidationResult y deja el estado en `idle` (RF-008, RF-009).
   * - Carga el índice si no estaba en memoria (una sola petición, RF-011).
   * - Aplica filterIndex sobre el índice completo.
   * - Si el término es numérico y no hay resultados, pasa a `error` con
   *   mensaje específico (RF-010).
   * - Si hay resultados: `success` con la primera página (RF-004, RF-005).
   * - Si no hay resultados (texto): `success` con array vacío (RF-007).
   *
   * @returns ValidationResult para que SearchBar sepa si mostrar validación.
   */
  async search(term: string): Promise<ValidationResult> {
    const validation = validateSearchTerm(term);
    if (!validation.valid) {
      // No modificar estado — queda en idle o en el estado previo
      return validation;
    }

    // Asegurarse de tener el índice en memoria
    if (this._index.length === 0) {
      this._setState({ status: 'loading' });
      try {
        this._index = await this._api.getPokemonIndex();
      } catch (err) {
        this._setState({
          status: 'error',
          message: err instanceof Error ? err.message : i18n.errorCarga,
          retryable: err instanceof Error && (err as { retryable?: boolean }).retryable !== false,
        });
        return { valid: true };
      }
    } else {
      this._setState({ status: 'loading' });
    }

    const trimmed = term.trim();
    this._filtered = filterIndex(this._index, trimmed);

    // RF-010: número numérico sin resultado → error específico
    const isNumeric = /^\d+$/.test(trimmed);
    if (isNumeric && this._filtered.length === 0) {
      this._setState({
        status: 'error',
        message: i18n.numeroInexistente,
        retryable: false,
      });
      return { valid: true };
    }

    // RF-007: sin resultados textuales → success con array vacío
    this._page = 1;
    this._emitCurrentPage();
    return { valid: true };
  }

  /**
   * Limpia la búsqueda y vuelve a idle.
   */
  clear(): void {
    this._filtered = [];
    this._page = 1;
    this._setState({ status: 'idle' });
  }

  /** Avanza a la siguiente página de resultados (RF-027) */
  async nextPage(): Promise<void> {
    const totalPages = Math.ceil(this._filtered.length / this._pageSize);
    if (this._page >= totalPages) return;
    this._page++;
    this._setState({ status: 'loading' });
    this._emitCurrentPage();
  }

  /** Retrocede a la página anterior de resultados (RF-027) */
  async prevPage(): Promise<void> {
    if (this._page <= 1) return;
    this._page--;
    this._setState({ status: 'loading' });
    this._emitCurrentPage();
  }

  // ------------------------------------------------------------------ //
  // Privado                                                              //
  // ------------------------------------------------------------------ //

  private _emitCurrentPage(): void {
    const start = (this._page - 1) * this._pageSize;
    const end = start + this._pageSize;
    const slice = this._filtered.slice(start, end);
    this._setState({ status: 'success', data: slice });
  }

  private _setState(state: AsyncState<PokemonEntry[]>): void {
    this._state = state;
    this._listeners.forEach((l) => l(state));
  }
}
