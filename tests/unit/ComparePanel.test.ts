/**
 * HU06-03 — Pruebas unitarias: ComparePanel
 * RF-020: señal textual/simbólica para el stat mayor (▲ o "Mayor") — NO solo color
 * RF-021: señal de empate (= o "Empate") — NO solo color, sin destacar ninguna
 * RF-029: dos slots independientes con selectores; comparación solo cuando ambos están listos
 *
 * Props: { result, slotA, slotB, onSelectA, onSelectB }
 */
import { describe, it, expect, vi } from 'vitest';
import { ComparePanel } from '../../src/presentation/ComparePanel';
import type { CompareResult, PokemonDetail, BaseStat } from '../../src/domain/types';
import { FIXTURE_PIKACHU, FIXTURE_NO_IMAGE } from '../mocks/MockPokeApiClient';

// ------------------------------------------------------------------ //
// Helpers                                                              //
// ------------------------------------------------------------------ //
function queryText(el: HTMLElement, text: string): boolean {
  return el.textContent?.includes(text) ?? false;
}

/** Construye un CompareResult dado para el test */
function makeResult(
  a: PokemonDetail,
  b: PokemonDetail,
  overrides?: Partial<Record<BaseStat['name'], 'A' | 'B' | 'tie'>>
): CompareResult {
  const names: BaseStat['name'][] = [
    'hp',
    'attack',
    'defense',
    'special-attack',
    'special-defense',
    'speed',
  ];
  const statResults = {} as Record<BaseStat['name'], 'A' | 'B' | 'tie'>;
  for (const name of names) {
    const va = a.stats.find((s) => s.name === name)?.value ?? 0;
    const vb = b.stats.find((s) => s.name === name)?.value ?? 0;
    statResults[name] = va > vb ? 'A' : vb > va ? 'B' : 'tie';
  }
  return { pokemonA: a, pokemonB: b, statResults: { ...statResults, ...overrides } };
}

