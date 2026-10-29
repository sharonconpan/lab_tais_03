/**
 * HU04-04 — Pruebas unitarias: FilterController
 * RF-014: filtro por un tipo → solo criaturas de ese tipo
 * RF-015: filtro OR por dos tipos → unión sin duplicados
 * RF-016: sin resultados → success con []; clearTypes() y clearSearch() independientes
 * RF-017: setTypes([]) → idle inmediato
 */
import { describe, it, expect, vi } from 'vitest';
import { FilterController } from '../../src/application/FilterController';
import {
  MockPokeApiClient,
  FIXTURE_INDEX,
} from '../mocks/MockPokeApiClient';
import type { AsyncState, PokemonEntry } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Estado inicial                                                       //
// ------------------------------------------------------------------ //
describe('FilterController — estado inicial', () => {
  it('estado inicial es idle', () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    expect(ctrl.state.status).toBe('idle');
  });

  it('expone clearTypes y clearSearch como funciones', () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    expect(typeof ctrl.clearTypes).toBe('function');
    expect(typeof ctrl.clearSearch).toBe('function');
  });
});

// ------------------------------------------------------------------ //
// setTypes — transiciones de estado (RF-014, RF-017)                  //
// ------------------------------------------------------------------ //
describe('FilterController — setTypes transiciones', () => {
  it('setTypes([]) → idle', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes([]);
    expect(ctrl.state.status).toBe('idle');
  });

  it('setTypes con tipos → idle→loading→success', async () => {
    const states: string[] = [];
    const ctrl = new FilterController(new MockPokeApiClient());
    ctrl.subscribe((s) => states.push(s.status));

    await ctrl.setTypes(['electric']);
    expect(states).toContain('loading');
    expect(states[states.length - 1]).toBe('success');
  });

  it('emite loading antes de que resuelva la promesa', () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    const states: string[] = [];
    ctrl.subscribe((s) => states.push(s.status));
    ctrl.setTypes(['electric']); // sin await
    expect(states).toContain('loading');
  });
});

// ------------------------------------------------------------------ //
// Filtro por un tipo (RF-014)                                         //
// ------------------------------------------------------------------ //
describe('FilterController — filtro por un tipo', () => {
  it('electric → solo pikachu (id 25)', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['electric']);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.data.some((e) => e.id === 25)).toBe(true);
    expect(s.data.every((e) => e.id === 25)).toBe(true);
  });

  it('normal → jigglypuff (id 39), no pikachu', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['normal']);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.data.some((e) => e.id === 39)).toBe(true);
    expect(s.data.some((e) => e.id === 25)).toBe(false);
  });

  it('tipo sin criaturas en fixture → success con [] (RF-016)', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['fire']); // mock devuelve [] para fire
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.status).toBe('success');
    expect(s.data.length).toBe(0);
  });
});

// ------------------------------------------------------------------ //
// Filtro OR por dos tipos (RF-015)                                    //
// ------------------------------------------------------------------ //
describe('FilterController — filtro OR por dos tipos', () => {
  it('electric + normal → pikachu Y jigglypuff', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['electric', 'normal']);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.data.some((e) => e.id === 25)).toBe(true);
    expect(s.data.some((e) => e.id === 39)).toBe(true);
  });

  it('normal + fairy (jigglypuff en ambos) → sin duplicados', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['normal', 'fairy']);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    const ids = s.data.map((e) => e.id);
    expect(ids.length).toBe(new Set(ids).size);
    expect(s.data.some((e) => e.id === 39)).toBe(true);
  });
});

