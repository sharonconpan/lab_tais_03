import type { AsyncState } from '../src/domain/types';

/**
 * Contrato base de los controladores de aplicación.
 * Cada controlador gestiona un estado AsyncState y notifica a los
 * componentes de presentación mediante un callback de suscripción.
 */
export interface IController<TData> {
  /** Estado actual del controlador */
  readonly state: AsyncState<TData>;

  /**
   * Suscribe un listener que se invoca cada vez que cambia el estado.
   * @returns función para cancelar la suscripción
   */
  subscribe(listener: (state: AsyncState<TData>) => void): () => void;

  /**
   * Libera recursos: cancela peticiones en curso y elimina suscripciones.
   * Llamar al desmontar la vista asociada.
   */
  destroy(): void;
}
