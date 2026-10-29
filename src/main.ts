/**
 * HU01-08 / HU02-06 — Punto de entrada
 * RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026 (HU-01)
 * RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027 (HU-02)
 *
 * Lógica de modo activo:
 * - Cuando no hay búsqueda activa, se muestran los resultados del CatalogController.
 * - Cuando hay una búsqueda activa, se muestran los resultados del SearchController.
 * - Limpiar búsqueda vuelve al catálogo en el estado previo.
 */
import './styles/catalog.css';

import { PokeApiClient }       from './services/PokeApiClient';
import { CatalogController }   from './application/CatalogController';
import { SearchController }    from './application/SearchController';
import { LoadingIndicator }    from './presentation/LoadingIndicator';
import { ErrorMessage }        from './presentation/ErrorMessage';
import { PokemonList }         from './presentation/PokemonList';
import { Pagination }          from './presentation/Pagination';
import { SearchBar }           from './presentation/SearchBar';
import type { AsyncState, PokemonEntry } from './domain/types';

// ------------------------------------------------------------------ //
// DOM setup                                                            //
// ------------------------------------------------------------------ //
const app = document.querySelector<HTMLDivElement>('#app')!;

const layout = document.createElement('div');
layout.className = 'catalog-layout';

const header = document.createElement('header');
header.className = 'catalog-header';
header.innerHTML = '<h1>PokeDex Explorer</h1>';

// Barra de búsqueda (HU-02)
const searchBarEl = new SearchBar({
  onSearch: (term) => handleSearch(term),
  onClear:  ()     => handleClear(),
});

// Componentes compartidos
const loadingEl    = new LoadingIndicator({ visible: false });
const errorEl      = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
const listEl       = new PokemonList({ items: [], onSelect: () => {} });
const paginationEl = new Pagination({
  params: { page: 1, pageSize: 20, total: 0 },
  onPrev: () => activeController().prevPage(),
  onNext: () => activeController().nextPage(),
});

errorEl.element.style.display = 'none';

layout.appendChild(header);
layout.appendChild(searchBarEl.element);
layout.appendChild(loadingEl.element);
layout.appendChild(errorEl.element);
layout.appendChild(listEl.element);
layout.appendChild(paginationEl.element);
app.appendChild(layout);

// ------------------------------------------------------------------ //
// Controladores                                                        //
// ------------------------------------------------------------------ //
const api               = new PokeApiClient();
const catalogCtrl       = new CatalogController(api);
const searchCtrl        = new SearchController(api);

/** true cuando hay una búsqueda activa en curso */
let searchActive = false;

/** Devuelve el controlador activo según el modo actual */
function activeController(): CatalogController | SearchController {
  return searchActive ? searchCtrl : catalogCtrl;
}

// ------------------------------------------------------------------ //
// Suscripciones                                                        //
// ------------------------------------------------------------------ //

function renderState(state: AsyncState<PokemonEntry[]>): void {
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
            // No hay término almacenado aquí; el usuario deberá re-enviar.
            // Limpiamos para volver al catálogo como fallback.
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

catalogCtrl.subscribe(renderState);
searchCtrl.subscribe(renderState);

// ------------------------------------------------------------------ //
// Handlers                                                             //
// ------------------------------------------------------------------ //

async function handleSearch(term: string): Promise<void> {
  searchActive = true;
  await searchCtrl.search(term);
}

function handleClear(): void {
  searchActive = false;
  searchCtrl.clear();
  // Renderizar el estado actual del catálogo (que sigue en success)
  renderState(catalogCtrl.state);
}

function onPokemonSelect(id: number): void {
  // HU-03: DetailController se conectará aquí
  console.log('[HU-03 pendiente] Seleccionada criatura id:', id);
}

// ------------------------------------------------------------------ //
// Arranque                                                             //
// ------------------------------------------------------------------ //
catalogCtrl.load();
