/**
 * HU01-07 — Controlador CatalogController
 * RF-001, RF-002, RF-023, RF-024, RF-025
 *
 * Implementa IController<PokemonEntry[]>.
 * Gestiona la paginación del índice completo de criaturas.
 *
 * Ciclo de estados:
 *   idle → loading → success (con datos de la página actual)
 *                 → error   (retryable según tipo de error)
 *
 * nextPage() / prevPage(): cargan la página siguiente/anterior.
 * El índice completo se guarda en memoria; las páginas son una vista local.
 */
import type { IController } from '../../contracts/IController';
import type { IPokeApiClient } from '../../contracts/IPokeApiClient';
import type { AsyncState, PaginationParams, PokemonEntry } from '../domain/types';
import { toErrorMessage } from '../services/errors';
import { TimeoutError } from '../services/errors';
import { i18n } from '../i18n/es';

export interface CatalogControllerOptions {
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export class CatalogController implements IController<PokemonEntry[]> {
  private _state: AsyncState<PokemonEntry[]> = { status: 'idle' };
  private _listeners: Array<(state: AsyncState<PokemonEntry[]>) => void> = [];
  private _index: PokemonEntry[] = [];
  private _page = 1;
  private readonly _pageSize: number;
  private readonly _api: IPokeApiClient;

  constructor(api: IPokeApiClient, options?: CatalogControllerOptions) {
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

  /** Parámetros de paginación actuales (útil para Pagination component) */
  get pagination(): PaginationParams {
    return {
      page: this._page,
      pageSize: this._pageSize,
      total: this._index.length,
    };
  }

  // ------------------------------------------------------------------ //
  // Operaciones                                                          //
  // ------------------------------------------------------------------ //

  /**
   * Carga el índice completo y emite la primera página.
   * Si el índice ya estaba cargado, emite directamente la página actual.
   */
  async load(): Promise<void> {
    this._setState({ status: 'loading' });
    try {
      this._index = await this._api.getPokemonIndex();
      this._page = 1;
      this._emitCurrentPage();
    } catch (err) {
      this._handleError(err);
    }
  }

  /** Avanza a la página siguiente si hay más páginas */
  async nextPage(): Promise<void> {
    const totalPages = Math.ceil(this._index.length / this._pageSize);
    if (this._page >= totalPages) return;
    this._page++;
    this._setState({ status: 'loading' });
    // El índice ya está en memoria; no hay petición de red
    this._emitCurrentPage();
  }

  /** Retrocede a la página anterior si no estamos en la primera */
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
    const slice = this._index.slice(start, end);
    this._setState({ status: 'success', data: slice });
  }

  private _handleError(err: unknown): void {
    const isTimeout = err instanceof TimeoutError;
    const message = isTimeout
      ? i18n.tiempoAgotado
      : toErrorMessage(err);
    // TimeoutError y NetworkError son retryable; NotFoundError no
    const retryable = err instanceof Error && (err as { retryable?: boolean }).retryable !== false;
    this._setState({ status: 'error', message, retryable });
  }

  private _setState(state: AsyncState<PokemonEntry[]>): void {
    this._state = state;
    this._listeners.forEach((l) => l(state));
  }
}
