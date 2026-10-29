/**
 * HU01-08 / HU02-06 / HU03-04 — Punto de entrada
 * RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026 (HU-01)
 * RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027 (HU-02)
 * RF-012, RF-013, RF-023, RF-024, RF-025 (HU-03)
 *
 * Modos de la interfaz:
 *   - 'catalog' : CatalogController + SearchController visibles (HU-01 / HU-02)
 *   - 'detail'  : DetailView visible, catálogo/búsqueda ocultos (HU-03)
 *
 * Navegación HU-03:
 *   1. Clic en una PokemonCard → onPokemonSelect(id) → showDetail(id)
 *   2. Pulsar "Volver" → DetailController.getCatalogContext() → showCatalog(ctx)
 */
import './styles/catalog.css';
import './styles/detail.css';

import { PokeApiClient }       from './services/PokeApiClient';
import { CatalogController }   from './application/CatalogController';
import { SearchController }    from './application/SearchController';
import { DetailController }    from './application/DetailController';
import { LoadingIndicator }    from './presentation/LoadingIndicator';
import { ErrorMessage }        from './presentation/ErrorMessage';
import { PokemonList }         from './presentation/PokemonList';
import { Pagination }          from './presentation/Pagination';
import { SearchBar }           from './presentation/SearchBar';
import { DetailView }          from './presentation/DetailView';
import type {
  AsyncState,
  CatalogContext,
  PokemonDetail,
  PokemonEntry,
} from './domain/types';

// ------------------------------------------------------------------ //
// DOM — contenedores de cada vista                                    //
// ------------------------------------------------------------------ //
const app = document.querySelector<HTMLDivElement>('#app')!;

// ── Vista catálogo/búsqueda ────────────────────────────────────────
const catalogWrapper = document.createElement('div');
catalogWrapper.className = 'catalog-layout';

const header = document.createElement('header');
header.className = 'catalog-header';
header.innerHTML = '<h1>PokeDex Explorer</h1>';

const searchBarEl = new SearchBar({
  onSearch: (term) => handleSearch(term),
  onClear:  ()     => handleClear(),
});

const loadingEl    = new LoadingIndicator({ visible: false });
const errorEl      = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
const listEl       = new PokemonList({ items: [], onSelect: () => {} });
const paginationEl = new Pagination({
  params: { page: 1, pageSize: 20, total: 0 },
  onPrev: () => activeController().prevPage(),
  onNext: () => activeController().nextPage(),
});

errorEl.element.style.display = 'none';

catalogWrapper.appendChild(header);
catalogWrapper.appendChild(searchBarEl.element);
catalogWrapper.appendChild(loadingEl.element);
catalogWrapper.appendChild(errorEl.element);
catalogWrapper.appendChild(listEl.element);
catalogWrapper.appendChild(paginationEl.element);

// ── Vista detalle ──────────────────────────────────────────────────
const detailWrapper = document.createElement('div');
detailWrapper.className = 'detail-wrapper';
detailWrapper.setAttribute('hidden', '');     // oculto al iniciar

const detailLoadingEl = new LoadingIndicator({ visible: false });
const detailErrorEl   = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
detailErrorEl.element.style.display = 'none';

detailWrapper.appendChild(detailLoadingEl.element);
detailWrapper.appendChild(detailErrorEl.element);

app.appendChild(catalogWrapper);
app.appendChild(detailWrapper);

// ------------------------------------------------------------------ //
// Controladores                                                        //
// ------------------------------------------------------------------ //
const api          = new PokeApiClient();
const catalogCtrl  = new CatalogController(api);
const searchCtrl   = new SearchController(api);
const detailCtrl   = new DetailController(api);

/** true cuando hay una búsqueda activa en curso */
let searchActive = false;

/** Referencia al DetailView activo (se recrea en cada navegación) */
let detailViewEl: DetailView | null = null;

/** Devuelve el controlador activo del catálogo según modo de búsqueda */
function activeController(): CatalogController | SearchController {
  return searchActive ? searchCtrl : catalogCtrl;
}

// ------------------------------------------------------------------ //
// Suscripción al catálogo / búsqueda                                  //
// ------------------------------------------------------------------ //
function renderCatalogState(state: AsyncState<PokemonEntry[]>): void {
  const ctrl = activeController();

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
          if (searchActive) {
            handleClear();
          } else {
            catalogCtrl.load();
          }
        },
      });
      errorEl.element.style.display = '';
      break;
  }
}

catalogCtrl.subscribe(renderCatalogState);
searchCtrl.subscribe(renderCatalogState);

// ------------------------------------------------------------------ //
// Suscripción al detalle (HU-03)                                      //
// ------------------------------------------------------------------ //
detailCtrl.subscribe((state: AsyncState<PokemonDetail>) => {
  switch (state.status) {
    case 'loading':
      detailLoadingEl.update({ visible: true });
      detailErrorEl.element.style.display = 'none';
      break;

    case 'success': {
      detailLoadingEl.update({ visible: false });
      detailErrorEl.element.style.display = 'none';

      // Reconstruir DetailView (o actualizar si ya existe)
      const handleBack = () => {
        const ctx = detailCtrl.getCatalogContext();
        showCatalog(ctx);
      };

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
        onRetry:   state.retryable
          ? () => { /* El usuario debe volver y reintentar */ }
          : () => {},
      });
      detailErrorEl.element.style.display = '';
      break;
  }
});

// ------------------------------------------------------------------ //
// Navegación entre vistas                                             //
// ------------------------------------------------------------------ //

/**
 * Muestra la ficha de la criatura con el id dado.
 * Guarda el CatalogContext actual para restaurarlo al volver (RF-013).
 */
async function showDetail(id: number): Promise<void> {
  // Capturar contexto actual antes de navegar
  const ctrl = activeController();
  const context: CatalogContext = {
    searchTerm:    searchBarEl.getCurrentTerm?.() ?? '',
    selectedTypes: [],
    page:          ctrl.pagination.page,
  };

  // Ocultar catálogo, mostrar detalle
  catalogWrapper.setAttribute('hidden', '');
  detailWrapper.removeAttribute('hidden');

  await detailCtrl.load(id, context);
}

/**
 * Vuelve al catálogo restaurando el CatalogContext guardado (RF-013).
 */
function showCatalog(ctx: CatalogContext): void {
  // Ocultar detalle, mostrar catálogo
  detailWrapper.setAttribute('hidden', '');
  catalogWrapper.removeAttribute('hidden');

  // Renderizar el estado actual del catálogo tal como estaba
  renderCatalogState(catalogCtrl.state);
}

// ------------------------------------------------------------------ //
// Handlers del catálogo / búsqueda                                    //
// ------------------------------------------------------------------ //

async function handleSearch(term: string): Promise<void> {
  searchActive = true;
  await searchCtrl.search(term);
}

function handleClear(): void {
  searchActive = false;
  searchCtrl.clear();
  renderCatalogState(catalogCtrl.state);
}

function onPokemonSelect(id: number): void {
  showDetail(id);
}

// ------------------------------------------------------------------ //
// Arranque                                                             //
// ------------------------------------------------------------------ //
catalogCtrl.load();
