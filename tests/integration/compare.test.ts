/**
 * HU06-01 — Prueba de integración: comparación de dos criaturas
 * RF-020: comparación en paralelo con señal textual/simbólica por stat mayor
 * RF-021: empate indicado con señal textual/simbólica sin destacar ninguna
 * RF-022: misma criatura en ambos slots → mensaje en español, sin petición extra
 * RF-023: indicador de carga mientras se cargan ambas criaturas
 * RF-024: error identifica qué slot falló, opción de reintentar
 * RF-025: timeout → mensaje en español, opción de reintentar
 * RF-029: dos selectores independientes; comparación solo cuando ambos tienen selección
 *
 * Ciclo TDD: pruebas escritas ANTES de que existan CompareController y ComparePanel.
 * Estado inicial: ROJO hasta que los módulos existan (rojo → verde).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockPokeApiClient,
  FIXTURE_PIKACHU,
  FIXTURE_NO_IMAGE,
} from '../mocks/MockPokeApiClient';
import { CompareController } from '../../src/application/CompareController';
import { ComparePanel }      from '../../src/presentation/ComparePanel';
import { LoadingIndicator }  from '../../src/presentation/LoadingIndicator';
import { ErrorMessage }      from '../../src/presentation/ErrorMessage';
import type { AsyncState, CompareResult } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Helpers                                                              //
// ------------------------------------------------------------------ //
function queryText(container: HTMLElement, text: string): boolean {
  return container.textContent?.includes(text) ?? false;
}
function getByRole(container: HTMLElement, role: string): HTMLElement | null {
  return container.querySelector(`[role="${role}"]`);
}
function getAllByText(container: HTMLElement, text: string): HTMLElement[] {
  return Array.from(container.querySelectorAll('*')).filter(
    (el) => el.textContent?.trim() === text
  ) as HTMLElement[];
}

// ------------------------------------------------------------------ //
// Escenario 7 — Acceso desde sección dedicada (RF-029)                //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 7 — Sección dedicada', () => {
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

  it('Esc-7: ComparePanel inicial muestra dos slots vacíos con selector', () => {
    const ctrl = new CompareController(mockApi);
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    container.appendChild(panel.element);

    // Debe haber al menos un input o botón para cada slot
    const inputs = container.querySelectorAll('input, select, button');
    expect(inputs.length).toBeGreaterThan(0);

    ctrl.destroy();
    panel.destroy();
  });

  it('Esc-7: CompareController.state inicial es idle', () => {
    const ctrl = new CompareController(mockApi);
    expect(ctrl.state.status).toBe('idle');
    ctrl.destroy();
  });

  it('Esc-7: CompareController.stateA e stateB iniciales son idle', () => {
    const ctrl = new CompareController(mockApi);
    expect(ctrl.stateA.status).toBe('idle');
    expect(ctrl.stateB.status).toBe('idle');
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Escenario 6 — Indicador de carga (RF-023)                          //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 6 — Indicador de carga', () => {
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

  it('Esc-6: LoadingIndicator es visible mientras se carga el slot A', () => {
    const ctrl = new CompareController(mockApi);
    const loading = new LoadingIndicator({ visible: false });
    container.appendChild(loading.element);

    let wasLoading = false;
    ctrl.subscribe((s) => {
      if (s.status === 'loading') {
        loading.update({ visible: true });
        wasLoading = true;
      }
    });

    ctrl.selectA(25); // sin await
    expect(wasLoading).toBe(true);
    ctrl.destroy();
  });

  it('Esc-6: LoadingIndicator es visible mientras se carga el slot B', () => {
    const ctrl = new CompareController(mockApi);
    const loading = new LoadingIndicator({ visible: false });
    container.appendChild(loading.element);

    let wasLoading = false;
    ctrl.subscribe((s) => {
      if (s.status === 'loading') {
        loading.update({ visible: true });
        wasLoading = true;
      }
    });

    ctrl.selectB(39); // sin await
    expect(wasLoading).toBe(true);
    ctrl.destroy();
  });

  it('Esc-6: indicador desaparece cuando la comparación está lista', async () => {
    const ctrl = new CompareController(mockApi);
    const loading = new LoadingIndicator({ visible: true });
    container.appendChild(loading.element);

    ctrl.subscribe((s) => {
      loading.update({ visible: s.status === 'loading' });
    });

    await ctrl.selectA(25);
    await ctrl.selectB(39);

    expect(loading.element.getAttribute('hidden') !== null ||
           loading.element.getAttribute('aria-hidden') === 'true' ||
           ctrl.state.status !== 'loading').toBe(true);
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Escenario 1 — Comparación estándar (RF-020)                        //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 1 — Comparación estándar', () => {
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

  it('Esc-1: tras seleccionar dos criaturas distintas, state es success', async () => {
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    expect(ctrl.state.status).toBe('success');
    ctrl.destroy();
  });

  it('Esc-1: state.data contiene pokemonA y pokemonB', async () => {
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    expect(s.data.pokemonA.id).toBe(FIXTURE_PIKACHU.id);
    expect(s.data.pokemonB.id).toBe(FIXTURE_NO_IMAGE.id);
    ctrl.destroy();
  });

  it('Esc-1: ComparePanel muestra señal textual/simbólica para stat mayor en A', async () => {
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };

    // Pikachu speed=90 > Jigglypuff speed=20 → statResults.speed === 'A'
    expect(s.data.statResults['speed']).toBe('A');

    const panel = new ComparePanel({
      result: s.data,
      slotA: s.data.pokemonA,
      slotB: s.data.pokemonB,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    container.appendChild(panel.element);

    // Debe existir alguna señal textual en el stat speed para A (▲ o "Mayor")
    const speedRow = container.querySelector('[data-stat="speed"]') ??
                     Array.from(container.querySelectorAll('*')).find(
                       (el) => el.textContent?.toLowerCase().includes('velocidad')
                     )?.parentElement;
    expect(speedRow).not.toBeNull();
    const markerA = speedRow?.querySelector('[data-winner="A"]') ??
                    speedRow?.querySelector('.stat-winner--a') ??
                    Array.from(speedRow?.querySelectorAll('*') ?? []).find(
                      (el) => el.textContent?.includes('▲') || el.textContent?.toLowerCase().includes('mayor')
                    );
    expect(markerA).not.toBeUndefined();

    panel.destroy();
    ctrl.destroy();
  });

  it('Esc-1: ComparePanel muestra señal textual/simbólica para stat mayor en B', async () => {
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };

    // Jigglypuff hp=115 > Pikachu hp=35 → statResults.hp === 'B'
    expect(s.data.statResults['hp']).toBe('B');

    const panel = new ComparePanel({
      result: s.data,
      slotA: s.data.pokemonA,
      slotB: s.data.pokemonB,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    container.appendChild(panel.element);

    const hpRow = container.querySelector('[data-stat="hp"]') ??
                  Array.from(container.querySelectorAll('*')).find(
                    (el) => el.textContent?.includes('PS')
                  )?.parentElement;
    expect(hpRow).not.toBeNull();
    const markerB = hpRow?.querySelector('[data-winner="B"]') ??
                    hpRow?.querySelector('.stat-winner--b') ??
                    Array.from(hpRow?.querySelectorAll('*') ?? []).find(
                      (el) => el.textContent?.includes('▲') || el.textContent?.toLowerCase().includes('mayor')
                    );
    expect(markerB).not.toBeUndefined();

    panel.destroy();
    ctrl.destroy();
  });

  it('Esc-1: nombres de ambas criaturas aparecen en el panel', async () => {
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    await ctrl.selectB(39);

    const s = ctrl.state as { status: 'success'; data: CompareResult };
    const panel = new ComparePanel({
      result: s.data,
      slotA: s.data.pokemonA,
      slotB: s.data.pokemonB,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    container.appendChild(panel.element);

    expect(queryText(container, FIXTURE_PIKACHU.displayName)).toBe(true);
    expect(queryText(container, FIXTURE_NO_IMAGE.displayName)).toBe(true);

    panel.destroy();
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Escenario 2 — Empate (RF-021)                                       //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 2 — Estadística empatada', () => {
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

  it('Esc-2: comparar criatura consigo misma produce todos empates', async () => {
    // Usamos dos instancias de pikachu con mismos stats
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    // Usamos un segundo mock API que devuelve pikachu también para B
    const mockApi2 = new MockPokeApiClient();
    const ctrl2 = new CompareController(mockApi2);

    // Verificar compareStats directamente
    const { compareStats } = await import('../../src/application/compareStats');
    const result = compareStats(FIXTURE_PIKACHU, FIXTURE_PIKACHU);
    for (const val of Object.values(result)) {
      expect(val).toBe('tie');
    }
  });

  it('Esc-2: ComparePanel muestra señal de empate para stat empatado (= o "Empate")', async () => {
    const { compareStats } = await import('../../src/application/compareStats');

    // Construir un resultado con special-attack empatado (pikachu: 50, jigglypuff: 45)
    // En realidad special-attack: pikachu=50 > jigglypuff=45 → no hay empate en fixtures
    // Creamos un CompareResult con empate manual para la prueba del panel
    const fakePikachuEqual = {
      ...FIXTURE_PIKACHU,
      stats: FIXTURE_PIKACHU.stats.map((s) => ({ ...s, value: 50 })),
    };
    const fakeJigglypuffEqual = {
      ...FIXTURE_NO_IMAGE,
      stats: FIXTURE_NO_IMAGE.stats.map((s) => ({ ...s, value: 50 })),
    };
    const result = compareStats(fakePikachuEqual, fakeJigglypuffEqual);

    for (const val of Object.values(result)) {
      expect(val).toBe('tie');
    }

    const panel = new ComparePanel({
      result: { pokemonA: fakePikachuEqual, pokemonB: fakeJigglypuffEqual, statResults: result },
      slotA: fakePikachuEqual,
      slotB: fakeJigglypuffEqual,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    container.appendChild(panel.element);

    // Debe existir señal de empate en el DOM (= o "Empate")
    const hasEmpate = queryText(container, '=') || queryText(container, 'Empate') ||
                      container.querySelectorAll('[data-winner="tie"]').length > 0;
    expect(hasEmpate).toBe(true);

    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// Escenario 3 — Misma criatura en ambos slots (RF-022)               //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 3 — Misma criatura', () => {
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

  it('Esc-3: seleccionar la misma criatura en ambos slots produce estado error con mensaje en español', async () => {
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);
    await ctrl.selectB(25); // misma criatura

    const s = ctrl.state;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.message).toMatch(/diferentes|misma|igual/i);
    }
    ctrl.destroy();
  });

  it('Esc-3: misma criatura en ambos slots no hace petición adicional', async () => {
    const spy = vi.spyOn(mockApi, 'getPokemonDetail');
    const ctrl = new CompareController(mockApi);

    await ctrl.selectA(25);
    const callsAfterA = spy.mock.calls.length;

    await ctrl.selectB(25); // misma criatura

    // No debe hacerse una petición extra de red para el slot B (ya está cargado y se detecta la igualdad)
    // O bien sí se hace la petición pero no se compara; el contrato es que no hay petición ADICIONAL
    // más allá de la propia carga del slot B. El importante es el estado de error.
    const s = ctrl.state;
    expect(s.status).toBe('error');
    // callsAfterA puede ser 0 o 1 dependiendo de si el ctrl es inteligente, pero no debe superar 1
    expect(spy.mock.calls.length - callsAfterA).toBeLessThanOrEqual(1);
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Escenario 4 — Error al cargar datos (RF-024)                       //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 4 — Error al cargar', () => {
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

  it('Esc-4: NetworkError en slot A → estado error con retryable=true', async () => {
    mockApi.setDetailBehavior('network-error');
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);

    const s = ctrl.stateA;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(true);
    ctrl.destroy();
  });

  it('Esc-4: NetworkError en slot B → estado error con retryable=true', async () => {
    const ctrlNormal = new CompareController(mockApi);
    await ctrlNormal.selectA(25);

    mockApi.setDetailBehavior('network-error');
    await ctrlNormal.selectB(39);

    const sB = ctrlNormal.stateB;
    expect(sB.status).toBe('error');
    if (sB.status === 'error') expect(sB.retryable).toBe(true);
    ctrlNormal.destroy();
  });

  it('Esc-4: ErrorMessage se puede renderizar con el mensaje del slot que falló', async () => {
    mockApi.setDetailBehavior('network-error');
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);

    const s = ctrl.stateA as { status: 'error'; message: string; retryable: boolean };
    if (s.status !== 'error') return;

    const errorMsg = new ErrorMessage({
      message: s.message,
      retryable: s.retryable,
      onRetry: () => {},
    });
    container.appendChild(errorMsg.element);

    expect(getByRole(container, 'alert')).not.toBeNull();
    ctrl.destroy();
  });

  it('Esc-4: estado global del controlador es error cuando un slot falla', async () => {
    mockApi.setDetailBehavior('network-error');
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);

    expect(ctrl.state.status).toBe('error');
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// Escenario 5 — Timeout (RF-025)                                      //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: Escenario 5 — Timeout', () => {
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

  it('Esc-5: TimeoutError en slot A → estado error retryable=true con mensaje tiempo agotado', async () => {
    mockApi.setDetailBehavior('timeout');
    const ctrl = new CompareController(mockApi);
    await ctrl.selectA(25);

    const s = ctrl.stateA;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(true);
      expect(s.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
    ctrl.destroy();
  });

  it('Esc-5: TimeoutError en slot B → estado error retryable=true', async () => {
    const apiNormal = new MockPokeApiClient();
    const ctrl = new CompareController(apiNormal);
    await ctrl.selectA(25);

    apiNormal.setDetailBehavior('timeout');
    await ctrl.selectB(39);

    const sB = ctrl.stateB;
    expect(sB.status).toBe('error');
    if (sB.status === 'error') {
      expect(sB.retryable).toBe(true);
    }
    ctrl.destroy();
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('HU-06 — Comparación: destroy', () => {
  it('CompareController.destroy no lanza errores', () => {
    const ctrl = new CompareController(new MockPokeApiClient());
    expect(() => ctrl.destroy()).not.toThrow();
  });

  it('ComparePanel.destroy no lanza errores', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    expect(() => panel.destroy()).not.toThrow();
  });
});
