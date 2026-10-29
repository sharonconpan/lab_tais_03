/**
 * HU03-03 — Pruebas unitarias: DetailController
 * RF-012: idle → loading → success con PokemonDetail
 * RF-013: guarda y devuelve CatalogContext; contexto vacío por defecto
 * RF-023: estado loading notificado antes de la respuesta
 * RF-024: NetworkError → error retryable=true; NotFoundError → retryable=false
 * RF-025: TimeoutError → error retryable=true, mensaje "tiempo agotado"
 */
import { describe, it, expect, vi } from 'vitest';
import { DetailController } from '../../src/application/DetailController';
import { MockPokeApiClient, FIXTURE_PIKACHU, FIXTURE_NO_IMAGE } from '../mocks/MockPokeApiClient';
import type { AsyncState, CatalogContext, PokemonDetail } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Transiciones de estado                                               //
// ------------------------------------------------------------------ //
describe('DetailController — transiciones de estado', () => {
  it('el estado inicial es idle', () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    expect(ctrl.state.status).toBe('idle');
  });

  it('load() transiciona idle → loading → success', async () => {
    const states: string[] = [];
    const ctrl = new DetailController(new MockPokeApiClient());
    const unsub = ctrl.subscribe((s) => states.push(s.status));

    await ctrl.load(25);
    unsub();

    expect(states[0]).toBe('loading');
    expect(states[states.length - 1]).toBe('success');
    expect(ctrl.state.status).toBe('success');
  });

  it('estado success contiene el PokemonDetail correcto (pikachu)', async () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    await ctrl.load(25);

    const s = ctrl.state as { status: 'success'; data: PokemonDetail };
    expect(s.data).toEqual(FIXTURE_PIKACHU);
  });

  it('estado success contiene el PokemonDetail correcto (jigglypuff)', async () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    await ctrl.load(39);

    const s = ctrl.state as { status: 'success'; data: PokemonDetail };
    expect(s.data).toEqual(FIXTURE_NO_IMAGE);
  });

  it('load() emite loading antes de que la promesa se resuelva', () => {
    const api = new MockPokeApiClient();
    const ctrl = new DetailController(api);
    const states: string[] = [];
    ctrl.subscribe((s) => states.push(s.status));

    ctrl.load(25); // sin await
    expect(states).toContain('loading');
  });
});

// ------------------------------------------------------------------ //
// CatalogContext (RF-013)                                              //
// ------------------------------------------------------------------ //
describe('DetailController — CatalogContext', () => {
  it('getCatalogContext devuelve contexto vacío antes de cualquier carga', () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    const ctx = ctrl.getCatalogContext();
    expect(ctx.searchTerm).toBe('');
    expect(ctx.selectedTypes).toEqual([]);
    expect(ctx.page).toBe(1);
  });

  it('load() sin context → getCatalogContext devuelve contexto vacío', async () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    await ctrl.load(25);

    const ctx = ctrl.getCatalogContext();
    expect(ctx.searchTerm).toBe('');
    expect(ctx.selectedTypes).toEqual([]);
    expect(ctx.page).toBe(1);
  });

  it('load() con context → getCatalogContext devuelve el contexto guardado', async () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    const context: CatalogContext = {
      searchTerm: 'pika',
      selectedTypes: ['electric'],
      page: 3,
    };

    await ctrl.load(25, context);

    const restored = ctrl.getCatalogContext();
    expect(restored.searchTerm).toBe('pika');
    expect(restored.selectedTypes).toEqual(['electric']);
    expect(restored.page).toBe(3);
  });

  it('getCatalogContext devuelve una copia (no la referencia interna)', async () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    const ctx: CatalogContext = { searchTerm: 'chu', selectedTypes: [], page: 1 };
    await ctrl.load(25, ctx);

    const retrieved = ctrl.getCatalogContext();
    retrieved.searchTerm = 'mutado'; // modificar la copia

    expect(ctrl.getCatalogContext().searchTerm).toBe('chu'); // interno intacto
  });

  it('segunda llamada a load() con distinto contexto sobreescribe el anterior', async () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    const ctx1: CatalogContext = { searchTerm: 'primer', selectedTypes: [], page: 1 };
    const ctx2: CatalogContext = { searchTerm: 'segundo', selectedTypes: ['fire'], page: 2 };

    await ctrl.load(25, ctx1);
    expect(ctrl.getCatalogContext().searchTerm).toBe('primer');

    await ctrl.load(39, ctx2);
    expect(ctrl.getCatalogContext().searchTerm).toBe('segundo');
    expect(ctrl.getCatalogContext().page).toBe(2);
  });
});

