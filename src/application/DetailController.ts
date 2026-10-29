/**
 * HU03-03 — Controlador DetailController
 * RF-012: cargar la ficha completa de una criatura por id o nombre.
 * RF-013: guardar CatalogContext antes de cargar; getCatalogContext() para restaurar.
 * RF-023: estado loading notificado vía suscripción.
 * RF-024: NetworkError → error retryable=true.
 *         NotFoundError → error retryable=false.
 * RF-025: TimeoutError → error retryable=true con mensaje "tiempo agotado".
 *
 * Ciclo de estados:
 *   idle → loading → success (PokemonDetail)
 *                 → error   (message + retryable)
 */
import type { IController } from '../../contracts/IController';
import type { IPokeApiClient } from '../../contracts/IPokeApiClient';
import type {
  AsyncState,
  CatalogContext,
  PokemonDetail,
  PokemonType,
} from '../domain/types';
import { TimeoutError, NotFoundError, toErrorMessage } from '../services/errors';
import { i18n } from '../i18n/es';

/** Contexto vacío de catálogo (valor por defecto antes de navegar) */
const EMPTY_CONTEXT: CatalogContext = {
  searchTerm: '',
  selectedTypes: [] as PokemonType[],
  page: 1,
};

export class DetailController implements IController<PokemonDetail> {
  private _state: AsyncState<PokemonDetail> = { status: 'idle' };
  private _listeners: Array<(state: AsyncState<PokemonDetail>) => void> = [];
  private _catalogContext: CatalogContext = { ...EMPTY_CONTEXT };
  private readonly _api: IPokeApiClient;

  constructor(api: IPokeApiClient) {
    this._api = api;
  }

  // ------------------------------------------------------------------ //
  // IController                                                          //
  // ------------------------------------------------------------------ //

  get state(): AsyncState<PokemonDetail> {
    return this._state;
  }

  subscribe(listener: (state: AsyncState<PokemonDetail>) => void): () => void {
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
  // Operaciones                                                          //
  // ------------------------------------------------------------------ //

  /**
   * Carga la ficha de la criatura identificada por `idOrName`.
   *
   * Si se proporciona `context`, lo guarda para poder restaurarlo al volver
   * (RF-013). Si no se proporciona, mantiene el contexto vacío por defecto.
   */
  async load(idOrName: number | string, context?: CatalogContext): Promise<void> {
    // Guardar contexto de navegación (RF-013)
    this._catalogContext = context
      ? { ...context }
      : { ...EMPTY_CONTEXT };

    this._setState({ status: 'loading' });
    try {
      const detail = await this._api.getPokemonDetail(idOrName);
      this._setState({ status: 'success', data: detail });
    } catch (err) {
      this._handleError(err);
    }
  }

  /**
   * Devuelve el CatalogContext guardado en la última llamada a load().
   * Permite que main.ts restaure el estado del catálogo al pulsar "Volver".
   */
  getCatalogContext(): CatalogContext {
    return { ...this._catalogContext };
  }

  // ------------------------------------------------------------------ //
  // Privado                                                              //
  // ------------------------------------------------------------------ //

  private _handleError(err: unknown): void {
    const isTimeout = err instanceof TimeoutError;
    const isNotFound = err instanceof NotFoundError;

    const message = isTimeout
      ? i18n.tiempoAgotado
      : toErrorMessage(err);

    // TimeoutError y NetworkError → retryable=true
    // NotFoundError               → retryable=false
    const retryable = !isNotFound;

    this._setState({ status: 'error', message, retryable });
  }

  private _setState(state: AsyncState<PokemonDetail>): void {
    this._state = state;
    this._listeners.forEach((l) => l(state));
  }
}
