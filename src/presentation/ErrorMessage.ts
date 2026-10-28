/**
 * HU01-03 — Componente ErrorMessage
 * RF-024, RF-025: Error de API o timeout → mensaje + opción reintentar.
 *
 * Props: { message: string; retryable: boolean; onRetry: () => void }
 * - retryable=true  → role="alert" + botón "Reintentar"
 * - retryable=false → role="alert" sin botón
 */
import type { IComponent } from '../../contracts/IComponent';
import { i18n } from '../i18n/es';

export interface ErrorMessageProps {
  message: string;
  retryable: boolean;
  onRetry: () => void;
}

export class ErrorMessage implements IComponent<ErrorMessageProps> {
  readonly element: HTMLElement;
  private _onRetry: () => void = () => {};
  private _btn: HTMLButtonElement | null = null;

  constructor(props: ErrorMessageProps) {
    this.element = document.createElement('div');
    this.element.setAttribute('role', 'alert');
    this._render(props);
  }

  update(props: ErrorMessageProps): void {
    // Limpiar listeners anteriores
    this._btn?.removeEventListener('click', this._handleClick);
    this._render(props);
  }

  destroy(): void {
    this._btn?.removeEventListener('click', this._handleClick);
  }

  private _handleClick = (): void => {
    this._onRetry();
  };

  private _render(props: ErrorMessageProps): void {
    this._onRetry = props.onRetry;
    this.element.innerHTML = '';

    const msg = document.createElement('p');
    msg.textContent = props.message;
    this.element.appendChild(msg);

    if (props.retryable) {
      this._btn = document.createElement('button');
      this._btn.type = 'button';
      this._btn.textContent = i18n.reintentar;
      this._btn.addEventListener('click', this._handleClick);
      this.element.appendChild(this._btn);
    } else {
      this._btn = null;
    }
  }
}
