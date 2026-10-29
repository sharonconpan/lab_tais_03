/**
 * HU01-08 / HU02-06 / HU03-04 / HU04-05 — Punto de entrada
 * RF-001..RF-003, RF-023..RF-026 (HU-01)
 * RF-004..RF-011, RF-027 (HU-02)
 * RF-012, RF-013 (HU-03)
 * RF-014..RF-017, RF-028 (HU-04)
 *
 * Modos de la interfaz:
 *   'catalog' — CatalogController + SearchController + TypeFilter visibles
 *   'detail'  — DetailView visible, catálogo oculto (HU-03)
 *
 * Pipeline de filtrado (HU-04):
 *   1. SearchController produce un subconjunto del índice por nombre.
 *   2. FilterController recibe ese subconjunto como base y aplica el filtro OR.
 *   3. Cuando no hay filtro activo se muestra el resultado de Search/Catalog.
 *   4. Cuando hay filtro activo se muestra el resultado de FilterController.
 *
 * clearTypes() y clearSearch() son independientes (RF-016).
 */
import './styles/catalog.css';
import './styles/detail.css';
import './styles/filter.css';

import { PokeApiClient }       from './services/PokeApiClient';
import { CatalogController }   from './application/CatalogController';
import { SearchController }    from './application/SearchController';
import { DetailController }    from './application/DetailController';
import { FilterController }    from './application/FilterController';
import { LoadingIndicator }    from './presentation/LoadingIndicator';
import { ErrorMessage }        from './presentation/ErrorMessage';
import { PokemonList }         from './presentation/PokemonList';
import { Pagination }          from './presentation/Pagination';
import { SearchBar }           from './presentation/SearchBar';
import { TypeFilter }          from './presentation/TypeFilter';
import { DetailView }          from './presentation/DetailView';
import type {
  AsyncState,
  CatalogContext,
  PokemonDetail,
  PokemonEntry,
  PokemonType,
} from './domain/types';

// ------------------------------------------------------------------ //
// Controladores                                                        //
// ------------------------------------------------------------------ //
const api          = new PokeApiClient();
const catalogCtrl  = new CatalogController(api);
const searchCtrl   = new SearchController(api);
const filterCtrl   = new FilterController(api);
const detailCtrl   = new DetailController(api);

// ------------------------------------------------------------------ //
// Estado de la UI                                                      //
// ------------------------------------------------------------------ //
let searchActive  = false;       // hay término de búsqueda activo
let filterActive  = false;       // hay tipos seleccionados
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

// TypeFilter — cargado con tipos al arranque
const typeFilterEl = new TypeFilter({
  types: [],       // se rellena al obtener la lista de tipos
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

// ── Vista detalle ─────────────────────────────────────────────────
const detailWrapper = document.createElement('div');
detailWrapper.className = 'detail-wrapper';
detailWrapper.setAttribute('hidden', '');

const detailLoadingEl = new LoadingIndicator({ visible: false });
const detailErrorEl   = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
detailErrorEl.element.style.display = 'none';

detailWrapper.appendChild(detailLoadingEl.element);
detailWrapper.appendChild(detailErrorEl.element);

app.appendChild(catalogWrapper);
app.appendChild(detailWrapper);

// ------------------------------------------------------------------ //
// Controlador "activo" para paginación                                //
// ------------------------------------------------------------------ //

/**
 * Devuelve el controlador cuya paginación debe usar la barra de paginación.
 * Prioridad: filtro > búsqueda > catálogo.
 */
function activeListCtrl(): CatalogController | SearchController | FilterController {
  if (filterActive)  return filterCtrl;
  if (searchActive)  return searchCtrl;
  return catalogCtrl;
}

// ------------------------------------------------------------------ //
// Renderizado de la lista                                             //
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
          if (filterActive)  handleTypeChange(selectedTypes);
          else if (searchActive) handleClearSearch();
          else catalogCtrl.load();
        },
      });
      errorEl.element.style.display = '';
      break;
  }
}

// Cada controlador notifica al mismo renderizador.
// Solo el controlador "activo" actualizará la vista efectivamente.
catalogCtrl.subscribe((s) => { if (!filterActive && !searchActive) renderListState(s); });
searchCtrl.subscribe((s)  => { if (!filterActive && searchActive)  renderListState(s); });
filterCtrl.subscribe((s)  => { if (filterActive)                   renderListState(s); });

// ------------------------------------------------------------------ //
// Suscripción al detalle (HU-03)                                      //
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
      if (detailViewEl) {
        detailViewEl.update({ detail: state.data, onBack: handleBack });
      } else {
        detailViewEl = new DetailView({ detail: state.data, onBack: handleBack });
        detailWrapper.appendChild(detailViewEl.element);
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
// Handlers                                                            //
// ------------------------------------------------------------------ //

async function handleSearch(term: string): Promise<void> {
  searchActive = true;
  await searchCtrl.search(term);
  // Si hay filtro activo, recalcular con la nueva base de búsqueda
  if (filterActive && searchCtrl.state.status === 'success') {
    await filterCtrl.setTypes(selectedTypes, searchCtrl.state.data);
  }
}

function handleClearSearch(): void {
  searchActive = false;
  searchCtrl.clear();
  filterCtrl.clearSearch();
  if (filterActive) {
    // Recalcular filtro sin restricción de búsqueda
    filterCtrl.setTypes(selectedTypes);
  } else {
    renderListState(catalogCtrl.state);
  }
}

async function handleTypeChange(types: PokemonType[]): Promise<void> {
  selectedTypes = types;
  filterActive  = types.length > 0;

  // Actualizar el componente visual con la selección actual
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
    // Mostrar resultado de búsqueda o catálogo
    if (searchActive && searchCtrl.state.status === 'success') {
      renderListState(searchCtrl.state);
    } else {
      renderListState(catalogCtrl.state);
    }
    return;
  }

  // Base: resultado de búsqueda activa o undefined (usa índice completo)
  const base = searchActive && searchCtrl.state.status === 'success'
    ? searchCtrl.state.data
    : undefined;

  await filterCtrl.setTypes(types, base);
}

// ------------------------------------------------------------------ //
// Navegación detalle (HU-03)                                         //
// ------------------------------------------------------------------ //

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

function showCatalog(_ctx: CatalogContext): void {
  detailWrapper.setAttribute('hidden', '');
  catalogWrapper.removeAttribute('hidden');
  // Restaurar la vista que estaba activa
  if (filterActive)      renderListState(filterCtrl.state);
  else if (searchActive) renderListState(searchCtrl.state);
  else                   renderListState(catalogCtrl.state);
}

function onPokemonSelect(id: number): void {
  showDetail(id);
}

// ------------------------------------------------------------------ //
// Arranque                                                            //
// ------------------------------------------------------------------ //

catalogCtrl.load();

// Cargar tipos disponibles para el TypeFilter
api.getTypeList().then((types) => {
  typeFilterEl.update({ types, selected: selectedTypes, onChange: handleTypeChange });
}).catch(() => {
  // Si falla, el TypeFilter simplemente no muestra botones (no es crítico)
});
