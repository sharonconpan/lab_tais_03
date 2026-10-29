/**
 * HU05-03 — Controlador AbilityController
 * RF-018: load(name) obtiene el detalle de una habilidad → idle→loading→success
 * RF-019: el dato descriptionLanguage proviene directamente de la API
 * RF-023: estado loading notificado vía suscripción
 * RF-024: NetworkError → retryable=true; NotFoundError → retryable=false
 * RF-025: TimeoutError → retryable=true con mensaje i18n.tiempoAgotado
 *
 * close(): transiciona de success → idle sin descartar los datos del PokemonDetail
 * padre (eso lo gestiona main.ts: AbilityController solo cambia su propio estado).
 */
import type { IController } from '../../contracts/IController';
import type { IPokeApiClient } from '../../contracts/IPokeApiClient';
import type { AsyncState, AbilityDetail } from '../domain/types';
import { TimeoutError, NotFoundError, toErrorMessage } from '../services/errors';
import { i18n } from '../i18n/es';

export class AbilityController implements IController<AbilityDetail> {
  private _state: AsyncState<AbilityDetail> = { status: 'idle' };
  private _listeners: Array<(state: AsyncState<AbilityDetail>) => void> = [];
  private readonly _api: IPokeApiClient;

  constructor(api: IPokeApiClient) {
    this._api = api;
  }

  // ------------------------------------------------------------------ //
  // IController                                                          //
  // ------------------------------------------------------------------ //

  get state(): AsyncState<AbilityDetail> {
    return this._state;
  }

  subscribe(listener: (state: AsyncState<AbilityDetail>) => void): () => void {
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

  /** Carga el detalle de la habilidad por nombre */
  async load(name: string): Promise<void> {
    this._setState({ status: 'loading' });
    try {
      const detail = await this._api.getAbility(name);
      this._setState({ status: 'success', data: detail });
    } catch (err) {
      this._handleError(err);
    }
  }

  /**
   * Cierra el detalle de la habilidad y vuelve a idle.
   * No descarta el PokemonDetail del padre — main.ts gestiona esa lógica.
   */
  close(): void {
    this._setState({ status: 'idle' });
  }

  // ------------------------------------------------------------------ //
  // Privado                                                              //
  // ------------------------------------------------------------------ //

  private _handleError(err: unknown): void {
    const isTimeout  = err instanceof TimeoutError;
    const isNotFound = err instanceof NotFoundError;
    this._setState({
      status:   'error',
      message:  isTimeout ? i18n.tiempoAgotado : toErrorMessage(err),
      retryable: !isNotFound,
    });
  }

  private _setState(state: AsyncState<AbilityDetail>): void {
    this._state = state;
    this._listeners.forEach((l) => l(state));
  }
}
