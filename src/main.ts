/**
 * HU01-08 / HU02-06 / HU03-04 / HU04-05 / HU05-04 / HU06-05 — Punto de entrada
 * RF-001..RF-003, RF-023..RF-026 (HU-01)
 * RF-004..RF-011, RF-027 (HU-02)
 * RF-012, RF-013 (HU-03)
 * RF-014..RF-017, RF-028 (HU-04)
 * RF-018, RF-019 (HU-05)
 * RF-020, RF-021, RF-022, RF-029 (HU-06)
 *
 * Modos de la interfaz:
 *   'catalog'  — CatalogController + SearchController + TypeFilter visibles
 *   'detail'   — DetailView visible, catálogo oculto (HU-03)
 *   'ability'  — AbilityDetail superpuesto sobre DetailView (HU-05);
 *                DetailView permanece en el DOM con sus datos intactos
 *   'compare'  — ComparePanel visible, catálogo oculto (HU-06)
 */
import './styles/catalog.css';
import './styles/header.css';
import './styles/searchbar.css';
import './styles/detail.css';
import './styles/filter.css';
import './styles/compare.css';

import { i18n } from './i18n/es';
import { PokeApiClient } from './services/PokeApiClient';
import { CatalogController } from './application/CatalogController';
import { SearchController } from './application/SearchController';
import { DetailController } from './application/DetailController';
import { FilterController } from './application/FilterController';
import { AbilityController } from './application/AbilityController';
import { CompareController } from './application/CompareController';
import { LoadingIndicator } from './presentation/LoadingIndicator';
import { ErrorMessage } from './presentation/ErrorMessage';
import { PokemonList } from './presentation/PokemonList';
import { Pagination } from './presentation/Pagination';
import { SearchBar } from './presentation/SearchBar';
import { TypeFilter } from './presentation/TypeFilter';
import { DetailView } from './presentation/DetailView';
import { AbilityDetail } from './presentation/AbilityDetail';
import { ComparePanel } from './presentation/ComparePanel';
import type {
  AsyncState,
  AbilityDetail as AbilityDetailType,
  CatalogContext,
  CompareResult,
  PokemonDetail,
  PokemonEntry,
  PokemonType,
} from './domain/types';

// ------------------------------------------------------------------ //
// Controladores                                                        //
// ------------------------------------------------------------------ //
const api = new PokeApiClient();
const catalogCtrl = new CatalogController(api);
const searchCtrl = new SearchController(api);
const filterCtrl = new FilterController(api, { andMode: true });
const detailCtrl = new DetailController(api);
const abilityCtrl = new AbilityController(api);
const compareCtrl = new CompareController(api);

// ------------------------------------------------------------------ //
// Estado de la UI                                                      //
// ------------------------------------------------------------------ //
let searchActive = false;
let filterActive = false;
let selectedTypes: PokemonType[] = [];

// ------------------------------------------------------------------ //
// DOM — contenedores                                                   //
// ------------------------------------------------------------------ //
const app = document.querySelector<HTMLDivElement>('#app')!;

// ── Vista catálogo / búsqueda / filtro ────────────────────────────
const catalogWrapper = document.createElement('div');
catalogWrapper.className = 'catalog-layout';

const header = document.createElement('header');
header.className = 'catalog-header';
header.innerHTML = '<h1>PokeDex Explorer</h1>';

const searchBarEl = new SearchBar({
  onSearch: (term) => handleSearch(term),
  onClear: () => handleClearSearch(),
});

const typeFilterEl = new TypeFilter({
  types: [],
  selected: [],
  onChange: (types) => handleTypeChange(types),
});

const loadingEl = new LoadingIndicator({ visible: false });
const errorEl = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
const listEl = new PokemonList({ items: [], onSelect: () => {} });
const paginationEl = new Pagination({
  params: { page: 1, pageSize: 20, total: 0 },
  onPrev: () => activeListCtrl().prevPage(),
  onNext: () => activeListCtrl().nextPage(),
});