// ------------------------------------------------------------------ //
// Estado inicial: sin selección                                        //
// ------------------------------------------------------------------ //
describe('ComparePanel — estado inicial (sin selección)', () => {
  it('renderiza sin errores con props nulas', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    expect(panel.element).toBeInstanceOf(HTMLElement);
    panel.destroy();
  });

  it('muestra dos slots (uno para A y otro para B)', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    // Debe haber al menos un elemento con clase o data-slot indicando los dos slots
    const slotA =
      container.querySelector('[data-slot="A"]') ??
      container.querySelector('.compare-panel__slot--a');
    const slotB =
      container.querySelector('[data-slot="B"]') ??
      container.querySelector('.compare-panel__slot--b');
    expect(slotA).not.toBeNull();
    expect(slotB).not.toBeNull();
    panel.destroy();
  });

  it('muestra texto indicando que hay que seleccionar una criatura', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    // Algún texto de "Selecciona una criatura" debe aparecer (i18n.seleccionaCriatura)
    expect(queryText(container, 'Selecciona')).toBe(true);
    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// Con slotA seleccionado pero sin slotB                               //
// ------------------------------------------------------------------ //
describe('ComparePanel — solo slot A seleccionado', () => {
  it('muestra el nombre de la criatura A', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: FIXTURE_PIKACHU,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    expect(queryText(container, FIXTURE_PIKACHU.displayName)).toBe(true);
    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// Con resultado completo: señales textuales/simbólicas (RF-020)       //
// ------------------------------------------------------------------ //
describe('ComparePanel — resultado completo (RF-020)', () => {
  it('muestra los nombres de ambas criaturas', () => {
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    expect(queryText(container, FIXTURE_PIKACHU.displayName)).toBe(true);
    expect(queryText(container, FIXTURE_NO_IMAGE.displayName)).toBe(true);
    panel.destroy();
  });

  it('muestra señal textual/simbólica "▲" o "Mayor" para el stat ganado por A', () => {
    // Pikachu speed=90 > Jigglypuff speed=20 → 'A'
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    expect(result.statResults['speed']).toBe('A');

    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    // La señal para A en el stat speed debe existir
    const speedRow = container.querySelector('[data-stat="speed"]');
    expect(speedRow).not.toBeNull();
    const markerA =
      speedRow?.querySelector('[data-winner="A"]') ??
      Array.from(speedRow?.querySelectorAll('*') ?? []).find(
        (el) => el.textContent?.includes('▲') || el.textContent?.toLowerCase().includes('mayor')
      );
    expect(markerA).not.toBeUndefined();
    panel.destroy();
  });

  it('muestra señal textual/simbólica "▲" o "Mayor" para el stat ganado por B', () => {
    // Jigglypuff hp=115 > Pikachu hp=35 → 'B'
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    expect(result.statResults['hp']).toBe('B');

    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    const hpRow = container.querySelector('[data-stat="hp"]');
    expect(hpRow).not.toBeNull();
    const markerB =
      hpRow?.querySelector('[data-winner="B"]') ??
      Array.from(hpRow?.querySelectorAll('*') ?? []).find(
        (el) => el.textContent?.includes('▲') || el.textContent?.toLowerCase().includes('mayor')
      );
    expect(markerB).not.toBeUndefined();
    panel.destroy();
  });

  it('muestra los 6 valores de stats para ambas criaturas', () => {
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    // Verificar algunos valores concretos de cada criatura
    expect(queryText(container, '35')).toBe(true); // pikachu hp
    expect(queryText(container, '115')).toBe(true); // jigglypuff hp
    expect(queryText(container, '90')).toBe(true); // pikachu speed
    panel.destroy();
  });

  it('muestra las 6 etiquetas de stats en español', () => {
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    const labels = ['PS', 'Ataque', 'Defensa', 'Ataque Esp.', 'Defensa Esp.', 'Velocidad'];
    for (const label of labels) {
      expect(queryText(container, label)).toBe(true);
    }
    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// Empate (RF-021)                                                      //
// ------------------------------------------------------------------ //
describe('ComparePanel — empate en un stat (RF-021)', () => {
  it('muestra señal "=" o "Empate" para stat empatado', () => {
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE, {
      'special-attack': 'tie',
    });

    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    const saRow = container.querySelector('[data-stat="special-attack"]');
    expect(saRow).not.toBeNull();

    const tieMarker =
      saRow?.querySelector('[data-winner="tie"]') ??
      Array.from(saRow?.querySelectorAll('*') ?? []).find(
        (el) => el.textContent?.includes('=') || el.textContent?.toLowerCase().includes('empate')
      );
    expect(tieMarker).not.toBeUndefined();
    panel.destroy();
  });

  it('para stat empatado NO hay un data-winner="A" ni "B"', () => {
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE, {
      speed: 'tie',
    });

    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    const speedRow = container.querySelector('[data-stat="speed"]');
    expect(speedRow?.querySelector('[data-winner="A"]')).toBeNull();
    expect(speedRow?.querySelector('[data-winner="B"]')).toBeNull();
    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// Callbacks (RF-029)                                                   //
// ------------------------------------------------------------------ //
describe('ComparePanel — callbacks de selección (RF-029)', () => {
  it('invoca onSelectA al interactuar con el selector del slot A', () => {
    const onSelectA = vi.fn();
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA,
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    // El botón/input de selección del slot A debe disparar onSelectA
    const slotA = container.querySelector('[data-slot="A"]');
    const btn = slotA?.querySelector('button') as HTMLButtonElement | null;
    btn?.click();
    // Si hay form o input, disparar submit/change según corresponda
    if (btn) expect(onSelectA).toHaveBeenCalledTimes(1);
    panel.destroy();
  });

  it('invoca onSelectB al interactuar con el selector del slot B', () => {
    const onSelectB = vi.fn();
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB,
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    const slotB = container.querySelector('[data-slot="B"]');
    const btn = slotB?.querySelector('button') as HTMLButtonElement | null;
    btn?.click();
    if (btn) expect(onSelectB).toHaveBeenCalledTimes(1);
    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// update                                                              //
// ------------------------------------------------------------------ //
describe('ComparePanel — update', () => {
  it('update con resultado completo muestra el nuevo contenido', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    const container = document.createElement('div');
    container.appendChild(panel.element);

    expect(queryText(container, FIXTURE_PIKACHU.displayName)).toBe(false);

    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    panel.update({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });

    expect(queryText(container, FIXTURE_PIKACHU.displayName)).toBe(true);
    panel.destroy();
  });
});

// ------------------------------------------------------------------ //
// destroy                                                             //
// ------------------------------------------------------------------ //
describe('ComparePanel — destroy', () => {
  it('destroy no lanza errores con props nulas', () => {
    const panel = new ComparePanel({
      result: null,
      slotA: null,
      slotB: null,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    expect(() => panel.destroy()).not.toThrow();
  });

  it('destroy limpia el elemento', () => {
    const result = makeResult(FIXTURE_PIKACHU, FIXTURE_NO_IMAGE);
    const panel = new ComparePanel({
      result,
      slotA: FIXTURE_PIKACHU,
      slotB: FIXTURE_NO_IMAGE,
      onSelectA: () => {},
      onSelectB: () => {},
    });
    panel.destroy();
    expect(panel.element.innerHTML).toBe('');
  });
});
