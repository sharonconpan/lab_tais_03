/**
 * HU05-01 — Prueba de integración: detalle de habilidad
 * RF-018: AbilityDetail muestra nombre + descripción
 * RF-019: si descripción no está en español, muestra en inglés + nota en español
 * RF-023: LoadingIndicator visible durante la carga
 * RF-024: NetworkError → ErrorMessage retryable; NotFoundError → retryable=false
 * RF-025: TimeoutError → retryable=true con mensaje "tiempo agotado"
 *
 * Ciclo TDD: pruebas escritas ANTES de que existan AbilityController y AbilityDetail.
 * Estado inicial: ROJO hasta que los módulos existan (rojo → verde).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  MockPokeApiClient,
  FIXTURE_ABILITY_ES,
  FIXTURE_ABILITY_EN_ONLY,
} from '../mocks/MockPokeApiClient';
import { AbilityController } from '../../src/application/AbilityController';
import { AbilityDetail } from '../../src/presentation/AbilityDetail';
import { LoadingIndicator } from '../../src/presentation/LoadingIndicator';
import { ErrorMessage } from '../../src/presentation/ErrorMessage';
import type { AsyncState } from '../../src/domain/types';
import type { AbilityDetail as AbilityDetailType } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Helpers                                                              //
// ------------------------------------------------------------------ //
function queryText(container: HTMLElement, text: string): boolean {
  return container.textContent?.includes(text) ?? false;
}
function getByRole(container: HTMLElement, role: string): HTMLElement | null {
  return container.querySelector(`[role="${role}"]`);
}

describe('HU-05 — Detalle de habilidad: pruebas de integración', () => {
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
  // Escenario 1 — Descripción en español (RF-018)                       //
  // ------------------------------------------------------------------ //
  it('Esc-1: AbilityController transiciona idle→loading→success para habilidad en español', async () => {
    const states: string[] = [];
    const ctrl = new AbilityController(mockApi);
    const unsub = ctrl.subscribe((s) => states.push(s.status));

    expect(ctrl.state.status).toBe('idle');
    const p = ctrl.load('static');
    expect(states).toContain('loading');
    await p;
    expect(ctrl.state.status).toBe('success');
    unsub();
  });

  it('Esc-1: AbilityDetail muestra nombre de la habilidad', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, FIXTURE_ABILITY_ES.displayName)).toBe(true);
  });

  it('Esc-1: AbilityDetail muestra descripción en español', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, FIXTURE_ABILITY_ES.description)).toBe(true);
  });

  it('Esc-1: AbilityDetail NO muestra nota cuando descripción está en español', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    container.appendChild(view.element);

    // La nota solo aparece cuando el idioma es 'en'
    expect(queryText(container, 'no disponible en español')).toBe(false);
  });

  it('Esc-1: AbilityDetail tiene botón Cerrar en español', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    container.appendChild(view.element);

    const closeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('cerrar')
    );
    expect(closeBtn).not.toBeUndefined();
  });

  it('Esc-1: onClose se invoca al pulsar Cerrar', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const onClose = vi.fn();
    const view = new AbilityDetail({ detail: s.data, onClose });
    container.appendChild(view.element);

    const closeBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('cerrar')
    )!;
    closeBtn.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------------ //
  // Escenario 2 — Descripción solo en inglés (RF-019)                   //
  // ------------------------------------------------------------------ //
  it('Esc-2: AbilityDetail muestra descripción en inglés cuando no existe en español', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('overgrow');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    container.appendChild(view.element);

    expect(queryText(container, FIXTURE_ABILITY_EN_ONLY.description)).toBe(true);
  });

  it('Esc-2: AbilityDetail muestra nota en español cuando descripción está en inglés', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('overgrow');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    container.appendChild(view.element);

    // i18n.descripcionNoDisponibleEs = 'Descripción no disponible en español.'
    expect(queryText(container, 'no disponible en español')).toBe(true);
  });

  it('Esc-2: AbilityController.descriptionLanguage === "en" para habilidad sin español', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('overgrow');

    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    expect(s.data.descriptionLanguage).toBe('en');
  });

  // ------------------------------------------------------------------ //
  // Escenario 3 — LoadingIndicator durante la carga (RF-023)            //
  // ------------------------------------------------------------------ //
  it('Esc-3: LoadingIndicator es visible durante la carga de la habilidad', () => {
    const ctrl = new AbilityController(mockApi);
    const loading = new LoadingIndicator({ visible: false });
    container.appendChild(loading.element);

    let wasLoading = false;
    ctrl.subscribe((s) => {
      if (s.status === 'loading') {
        loading.update({ visible: true });
        wasLoading = true;
      }
    });

    ctrl.load('static'); // sin await
    expect(wasLoading).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Escenario 4 — Cerrar vuelve a la ficha sin perder datos             //
  // ------------------------------------------------------------------ //
  it('Esc-4: AbilityController.close() transiciona a idle', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');
    expect(ctrl.state.status).toBe('success');

    ctrl.close();
    expect(ctrl.state.status).toBe('idle');
  });

  it('Esc-4: close() notifica a los suscriptores con idle', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const spy = vi.fn();
    ctrl.subscribe(spy);
    ctrl.close();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ status: 'idle' }));
  });

  // ------------------------------------------------------------------ //
  // Escenario 5 — Error de red (RF-024)                                 //
  // ------------------------------------------------------------------ //
  it('Esc-5: NetworkError → estado error con retryable=true', async () => {
    mockApi.setAbilityBehavior('network-error');
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(true);
  });

  it('Esc-5: NetworkError renderiza ErrorMessage con botón Reintentar', async () => {
    mockApi.setAbilityBehavior('network-error');
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as { status: 'error'; message: string; retryable: boolean };
    const errorMsg = new ErrorMessage({
      message: s.message,
      retryable: s.retryable,
      onRetry: () => {},
    });
    container.appendChild(errorMsg.element);

    expect(getByRole(container, 'alert')).not.toBeNull();
    const btn = container.querySelector('button');
    expect(btn?.textContent?.toLowerCase()).toContain('reintentar');
  });

  it('Esc-5: NotFoundError → estado error con retryable=false', async () => {
    mockApi.setAbilityBehavior('not-found');
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state;
    expect(s.status).toBe('error');
    if (s.status === 'error') expect(s.retryable).toBe(false);
  });

  // ------------------------------------------------------------------ //
  // Escenario 6 — Timeout (RF-025)                                      //
  // ------------------------------------------------------------------ //
  it('Esc-6: TimeoutError → estado error retryable=true con mensaje de tiempo agotado', async () => {
    mockApi.setAbilityBehavior('timeout');
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');

    const s = ctrl.state as AsyncState<AbilityDetailType>;
    expect(s.status).toBe('error');
    if (s.status === 'error') {
      expect(s.retryable).toBe(true);
      expect(s.message.toLowerCase()).toMatch(/tard|tiempo|agotado/);
    }
  });

  // ------------------------------------------------------------------ //
  // destroy                                                              //
  // ------------------------------------------------------------------ //
  it('AbilityController.destroy no lanza errores', () => {
    expect(() => new AbilityController(mockApi).destroy()).not.toThrow();
  });

  it('AbilityDetail.destroy no lanza errores', async () => {
    const ctrl = new AbilityController(mockApi);
    await ctrl.load('static');
    const s = ctrl.state as { status: 'success'; data: AbilityDetailType };
    const view = new AbilityDetail({ detail: s.data, onClose: () => {} });
    expect(() => view.destroy()).not.toThrow();
  });
});
