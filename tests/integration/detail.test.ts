/**
 * HU03-01 — Prueba de integración: ficha de criatura
 * RF: RF-003, RF-012, RF-013, RF-023, RF-024, RF-025
 *
 * Ciclo TDD: pruebas escritas ANTES que los módulos de HU-03.
 * Estado inicial esperado: ROJO hasta que existan DetailView y DetailController.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockPokeApiClient, FIXTURE_PIKACHU } from '../mocks/MockPokeApiClient';
import { DetailController } from '../../src/application/DetailController';
import { DetailView } from '../../src/presentation/DetailView';
import { LoadingIndicator } from '../../src/presentation/LoadingIndicator';
import { ErrorMessage } from '../../src/presentation/ErrorMessage';
import type { AsyncState, CatalogContext, PokemonDetail } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Helpers                                                              //
// ------------------------------------------------------------------ //
function queryText(container: HTMLElement, text: string): boolean {
  return container.textContent?.includes(text) ?? false;
}
function getByRole(container: HTMLElement, role: string): HTMLElement | null {
  return container.querySelector(`[role="${role}"]`);
}

describe('HU-03 — Ficha de criatura: pruebas de integración', () => {
  let container: HTMLElement;
  let mockApi: MockPokeApiClient;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockApi = new MockPokeApiClient();
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  // ------------------------------------------------------------------ //
  // Escenario 1 — La ficha muestra todos los campos (RF-012)            //
  // ------------------------------------------------------------------ //
  it('Esc-1: DetailController transiciona idle→loading→success al cargar pikachu', async () => {
    const states: string[] = [];
    const ctrl = new DetailController(mockApi);
    const unsub = ctrl.subscribe((s) => states.push(s.status));

    expect(ctrl.state.status).toBe('idle');
    const loadPromise = ctrl.load(25);
    expect(states).toContain('loading');
    await loadPromise;
    expect(ctrl.state.status).toBe('success');
    unsub();
  });

  it('Esc-1: DetailView renderiza imagen con alt accesible', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);

    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('alt')).toBeTruthy();
    expect(img!.getAttribute('src')).toBe(FIXTURE_PIKACHU.imageUrl);
  });

  it('Esc-1: DetailView muestra el número nacional', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, '25')).toBe(true);
  });

  it('Esc-1: DetailView muestra el nombre de la criatura', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, 'Pikachu')).toBe(true);
  });

  it('Esc-1: DetailView muestra el tipo de la criatura', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, 'electric')).toBe(true);
  });

  it('Esc-1: DetailView muestra altura y peso', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    // Altura (4 dm = 0.4 m) y peso (60 hg = 6.0 kg) deben aparecer de alguna forma
    expect(queryText(container, '4') || queryText(container, '0.4')).toBe(true);
    expect(queryText(container, '60') || queryText(container, '6')).toBe(true);
  });

  it('Esc-1: DetailView muestra las habilidades', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, 'static')).toBe(true);
  });

  it('Esc-1: DetailView muestra las 6 estadísticas base con etiquetas en español', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    // Las 6 etiquetas en español definidas en BaseStat.label
    expect(queryText(container, 'PS')).toBe(true);
    expect(queryText(container, 'Ataque')).toBe(true);
    expect(queryText(container, 'Defensa')).toBe(true);
    expect(queryText(container, 'Ataque Esp.')).toBe(true);
    expect(queryText(container, 'Defensa Esp.')).toBe(true);
    expect(queryText(container, 'Velocidad')).toBe(true);
  });

  it('Esc-1: DetailView muestra los valores numéricos de las stats', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    // Pikachu: PS=35, Ataque=55, Defensa=40, Velocidad=90
    expect(queryText(container, '35')).toBe(true);
    expect(queryText(container, '55')).toBe(true);
    expect(queryText(container, '90')).toBe(true);
  });

  it('Esc-1: DetailView tiene botón Volver en español', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    const backBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('volver')
    );
    expect(backBtn).not.toBeUndefined();
  });

  it('Esc-1: onBack se invoca al pulsar Volver', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const onBack = vi.fn();
    const view = new DetailView({ detail: state.data, onBack });
    container.appendChild(view.element);

    const backBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('volver')
    )!;
    backBtn.click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------------ //
  // Escenario 1 — LoadingIndicator mientras carga (RF-023)              //
  // ------------------------------------------------------------------ //
  it('Esc-1: LoadingIndicator es visible durante la carga de la ficha', () => {
    const ctrl = new DetailController(mockApi);
    const loading = new LoadingIndicator({ visible: false });
    container.appendChild(loading.element);

    let wasLoading = false;
    ctrl.subscribe((s) => {
      if (s.status === 'loading') {
        loading.update({ visible: true });
        wasLoading = true;
      }
    });

    ctrl.load(25); // sin await — capturamos el estado intermedio
    expect(wasLoading).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 2 — Criatura sin imagen muestra placeholder (RF-003)      //
  // ------------------------------------------------------------------ //
  it('Esc-2: criatura sin imagen muestra placeholder, número y nombre siguen visibles', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(39); // jigglypuff — imageUrl: null

    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    expect(state.data.imageUrl).toBeNull();

    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    // No debe haber un <img> con src vacío o "null"
    const img = container.querySelector('img');
    if (img) {
      expect(img.getAttribute('src')).not.toBe('');
      expect(img.getAttribute('src')).not.toBe('null');
    } else {
      // Si no hay img, debe existir un placeholder
      const placeholder =
        container.querySelector('[data-placeholder]') ??
        container.querySelector('svg') ??
        container.querySelector('[aria-label]');
      expect(placeholder).not.toBeNull();
    }

    // Número y nombre siguen visibles
    expect(queryText(container, '39')).toBe(true);
    expect(queryText(container, 'Jigglypuff')).toBe(true);
  });

  it('Esc-2: criatura con múltiples tipos muestra todos', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(39); // jigglypuff: ['normal', 'fairy']

    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, 'normal')).toBe(true);
    expect(queryText(container, 'fairy')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 3 — Volver restaura CatalogContext (RF-013)               //
  // ------------------------------------------------------------------ //
  it('Esc-3: DetailController guarda el CatalogContext antes de cargar', async () => {
    const ctrl = new DetailController(mockApi);
    const context: CatalogContext = {
      searchTerm: 'chu',
      selectedTypes: ['electric'],
      page: 2,
    };

    await ctrl.load(25, context);

    const restored = ctrl.getCatalogContext();
    expect(restored.searchTerm).toBe('chu');
    expect(restored.selectedTypes).toEqual(['electric']);
    expect(restored.page).toBe(2);
  });

  it('Esc-3: DetailController.getCatalogContext devuelve contexto vacío si no se pasó', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);

    const ctx = ctrl.getCatalogContext();
    expect(ctx.searchTerm).toBe('');
    expect(ctx.selectedTypes).toEqual([]);
    expect(ctx.page).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // Escenario 4 — Error al cargar la ficha (RF-024)                     //
  // ------------------------------------------------------------------ //
  it('Esc-4: error de red al cargar ficha → estado error con retryable=true', async () => {
    mockApi.setDetailBehavior('network-error');
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);

    const state = ctrl.state;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
    }
  });

  it('Esc-4: error de red renderiza ErrorMessage con botón Reintentar', async () => {
    mockApi.setDetailBehavior('network-error');
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);

    const state = ctrl.state as { status: 'error'; message: string; retryable: boolean };
    const errorMsg = new ErrorMessage({
      message: state.message,
      retryable: state.retryable,
      onRetry: () => {},
    });
    container.appendChild(errorMsg.element);

    expect(getByRole(container, 'alert')).not.toBeNull();
    const btn = container.querySelector('button');
    expect(btn?.textContent?.toLowerCase()).toContain('reintentar');
  });

  it('Esc-4: NotFoundError → estado error con retryable=false', async () => {
    mockApi.setDetailBehavior('not-found');
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);

    const state = ctrl.state;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(false);
    }
  });

  // ------------------------------------------------------------------ //
  // Escenario 5 — Timeout (RF-025)                                      //
  // ------------------------------------------------------------------ //
  it('Esc-5: timeout → estado error retryable=true con mensaje de tiempo agotado', async () => {
    mockApi.setDetailBehavior('timeout');
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);

    const state = ctrl.state as AsyncState<PokemonDetail>;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
      expect(state.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
  });

  // ------------------------------------------------------------------ //
  // destroy                                                              //
  // ------------------------------------------------------------------ //
  it('destroy no lanza errores', () => {
    const ctrl = new DetailController(mockApi);
    expect(() => ctrl.destroy()).not.toThrow();
  });

  it('DetailView.destroy no lanza errores', async () => {
    const ctrl = new DetailController(mockApi);
    await ctrl.load(25);
    const state = ctrl.state as { status: 'success'; data: PokemonDetail };
    const view = new DetailView({ detail: state.data, onBack: () => {} });
    expect(() => view.destroy()).not.toThrow();
  });
});