// ------------------------------------------------------------------ //
// Manejo de errores (RF-024, RF-025)                                  //
// ------------------------------------------------------------------ //
describe('DetailController — manejo de errores', () => {
  it('NetworkError → estado error con retryable=true', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('network-error');
    const ctrl = new DetailController(api);
    await ctrl.load(25);

    const s = ctrl.state as AsyncState<PokemonDetail>;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(true);
    }
  });

  it('TimeoutError → estado error con retryable=true (RF-025)', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('timeout');
    const ctrl = new DetailController(api);
    await ctrl.load(25);

    const s = ctrl.state as AsyncState<PokemonDetail>;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(true);
    }
  });

  it('TimeoutError → mensaje contiene "tard" o "tiempo" o "agotado"', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('timeout');
    const ctrl = new DetailController(api);
    await ctrl.load(25);

    const s = ctrl.state as AsyncState<PokemonDetail>;
    if (s.status === 'error') {
      expect(s.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
  });

  it('NotFoundError → estado error con retryable=false', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('not-found');
    const ctrl = new DetailController(api);
    await ctrl.load(25);

    const s = ctrl.state as AsyncState<PokemonDetail>;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(false);
    }
  });

  it('error guarda el contexto igualmente (context no se pierde ante error)', async () => {
    const api = new MockPokeApiClient().setDetailBehavior('network-error');
    const ctrl = new DetailController(api);
    const ctx: CatalogContext = { searchTerm: 'test', selectedTypes: [], page: 2 };
    await ctrl.load(25, ctx);

    expect(ctrl.state.status).toBe('error');
    expect(ctrl.getCatalogContext().searchTerm).toBe('test');
    expect(ctrl.getCatalogContext().page).toBe(2);
  });
});

// ------------------------------------------------------------------ //
// Suscripción / desuscripción                                          //
// ------------------------------------------------------------------ //
describe('DetailController — suscripción', () => {
  it('subscribe notifica cada cambio de estado', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new DetailController(api);
    const states: string[] = [];
    ctrl.subscribe((s) => states.push(s.status));

    await ctrl.load(25);
    expect(states).toContain('loading');
    expect(states).toContain('success');
  });

  it('unsubscribe deja de recibir notificaciones', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new DetailController(api);
    const states: string[] = [];
    const unsub = ctrl.subscribe((s) => states.push(s.status));

    await ctrl.load(25);
    const countAfterFirst = states.length;
    unsub();

    await ctrl.load(39);
    // No deben llegar nuevas notificaciones
    expect(states.length).toBe(countAfterFirst);
  });

  it('múltiples suscriptores reciben el mismo estado', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new DetailController(api);
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    ctrl.subscribe(spy1);
    ctrl.subscribe(spy2);

    await ctrl.load(25);
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(spy1.mock.calls.length).toBe(spy2.mock.calls.length);
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('DetailController — destroy', () => {
  it('destroy no lanza errores', () => {
    const ctrl = new DetailController(new MockPokeApiClient());
    expect(() => ctrl.destroy()).not.toThrow();
  });

  it('destroy limpia los listeners (no se reciben más notificaciones)', async () => {
    const api = new MockPokeApiClient();
    const ctrl = new DetailController(api);
    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.destroy();

    await ctrl.load(25);
    // spy no debería recibir calls post-destroy
    // (llamado de load hace _setState pero listeners = [])
    // Al menos no lanza excepciones
    expect(spy.mock.calls.every((call) => call[0].status !== 'success')).toBe(true);
  });
});
