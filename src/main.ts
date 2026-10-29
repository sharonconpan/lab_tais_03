/**
 * HU01-08 / HU02-06 / HU03-04 / HU04-05 / HU05-04 — Punto de entrada
 * RF-001..RF-003, RF-023..RF-026 (HU-01)
 * RF-004..RF-011, RF-027 (HU-02)
 * RF-012, RF-013 (HU-03)
 * RF-014..RF-017, RF-028 (HU-04)
 * RF-018, RF-019 (HU-05)
 *
 * Modos de la interfaz:
 *   'catalog' — CatalogController + SearchController + TypeFilter visibles
 *   'detail'  — DetailView visible, catálogo oculto (HU-03)
 *   'ability' — AbilityDetail superpuesto sobre DetailView (HU-05);
 *               DetailView permanece en el DOM con sus datos intactos
 */
import './styles/catalog.css';
import './styles/detail.css';
import './styles/filter.css';

import { PokeApiClient }        from './services/PokeApiClient';
import { CatalogController }    from './application/CatalogController';
import { SearchController }     from './application/SearchController';
import { DetailController }     from './application/DetailController';
import { FilterController }     from './application/FilterController';
import { AbilityController }    from './application/AbilityController';
import { LoadingIndicator }     from './presentation/LoadingIndicator';
import { ErrorMessage }         from './presentation/ErrorMessage';
import { PokemonList }          from './presentation/PokemonList';
import { Pagination }           from './presentation/Pagination';
import { SearchBar }            from './presentation/SearchBar';
import { TypeFilter }           from './presentation/TypeFilter';
import { DetailView }           from './presentation/DetailView';
import { AbilityDetail }        from './presentation/AbilityDetail';
import type {
  AsyncState,
  AbilityDetail as AbilityDetailType,
  CatalogContext,
  PokemonDetail,
  PokemonEntry,
  PokemonType,
} from './domain/types';

// ------------------------------------------------------------------ //
// Controladores                                                        //
// ------------------------------------------------------------------ //
const api           = new PokeApiClient();
const catalogCtrl   = new CatalogController(api);
const searchCtrl    = new SearchController(api);
const filterCtrl    = new FilterController(api);
const detailCtrl    = new DetailController(api);
const abilityCtrl   = new AbilityController(api);

// ------------------------------------------------------------------ //
// Estado de la UI                                                      //
// ------------------------------------------------------------------ //
let searchActive   = false;
let filterActive   = false;
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
  onClear:  ()     => handleClearSearch(),
});

const typeFilterEl = new TypeFilter({
  types: [],
  selected: [],
  onChange: (types) => handleTypeChange(types),
});

const loadingEl    = new LoadingIndicator({ visible: false });
const errorEl      = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
const listEl       = new PokemonList({ items: [], onSelect: () => {} });
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
const detailErrorEl   = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
detailErrorEl.element.style.display = 'none';

detailWrapper.appendChild(detailLoadingEl.element);
detailWrapper.appendChild(detailErrorEl.element);

// ── Vista habilidad (HU-05) — superpuesta dentro de detailWrapper ─
const abilityWrapper = document.createElement('div');
abilityWrapper.className = 'ability-wrapper';
abilityWrapper.setAttribute('hidden', '');

const abilityLoadingEl = new LoadingIndicator({ visible: false });
const abilityErrorEl   = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
abilityErrorEl.element.style.display = 'none';

abilityWrapper.appendChild(abilityLoadingEl.element);
abilityWrapper.appendChild(abilityErrorEl.element);

detailWrapper.appendChild(abilityWrapper);

app.appendChild(catalogWrapper);
app.appendChild(detailWrapper);

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
        message:   state.message,
        retryable: state.retryable,
        onRetry:   () => {
          if (filterActive)       handleTypeChange(selectedTypes);
          else if (searchActive)  handleClearSearch();
          else                    catalogCtrl.load();
        },
      });
      errorEl.element.style.display = '';
      break;
  }
}

catalogCtrl.subscribe((s) => { if (!filterActive && !searchActive) renderListState(s); });
searchCtrl.subscribe((s)  => { if (!filterActive &&  searchActive) renderListState(s); });
filterCtrl.subscribe((s)  => { if (filterActive)                   renderListState(s); });

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
      break;
    }
    case 'error':
      detailLoadingEl.update({ visible: false });
      detailErrorEl.update({
        message:   state.message,
        retryable: state.retryable,
        onRetry:   () => {},
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
        message:   state.message,
        retryable: state.retryable,
        onRetry:   state.retryable
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
  filterActive  = types.length > 0;

  typeFilterEl.update({
    types: typeFilterEl.element.querySelectorAll('[data-type]').length > 0
      ? Array.from(typeFilterEl.element.querySelectorAll<HTMLElement>('[data-type]'))
          .map((el) => el.getAttribute('data-type') as PokemonType)
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

  const base = searchActive && searchCtrl.state.status === 'success'
    ? searchCtrl.state.data
    : undefined;
  await filterCtrl.setTypes(types, base);
}

// ------------------------------------------------------------------ //
// Navegación: catálogo ↔ detalle ↔ habilidad                        //
// ------------------------------------------------------------------ //

/** Muestra la ficha de una criatura (HU-03) */
async function showDetail(id: number): Promise<void> {
  const ctx: CatalogContext = {
    searchTerm:    searchBarEl.getCurrentTerm(),
    selectedTypes: [...selectedTypes],
    page:          activeListCtrl().pagination.page,
  };
  catalogWrapper.setAttribute('hidden', '');
  detailWrapper.removeAttribute('hidden');
  await detailCtrl.load(id, ctx);
}

/** Vuelve al catálogo restaurando el contexto (HU-03) */
function showCatalog(_ctx: CatalogContext): void {
  detailWrapper.setAttribute('hidden', '');
  catalogWrapper.removeAttribute('hidden');
  if (filterActive)      renderListState(filterCtrl.state);
  else if (searchActive) renderListState(searchCtrl.state);
  else                   renderListState(catalogCtrl.state);
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

api.getTypeList().then((types) => {
  typeFilterEl.update({ types, selected: selectedTypes, onChange: handleTypeChange });
}).catch(() => {
  // No crítico: el selector de tipos simplemente estará vacío
});