errorEl.element.style.display = 'none';

catalogWrapper.appendChild(header);
catalogWrapper.appendChild(searchBarEl.element);
catalogWrapper.appendChild(typeFilterEl.element);
catalogWrapper.appendChild(loadingEl.element);
catalogWrapper.appendChild(errorEl.element);
catalogWrapper.appendChild(listEl.element);
catalogWrapper.appendChild(paginationEl.element);

// ── Vista detalle (HU-03) ─────────────────────────────────────────
const detailWrapper = document.createElement('div');
detailWrapper.className = 'detail-wrapper';
detailWrapper.setAttribute('hidden', '');

const detailLoadingEl = new LoadingIndicator({ visible: false });
const detailErrorEl = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
detailErrorEl.element.style.display = 'none';

detailWrapper.appendChild(detailLoadingEl.element);
detailWrapper.appendChild(detailErrorEl.element);

// ── Vista habilidad (HU-05) — superpuesta dentro de detailWrapper ─
const abilityWrapper = document.createElement('div');
abilityWrapper.className = 'ability-wrapper';
abilityWrapper.setAttribute('hidden', '');

const abilityLoadingEl = new LoadingIndicator({ visible: false });
const abilityErrorEl = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
abilityErrorEl.element.style.display = 'none';

abilityWrapper.appendChild(abilityLoadingEl.element);
abilityWrapper.appendChild(abilityErrorEl.element);

detailWrapper.appendChild(abilityWrapper);

// ── Navegación principal ─────────────────────────────────────────
const navBar = document.createElement('nav');
navBar.className = 'main-nav';
navBar.setAttribute('aria-label', 'Navegación principal');

const compareNavBtn = document.createElement('button');
compareNavBtn.type = 'button';
compareNavBtn.className = 'main-nav__compare-btn';
compareNavBtn.textContent = '⚔ Comparar';
compareNavBtn.setAttribute('aria-label', 'Ir a comparación de criaturas');
compareNavBtn.addEventListener('click', () => showCompare());
navBar.appendChild(compareNavBtn);

const catalogNavBtn = document.createElement('button');
catalogNavBtn.type = 'button';
catalogNavBtn.className = 'main-nav__catalog-btn';
catalogNavBtn.textContent = '📋 Catálogo';
catalogNavBtn.setAttribute('aria-label', 'Volver al catálogo');
catalogNavBtn.style.display = 'none';
catalogNavBtn.addEventListener('click', () =>
  showCatalog({ searchTerm: '', selectedTypes: [], page: 1 })
);
navBar.appendChild(catalogNavBtn);

header.appendChild(navBar);

// ── Vista comparación (HU-06) ─────────────────────────────────────
const compareWrapper = document.createElement('div');
compareWrapper.className = 'compare-wrapper';
compareWrapper.setAttribute('hidden', '');

const compareLoadingEl = new LoadingIndicator({ visible: false });
const compareErrorEl = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
compareErrorEl.element.style.display = 'none';

// Selects nativos para cada slot (HU-06 / RF-029)
const compareSelectA = document.createElement('select');
compareSelectA.className = 'compare-select compare-select--a';
compareSelectA.setAttribute('aria-label', 'Selecciona criatura A');

const compareSelectB = document.createElement('select');
compareSelectB.className = 'compare-select compare-select--b';
compareSelectB.setAttribute('aria-label', 'Selecciona criatura B');

let comparePanelEl: ComparePanel | null = null;

compareWrapper.appendChild(compareLoadingEl.element);
compareWrapper.appendChild(compareErrorEl.element);

app.appendChild(catalogWrapper);
app.appendChild(detailWrapper);
app.appendChild(compareWrapper);

