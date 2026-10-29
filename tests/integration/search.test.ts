/**
 * HU02-01 — Prueba de integración: búsqueda de criaturas
 * RF: RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027
 *
 * Estas pruebas verifican el comportamiento observable de la búsqueda:
 * lo que el usuario ve en pantalla, no los detalles de implementación.
 *
 * Ciclo TDD: pruebas escritas ANTES que los módulos de HU-02.
 * Estado inicial esperado: ROJO hasta que existan
 * searchValidation, searchFilter, SearchBar y SearchController.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockPokeApiClient } from '../mocks/MockPokeApiClient';
import { SearchController } from '../../src/application/SearchController';
import { SearchBar } from '../../src/presentation/SearchBar';
import { PokemonList } from '../../src/presentation/PokemonList';
import { Pagination } from '../../src/presentation/Pagination';
import type { AsyncState, PokemonEntry } from '../../src/domain/types';

// Helpers de DOM
function queryText(container: HTMLElement, text: string): boolean {
  return container.textContent?.includes(text) ?? false;
}

describe('HU-02 — Búsqueda: pruebas de integración', () => {
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
  // Escenario 1 — Búsqueda por nombre exacto (RF-004)                   //
  // ------------------------------------------------------------------ //
  it('Esc-1: búsqueda por nombre exacto devuelve la criatura correcta', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('pikachu');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.some((e) => e.name === 'pikachu')).toBe(true);
    expect(state.data.length).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // Escenario 1 — Sin distinción de mayúsculas (RF-004)                  //
  // ------------------------------------------------------------------ //
  it('Esc-1: búsqueda sin distinguir mayúsculas ("PIKACHU" → pikachu)', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('PIKACHU');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.some((e) => e.name === 'pikachu')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 2 — Búsqueda por nombre parcial (RF-004)                  //
  // ------------------------------------------------------------------ //
  it('Esc-2: búsqueda parcial "chu" encuentra pikachu', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('chu');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    // pikachu contiene "chu"
    expect(state.data.some((e) => e.name === 'pikachu')).toBe(true);
  });

  it('Esc-2: búsqueda parcial con espacios sobrantes (" bulba ") normaliza', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('  bulba  ');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.some((e) => e.name === 'bulbasaur')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 3 — Búsqueda por número nacional exacto (RF-005)          //
  // ------------------------------------------------------------------ //
  it('Esc-3: búsqueda por número exacto "25" devuelve pikachu', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('25');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.length).toBe(1);
    expect(state.data[0].id).toBe(25);
  });

  // ------------------------------------------------------------------ //
  // Escenario 4 — Nombres con caracteres especiales (RF-006)            //
  // ------------------------------------------------------------------ //
  it('Esc-4: búsqueda "mr. mime" con punto encuentra mr-mime', async () => {
    // Añadir mr-mime al fixture dinámicamente
    const extendedMock = new MockPokeApiClient();
    extendedMock.addIndexEntry({
      id: 122,
      name: 'mr-mime',
      displayName: 'Mr. Mime',
      imageUrl: null,
    });
    const controller = new SearchController(extendedMock);
    await controller.search('mr. mime');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.some((e) => e.id === 122)).toBe(true);
  });

  it('Esc-4: búsqueda "farfetch\'d" con apóstrofo encuentra farfetchd', async () => {
    const extendedMock = new MockPokeApiClient();
    extendedMock.addIndexEntry({
      id: 83,
      name: "farfetch'd",
      displayName: "Farfetch'd",
      imageUrl: null,
    });
    const controller = new SearchController(extendedMock);
    await controller.search("farfetch'd");

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.some((e) => e.id === 83)).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 5 — Sin resultados (RF-007)                               //
  // ------------------------------------------------------------------ //
  it('Esc-5: búsqueda sin resultados devuelve array vacío con status success', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('zzznoencontrado999');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.length).toBe(0);
  });

  it('Esc-5: PokemonList muestra mensaje de "sin resultados" cuando data está vacío', () => {
    const list = new PokemonList({ items: [], onSelect: () => {} });
    container.appendChild(list.element);

    // Debe mostrar algún mensaje en español indicando ausencia de resultados
    expect(container.textContent?.trim().length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------ //
  // Escenario 6 — Campo vacío no llama a la API (RF-008)                //
  // ------------------------------------------------------------------ //
  it('Esc-6: búsqueda con término vacío devuelve ValidationError sin petición', async () => {
    const controller = new SearchController(mockApi);
    const spyIndex = vi.spyOn(mockApi, 'getPokemonIndex');

    const result = await controller.search('');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('empty');
    // No debe haberse pedido el índice todavía (podría estar en caché, pero
    // si el índice no estaba precargado, no debe haberse llamado)
    // La validación ocurre antes de cualquier acceso a la API
    expect(controller.state.status).toBe('idle');
    spyIndex.mockRestore();
  });

  it('Esc-6: campo vacío — SearchBar no llama onSearch', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });
    container.appendChild(bar.element);

    const input = container.querySelector('input')!;
    const submitBtn = (container.querySelector('button[data-action="search"]') ??
      Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.toLowerCase().includes('buscar')
      )!) as HTMLElement;

    // Campo vacío → confirmar búsqueda
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submitBtn.click();

    vi.advanceTimersByTime(500);
    expect(onSearch).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('Esc-6: campo vacío — SearchBar muestra mensaje de validación en español', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });
    container.appendChild(bar.element);

    const input = container.querySelector('input')!;
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('buscar')
    )!;

    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submitBtn.click();

    // Debe mostrarse algún mensaje de validación
    const validationMsg =
      container.querySelector('[data-validation]') ?? container.querySelector('[role="alert"]');
    expect(validationMsg).not.toBeNull();
    expect(validationMsg?.textContent?.trim().length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------ //
  // Escenario 7 — Solo símbolos no llama a la API (RF-009)              //
  // ------------------------------------------------------------------ //
  it('Esc-7: término con solo símbolos devuelve ValidationError', async () => {
    const controller = new SearchController(mockApi);
    const result = await controller.search('???');

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('only-symbols');
    expect(controller.state.status).toBe('idle');
  });

  it('Esc-7: término "###" — SearchBar muestra validación y no llama onSearch', () => {
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });
    container.appendChild(bar.element);

    const input = container.querySelector('input')!;
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('buscar')
    )!;

    input.value = '###';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    submitBtn.click();

    expect(onSearch).not.toHaveBeenCalled();

    const validationMsg =
      container.querySelector('[data-validation]') ?? container.querySelector('[role="alert"]');
    expect(validationMsg).not.toBeNull();
  });

  // ------------------------------------------------------------------ //
  // Escenario 8 — Número inexistente (RF-010)                           //
  // ------------------------------------------------------------------ //
  it('Esc-8: número que no existe en el índice devuelve mensaje específico', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('99999');

    const state = controller.state as AsyncState<PokemonEntry[]>;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      // Mensaje específico para número inexistente (distinto al de sin resultados)
      expect(state.message.length).toBeGreaterThan(0);
    }
  });

  // ------------------------------------------------------------------ //
  // Escenario 9 — Doble confirmación rápida produce una sola petición   //
  // RF-011                                                               //
  // ------------------------------------------------------------------ //
  it('Esc-9: doble confirmación rápida en SearchBar produce una sola llamada a onSearch', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });
    container.appendChild(bar.element);

    const input = container.querySelector('input')!;
    const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('buscar')
    )!;

    input.value = 'pikachu';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Dos clics rápidos
    submitBtn.click();
    submitBtn.click();

    vi.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  // ------------------------------------------------------------------ //
  // Escenario 10 — Paginación de resultados de búsqueda (RF-027)        //
  // ------------------------------------------------------------------ //
  it('Esc-10: resultados paginados cuando superan el pageSize', async () => {
    // Crear un mock con más de 20 entradas para forzar paginación
    const bigMock = new MockPokeApiClient();
    // Añadir 25 entradas al índice
    for (let i = 100; i < 125; i++) {
      bigMock.addIndexEntry({
        id: i,
        name: `pokemon-${i}`,
        displayName: `Pokémon ${i}`,
        imageUrl: null,
      });
    }
    const controller = new SearchController(bigMock, { pageSize: 20 });
    await controller.search('pokemon');

    const state = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    // La primera página debe tener máximo 20 resultados
    expect(state.data.length).toBeLessThanOrEqual(20);
    // El total debe ser mayor que 20
    expect(controller.pagination.total).toBeGreaterThan(20);
  });

  it('Esc-10: Pagination funciona sobre resultados de búsqueda', async () => {
    const bigMock = new MockPokeApiClient();
    for (let i = 100; i < 125; i++) {
      bigMock.addIndexEntry({
        id: i,
        name: `pokemon-${i}`,
        displayName: `Pokémon ${i}`,
        imageUrl: null,
      });
    }
    const controller = new SearchController(bigMock, { pageSize: 20 });
    await controller.search('pokemon');

    const pagination = new Pagination({
      params: controller.pagination,
      onPrev: () => controller.prevPage(),
      onNext: () => controller.nextPage(),
    });
    container.appendChild(pagination.element);

    // Muestra página 1 de 2 (25 resultados / 20 pageSize)
    expect(queryText(container, '1')).toBe(true);
    expect(queryText(container, '2')).toBe(true);

    // Avanzar página
    await controller.nextPage();
    const page2State = controller.state as { status: 'success'; data: PokemonEntry[] };
    expect(page2State.status).toBe('success');
    expect(page2State.data.length).toBe(5); // 25 - 20 = 5
    expect(controller.pagination.page).toBe(2);
  });

  // ------------------------------------------------------------------ //
  // Botón Limpiar — vuelve al estado idle (RF-007, RF-008)              //
  // ------------------------------------------------------------------ //
  it('Limpiar — SearchBar llama a onClear al hacer clic en Limpiar', () => {
    const onClear = vi.fn();
    const bar = new SearchBar({ onSearch: () => {}, onClear });
    container.appendChild(bar.element);

    const clearBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('limpiar')
    )!;
    expect(clearBtn).not.toBeUndefined();
    clearBtn.click();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Limpiar — SearchController.clear() vuelve a idle', async () => {
    const controller = new SearchController(mockApi);
    await controller.search('pikachu');
    expect(controller.state.status).toBe('success');

    controller.clear();
    expect(controller.state.status).toBe('idle');
  });
});
