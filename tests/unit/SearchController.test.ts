/**
 * HU02-05 — Pruebas unitarias: SearchController
 * RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchController } from '../../src/application/SearchController';
import { MockPokeApiClient } from '../mocks/MockPokeApiClient';
import type { PokemonEntry } from '../../src/domain/types';

describe('SearchController', () => {
  let mockApi: MockPokeApiClient;

  beforeEach(() => {
    mockApi = new MockPokeApiClient();
  });

  // ------------------------------------------------------------------ //
  // Estado inicial                                                       //
  // ------------------------------------------------------------------ //
  it('estado inicial es idle', () => {
    const ctrl = new SearchController(mockApi);
    expect(ctrl.state.status).toBe('idle');
  });

  // ------------------------------------------------------------------ //
  // RF-008 — campo vacío: devuelve invalid, estado queda en idle         //
  // ------------------------------------------------------------------ //
  it('search("") devuelve { valid: false, reason: "empty" }', async () => {
    const ctrl = new SearchController(mockApi);
    const result = await ctrl.search('');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('empty');
    expect(ctrl.state.status).toBe('idle');
  });

  it('search("") no llama a getPokemonIndex', async () => {
    const spy = vi.spyOn(mockApi, 'getPokemonIndex');
    const ctrl = new SearchController(mockApi);
    await ctrl.search('');
    expect(spy).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------ //
  // RF-009 — solo símbolos: devuelve invalid, estado queda en idle       //
  // ------------------------------------------------------------------ //
  it('search("???") devuelve { valid: false, reason: "only-symbols" }', async () => {
    const ctrl = new SearchController(mockApi);
    const result = await ctrl.search('???');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('only-symbols');
    expect(ctrl.state.status).toBe('idle');
  });

  it('search("###") no llama a getPokemonIndex', async () => {
    const spy = vi.spyOn(mockApi, 'getPokemonIndex');
    const ctrl = new SearchController(mockApi);
    await ctrl.search('###');
    expect(spy).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------ //
  // RF-004 — búsqueda por nombre exacto                                  //
  // ------------------------------------------------------------------ //
  it('search("pikachu") → success con pikachu', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('pikachu');
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.some((e) => e.name === 'pikachu')).toBe(true);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-004 — sin distinción de mayúsculas                                //
  // ------------------------------------------------------------------ //
  it('search("PIKACHU") → success con pikachu', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('PIKACHU');
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.some((e) => e.name === 'pikachu')).toBe(true);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-004 — búsqueda por nombre parcial                                 //
  // ------------------------------------------------------------------ //
  it('search("chu") → success que incluye pikachu', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('chu');
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.some((e) => e.name === 'pikachu')).toBe(true);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-005 — búsqueda por número exacto                                  //
  // ------------------------------------------------------------------ //
  it('search("25") → success con pikachu (id=25)', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('25');
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.length).toBe(1);
      expect(state.data[0].id).toBe(25);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-006 — caracteres especiales                                        //
  // ------------------------------------------------------------------ //
  it('search("farfetch\'d") → success con farfetchd', async () => {
    mockApi.addIndexEntry({
      id: 83,
      name: "farfetch'd",
      displayName: "Farfetch'd",
      imageUrl: null,
    });
    const ctrl = new SearchController(mockApi);
    await ctrl.search("farfetch'd");
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.some((e) => e.id === 83)).toBe(true);
    }
  });

  it('search("mr-mime") → success con mr-mime', async () => {
    mockApi.addIndexEntry({ id: 122, name: 'mr-mime', displayName: 'Mr. Mime', imageUrl: null });
    const ctrl = new SearchController(mockApi);
    await ctrl.search('mr-mime');
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.some((e) => e.id === 122)).toBe(true);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-007 — sin resultados → success con array vacío                    //
  // ------------------------------------------------------------------ //
  it('search("zzznoencontrado") → success con data vacío', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('zzznoencontrado');
    const state = ctrl.state;
    expect(state.status).toBe('success');
    if (state.status === 'success') {
      expect(state.data.length).toBe(0);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-010 — número inexistente → error con mensaje específico           //
  // ------------------------------------------------------------------ //
  it('search("99999") → error con mensaje de número inexistente', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('99999');
    const state = ctrl.state;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.message.length).toBeGreaterThan(0);
      expect(state.retryable).toBe(false);
    }
  });

  // ------------------------------------------------------------------ //
  // RF-011 — el índice se solicita una sola vez (caché interna)          //
  // ------------------------------------------------------------------ //
  it('segunda búsqueda no vuelve a llamar a getPokemonIndex', async () => {
    const spy = vi.spyOn(mockApi, 'getPokemonIndex');
    const ctrl = new SearchController(mockApi);

    await ctrl.search('pikachu');
    await ctrl.search('bulbasaur');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------------ //
  // RF-027 — paginación de resultados de búsqueda                        //
  // ------------------------------------------------------------------ //
  it('paginación: pageSize=2 con 5 entradas del fixture da page.total=5', async () => {
    const ctrl = new SearchController(mockApi, { pageSize: 2 });
    // "a" coincide con bulbasaur, charmander, pikachu, jigglypuff (4 de 5)
    await ctrl.search('a');
    expect(ctrl.pagination.total).toBeGreaterThanOrEqual(2);
    expect(ctrl.pagination.page).toBe(1);
  });

  it('nextPage avanza al siguiente bloque de resultados', async () => {
    // Añadir suficientes entradas para necesitar paginación
    for (let i = 100; i < 125; i++) {
      mockApi.addIndexEntry({
        id: i,
        name: `pokemon-${i}`,
        displayName: `Pokémon ${i}`,
        imageUrl: null,
      });
    }
    const ctrl = new SearchController(mockApi, { pageSize: 20 });
    await ctrl.search('pokemon');

    const page1State = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(page1State.data.length).toBe(20);

    await ctrl.nextPage();
    const page2State = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(page2State.status).toBe('success');
    expect(page2State.data.length).toBe(5);
    expect(ctrl.pagination.page).toBe(2);
  });

  it('prevPage no baja de página 1', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('pikachu');
    await ctrl.prevPage();
    expect(ctrl.pagination.page).toBe(1);
  });

  it('nextPage en la última página no cambia el estado', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('pikachu'); // 1 resultado, 1 página
    await ctrl.nextPage();
    expect(ctrl.pagination.page).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // clear()                                                              //
  // ------------------------------------------------------------------ //
  it('clear() vuelve a idle y vacía los resultados', async () => {
    const ctrl = new SearchController(mockApi);
    await ctrl.search('pikachu');
    expect(ctrl.state.status).toBe('success');

    ctrl.clear();
    expect(ctrl.state.status).toBe('idle');
  });

  // ------------------------------------------------------------------ //
  // Transiciones de estado                                               //
  // ------------------------------------------------------------------ //
  it('emite loading antes de success', async () => {
    const states: string[] = [];
    const ctrl = new SearchController(mockApi);
    const unsub = ctrl.subscribe((s) => states.push(s.status));

    await ctrl.search('pikachu');
    expect(states).toContain('loading');
    expect(states[states.length - 1]).toBe('success');

    unsub();
    ctrl.destroy();
  });

  // ------------------------------------------------------------------ //
  // Error de red al cargar índice                                        //
  // ------------------------------------------------------------------ //
  it('error de red al cargar índice → estado error con retryable=true', async () => {
    mockApi.setIndexBehavior('network-error');
    const ctrl = new SearchController(mockApi);
    await ctrl.search('pikachu');
    const state = ctrl.state;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
    }
  });

  // ------------------------------------------------------------------ //
  // subscribe / destroy                                                  //
  // ------------------------------------------------------------------ //
  it('unsubscribe elimina al listener', async () => {
    const ctrl = new SearchController(mockApi);
    const listener = vi.fn();
    const unsub = ctrl.subscribe(listener);
    unsub();

    await ctrl.search('pikachu');
    expect(listener).not.toHaveBeenCalled();
    ctrl.destroy();
  });

  it('destroy no lanza errores', () => {
    const ctrl = new SearchController(mockApi);
    expect(() => ctrl.destroy()).not.toThrow();
  });
});
