/**
 * HU01-08 — Punto de entrada: conecta CatalogController con los componentes de presentación.
 * RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026
 *
 * Las historias HU-02..HU-06 se conectarán aquí progresivamente.
 */
import './styles/catalog.css';

import { PokeApiClient } from './services/PokeApiClient';
import { CatalogController } from './application/CatalogController';
import { LoadingIndicator } from './presentation/LoadingIndicator';
import { ErrorMessage } from './presentation/ErrorMessage';
import { PokemonList } from './presentation/PokemonList';
import { Pagination } from './presentation/Pagination';
import type { AsyncState, PokemonEntry } from './domain/types';

// ------------------------------------------------------------------ //
// DOM setup                                                            //
// ------------------------------------------------------------------ //
const app = document.querySelector<HTMLDivElement>('#app')!;

// Estructura del catálogo
const layout = document.createElement('div');
layout.className = 'catalog-layout';

const header = document.createElement('header');
header.className = 'catalog-header';
header.innerHTML = '<h1>PokeDex Explorer</h1>';

const loadingEl = new LoadingIndicator({ visible: false });
const errorEl   = new ErrorMessage({ message: '', retryable: false, onRetry: () => {} });
const listEl    = new PokemonList({ items: [], onSelect: () => {} });
const paginationEl = new Pagination({
  params: { page: 1, pageSize: 20, total: 0 },
  onPrev: () => controller.prevPage(),
  onNext: () => controller.nextPage(),
});

// Ocultar ErrorMessage inicialmente (no visible hasta que haya error)
errorEl.element.style.display = 'none';

layout.appendChild(header);
layout.appendChild(loadingEl.element);
layout.appendChild(errorEl.element);
layout.appendChild(listEl.element);
layout.appendChild(paginationEl.element);
app.appendChild(layout);

// ------------------------------------------------------------------ //
// Controller                                                           //
// ------------------------------------------------------------------ //
const api = new PokeApiClient();
const controller = new CatalogController(api);

controller.subscribe((state: AsyncState<PokemonEntry[]>) => {
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
        params: controller.pagination,
        onPrev: () => controller.prevPage(),
        onNext: () => controller.nextPage(),
      });
      break;

    case 'error':
      loadingEl.update({ visible: false });
      errorEl.update({
        message: state.message,
        retryable: state.retryable,
        onRetry: () => controller.load(),
      });
      errorEl.element.style.display = '';
      break;
  }
});

// ------------------------------------------------------------------ //
// Handlers                                                             //
// ------------------------------------------------------------------ //
function onPokemonSelect(id: number): void {
  // HU-03: DetailController se conectará aquí
  console.log('[HU-03 pendiente] Seleccionada criatura id:', id);
}

// ------------------------------------------------------------------ //
// Arranque                                                             //
// ------------------------------------------------------------------ //
controller.load();
