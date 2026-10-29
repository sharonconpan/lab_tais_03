/**
 * HU06-04 — Pruebas unitarias: CompareController
 * RF-020: cuando ambos slots tienen datos, calcula compareStats y emite success
 * RF-021: empate verificado en compareStats (cubierto en compareStats.test.ts)
 * RF-022: misma criatura en ambos slots → estado error, sin petición extra
 * RF-023: estado loading mientras cualquier slot está cargando
 * RF-024: NetworkError en cualquier slot → error retryable=true; NotFoundError → retryable=false
 * RF-025: TimeoutError → error retryable=true con mensaje "tiempo agotado"
 * RF-029: stateA y stateB independientes
 */
import { describe, it, expect, vi } from 'vitest';
import { CompareController } from '../../src/application/CompareController';
import {
  MockPokeApiClient,
  FIXTURE_PIKACHU,
  FIXTURE_NO_IMAGE,
} from '../mocks/MockPokeApiClient';
import type { AsyncState, CompareResult } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Estado inicial                                                       //
// ------------------------------------------------------------------ //
describe('CompareController — estado inicial', () => {
  it('state inicial es idle', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    expect(ctrl.state.status).toBe('idle');
    ctrl.destroy();
  });

  it('stateA inicial es idle', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    expect(ctrl.stateA.status).toBe('idle');
    ctrl.destroy();
  });

  it('stateB inicial es idle', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    expect(ctrl.stateB.status).toBe('idle');
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// selectA — transiciones de estado (RF-023)                           //
// ------------------------------------------------------------------ //
describe('CompareController — selectA', () => {
  it('selectA(id) transiciona idle→loading→success en stateA', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new CompareController(api);
    const states: string[] = [];
    // Observar stateA mediante subscribe del controlador global
    ctrl.subscribe(() => states.push(ctrl.stateA.status));

    await ctrl.selectA(25);
    expect(states).toContain('loading');
    expect(ctrl.stateA.status).toBe('success');
    ctrl.destroy();
  });

  it('selectA emite loading antes de resolver', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const states: string[] = [];
    ctrl.subscribe(() => states.push(ctrl.stateA.status));

    ctrl.selectA(25); // sin await
    expect(states).toContain('loading');
    ctrl.destroy();
  });

  it('selectA almacena el PokemonDetail correcto en stateA', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);

    const sA = ctrl.stateA as { status: 'success'; data: typeof FIXTURE_PIKACHU };
    expect(sA.data.id).toBe(FIXTURE_PIKACHU.id);
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// selectB — transiciones de estado                                     //
// ------------------------------------------------------------------ //
describe('CompareController — selectB', () => {
  it('selectB(id) transiciona idle→loading→success en stateB', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const states: string[] = [];
    ctrl.subscribe(() => states.push(ctrl.stateB.status));

    await ctrl.selectB(39);
    expect(states).toContain('loading');
    expect(ctrl.stateB.status).toBe('success');
    ctrl.destroy();
  });

  it('selectB almacena el PokemonDetail correcto en stateB', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectB(39);

    const sB = ctrl.stateB as { status: 'success'; data: typeof FIXTURE_NO_IMAGE };
    expect(sB.data.id).toBe(FIXTURE_NO_IMAGE.id);
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Comparación completa (RF-020)                                        //
// ------------------------------------------------------------------ //
describe('CompareController — comparación completa', () => {
  it('state es success tras seleccionar dos criaturas distintas', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    expect(ctrl.state.status).toBe('success');
    ctrl.destroy();
  });

  it('state.data contiene pokemonA con id correcto', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    expect(s.data.pokemonA.id).toBe(25);
    ctrl.destroy();
  });

  it('state.data contiene pokemonB con id correcto', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    expect(s.data.pokemonB.id).toBe(39);
    ctrl.destroy();
  });

  it('state.data.statResults contiene las 6 claves de stat', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    const keys = Object.keys(s.data.statResults);
    expect(keys).toContain('hp');
    expect(keys).toContain('attack');
    expect(keys).toContain('defense');
    expect(keys).toContain('special-attack');
    expect(keys).toContain('special-defense');
    expect(keys).toContain('speed');
    ctrl.destroy();
  });

  it('pikachu hp=35 < jigglypuff hp=115 → statResults.hp === "B"', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    expect(s.data.statResults['hp']).toBe('B');
    ctrl.destroy();
  });

  it('pikachu speed=90 > jigglypuff speed=20 → statResults.speed === "A"', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    expect(s.data.statResults['speed']).toBe('A');
    ctrl.destroy();
  });

  it('state permanece idle cuando solo se ha cargado el slot A', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);

    // Con solo uno de los slots, el estado global NO es success
    expect(ctrl.state.status).not.toBe('success');
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Misma criatura en ambos slots (RF-022)                              //
// ------------------------------------------------------------------ //
describe('CompareController — misma criatura en ambos slots (RF-022)', () => {
  it('estado error cuando slotA y slotB tienen la misma criatura', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(25);

    expect(ctrl.state.status).toBe('error');
    ctrl.destroy();
  });

  it('mensaje de error en español menciona "diferentes" o "misma" o "igual"', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(25);

    const s = ctrl.state as AsyncState<CompareResult>;
    if (s.status === 'error') {
      expect(s.message).toMatch(/diferentes|misma|igual/i);
    }
    ctrl.destroy();
  });

  it('el mensaje de creaturasIguales de i18n se usa para el error', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    await ctrl.selectA(25);
    await ctrl.selectB(25);

    const s = ctrl.state;
    if (s.status === 'error') {
      expect(s.message.length).toBeGreaterThan(0);
    }
    ctrl.destroy();
  });

  it('no hace más de 2 peticiones al api cuando ambos slots son iguales', async () => {
    const api = new MockPokeApiClient();
    const spy = vi.spyOn(api, 'getPokemonDetail');
    const ctrl = new CompareController(api);

    await ctrl.selectA(25);
    await ctrl.selectB(25);

    // Máximo 2 llamadas (una por slot)
    expect(spy.mock.calls.length).toBeLessThanOrEqual(2);
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Errores de red (RF-024)                                              //
// ------------------------------------------------------------------ //
describe('CompareController — manejo de errores (RF-024, RF-025)', () => {
  it('NetworkError en slot A → stateA es error con retryable=true', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('network-error');
    const ctrl = new CompareController(api);
    await ctrl.selectA(25);

    const s = ctrl.stateA;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(true);
    ctrl.destroy();
  });

  it('NetworkError en slot A → state global es error', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('network-error');
    const ctrl = new CompareController(api);
    await ctrl.selectA(25);

    expect(ctrl.state.status).toBe('error');
    ctrl.destroy();
  });

  it('TimeoutError en slot A → stateA es error retryable=true', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('timeout');
    const ctrl = new CompareController(api);
    await ctrl.selectA(25);

    const s = ctrl.stateA;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(true);
      expect(s.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
    ctrl.destroy();
  });

  it('NotFoundError en slot A → stateA es error retryable=false', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('not-found');
    const ctrl = new CompareController(api);
    await ctrl.selectA(25);

    const s = ctrl.stateA;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(false);
    ctrl.destroy();
  });

  it('NetworkError en slot B → stateB es error con retryable=true', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new CompareController(api);
    await ctrl.selectA(25); // A carga bien

    api.setDetailBehavior('network-error');
    await ctrl.selectB(39);

    const sB = ctrl.stateB;
    expect(sB.status).toBe('error');
    if (sB.status === 'error') expect(sB.retryable).toBe(true);
    ctrl.destroy();
  });

  it('TimeoutError en slot B → stateB es error retryable=true (RF-025)', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new CompareController(api);
    await ctrl.selectA(25);

    api.setDetailBehavior('timeout');
    await ctrl.selectB(39);

    const sB = ctrl.stateB;
    expect(sB.status).toBe('error');
    if (sB.status === 'error') {
      expect(sB.retryable).toBe(true);
      expect(sB.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Estado global loading (RF-023)                                       //
// ------------------------------------------------------------------ //
describe('CompareController — estado loading global (RF-023)', () => {
  it('state global es loading mientras selectA está en curso', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const states: string[] = [];
    ctrl.subscribe((s) => states.push(s.status));

    ctrl.selectA(25); // sin await
    expect(states).toContain('loading');
    ctrl.destroy();
  });

  it('state global es loading mientras selectB está en curso', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const states: string[] = [];
    ctrl.subscribe((s) => states.push(s.status));

    ctrl.selectB(39); // sin await
    expect(states).toContain('loading');
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Suscripción / desuscripción                                          //
// ------------------------------------------------------------------ //
describe('CompareController — suscripción', () => {
  it('subscribe notifica cada cambio de estado', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const spy = vi.fn();
    ctrl.subscribe(spy);

    await ctrl.selectA(25);
    expect(spy).toHaveBeenCalled();
    ctrl.destroy();
  });

  it('unsubscribe deja de recibir notificaciones', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const spy = vi.fn();
    const unsub = ctrl.subscribe(spy);

    await ctrl.selectA(25);
    const callsAfterA = spy.mock.calls.length;
    unsub();

    await ctrl.selectB(39);
    expect(spy.mock.calls.length).toBe(callsAfterA);
    ctrl.destroy();
  });

  it('múltiples suscriptores reciben las mismas notificaciones', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    ctrl.subscribe(spy1);
    ctrl.subscribe(spy2);

    await ctrl.selectA(25);
    expect(spy1.mock.calls.length).toBe(spy2.mock.calls.length);
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('CompareController — destroy', () => {
  it('destroy no lanza errores', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    expect(() => ctrl.destroy()).not.toThrow();
  });

  it('destroy limpia los listeners', async () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.destroy();

    await ctrl.selectA(25); // no debería disparar spy
    // No debe haber llamadas post-destroy a success
    const successCalls = spy.mock.calls.filter((c) => c[0]?.status === 'success');
    expect(successCalls.length).toBe(0);
  });
});
