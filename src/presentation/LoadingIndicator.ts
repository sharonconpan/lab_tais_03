/**
 * HU01-02 — Componente LoadingIndicator
 * RF-023: Toda operación muestra indicador de carga mientras espera.
 *
 * Props: { visible: boolean }
 * - visible=true  → elemento con role="status" y aria-live="polite", texto en español
 * - visible=false → elemento oculto (aria-hidden="true")
 */
import type { IComponent } from '../../contracts/IComponent';
import { i18n } from '../i18n/es';

export interface LoadingIndicatorProps {
  visible: boolean;
}

export class LoadingIndicator implements IComponent<LoadingIndicatorProps> {
  readonly element: HTMLElement;

  constructor(props: LoadingIndicatorProps) {
    this.element = document.createElement('div');
    this.element.setAttribute('role', 'status');
    this.element.setAttribute('aria-live', 'polite');
    this.update(props);
  }

  update(props: LoadingIndicatorProps): void {
    if (props.visible) {
      this.element.removeAttribute('aria-hidden');
      this.element.removeAttribute('hidden');
      this.element.style.display = '';
      this.element.textContent = i18n.cargando;
    } else {
      this.element.setAttribute('aria-hidden', 'true');
      this.element.textContent = '';
    }
  }

  destroy(): void {
    // No hay event listeners que limpiar
  }
}
