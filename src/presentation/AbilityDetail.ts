/**
 * HU05-02 — Componente AbilityDetail
 * RF-018: muestra nombre y descripción de la habilidad
 * RF-019: si descriptionLanguage === 'en', muestra nota i18n.descripcionNoDisponibleEs
 *         si descriptionLanguage === 'es', la nota NO aparece
 *
 * Props: { detail: AbilityDetail; onClose: () => void }
 */
import type { IComponent } from '../../contracts/IComponent';
import type { AbilityDetail as AbilityDetailType } from '../domain/types';
import { i18n } from '../i18n/es';

export interface AbilityDetailProps {
  detail: AbilityDetailType;
  onClose: () => void;
}

export class AbilityDetail implements IComponent<AbilityDetailProps> {
  readonly element: HTMLElement;
  private _onClose: () => void = () => {};

  constructor(props: AbilityDetailProps) {
    this.element = document.createElement('article');
    this.element.className = 'ability-detail';
    this._render(props);
  }

  update(props: AbilityDetailProps): void {
    this._render(props);
  }

  destroy(): void {
    this.element.innerHTML = '';
  }

  // ------------------------------------------------------------------ //
  // Renderizado                                                          //
  // ------------------------------------------------------------------ //

  private _render(props: AbilityDetailProps): void {
    this._onClose = props.onClose;
    this.element.innerHTML = '';

    const { detail } = props;

    // ── Botón Cerrar ──────────────────────────────────────────────────
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ability-detail__close';
    closeBtn.textContent = i18n.cerrar;
    closeBtn.addEventListener('click', () => this._onClose());
    this.element.appendChild(closeBtn);

    // ── Nombre de la habilidad (RF-018) ───────────────────────────────
    const nameEl = document.createElement('h2');
    nameEl.className = 'ability-detail__name';
    nameEl.textContent = detail.displayName;
    this.element.appendChild(nameEl);

    // ── Descripción (RF-018, RF-019) ──────────────────────────────────
    const descEl = document.createElement('p');
    descEl.className = 'ability-detail__description';
    descEl.textContent = detail.description;
    this.element.appendChild(descEl);

    // ── Nota de idioma (RF-019): solo cuando la descripción está en inglés
    if (detail.descriptionLanguage === 'en') {
      const noteEl = document.createElement('p');
      noteEl.className = 'ability-detail__note';
      noteEl.setAttribute('data-lang-note', '');
      noteEl.textContent = i18n.descripcionNoDisponibleEs;
      this.element.appendChild(noteEl);
    }
  }
}
