/**
 * HU04-03 — Componente TypeFilter
 * RF-014: renderiza botones/checkboxes por tipo para seleccionar filtros
 * RF-017: al seleccionar/deseleccionar llama onChange con la lista actualizada
 * RF-028: muestra nota informativa sobre el máximo de 2 tipos
 *
 * Props:
 *   types    — lista completa de tipos disponibles
 *   selected — tipos actualmente seleccionados
 *   onChange — callback con la nueva lista de seleccionados al cambiar
 */
import type { IComponent } from '../../contracts/IComponent';
import type { PokemonType } from '../domain/types';
import { i18n } from '../i18n/es';

export interface TypeFilterProps {
  types: PokemonType[];
  selected: PokemonType[];
  onChange: (selected: PokemonType[]) => void;
}

export class TypeFilter implements IComponent<TypeFilterProps> {
  readonly element: HTMLElement;
  private _selected: PokemonType[] = [];
  private _onChange: (selected: PokemonType[]) => void = () => {};

  constructor(props: TypeFilterProps) {
    this.element = document.createElement('div');
    this.element.className = 'type-filter';
    this._render(props);
  }

  update(props: TypeFilterProps): void {
    this._render(props);
  }

  destroy(): void {
    this.element.innerHTML = '';
  }

  // ------------------------------------------------------------------ //
  // Privado                                                              //
  // ------------------------------------------------------------------ //

  private _render(props: TypeFilterProps): void {
    this._selected = [...props.selected];
    this._onChange = props.onChange;
    this.element.innerHTML = '';

    // ── Título del filtro ──────────────────────────────────────────
    const title = document.createElement('h3');
    title.className = 'type-filter__title';
    title.textContent = i18n.filtrarPorTipo;
    this.element.appendChild(title);

    // ── Nota RF-028: máximo de 2 tipos ─────────────────────────────
    const note = document.createElement('p');
    note.className = 'type-filter__note';
    note.setAttribute('data-type-note', '');
    note.textContent = i18n.tipoMaximos;
    this.element.appendChild(note);

    // ── Botones de tipos ───────────────────────────────────────────
    const btnGroup = document.createElement('div');
    btnGroup.className = 'type-filter__buttons';
    btnGroup.setAttribute('role', 'group');
    btnGroup.setAttribute('aria-label', i18n.filtrarPorTipo);

    for (const type of props.types) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'type-filter__btn';
      btn.setAttribute('data-type', type);
      btn.textContent = type;

      const isSelected = this._selected.includes(type);
      btn.setAttribute('aria-pressed', String(isSelected));
      if (isSelected) {
        btn.classList.add('type-filter__btn--selected');
      }

      btn.addEventListener('click', () => this._handleClick(type));
      btnGroup.appendChild(btn);
    }

    this.element.appendChild(btnGroup);
  }

  private _handleClick(type: PokemonType): void {
    const idx = this._selected.indexOf(type);
    if (idx >= 0) {
      // Deseleccionar
      this._selected = this._selected.filter((t) => t !== type);
    } else {
      // Seleccionar (sin límite impuesto aquí — lo limita el controlador)
      this._selected = [...this._selected, type];
    }
    this._updateButtonStates();
    this._onChange([...this._selected]);
  }

  private _updateButtonStates(): void {
    const buttons = this.element.querySelectorAll<HTMLButtonElement>('[data-type]');
    for (const btn of buttons) {
      const type = btn.getAttribute('data-type') as PokemonType;
      const selected = this._selected.includes(type);
      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('type-filter__btn--selected', selected);
    }
  }
}
