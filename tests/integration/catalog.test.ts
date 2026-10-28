/**
 * HU01-01 — Prueba de integración: carga inicial del catálogo
 * RF: RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026
 *
 * Estas pruebas verifican el comportamiento observable del catálogo:
 * lo que el usuario ve en pantalla, no los detalles de implementación.
 *
 * Ciclo TDD: pruebas escritas ANTES que los componentes.
 * Estado inicial esperado: ROJO (fallan hasta que existan LoadingIndicator,
 * ErrorMessage, PokemonCard, PokemonList, Pagination y CatalogController).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockPokeApiClient, FIXTURE_INDEX } from '../mocks/MockPokeApiClient';
import { CatalogController } from '../../src/application/CatalogController';
import { LoadingIndicator } from '../../src/presentation/LoadingIndicator';
import { ErrorMessage } from '../../src/presentation/ErrorMessage';
import { PokemonList } from '../../src/presentation/PokemonList';
import { Pagination } from '../../src/presentation/Pagination';
import type { AsyncState, PokemonEntry } from '../../src/domain/types';

// Helpers de DOM
function getByRole(container: HTMLElement, role: string): HTMLElement | null {
  return container.querySelector(`[role="${role}"]`);
}
function queryText(container: HTMLElement, text: string): boolean {
  return container.textContent?.includes(text) ?? false;
}

describe('HU-01 — Catálogo: pruebas de integración', () => {
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
  // Escenario 1 — Lista renderiza tarjetas ordenadas por número          //
  // RF-001: lista paginada ordenada por número nacional ascendente       //
  // ------------------------------------------------------------------ //
  it('Esc-1: renderiza tarjetas para cada criatura del índice', async () => {
    const controller = new CatalogController(mockApi);
    const list = new PokemonList({ items: [], onSelect: () => {} });
    container.appendChild(list.element);

    await controller.load();

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');

    list.update({ items: state.data, onSelect: () => {} });

    // Debe haber una tarjeta por cada entrada del fixture
    const cards = container.querySelectorAll('[data-pokemon-id]');
    expect(cards.length).toBe(FIXTURE_INDEX.length);

    // Las tarjetas deben mostrar los nombres
    expect(queryText(container, 'Pikachu')).toBe(true);
    expect(queryText(container, 'Bulbasaur')).toBe(true);
  });

  it('Esc-1: tarjetas contienen número nacional y nombre', async () => {
    const controller = new CatalogController(mockApi);
    await controller.load();

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    const list = new PokemonList({ items: state.data, onSelect: () => {} });
    container.appendChild(list.element);

    // La primera entrada del fixture es bulbasaur (id=1)
    expect(queryText(container, '1')).toBe(true);
    expect(queryText(container, 'Bulbasaur')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 1 — Indicador de carga (RF-023)                           //
  // ------------------------------------------------------------------ //
  it('Esc-1: LoadingIndicator es visible mientras carga y oculto en reposo', () => {
    const indicator = new LoadingIndicator({ visible: true });
    container.appendChild(indicator.element);

    // Visible: debe tener role=status
    expect(getByRole(container, 'status')).not.toBeNull();

    // Oculto
    indicator.update({ visible: false });
    const el = getByRole(container, 'status');
    // El elemento puede existir pero estar oculto (aria-hidden o display:none)
    if (el) {
      const hidden =
        el.getAttribute('aria-hidden') === 'true' ||
        (el as HTMLElement).style.display === 'none' ||
        el.hasAttribute('hidden');
      expect(hidden).toBe(true);
    } else {
      // Si se elimina del DOM, también es correcto
      expect(el).toBeNull();
    }
  });

  it('Esc-1: LoadingIndicator tiene aria-live=polite', () => {
    const indicator = new LoadingIndicator({ visible: true });
    container.appendChild(indicator.element);
    const el = getByRole(container, 'status');
    expect(el?.getAttribute('aria-live')).toBe('polite');
  });

  it('Esc-1: LoadingIndicator muestra texto en español', () => {
    const indicator = new LoadingIndicator({ visible: true });
    container.appendChild(indicator.element);
    // Debe contener algún texto de carga en español
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------ //
  // Escenario 3 — Criatura sin imagen muestra placeholder (RF-003)      //
  // ------------------------------------------------------------------ //
  it('Esc-3: criatura sin imagen muestra placeholder visual', async () => {
    const controller = new CatalogController(mockApi);
    await controller.load();

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    const list = new PokemonList({ items: state.data, onSelect: () => {} });
    container.appendChild(list.element);

    // Jigglypuff (id=39) tiene imageUrl=null → debe haber un placeholder
    const jigglypuffCard = container.querySelector('[data-pokemon-id="39"]');
    expect(jigglypuffCard).not.toBeNull();

    // No debe haber un <img> con src apuntando a null o vacío para esta criatura
    const img = jigglypuffCard?.querySelector('img');
    if (img) {
      // Si hay imagen, el src no puede ser vacío ni "null"
      expect(img.getAttribute('src')).not.toBe('');
      expect(img.getAttribute('src')).not.toBe('null');
    } else {
      // Si no hay img, debe existir algún elemento de placeholder
      const placeholder = jigglypuffCard?.querySelector('[data-placeholder]') ??
                          jigglypuffCard?.querySelector('svg') ??
                          jigglypuffCard?.querySelector('[aria-label]');
      expect(placeholder).not.toBeNull();
    }

    // Número y nombre siguen visibles
    expect(queryText(container, '39')).toBe(true);
    expect(queryText(container, 'Jigglypuff')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 4 — Error de API muestra ErrorMessage con reintentar      //
  // RF-024                                                               //
  // ------------------------------------------------------------------ //
  it('Esc-4: error de red muestra ErrorMessage con botón Reintentar', async () => {
    mockApi.setIndexBehavior('network-error');
    const controller = new CatalogController(mockApi);
    await controller.load();

    const state = controller.state as { status: 'error'; message: string; retryable: boolean };
    expect(state.status).toBe('error');
    expect(state.retryable).toBe(true);

    const errorMsg = new ErrorMessage({
      message: state.message,
      retryable: state.retryable,
      onRetry: () => {},
    });
    container.appendChild(errorMsg.element);

    // role=alert
    expect(getByRole(container, 'alert')).not.toBeNull();
    // Botón de reintentar
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn?.textContent?.toLowerCase()).toContain('reintentar');
  });

  it('Esc-4: error no retryable omite botón Reintentar', () => {
    const errorMsg = new ErrorMessage({
      message: 'No encontrado.',
      retryable: false,
      onRetry: () => {},
    });
    container.appendChild(errorMsg.element);

    const btn = container.querySelector('button');
    expect(btn).toBeNull();
  });

  it('Esc-4: onRetry se invoca al hacer clic en Reintentar', () => {
    const spy = vi.fn();
    const errorMsg = new ErrorMessage({ message: 'Error', retryable: true, onRetry: spy });
    container.appendChild(errorMsg.element);

    const btn = container.querySelector('button')!;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------------ //
  // Escenario 5 — Timeout muestra mensaje de tiempo agotado (RF-025)    //
  // ------------------------------------------------------------------ //
  it('Esc-5: timeout muestra mensaje de tiempo agotado y retryable=true', async () => {
    mockApi.setIndexBehavior('timeout');
    const controller = new CatalogController(mockApi);
    await controller.load();

    const state = controller.state as AsyncState<PokemonEntry[]>;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
      // El mensaje debe mencionar tiempo o timeout en español
      expect(state.message.toLowerCase()).toMatch(/tard|tiempo|agotado|timeout/);
    }
  });

  // ------------------------------------------------------------------ //
  // Paginación — RF-002                                                  //
  // ------------------------------------------------------------------ //
  it('Paginación muestra número de página y total', () => {
    const pagination = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    container.appendChild(pagination.element);

    // Debe mostrar el número de página actual
    expect(queryText(container, '1')).toBe(true);
    // Debe mostrar el total de páginas (100/20 = 5)
    expect(queryText(container, '5')).toBe(true);
  });

  it('Paginación desactiva "Anterior" en página 1', () => {
    const pagination = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    container.appendChild(pagination.element);

    const buttons = container.querySelectorAll('button');
    const prevBtn = Array.from(buttons).find(
      (b) => b.getAttribute('aria-label')?.toLowerCase().includes('anterior') ||
             b.textContent?.toLowerCase().includes('anterior')
    );
    expect(prevBtn).not.toBeNull();
    expect(prevBtn?.disabled).toBe(true);
  });

  it('Paginación desactiva "Siguiente" en última página', () => {
    const pagination = new Pagination({
      params: { page: 5, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    container.appendChild(pagination.element);

    const buttons = container.querySelectorAll('button');
    const nextBtn = Array.from(buttons).find(
      (b) => b.getAttribute('aria-label')?.toLowerCase().includes('siguiente') ||
             b.textContent?.toLowerCase().includes('siguiente')
    );
    expect(nextBtn).not.toBeNull();
    expect(nextBtn?.disabled).toBe(true);
  });

  it('Paginación llama onPrev y onNext al hacer clic', () => {
    const prevSpy = vi.fn();
    const nextSpy = vi.fn();
    const pagination = new Pagination({
      params: { page: 2, pageSize: 20, total: 100 },
      onPrev: prevSpy,
      onNext: nextSpy,
    });
    container.appendChild(pagination.element);

    const buttons = container.querySelectorAll('button');
    const prevBtn = Array.from(buttons).find(
      (b) => b.getAttribute('aria-label')?.toLowerCase().includes('anterior') ||
             b.textContent?.toLowerCase().includes('anterior')
    )!;
    const nextBtn = Array.from(buttons).find(
      (b) => b.getAttribute('aria-label')?.toLowerCase().includes('siguiente') ||
             b.textContent?.toLowerCase().includes('siguiente')
    )!;

    prevBtn.click();
    expect(prevSpy).toHaveBeenCalledTimes(1);

    nextBtn.click();
    expect(nextSpy).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------------ //
  // CatalogController — transiciones de estado                           //
  // ------------------------------------------------------------------ //
  it('CatalogController transiciona idle→loading→success', async () => {
    const states: string[] = [];
    const controller = new CatalogController(mockApi);

    const unsub = controller.subscribe((s) => states.push(s.status));
    expect(controller.state.status).toBe('idle');

    const loadPromise = controller.load();
    // Durante la carga debe emitir 'loading'
    expect(states).toContain('loading');

    await loadPromise;
    expect(controller.state.status).toBe('success');

    unsub();
    controller.destroy();
  });

  it('CatalogController transiciona a error con retryable=true ante NetworkError', async () => {
    mockApi.setIndexBehavior('network-error');
    const controller = new CatalogController(mockApi);
    await controller.load();

    const state = controller.state;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
    }
    controller.destroy();
  });

  it('CatalogController nextPage avanza página y carga nuevos datos', async () => {
    const controller = new CatalogController(mockApi, { pageSize: 2 });
    await controller.load();

    const page1State = controller.state;
    expect(page1State.status).toBe('success');
    if (page1State.status === 'success') {
      expect(page1State.data.length).toBeLessThanOrEqual(2);
    }

    await controller.nextPage();
    const page2State = controller.state;
    expect(page2State.status).toBe('success');

    controller.destroy();
  });

  it('CatalogController prevPage en página 1 no cambia de página', async () => {
    const controller = new CatalogController(mockApi);
    await controller.load();
    const initialPagination = controller.pagination;
    expect(initialPagination.page).toBe(1);

    await controller.prevPage();
    expect(controller.pagination.page).toBe(1);

    controller.destroy();
  });
});
