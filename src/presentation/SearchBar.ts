/**
 * HU02-04 — Componente SearchBar
 * RF-004: campo de texto con label accesible
 * RF-006: acepta cualquier carácter (no filtra en input)
 * RF-008: campo vacío → mensaje de validación, no llama onSearch
 * RF-009: solo símbolos → mensaje de validación, no llama onSearch
 * RF-011: debounce de 300 ms para evitar doble confirmación rápida
 *
 * Implementa IComponent (elemento DOM + update + destroy).
 */
import { validateSearchTerm } from '../application/searchValidation';
import { i18n } from '../i18n/es';

export interface SearchBarProps {
  onSearch: (term: string) => void;
  onClear: () => void;
}

export class SearchBar {
  readonly element: HTMLElement;

  private _input!: HTMLInputElement;
  private _searchBtn!: HTMLButtonElement;
  private _clearBtn!: HTMLButtonElement;
  private _validationEl!: HTMLElement;
  private _onSearch: (term: string) => void;
  private _onClear: () => void;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _pendingSearch = false;

  constructor(props: SearchBarProps) {
    this._onSearch = props.onSearch;
    this._onClear = props.onClear;
    this.element = this._build();
  }

  // ------------------------------------------------------------------ //
  // API pública                                                          //
  // ------------------------------------------------------------------ //

  update(props: Partial<SearchBarProps>): void {
    if (props.onSearch !== undefined) this._onSearch = props.onSearch;
    if (props.onClear !== undefined)  this._onClear  = props.onClear;
  }

  /** Limpia el campo y oculta la validación */
  reset(): void {
    this._input.value = '';
    this._hideValidation();
  }

  destroy(): void {
    if (this._debounceTimer !== null) clearTimeout(this._debounceTimer);
    this.element.remove();
  }

  // ------------------------------------------------------------------ //
  // Construcción del DOM                                                 //
  // ------------------------------------------------------------------ //

  private _build(): HTMLElement {
    const form = document.createElement('form');
    form.className = 'search-bar';
    form.setAttribute('role', 'search');

    // Label accesible
    const labelId = 'search-label';
    const label = document.createElement('label');
    label.htmlFor = 'search-input';
    label.id = labelId;
    label.textContent = i18n.buscar;
    label.className = 'search-bar__label';

    // Input
    this._input = document.createElement('input');
    this._input.type = 'text';
    this._input.id = 'search-input';
    this._input.name = 'q';
    this._input.className = 'search-bar__input';
    this._input.setAttribute('aria-labelledby', labelId);
    this._input.setAttribute('autocomplete', 'off');
    this._input.setAttribute('placeholder', 'Nombre o número…');

    // Mensaje de validación (oculto por defecto)
    this._validationEl = document.createElement('span');
    this._validationEl.className = 'search-bar__validation';
    this._validationEl.setAttribute('data-validation', '');
    this._validationEl.setAttribute('role', 'alert');
    this._validationEl.setAttribute('aria-live', 'assertive');
    this._validationEl.style.display = 'none';

    // Botón Buscar
    this._searchBtn = document.createElement('button');
    this._searchBtn.type = 'button';
    this._searchBtn.className = 'search-bar__btn search-bar__btn--search';
    this._searchBtn.setAttribute('data-action', 'search');
    this._searchBtn.textContent = i18n.buscar;

    // Botón Limpiar
    this._clearBtn = document.createElement('button');
    this._clearBtn.type = 'button';
    this._clearBtn.className = 'search-bar__btn search-bar__btn--clear';
    this._clearBtn.setAttribute('data-action', 'clear');
    this._clearBtn.textContent = i18n.limpiar;

    // Layout
    const inputGroup = document.createElement('div');
    inputGroup.className = 'search-bar__group';
    inputGroup.appendChild(label);
    inputGroup.appendChild(this._input);
    inputGroup.appendChild(this._validationEl);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'search-bar__actions';
    btnGroup.appendChild(this._searchBtn);
    btnGroup.appendChild(this._clearBtn);

    form.appendChild(inputGroup);
    form.appendChild(btnGroup);

    // Eventos
    this._searchBtn.addEventListener('click', () => this._handleSearchClick());
    this._clearBtn.addEventListener('click', () => this._handleClearClick());
    form.addEventListener('submit', (e) => { e.preventDefault(); this._handleSearchClick(); });

    return form;
  }

  // ------------------------------------------------------------------ //
  // Handlers                                                             //
  // ------------------------------------------------------------------ //

  /**
   * Gestiona el clic en "Buscar" con debounce (RF-011).
   * La validación del término se realiza de forma síncrona e inmediata
   * para dar retroalimentación visual instantánea (RF-008, RF-009).
   * Solo las búsquedas válidas pasan por el debounce para evitar
   * múltiples peticiones a la API ante clics rápidos.
   */
  private _handleSearchClick(): void {
    const term = this._input.value;
    const validation = validateSearchTerm(term);

    if (!validation.valid) {
      // Validación síncrona e inmediata — sin debounce
      this._showValidation(
        validation.reason === 'empty'
          ? i18n.campoBusquedaVacio
          : i18n.terminoInvalido
      );
      return;
    }

    this._hideValidation();

    // Si ya hay un timer activo, ignorar: el debounce procesará la búsqueda
    if (this._pendingSearch) return;
    this._pendingSearch = true;

    this._debounceTimer = setTimeout(() => {
      this._pendingSearch = false;
      this._onSearch(this._input.value.trim());
    }, 300);
  }

  private _handleClearClick(): void {
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._pendingSearch = false;
    this.reset();
    this._onClear();
  }

  // ------------------------------------------------------------------ //
  // Validación visual                                                    //
  // ------------------------------------------------------------------ //

  private _showValidation(message: string): void {
    this._validationEl.textContent = message;
    this._validationEl.style.display = '';
  }

  private _hideValidation(): void {
    this._validationEl.style.display = 'none';
    this._validationEl.textContent = '';
  }
}
