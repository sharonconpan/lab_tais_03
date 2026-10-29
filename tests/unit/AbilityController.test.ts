/**
 * HU05-03 — Pruebas unitarias: AbilityController
 * RF-018: idle → loading → success con AbilityDetail
 * RF-019: descriptionLanguage reflejado tal cual llega de la API
 * RF-023: estado loading notificado antes de la respuesta
 * RF-024: NetworkError → retryable=true; NotFoundError → retryable=false
 * RF-025: TimeoutError → retryable=true, mensaje "tiempo agotado"
 */
import { describe, it, expect, vi } from 'vitest';
import { AbilityController } from '../../src/application/AbilityController';
import {
  MockPokeApiClient,
  FIXTURE_ABILITY_ES,
  FIXTURE_ABILITY_EN_ONLY,
} from '../mocks/MockPokeApiClient';
import type { AsyncState, AbilityDetail } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Transiciones de estado                                               //
// ------------------------------------------------------------------ //
describe('AbilityController — transiciones de estado', () => {
  it('estado inicial es idle', () => {
    expect(new AbilityController(new MockPokeApiClient()).state.status).toBe('idle');
  });

  it('load() transiciona idle → loading → success', async () => {
    const states: string[] = [];
    const ctrl = new AbilityController(new MockPokeApiClient());
    const unsub = ctrl.subscribe((s) => states.push(s.status));
    await ctrl.load('static');
    unsub();
    expect(states[0]).toBe('loading');
    expect(states[states.length - 1]).toBe('success');
  });

  it('emite loading antes de que la promesa resuelva', () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    const states: string[] = [];
    ctrl.subscribe((s) => states.push(s.status));
    ctrl.load('static'); // sin await
    expect(states).toContain('loading');
  });

  it('success contiene la habilidad con descripción en español', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    await ctrl.load('static');
    const s = ctrl.state as { status: 'success'; data: AbilityDetail };
    expect(s.data).toEqual(FIXTURE_ABILITY_ES);
    expect(s.data.descriptionLanguage).toBe('es');
  });

  it('success contiene la habilidad con descripción en inglés', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    await ctrl.load('overgrow');
    const s = ctrl.state as { status: 'success'; data: AbilityDetail };
    expect(s.data).toEqual(FIXTURE_ABILITY_EN_ONLY);
    expect(s.data.descriptionLanguage).toBe('en');
  });
});

// ------------------------------------------------------------------ //
// close()                                                              //
// ------------------------------------------------------------------ //
describe('AbilityController — close()', () => {
  it('close() en idle no lanza error', () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    expect(() => ctrl.close()).not.toThrow();
    expect(ctrl.state.status).toBe('idle');
  });

  it('close() tras success → idle', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    await ctrl.load('static');
    expect(ctrl.state.status).toBe('success');
    ctrl.close();
    expect(ctrl.state.status).toBe('idle');
  });

  it('close() notifica a los suscriptores con { status: idle }', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    await ctrl.load('static');
    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.close();
    expect(spy).toHaveBeenCalledWith({ status: 'idle' });
  });

  it('close() tras error → idle', async () => {
    const api = new MockPokeApiClient().setAbilityBehavior('network-error');
    const ctrl = new AbilityController(api);
    await ctrl.load('static');
    expect(ctrl.state.status).toBe('error');
    ctrl.close();
    expect(ctrl.state.status).toBe('idle');
  });
});

// ------------------------------------------------------------------ //
// Manejo de errores (RF-024, RF-025)                                  //
// ------------------------------------------------------------------ //
describe('AbilityController — manejo de errores', () => {
  it('NetworkError → error retryable=true', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient().setAbilityBehavior('network-error'));
    await ctrl.load('static');
    const s = ctrl.state as AsyncState<AbilityDetail>;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(true);
  });

  it('NotFoundError → error retryable=false', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient().setAbilityBehavior('not-found'));
    await ctrl.load('static');
    const s = ctrl.state as AsyncState<AbilityDetail>;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(false);
  });

  it('TimeoutError → error retryable=true (RF-025)', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient().setAbilityBehavior('timeout'));
    await ctrl.load('static');
    const s = ctrl.state as AsyncState<AbilityDetail>;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(true);
  });

  it('TimeoutError → mensaje contiene "tard" / "tiempo" / "agotado"', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient().setAbilityBehavior('timeout'));
    await ctrl.load('static');
    const s = ctrl.state as AsyncState<AbilityDetail>;
    if (s.status === 'error') {
      expect(s.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
  });
});

// ------------------------------------------------------------------ //
// Suscripción                                                          //
// ------------------------------------------------------------------ //
describe('AbilityController — suscripción', () => {
  it('unsubscribe deja de recibir notificaciones', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    const calls: string[] = [];
    const unsub = ctrl.subscribe((s) => calls.push(s.status));
    await ctrl.load('static');
    const count = calls.length;
    unsub();
    await ctrl.load('overgrow');
    expect(calls.length).toBe(count);
  });

  it('múltiples suscriptores reciben el mismo número de llamadas', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    ctrl.subscribe(spy1);
    ctrl.subscribe(spy2);
    await ctrl.load('static');
    expect(spy1.mock.calls.length).toBe(spy2.mock.calls.length);
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('AbilityController — destroy', () => {
  it('destroy no lanza errores', () => {
    expect(() => new AbilityController(new MockPokeApiClient()).destroy()).not.toThrow();
  });

  it('tras destroy no se reciben notificaciones', async () => {
    const ctrl = new AbilityController(new MockPokeApiClient());
    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.destroy();
    await ctrl.load('static');
    expect(spy).not.toHaveBeenCalled();
  });
});
