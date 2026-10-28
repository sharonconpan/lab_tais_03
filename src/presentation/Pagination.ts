/**
 * HU01-06 — Componente Pagination
 * RF-002
 *
 * Props: { params: PaginationParams; onPrev: () => void; onNext: () => void }
 * - Muestra "Página X de Y"
 * - Desactiva "Anterior" en página 1
 * - Desactiva "Siguiente" en última página
 * - Botones con aria-label accesible
 */
import type { IComponent } from '../../contracts/IComponent';
import type { PaginationParams } from '../domain/types';
import { i18n } from '../i18n/es';

export interface PaginationProps {
  params: PaginationParams;
  onPrev: () => void;
  onNext: () => void;
}

export class Pagination implements IComponent<PaginationProps> {
  readonly element: HTMLElement;
  private _prevBtn!: HTMLButtonElement;
  private _nextBtn!: HTMLButtonElement;
  private _onPrev: () => void = () => {};
  private _onNext: () => void = () => {};

  constructor(props: PaginationProps) {
    this.element = document.createElement('nav');
    this.element.setAttribute('aria-label', 'Paginación del catálogo');
    this._build();
    this._update(props);
  }

  update(props: PaginationProps): void {
    this._update(props);
  }

  destroy(): void {
    this._prevBtn.removeEventListener('click', this._handlePrev);
    this._nextBtn.removeEventListener('click', this._handleNext);
  }

  private _handlePrev = (): void => { this._onPrev(); };
  private _handleNext = (): void => { this._onNext(); };

  private _build(): void {
    this._prevBtn = document.createElement('button');
    this._prevBtn.type = 'button';
    this._prevBtn.textContent = i18n.anterior;
    this._prevBtn.setAttribute('aria-label', i18n.anterior);
    this._prevBtn.addEventListener('click', this._handlePrev);

    const info = document.createElement('span');
    info.className = 'pagination__info';
    info.setAttribute('data-pagination-info', 'true');

    this._nextBtn = document.createElement('button');
    this._nextBtn.type = 'button';
    this._nextBtn.textContent = i18n.siguiente;
    this._nextBtn.setAttribute('aria-label', i18n.siguiente);
    this._nextBtn.addEventListener('click', this._handleNext);

    this.element.appendChild(this._prevBtn);
    this.element.appendChild(info);
    this.element.appendChild(this._nextBtn);
  }

  private _update(props: PaginationProps): void {
    this._onPrev = props.onPrev;
    this._onNext = props.onNext;

    const { page, pageSize, total } = props.params;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Texto de paginación
    const info = this.element.querySelector('[data-pagination-info]')!;
    info.textContent = i18n.paginaDeTotal
      .replace('{page}', String(page))
      .replace('{total}', String(totalPages));

    // Estado de botones
    this._prevBtn.disabled = page <= 1;
    this._nextBtn.disabled = page >= totalPages;
  }
}