// ------------------------------------------------------------------ //
// Suscripción a la comparación (HU-06)                               //
// ------------------------------------------------------------------ //
compareCtrl.subscribe((state: AsyncState<CompareResult>) => {
  switch (state.status) {
    case 'loading':
      compareLoadingEl.update({ visible: true });
      compareErrorEl.element.style.display = 'none';
      break;
    case 'success': {
      compareLoadingEl.update({ visible: false });
      compareErrorEl.element.style.display = 'none';
      const sA = compareCtrl.stateA as { status: 'success'; data: PokemonDetail };
      const sB = compareCtrl.stateB as { status: 'success'; data: PokemonDetail };
      const props = {
        result: state.data,
        slotA: sA.status === 'success' ? sA.data : null,
        slotB: sB.status === 'success' ? sB.data : null,
        onSelectA: () => {},
        onSelectB: () => {},
      };
      if (comparePanelEl) {
        comparePanelEl.update(props);
      } else {
        comparePanelEl = new ComparePanel(props);
        compareWrapper.appendChild(comparePanelEl.element);
      }
      break;
    }
    case 'error':
      compareLoadingEl.update({ visible: false });
      compareErrorEl.update({
        message: state.message,
        retryable: state.retryable,
        onRetry: () => {},
      });
      compareErrorEl.element.style.display = '';
      // Actualizar panel con datos parciales si existen
      _refreshComparePanel();
      break;
    case 'idle':
      compareLoadingEl.update({ visible: false });
      _refreshComparePanel();
      break;
  }
});

function _refreshComparePanel(): void {
  const sA = compareCtrl.stateA;
  const sB = compareCtrl.stateB;
  const slotA = sA.status === 'success' ? sA.data : null;
  const slotB = sB.status === 'success' ? sB.data : null;
  const result =
    compareCtrl.state.status === 'success'
      ? (compareCtrl.state as { status: 'success'; data: CompareResult }).data
      : null;
  const props = {
    result,
    slotA,
    slotB,
    onSelectA: () => {},
    onSelectB: () => {},
  };
  if (comparePanelEl) {
    comparePanelEl.update(props);
  } else {
    comparePanelEl = new ComparePanel(props);
    compareWrapper.appendChild(comparePanelEl.element);
  }
}

// ------------------------------------------------------------------ //
// Helpers de paginación                                               //
// ------------------------------------------------------------------ //
function activeListCtrl(): CatalogController | SearchController | FilterController {
  if (filterActive) return filterCtrl;
  if (searchActive) return searchCtrl;
  return catalogCtrl;
}

// ------------------------------------------------------------------ //
// Renderizado de la lista (catálogo / búsqueda / filtro)             //
// ------------------------------------------------------------------ //
function renderListState(state: AsyncState<PokemonEntry[]>): void {
  const ctrl = activeListCtrl();
  switch (state.status) {
    case 'loading':
      loadingEl.update({ visible: true });
      errorEl.element.style.display = 'none';
      break;
    case 'success':
      loadingEl.update({ visible: false });
      errorEl.element.style.display = 'none';
      listEl.update({ items: state.data, onSelect: onPokemonSelect });
      paginationEl.update({
        params: ctrl.pagination,
        onPrev: () => ctrl.prevPage(),
        onNext: () => ctrl.nextPage(),
      });
      break;
    case 'error':
      loadingEl.update({ visible: false });
      errorEl.update({
        message: state.message,
        retryable: state.retryable,
        onRetry: () => {
          if (filterActive) handleTypeChange(selectedTypes);
          else if (searchActive) handleClearSearch();
          else catalogCtrl.load();
        },
      });
      errorEl.element.style.display = '';
      break;
  }
}

catalogCtrl.subscribe((s) => {
  if (!filterActive && !searchActive) renderListState(s);
});
searchCtrl.subscribe((s) => {
  if (!filterActive && searchActive) renderListState(s);
});
filterCtrl.subscribe((s) => {
  if (filterActive) renderListState(s);
});

