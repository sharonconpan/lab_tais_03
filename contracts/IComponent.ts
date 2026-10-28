/**
 * Contrato base de los componentes de presentación.
 * Un componente solo renderiza datos; no contiene lógica de negocio
 * ni invoca servicios directamente (principio C-01).
 */
export interface IComponent<TProps> {
  /**
   * Nodo raíz del componente en el DOM.
   * Puede insertarse en cualquier contenedor.
   */
  readonly element: HTMLElement;

  /**
   * Actualiza el componente con nuevos datos.
   * La implementación decide si hace un diff o re-renderiza completo.
   */
  update(props: TProps): void;

  /**
   * Libera event listeners y referencias.
   * Llamar antes de eliminar el elemento del DOM.
   */
  destroy(): void;
}
