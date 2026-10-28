/**
 * HU01-07 — Pruebas unitarias: CatalogController
 * RF-001, RF-002, RF-023, RF-024, RF-025
 */
import { describe, it, expect, vi } from 'vitest';
import { CatalogController } from '../../src/application/CatalogController';
import { MockPokeApiClient, FIXTURE_INDEX } from '../mocks/MockPokeApiClient';
import type { AsyncState, PokemonEntry } from '../../src/domain/types';

describe('CatalogController', () => {
  // ------------------------------------------------------------------ //
  // Estado inicial                                                       //
  // ------------------------------------------------------------------ //
  it('estado inicial es idle', () => {
    const ctrl = new CatalogController(new MockPokeApiClient());
    expect(ctrl.state.status).toBe('idle');
  });

  // ------------------------------------------------------------------ //
  // load() — transiciones idle → loading → success                      //
  // ------------------------------------------------------------------ //
  it('load emite loading y luego success', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new CatalogController(api);
    const states: string[] = [];

    const unsub = ctrl.subscribe((s) => states.push(s.status));
    await ctrl.load();
    unsub();

    expect(states[0]).toBe('loading');
    expect(states[states.length - 1]).toBe('success');
    expect(ctrl.state.status).toBe('success');
  });

  it('load en success contiene datos de la primera página', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient());
    await ctrl.load();

    const state = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.status).toBe('success');
    expect(state.data.length).toBeGreaterThan(0);
    expect(state.data.length).toBeLessThanOrEqual(20);
  });

  it('load con pageSize=2 devuelve solo 2 entradas', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient(), { pageSize: 2 });
    await ctrl.load();

    const state = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(state.data.length).toBe(2);
  });

  // ------------------------------------------------------------------ //
  // load() — errores                                                     //
  // ------------------------------------------------------------------ //
  it('load con NetworkError → estado error con retryable=true', async () => {
    const api = new MockPokeApiClient().setIndexBehavior('network-error');
    const ctrl = new CatalogController(api);
    await ctrl.load();

    const state = ctrl.state as AsyncState<PokemonEntry[]>;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
    }
  });

  it('load con TimeoutError → estado error con mensaje tiempo agotado', async () => {
    const api = new MockPokeApiClient().setIndexBehavior('timeout');
    const ctrl = new CatalogController(api);
    await ctrl.load();

    const state = ctrl.state as AsyncState<PokemonEntry[]>;
    expect(state.status).toBe('error');
    if (state.status === 'error') {
      expect(state.retryable).toBe(true);
      expect(state.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
  });

  // ------------------------------------------------------------------ //
  // subscribe / unsubscribe                                              //
  // ------------------------------------------------------------------ //
  it('subscribe notifica al listener al cambiar estado', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient());
    const spy = vi.fn();

    const unsub = ctrl.subscribe(spy);
    await ctrl.load();
    unsub();

    expect(spy).toHaveBeenCalled();
    // Al menos se notificó loading y success
    const statuses = spy.mock.calls.map((c: [AsyncState<PokemonEntry[]>]) => c[0].status);
    expect(statuses).toContain('loading');
    expect(statuses).toContain('success');
  });

  it('unsubscribe deja de notificar', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient());
    const spy = vi.fn();

    const unsub = ctrl.subscribe(spy);
    unsub();
    await ctrl.load();

    expect(spy).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------ //
  // nextPage / prevPage                                                  //
  // ------------------------------------------------------------------ //
  it('nextPage avanza a página 2 y devuelve los items siguientes', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient(), { pageSize: 2 });
    await ctrl.load();

    const page1 = (ctrl.state as { status: 'success'; data: PokemonEntry[] }).data;
    await ctrl.nextPage();
    const page2 = (ctrl.state as { status: 'success'; data: PokemonEntry[] }).data;

    expect(ctrl.pagination.page).toBe(2);
    // Las páginas deben ser distintas (distintos ids)
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it('prevPage en página 1 no cambia de página', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient());
    await ctrl.load();

    expect(ctrl.pagination.page).toBe(1);
    await ctrl.prevPage();
    expect(ctrl.pagination.page).toBe(1);
  });

  it('nextPage en última página no cambia de página', async () => {
    // Con pageSize igual al total de fixtures, solo hay 1 página
    const ctrl = new CatalogController(new MockPokeApiClient(), { pageSize: FIXTURE_INDEX.length });
    await ctrl.load();

    expect(ctrl.pagination.page).toBe(1);
    await ctrl.nextPage();
    expect(ctrl.pagination.page).toBe(1);
  });

  it('nextPage + prevPage restaura la primera página', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient(), { pageSize: 2 });
    await ctrl.load();

    const page1Before = (ctrl.state as { status: 'success'; data: PokemonEntry[] }).data[0].id;
    await ctrl.nextPage();
    await ctrl.prevPage();
    const page1After = (ctrl.state as { status: 'success'; data: PokemonEntry[] }).data[0].id;

    expect(page1Before).toBe(page1After);
  });

  // ------------------------------------------------------------------ //
  // pagination getter                                                    //
  // ------------------------------------------------------------------ //
  it('pagination refleja page, pageSize y total correctos', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient(), { pageSize: 2 });
    await ctrl.load();

    expect(ctrl.pagination.page).toBe(1);
    expect(ctrl.pagination.pageSize).toBe(2);
    expect(ctrl.pagination.total).toBe(FIXTURE_INDEX.length);
  });

  // ------------------------------------------------------------------ //
  // destroy                                                              //
  // ------------------------------------------------------------------ //
  it('destroy no lanza errores', async () => {
    const ctrl = new CatalogController(new MockPokeApiClient());
    await ctrl.load();
    expect(() => ctrl.destroy()).not.toThrow();
  });
});