// ------------------------------------------------------------------ //
// Suscripción al detalle (HU-03)                                     //
// ------------------------------------------------------------------ //
let detailViewEl: DetailView | null = null;

detailCtrl.subscribe((state: AsyncState<PokemonDetail>) => {
  switch (state.status) {
    case 'loading':
      detailLoadingEl.update({ visible: true });
      detailErrorEl.element.style.display = 'none';
      break;
    case 'success': {
      detailLoadingEl.update({ visible: false });
      detailErrorEl.element.style.display = 'none';
      const handleBack = () => showCatalog(detailCtrl.getCatalogContext());
      const props = {
        detail: state.data,
        onBack: handleBack,
        onAbilityClick: (name: string) => showAbility(name),
      };
      if (detailViewEl) {
        detailViewEl.update(props);
      } else {
        detailViewEl = new DetailView(props);
        // Insert before abilityWrapper so ability overlays on top
        detailWrapper.insertBefore(detailViewEl.element, abilityWrapper);
      }
      // ── Mover abilityWrapper inline: justo después de la sección de habilidades ──
      // Esto garantiza que el panel de habilidad aparezca en contexto, sin scroll.
      _attachAbilityWrapperInline();
      break;
    }
    case 'error':
      detailLoadingEl.update({ visible: false });
      detailErrorEl.update({
        message: state.message,
        retryable: state.retryable,
        onRetry: () => {},
      });
      detailErrorEl.element.style.display = '';
      break;
  }
});

// ------------------------------------------------------------------ //
// Suscripción a la habilidad (HU-05)                                 //
// ------------------------------------------------------------------ //
let abilityViewEl: AbilityDetail | null = null;

abilityCtrl.subscribe((state: AsyncState<AbilityDetailType>) => {
  switch (state.status) {
    case 'loading':
      abilityLoadingEl.update({ visible: true });
      abilityErrorEl.element.style.display = 'none';
      break;
    case 'success': {
      abilityLoadingEl.update({ visible: false });
      abilityErrorEl.element.style.display = 'none';
      const handleClose = () => closeAbility();
      if (abilityViewEl) {
        abilityViewEl.update({ detail: state.data, onClose: handleClose });
      } else {
        abilityViewEl = new AbilityDetail({ detail: state.data, onClose: handleClose });
        abilityWrapper.appendChild(abilityViewEl.element);
      }
      break;
    }
    case 'error':
      abilityLoadingEl.update({ visible: false });
      abilityErrorEl.update({
        message: state.message,
        retryable: state.retryable,
        onRetry: state.retryable
          ? () => {} // usuario debe reintentar manualmente
          : () => {},
      });
      abilityErrorEl.element.style.display = '';
      break;
    case 'idle':
      // Nada que hacer — la visibilidad la maneja closeAbility()
      break;
  }
});

// ------------------------------------------------------------------ //
// Handlers de catálogo / búsqueda / filtro                           //
// ------------------------------------------------------------------ //
async function handleSearch(term: string): Promise<void> {
  searchActive = true;
  await searchCtrl.search(term);
  if (filterActive && searchCtrl.state.status === 'success') {
    await filterCtrl.setTypes(selectedTypes, searchCtrl.state.data);
  }
}

function handleClearSearch(): void {
  searchActive = false;
  searchCtrl.clear();
  filterCtrl.clearSearch();
  if (filterActive) {
    filterCtrl.setTypes(selectedTypes);
  } else {
    renderListState(catalogCtrl.state);
  }
}

