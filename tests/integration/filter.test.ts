/**
 * HU04-01 — Prueba de integración: filtro por tipo
 * RF-014: filtro por un tipo muestra solo criaturas de ese tipo
 * RF-015: filtro por dos tipos aplica OR (unión)
 * RF-016: sin resultados muestra mensaje con "limpiar filtros" y "limpiar búsqueda"
 * RF-017: deseleccionar tipo actualiza la lista inmediatamente
 * RF-028: nota de máx. 2 tipos visible en el selector
 *
 * Ciclo TDD: estas pruebas guían la implementación de
 *   - src/application/typeFilter.ts
 *   - src/presentation/TypeFilter.ts
 *   - src/application/FilterController.ts
 *   - integración en main.ts
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  MockPokeApiClient,
  FIXTURE_INDEX,
} from '../mocks/MockPokeApiClient';
import { FilterController }  from '../../src/application/FilterController';
import { TypeFilter }        from '../../src/presentation/TypeFilter';
import { PokemonList }       from '../../src/presentation/PokemonList';
import type { AsyncState, PokemonEntry, PokemonType } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Helpers                                                              //
// ------------------------------------------------------------------ //
function queryText(container: HTMLElement, text: string): boolean {
  return container.textContent?.includes(text) ?? false;
}

function waitForSuccess(
  ctrl: FilterController
): Promise<{ status: 'success'; data: PokemonEntry[] }> {
  return new Promise((resolve) => {
    const unsub = ctrl.subscribe((s) => {
      if (s.status === 'success') {
        unsub();
        resolve(s as { status: 'success'; data: PokemonEntry[] });
      }
    });
    // Si ya está en success, resolver inmediatamente
    if (ctrl.state.status === 'success') {
      unsub();
      resolve(ctrl.state as { status: 'success'; data: PokemonEntry[] });
    }
  });
}

// ------------------------------------------------------------------ //
// Setup                                                                //
// ------------------------------------------------------------------ //
describe('HU-04 — Filtro por tipo: pruebas de integración', () => {
  let container: HTMLElement;
  let mockApi: MockPokeApiClient;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    mockApi = new MockPokeApiClient();
  });

  afterEach(() => {
    container.remove();
  });

  // ------------------------------------------------------------------ //
  // Escenario 1 — Filtrar por un tipo (RF-014)                          //
  // ------------------------------------------------------------------ //
  it('Esc-1: filtrar por "electric" devuelve solo criaturas de ese tipo', async () => {
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes(['electric']);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    // El mock devuelve pikachu (id=25) para tipo electric
    expect(s.data.every((e) => e.id === 25)).toBe(true);
    expect(s.data.some((e) => e.id === 25)).toBe(true);
  });

  it('Esc-1: filtrar por "normal" devuelve solo criaturas de ese tipo', async () => {
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes(['normal']);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    // El mock devuelve jigglypuff (id=39) para tipo normal
    expect(s.data.some((e) => e.id === 39)).toBe(true);
    // pikachu (electric) no debe aparecer
    expect(s.data.some((e) => e.id === 25)).toBe(false);
  });

  it('Esc-1: FilterController transiciona idle→loading→success al establecer tipos', async () => {
    const states: string[] = [];
    const ctrl = new FilterController(mockApi);
    const unsub = ctrl.subscribe((s) => states.push(s.status));

    await ctrl.setTypes(['electric']);
    unsub();

    expect(states).toContain('loading');
    expect(states[states.length - 1]).toBe('success');
  });

  // ------------------------------------------------------------------ //
  // Escenario 2 — Filtrar por dos tipos (RF-015, OR)                    //
  // ------------------------------------------------------------------ //
  it('Esc-2: filtrar por ["electric", "normal"] devuelve la unión (OR)', async () => {
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes(['electric', 'normal']);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    // pikachu (electric) y jigglypuff (normal/fairy) deben estar
    expect(s.data.some((e) => e.id === 25)).toBe(true);
    expect(s.data.some((e) => e.id === 39)).toBe(true);
  });

  it('Esc-2: el resultado OR no tiene duplicados cuando una criatura es de dos tipos seleccionados', async () => {
    // jigglypuff es normal y fairy — al seleccionar ambos no debe aparecer dos veces
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes(['normal', 'fairy']);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    const ids = s.data.map((e) => e.id);
    const unique = new Set(ids);
    expect(ids.length).toBe(unique.size);
  });

  // ------------------------------------------------------------------ //
  // Escenario 3 — Filtro + búsqueda combinados (RF-015)                 //
  // ------------------------------------------------------------------ //
  it('Esc-3: filtro + búsqueda aplica ambos criterios (intersección)', async () => {
    const ctrl = new FilterController(mockApi);
    // Establecer índice de búsqueda: solo pikachu (como si SearchController filtrara por "pika")
    const searchResults: PokemonEntry[] = FIXTURE_INDEX.filter((e) => e.name.includes('pikachu'));
    await ctrl.setTypes(['electric'], searchResults);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    expect(s.data.some((e) => e.id === 25)).toBe(true);
    // jigglypuff no está en searchResults → no debe aparecer aunque se pida normal
    expect(s.data.some((e) => e.id === 39)).toBe(false);
  });

  it('Esc-3: si búsqueda devuelve solo jigglypuff, filtro electric no muestra resultados', async () => {
    const ctrl = new FilterController(mockApi);
    const searchResults: PokemonEntry[] = FIXTURE_INDEX.filter((e) => e.name === 'jigglypuff');
    await ctrl.setTypes(['electric'], searchResults);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    expect(s.data.length).toBe(0);
  });

  // ------------------------------------------------------------------ //
  // Escenario 4 — Sin resultados (RF-016)                               //
  // ------------------------------------------------------------------ //
  it('Esc-4: sin resultados → estado success con array vacío', async () => {
    const ctrl = new FilterController(mockApi);
    // búsqueda restringida a bulbasaur; tipo electric → intersección vacía
    const searchResults: PokemonEntry[] = FIXTURE_INDEX.filter((e) => e.name === 'bulbasaur');
    await ctrl.setTypes(['electric'], searchResults);

    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    expect(s.data.length).toBe(0);
  });

  it('Esc-4: PokemonList muestra mensaje sin resultados cuando data está vacío', async () => {
    const list = new PokemonList({ items: [], onSelect: () => {} });
    container.appendChild(list.element);
    expect(queryText(container, 'No se encontraron')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 5 — Deseleccionar tipo actualiza la lista (RF-017)        //
  // ------------------------------------------------------------------ //
  it('Esc-5: deseleccionar tipo (setTypes vacío) vuelve al estado idle', async () => {
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes(['electric']);
    expect(ctrl.state.status).toBe('success');

    await ctrl.setTypes([]);
    expect(ctrl.state.status).toBe('idle');
  });

  it('Esc-5: TypeFilter llama onChange cuando se hace clic en un tipo', () => {
    const received: PokemonType[][] = [];
    const tf = new TypeFilter({
      types: ['electric', 'normal', 'fire'],
      selected: [],
      onChange: (sel) => received.push([...sel]),
    });
    container.appendChild(tf.element);

    // Hacer clic en el botón de "electric"
    const btn = Array.from(container.querySelectorAll('button, input[type="checkbox"]')).find(
      (el) => el.textContent?.toLowerCase().includes('electric') ||
               (el as HTMLInputElement).value?.toLowerCase() === 'electric'
    ) as HTMLElement | undefined;
    expect(btn).not.toBeUndefined();
    btn!.click();

    expect(received.length).toBeGreaterThan(0);
    expect(received[received.length - 1]).toContain('electric');
  });

  it('Esc-5: TypeFilter permite deseleccionar un tipo ya seleccionado', () => {
    const received: PokemonType[][] = [];
    const tf = new TypeFilter({
      types: ['electric', 'normal'],
      selected: ['electric'],
      onChange: (sel) => received.push([...sel]),
    });
    container.appendChild(tf.element);

    // Clic en "electric" (ya seleccionado) debe quitarlo
    const btn = Array.from(container.querySelectorAll('button, input[type="checkbox"]')).find(
      (el) => el.textContent?.toLowerCase().includes('electric') ||
               (el as HTMLInputElement).value?.toLowerCase() === 'electric'
    ) as HTMLElement | undefined;
    btn!.click();

    const last = received[received.length - 1];
    expect(last).not.toContain('electric');
  });

  // ------------------------------------------------------------------ //
  // Escenario 6 — Nota de máx. 2 tipos en selector (RF-028)             //
  // ------------------------------------------------------------------ //
  it('Esc-6: TypeFilter muestra nota sobre máximo de 2 tipos (RF-028)', () => {
    const tf = new TypeFilter({
      types: ['fire', 'water', 'electric'],
      selected: [],
      onChange: () => {},
    });
    container.appendChild(tf.element);
    // i18n.tipoMaximos = 'Cada criatura tiene como máximo 2 tipos.'
    expect(queryText(container, '2 tipos')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 7 — clearTypes / clearSearch (RF-016)                     //
  // ------------------------------------------------------------------ //
  it('Esc-7: clearTypes() quita los tipos seleccionados y vuelve a idle', async () => {
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes(['electric']);
    expect(ctrl.state.status).toBe('success');

    ctrl.clearTypes();
    expect(ctrl.state.status).toBe('idle');
  });

  it('Esc-7: FilterController expone clearTypes() y clearSearch() de forma independiente', () => {
    const ctrl = new FilterController(mockApi);
    expect(typeof ctrl.clearTypes).toBe('function');
    expect(typeof ctrl.clearSearch).toBe('function');
  });

  // ------------------------------------------------------------------ //
  // Escenario 8 — Estado inicial                                         //
  // ------------------------------------------------------------------ //
  it('Esc-8: el estado inicial de FilterController es idle', () => {
    const ctrl = new FilterController(mockApi);
    expect(ctrl.state.status).toBe('idle');
  });

  it('Esc-8: sin tipos seleccionados setTypes([]) mantiene idle', async () => {
    const ctrl = new FilterController(mockApi);
    await ctrl.setTypes([]);
    expect(ctrl.state.status).toBe('idle');
  });
});