// ------------------------------------------------------------------ //
// Intersección con búsqueda (RF-015)                                  //
// ------------------------------------------------------------------ //
describe('FilterController — intersección con búsqueda', () => {
  it('searchBase con solo pikachu + electric → pikachu', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    const base = FIXTURE_INDEX.filter((e) => e.name === 'pikachu');
    await ctrl.setTypes(['electric'], base);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.data.length).toBe(1);
    expect(s.data[0].id).toBe(25);
  });

  it('searchBase con jigglypuff + electric → vacío', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    const base = FIXTURE_INDEX.filter((e) => e.name === 'jigglypuff');
    await ctrl.setTypes(['electric'], base);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.data.length).toBe(0);
  });

  it('searchBase con bulbasaur + electric → vacío', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    const base = FIXTURE_INDEX.filter((e) => e.name === 'bulbasaur');
    await ctrl.setTypes(['electric'], base);
    const s = ctrl.state as { status: 'success'; data: PokemonEntry[] };
    expect(s.data.length).toBe(0);
  });
});

// ------------------------------------------------------------------ //
// clearTypes y clearSearch (RF-016)                                   //
// ------------------------------------------------------------------ //
describe('FilterController — clearTypes / clearSearch', () => {
  it('clearTypes() después de setTypes → idle', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['electric']);
    ctrl.clearTypes();
    expect(ctrl.state.status).toBe('idle');
  });

  it('clearTypes() notifica a los suscriptores', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['electric']);
    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.clearTypes();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'idle' }));
  });

  it('clearSearch() no cambia el estado de tipos', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    await ctrl.setTypes(['electric']);
    const stateBefore = ctrl.state;
    ctrl.clearSearch();
    // estado no debe cambiar (clearSearch solo limpia la base interna)
    expect(ctrl.state).toEqual(stateBefore);
  });
});

// ------------------------------------------------------------------ //
// Manejo de errores                                                    //
// ------------------------------------------------------------------ //
describe('FilterController — manejo de errores', () => {
  it('NetworkError al pedir tipos → estado error retryable=true', async () => {
    // Necesitamos que getPokemonByType lance un error.
    // Usamos un mock customizado inline.
    const api = new MockPokeApiClient();
    const { NetworkError } = await import('../../src/services/errors');
    vi.spyOn(api, 'getPokemonByType').mockRejectedValueOnce(new NetworkError());

    const ctrl = new FilterController(api);
    await ctrl.setTypes(['electric']);

    const s = ctrl.state as AsyncState<PokemonEntry[]>;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(true);
  });

  it('TimeoutError al pedir tipos → retryable=true con mensaje "tiempo"', async () => {
    const api = new MockPokeApiClient();
    const { TimeoutError } = await import('../../src/services/errors');
    vi.spyOn(api, 'getPokemonByType').mockRejectedValueOnce(new TimeoutError());

    const ctrl = new FilterController(api);
    await ctrl.setTypes(['electric']);

    const s = ctrl.state as AsyncState<PokemonEntry[]>;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(true);
      expect(s.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
  });
});

// ------------------------------------------------------------------ //
// Suscripción                                                          //
// ------------------------------------------------------------------ //
describe('FilterController — suscripción', () => {
  it('unsubscribe deja de recibir notificaciones', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new FilterController(api);
    const calls: string[] = [];
    const unsub = ctrl.subscribe((s) => calls.push(s.status));

    await ctrl.setTypes(['electric']);
    const countAfter = calls.length;
    unsub();

    await ctrl.setTypes(['normal']);
    expect(calls.length).toBe(countAfter);
  });

  it('múltiples suscriptores reciben el mismo número de llamadas', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    ctrl.subscribe(spy1);
    ctrl.subscribe(spy2);

    await ctrl.setTypes(['electric']);
    expect(spy1.mock.calls.length).toBe(spy2.mock.calls.length);
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('FilterController — destroy', () => {
  it('destroy no lanza errores', () => {
    expect(() => new FilterController(new MockPokeApiClient()).destroy()).not.toThrow();
  });

  it('después de destroy no se reciben notificaciones', async () => {
    const ctrl = new FilterController(new MockPokeApiClient());
    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.destroy();
    await ctrl.setTypes(['electric']);
    expect(spy).not.toHaveBeenCalled();
  });
});