async function handleTypeChange(types: PokemonType[]): Promise<void> {
  selectedTypes = types;
  filterActive = types.length > 0;

  typeFilterEl.update({
    types:
      typeFilterEl.element.querySelectorAll('[data-type]').length > 0
        ? Array.from(typeFilterEl.element.querySelectorAll<HTMLElement>('[data-type]')).map(
            (el) => el.getAttribute('data-type') as PokemonType
          )
        : selectedTypes,
    selected: selectedTypes,
    onChange: handleTypeChange,
  });

  if (!filterActive) {
    filterCtrl.clearTypes();
    if (searchActive && searchCtrl.state.status === 'success') {
      renderListState(searchCtrl.state);
    } else {
      renderListState(catalogCtrl.state);
    }
    return;
  }

  const base =
    searchActive && searchCtrl.state.status === 'success' ? searchCtrl.state.data : undefined;
  await filterCtrl.setTypes(types, base);
}

// ------------------------------------------------------------------ //
// Navegación: catálogo ↔ detalle ↔ habilidad                        //
// ------------------------------------------------------------------ //

/**
 * Mueve el abilityWrapper para que quede inline dentro del detailView,
 * justo después de la sección de habilidades.
 * Se llama cada vez que el DetailView se re-renderiza (update), porque
 * update() hace innerHTML='' y el abilityWrapper se desconecta del DOM.
 */
function _attachAbilityWrapperInline(): void {
  if (!detailViewEl) return;
  const abilitiesSection = detailViewEl.element.querySelector<HTMLElement>(
    '[data-section="abilities"]'
  );
  if (abilitiesSection) {
    // Insertar abilityWrapper justo después de la sección de habilidades
    abilitiesSection.after(abilityWrapper);
  } else {
    // Fallback: al final del detailViewEl
    detailViewEl.element.appendChild(abilityWrapper);
  }
}

/** Muestra la ficha de una criatura (HU-03) */
async function showDetail(id: number): Promise<void> {
  const ctx: CatalogContext = {
    searchTerm: searchBarEl.getCurrentTerm(),
    selectedTypes: [...selectedTypes],
    page: activeListCtrl().pagination.page,
  };
  catalogWrapper.setAttribute('hidden', '');
  compareWrapper.setAttribute('hidden', '');
  compareNavBtn.style.display = '';
  catalogNavBtn.style.display = 'none';
  detailWrapper.removeAttribute('hidden');
  await detailCtrl.load(id, ctx);
}

/** Vuelve al catálogo restaurando el contexto (HU-03) */
function showCatalog(_ctx: CatalogContext): void {
  detailWrapper.setAttribute('hidden', '');
  compareWrapper.setAttribute('hidden', '');
  compareNavBtn.style.display = '';
  catalogNavBtn.style.display = 'none';
  catalogWrapper.removeAttribute('hidden');
  if (filterActive) renderListState(filterCtrl.state);
  else if (searchActive) renderListState(searchCtrl.state);
  else renderListState(catalogCtrl.state);
}

