/**
 * HU06-04 — Controlador CompareController
 * RF-020: cuando ambos slots están cargados, calcula compareStats y emite success
 * RF-021: empate viene de compareStats (pura)
 * RF-022: valida que slotA.id !== slotB.id antes de comparar
 * RF-023: estado loading mientras cualquier slot está cargando
 * RF-024: NetworkError → retryable=true; NotFoundError → retryable=false
 * RF-025: TimeoutError → retryable=true, mensaje i18n.tiempoAgotado
 *
 * Expone:
 *   stateA / stateB  — estado independiente de cada slot
 *   state            — estado global:
 *                       'idle'    mientras no se ha cargado ningún slot
 *                       'loading' mientras cualquier slot está cargando
 *                       'success' cuando ambos slots tienen success y son distintos
 *                       'error'   cuando cualquier slot tiene error, o misma criatura
 *   selectA(idOrName) / selectB(idOrName) — cargar una criatura en el slot indicado
 *   subscribe() — notifica en cada cambio de estado global
 *   destroy()   — cancela peticiones y limpia listeners
 */
import type { IController } from '../../contracts/IController';
import type { IPokeApiClient } from '../../contracts/IPokeApiClient';
import type { AsyncState, CompareResult, PokemonDetail } from '../domain/types';
import { TimeoutError, NotFoundError, toErrorMessage } from '../services/errors';
import { compareStats } from './compareStats';
import { i18n } from '../i18n/es';

export class CompareController implements IController<CompareResult> {
  // ── Estado global (lo que consume ComparePanel) ───────────────────
  private _state: AsyncState<CompareResult> = { status: 'idle' };
  // ── Estados independientes de cada slot ──────────────────────────
  private _stateA: AsyncState<PokemonDetail> = { status: 'idle' };
  private _stateB: AsyncState<PokemonDetail> = { status: 'idle' };

  private _listeners: Array<(state: AsyncState<CompareResult>) => void> = [];
  private readonly _api: IPokeApiClient;

  constructor(api: IPokeApiClient) {
    this._api = api;
  }

  // ------------------------------------------------------------------ //
  // Propiedades públicas                                                 //
  // ------------------------------------------------------------------ //

  get state(): AsyncState<CompareResult> {
    return this._state;
  }

  /** Estado del slot A (RF-029) */
  get stateA(): AsyncState<PokemonDetail> {
    return this._stateA;
  }

  /** Estado del slot B (RF-029) */
  get stateB(): AsyncState<PokemonDetail> {
    return this._stateB;
  }

  // ------------------------------------------------------------------ //
  // IController                                                          //
  // ------------------------------------------------------------------ //

  subscribe(listener: (state: AsyncState<CompareResult>) => void): () => void {
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
   * Carga la criatura indicada en el slot A.
   * Cuando ambos slots estén en success, evalúa si son distintas y calcula la comparación.
   */
  async selectA(idOrName: number | string): Promise<void> {
    this._stateA = { status: 'loading' };
    this._recalculateGlobal();

    try {
      const detail = await this._api.getPokemonDetail(idOrName);
      this._stateA = { status: 'success', data: detail };
    } catch (err) {
      this._stateA = this._buildErrorState(err);
    }

    this._recalculateGlobal();
  }

  /**
   * Carga la criatura indicada en el slot B.
   * Cuando ambos slots estén en success, evalúa si son distintas y calcula la comparación.
   */
  async selectB(idOrName: number | string): Promise<void> {
    this._stateB = { status: 'loading' };
    this._recalculateGlobal();

    try {
      const detail = await this._api.getPokemonDetail(idOrName);
      this._stateB = { status: 'success', data: detail };
    } catch (err) {
      this._stateB = this._buildErrorState(err);
    }

    this._recalculateGlobal();
  }

  // ------------------------------------------------------------------ //
  // Privado                                                              //
  // ------------------------------------------------------------------ //

  /**
   * Recalcula el estado global a partir de stateA y stateB y notifica.
   *
   * Reglas:
   * 1. Si cualquier slot está en 'error' → global = error (propagamos el primero que falle)
   * 2. Si cualquier slot está en 'loading' → global = loading
   * 3. Si ambos están en 'success':
   *    a. Si son la misma criatura → global = error (RF-022)
   *    b. Si son distintas → global = success con CompareResult
   * 4. Otro caso (idle, mezcla idle+success) → global = idle
   */
  private _recalculateGlobal(): void {
    const sA = this._stateA;
    const sB = this._stateB;

    // 1. Error en cualquier slot
    if (sA.status === 'error') {
      this._setState(sA);
      return;
    }
    if (sB.status === 'error') {
      this._setState(sB);
      return;
    }

    // 2. Cargando
    if (sA.status === 'loading' || sB.status === 'loading') {
      this._setState({ status: 'loading' });
      return;
    }

    // 3. Ambos con éxito
    if (sA.status === 'success' && sB.status === 'success') {
      const detailA = sA.data;
      const detailB = sB.data;

      // RF-022: misma criatura
      if (detailA.id === detailB.id) {
        this._setState({
          status: 'error',
          message: i18n.creaturasIguales,
          retryable: false,
        });
        return;
      }

      // Comparación (RF-020)
      const statResults = compareStats(detailA, detailB);
      this._setState({
        status: 'success',
        data: { pokemonA: detailA, pokemonB: detailB, statResults },
      });
      return;
    }

    // 4. Estado inicial o mixto idle/success
    this._setState({ status: 'idle' });
  }

  private _buildErrorState(err: unknown): AsyncState<PokemonDetail> & { status: 'error' } {
    const isTimeout = err instanceof TimeoutError;
    const isNotFound = err instanceof NotFoundError;
    return {
      status: 'error',
      message: isTimeout ? i18n.tiempoAgotado : toErrorMessage(err),
      retryable: !isNotFound,
    };
  }

  private _setState(state: AsyncState<CompareResult>): void {
    this._state = state;
    this._listeners.forEach((l) => l(state));
  }
}
