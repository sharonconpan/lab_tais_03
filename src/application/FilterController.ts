/**
 * HU04-04 — Controlador FilterController
 * RF-014: filtro por un tipo → solo criaturas de ese tipo (vía getPokemonByType)
 * RF-015: filtro OR por dos tipos → unión, intersectada con el índice de búsqueda
 * RF-016: sin resultados → success con array vacío; expone clearTypes() y clearSearch()
 *         de forma independiente
 * RF-017: al cambiar tipos recalcula inmediatamente (setTypes)
 *
 * Implementa IController<PokemonEntry[]>.
 *
 * Ciclo de estados:
 *   idle   → al inicio o cuando no hay tipos seleccionados
 *   loading → mientras se obtienen las entradas por tipo desde la API
 *   success → resultado (puede ser [])
 *   error   → fallo de red o timeout al solicitar un tipo
 *
 * setTypes(types, searchResults?)
 *   Acepta el índice base opcional (resultado de SearchController).
 *   Si no se proporciona, usa el índice completo (getPokemonIndex).
 */
import type { IController } from '../../contracts/IController';
import type { IPokeApiClient } from '../../contracts/IPokeApiClient';
import type { AsyncState, PaginationParams, PokemonEntry, PokemonType } from '../domain/types';
import { applyTypeFilter, applyTypeFilterAnd } from './typeFilter';
import { TimeoutError, toErrorMessage } from '../services/errors';
import { i18n } from '../i18n/es';

export interface FilterControllerOptions {
  pageSize?: number;
  /** Si es true, con 2+ tipos muestra solo criaturas que tengan AMBOS (AND). Default: false */
  andMode?: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

export class FilterController implements IController<PokemonEntry[]> {
  private _state: AsyncState<PokemonEntry[]> = { status: 'idle' };
  private _listeners: Array<(state: AsyncState<PokemonEntry[]>) => void> = [];

  /** Tipos actualmente seleccionados */
  private _selectedTypes: PokemonType[] = [];
  /** Índice base de búsqueda (puede ser el resultado de SearchController) */
  private _searchBase: PokemonEntry[] | null = null;
  /** Índice completo cacheado */
  private _fullIndex: PokemonEntry[] = [];
  /** Resultados filtrados (para paginación futura) */
  private _filtered: PokemonEntry[] = [];
  private _page = 1;
  private readonly _pageSize: number;
  private readonly _andMode: boolean;
  private readonly _api: IPokeApiClient;

  constructor(api: IPokeApiClient, options?: FilterControllerOptions) {
    this._api = api;
    this._pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
    this._andMode = options?.andMode ?? false;
  }

  // ------------------------------------------------------------------ //
  // IController                                                          //
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
   * Establece los tipos seleccionados y recalcula el filtro.
   *
   * @param types         Tipos a seleccionar. Si está vacío, vuelve a idle.
   * @param searchBase    Subconjunto base (resultado de búsqueda). Si se omite,
   *                      se usa el índice completo.
   */
  async setTypes(types: PokemonType[], searchBase?: PokemonEntry[]): Promise<void> {
    this._selectedTypes = [...types];
    if (searchBase !== undefined) {
      this._searchBase = searchBase;
    }

    if (types.length === 0) {
      this._filtered = [];
      this._page = 1;
      this._setState({ status: 'idle' });
      return;
    }

    this._setState({ status: 'loading' });

    try {
      // Construir el mapa tipo → Set<name> para los tipos seleccionados.
      // Cada tipo se solicita a la API (que usa caché internamente).
      const typeEntries = new Map<PokemonType, Set<string>>();
      for (const type of types) {
        const entries = await this._api.getPokemonByType(type);
        typeEntries.set(type, new Set(entries.map((e) => e.name)));
      }

      // Determinar el índice base
      const base = this._searchBase ?? (await this._getFullIndex());

      // Aplicar filtro OR o AND según el modo configurado
      this._filtered = this._andMode
        ? applyTypeFilterAnd(base, typeEntries)
        : applyTypeFilter(base, typeEntries);
      this._page = 1;
      this._setState({ status: 'success', data: this._currentPage() });
    } catch (err) {
      const isTimeout = err instanceof TimeoutError;
      this._setState({
        status: 'error',
        message: isTimeout ? i18n.tiempoAgotado : toErrorMessage(err),
        retryable:
          isTimeout ||
          (err instanceof Error && (err as { retryable?: boolean }).retryable !== false),
      });
    }
  }

  /** Elimina todos los tipos seleccionados → idle */
  clearTypes(): void {
    this._selectedTypes = [];
    this._filtered = [];
    this._page = 1;
    this._setState({ status: 'idle' });
  }

  /** Limpia el índice base de búsqueda (sin tocar los tipos seleccionados) */
  clearSearch(): void {
    this._searchBase = null;
  }

  /** Avanza de página sobre el conjunto filtrado */
  async nextPage(): Promise<void> {
    const totalPages = Math.ceil(this._filtered.length / this._pageSize);
    if (this._page >= totalPages) return;
    this._page++;
    this._setState({ status: 'loading' });
    this._setState({ status: 'success', data: this._currentPage() });
  }

  /** Retrocede de página */
  async prevPage(): Promise<void> {
    if (this._page <= 1) return;
    this._page--;
    this._setState({ status: 'loading' });
    this._setState({ status: 'success', data: this._currentPage() });
  }

  // ------------------------------------------------------------------ //
  // Privado                                                              //
  // ------------------------------------------------------------------ //

  private async _getFullIndex(): Promise<PokemonEntry[]> {
    if (this._fullIndex.length > 0) return this._fullIndex;
    this._fullIndex = await this._api.getPokemonIndex();
    return this._fullIndex;
  }

  private _currentPage(): PokemonEntry[] {
    const start = (this._page - 1) * this._pageSize;
    return this._filtered.slice(start, start + this._pageSize);
  }

  private _setState(state: AsyncState<PokemonEntry[]>): void {
    this._state = state;
    this._listeners.forEach((l) => l(state));
  }
}