/** Muestra la sección de comparación (HU-06, RF-029) */
function showCompare(): void {
  catalogWrapper.setAttribute('hidden', '');
  detailWrapper.setAttribute('hidden', '');
  compareWrapper.removeAttribute('hidden');
  compareNavBtn.style.display = 'none';
  catalogNavBtn.style.display = '';

  // Inicializar la UI de comparación si aún no se ha construido
  if (!compareWrapper.querySelector('.compare-slots')) {
    // ── Botón Volver dentro del panel ─────────────────────────────
    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'compare-back-btn';
    backBtn.textContent = i18n.volverAlCatalogoBtn;
    backBtn.setAttribute('aria-label', 'Volver al catálogo');
    backBtn.addEventListener('click', () =>
      showCatalog({ searchTerm: '', selectedTypes: [], page: 1 })
    );
    compareWrapper.insertBefore(backBtn, compareWrapper.firstChild);

    // ── Área de selects ───────────────────────────────────────────
    const slotsArea = document.createElement('div');
    slotsArea.className = 'compare-slots';

    const areaA = document.createElement('div');
    areaA.className = 'compare-slot-area compare-slot-area--a';
    const labelA = document.createElement('label');
    labelA.htmlFor = 'compare-select-a';
    labelA.className = 'compare-slot-label';
    labelA.textContent = i18n.labelSlotA;
    compareSelectA.id = 'compare-select-a';
    areaA.appendChild(labelA);
    areaA.appendChild(compareSelectA);

    const areaB = document.createElement('div');
    areaB.className = 'compare-slot-area compare-slot-area--b';
    const labelB = document.createElement('label');
    labelB.htmlFor = 'compare-select-b';
    labelB.className = 'compare-slot-label';
    labelB.textContent = i18n.labelSlotB;
    compareSelectB.id = 'compare-select-b';
    areaB.appendChild(labelB);
    areaB.appendChild(compareSelectB);

    slotsArea.appendChild(areaA);
    slotsArea.appendChild(areaB);

    // Insertar después del botón Volver y antes de loading/error
    compareWrapper.insertBefore(slotsArea, compareWrapper.children[1]);

    // ── Poblar selects con el índice ──────────────────────────────
    _populateCompareSelects();

    // ── Escuchar cambios en los selects ───────────────────────────
    compareSelectA.addEventListener('change', () => {
      const val = compareSelectA.value;
      if (val) compareCtrl.selectA(val);
    });
    compareSelectB.addEventListener('change', () => {
      const val = compareSelectB.value;
      if (val) compareCtrl.selectB(val);
    });
  }

  // Inicializar el panel si aún no existe
  if (!comparePanelEl) {
    comparePanelEl = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    compareWrapper.appendChild(comparePanelEl.element);
  }
}

/** Puebla ambos selects con el índice COMPLETO de Pokémon directamente desde la API.
 *  getPokemonIndex usa limit=100000 y caché interna, por lo que la segunda llamada
 *  es instantánea.
 */
function _populateCompareSelects(): void {
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = i18n.seleccionaOpcion;
  placeholder.disabled = true;
  placeholder.selected = true;

  const placeholderB = placeholder.cloneNode(true) as HTMLOptionElement;

  compareSelectA.innerHTML = '';
  compareSelectB.innerHTML = '';
  compareSelectA.appendChild(placeholder);
  compareSelectB.appendChild(placeholderB);

  // Siempre pedimos el índice completo a la API (usa caché interna si ya se cargó)
  api
    .getPokemonIndex()
    .then((entries) => {
      _appendSelectOptions(compareSelectA, entries);
      _appendSelectOptions(compareSelectB, entries);
    })
    .catch(() => {
      /* no crítico: los selects quedarán solo con el placeholder */
    });
}

function _appendSelectOptions(
  select: HTMLSelectElement,
  entries: import('./domain/types').PokemonEntry[]
): void {
  for (const entry of entries) {
    const opt = document.createElement('option');
    opt.value = entry.name;
    opt.textContent = `N.º${entry.id} ${entry.displayName}`;
    select.appendChild(opt);
  }
}

/**
 * Muestra el detalle de una habilidad sobre la ficha (HU-05).
 * DetailView permanece en el DOM — sus datos no se pierden.
 */
async function showAbility(name: string): Promise<void> {
  abilityWrapper.removeAttribute('hidden');
  // Opcional: ocultar la ficha mientras la habilidad está visible
  // (no es requisito; se deja visible debajo para no perder datos)
  await abilityCtrl.load(name);
}

/** Cierra la vista de habilidad y vuelve a la ficha (HU-05) */
function closeAbility(): void {
  abilityCtrl.close();
  abilityWrapper.setAttribute('hidden', '');
}

function onPokemonSelect(id: number): void {
  showDetail(id);
}

// ------------------------------------------------------------------ //
// Arranque                                                            //
// ------------------------------------------------------------------ //
catalogCtrl.load();

api
  .getTypeList()
  .then((types) => {
    typeFilterEl.update({ types, selected: selectedTypes, onChange: handleTypeChange });
  })
  .catch(() => {
    // No crítico: el selector de tipos simplemente estará vacío
  });
