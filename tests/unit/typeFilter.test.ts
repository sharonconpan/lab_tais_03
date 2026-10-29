/**
 * HU04-03 — Pruebas unitarias: TypeFilter (componente)
 * RF-014: renderiza botón por tipo con data-type
 * RF-017: onChange llamado con lista actualizada al seleccionar/deseleccionar
 * RF-028: nota de máximo 2 tipos visible
 */
import { describe, it, expect, vi } from 'vitest';
import { TypeFilter } from '../../src/presentation/TypeFilter';
import type { PokemonType } from '../../src/domain/types';

const TYPES: PokemonType[] = ['fire', 'water', 'electric', 'normal', 'fairy'];

function getBtn(root: HTMLElement, type: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('[data-type]'))
    .find((b) => b.getAttribute('data-type') === type);
}

// ------------------------------------------------------------------ //
// Renderizado                                                          //
// ------------------------------------------------------------------ //
describe('TypeFilter — renderizado', () => {
  it('renderiza un botón por cada tipo', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    expect(tf.element.querySelectorAll('[data-type]').length).toBe(TYPES.length);
  });

  it('cada botón tiene data-type con el nombre del tipo', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    for (const t of TYPES) expect(getBtn(tf.element, t)).not.toBeUndefined();
  });

  it('el texto del botón incluye el nombre del tipo', () => {
    const tf = new TypeFilter({ types: ['electric'], selected: [], onChange: () => {} });
    expect(getBtn(tf.element, 'electric')?.textContent).toContain('electric');
  });

  it('muestra nota "2 tipos" (RF-028)', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    expect(tf.element.textContent).toContain('2 tipos');
  });

  it('la nota tiene data-type-note', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    expect(tf.element.querySelector('[data-type-note]')).not.toBeNull();
  });

  it('el grupo de botones tiene role="group"', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    expect(tf.element.querySelector('[role="group"]')).not.toBeNull();
  });

  it('el elemento raíz es div.type-filter', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    expect(tf.element.tagName.toLowerCase()).toBe('div');
    expect(tf.element.classList.contains('type-filter')).toBe(true);
  });
});

// ------------------------------------------------------------------ //
// aria-pressed inicial                                                 //
// ------------------------------------------------------------------ //
describe('TypeFilter — aria-pressed inicial', () => {
  it('tipo no seleccionado → aria-pressed="false"', () => {
    const tf = new TypeFilter({ types: ['fire'], selected: [], onChange: () => {} });
    expect(getBtn(tf.element, 'fire')?.getAttribute('aria-pressed')).toBe('false');
  });

  it('tipo seleccionado → aria-pressed="true"', () => {
    const tf = new TypeFilter({ types: ['fire'], selected: ['fire'], onChange: () => {} });
    expect(getBtn(tf.element, 'fire')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('tipo seleccionado tiene clase type-filter__btn--selected', () => {
    const tf = new TypeFilter({ types: ['electric'], selected: ['electric'], onChange: () => {} });
    expect(getBtn(tf.element, 'electric')?.classList.contains('type-filter__btn--selected')).toBe(true);
  });

  it('tipo no seleccionado no tiene clase --selected', () => {
    const tf = new TypeFilter({ types: ['electric'], selected: [], onChange: () => {} });
    expect(getBtn(tf.element, 'electric')?.classList.contains('type-filter__btn--selected')).toBe(false);
  });
});

// ------------------------------------------------------------------ //
// Interacción                                                          //
// ------------------------------------------------------------------ //
describe('TypeFilter — selección y deselección', () => {
  it('clic en tipo no seleccionado → onChange con ese tipo', () => {
    const spy = vi.fn<[PokemonType[]], void>();
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: spy });
    getBtn(tf.element, 'electric')!.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('electric');
  });

  it('clic en tipo ya seleccionado → onChange sin ese tipo', () => {
    const spy = vi.fn<[PokemonType[]], void>();
    const tf = new TypeFilter({ types: TYPES, selected: ['electric'], onChange: spy });
    getBtn(tf.element, 'electric')!.click();
    expect(spy.mock.calls[0][0]).not.toContain('electric');
  });

  it('seleccionar dos tipos en secuencia → onChange con los dos', () => {
    const received: PokemonType[][] = [];
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: (s) => received.push([...s]) });
    getBtn(tf.element, 'fire')!.click();
    getBtn(tf.element, 'water')!.click();
    const last = received[received.length - 1];
    expect(last).toContain('fire');
    expect(last).toContain('water');
  });

  it('deseleccionar uno de dos → onChange con solo el restante', () => {
    const received: PokemonType[][] = [];
    const tf = new TypeFilter({ types: TYPES, selected: ['fire', 'water'], onChange: (s) => received.push([...s]) });
    getBtn(tf.element, 'fire')!.click();
    const last = received[received.length - 1];
    expect(last).not.toContain('fire');
    expect(last).toContain('water');
  });

  it('tras seleccionar, aria-pressed se actualiza a true', () => {
    const tf = new TypeFilter({ types: ['electric'], selected: [], onChange: () => {} });
    const btn = getBtn(tf.element, 'electric')!;
    btn.click();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
  });

  it('tras deseleccionar, aria-pressed vuelve a false', () => {
    const tf = new TypeFilter({ types: ['electric'], selected: ['electric'], onChange: () => {} });
    const btn = getBtn(tf.element, 'electric')!;
    btn.click();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });
});

// ------------------------------------------------------------------ //
// update                                                               //
// ------------------------------------------------------------------ //
describe('TypeFilter — update', () => {
  it('update re-renderiza con nuevos tipos', () => {
    const tf = new TypeFilter({ types: ['fire'], selected: [], onChange: () => {} });
    tf.update({ types: ['water', 'grass'], selected: [], onChange: () => {} });
    expect(getBtn(tf.element, 'fire')).toBeUndefined();
    expect(getBtn(tf.element, 'water')).not.toBeUndefined();
  });

  it('update refleja tipos seleccionados actualizados', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    tf.update({ types: TYPES, selected: ['electric'], onChange: () => {} });
    expect(getBtn(tf.element, 'electric')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('update reemplaza el callback onChange', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const tf = new TypeFilter({ types: ['fire'], selected: [], onChange: spy1 });
    tf.update({ types: ['fire'], selected: [], onChange: spy2 });
    getBtn(tf.element, 'fire')!.click();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy1).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('TypeFilter — destroy', () => {
  it('destroy no lanza errores', () => {
    const tf = new TypeFilter({ types: TYPES, selected: [], onChange: () => {} });
    expect(() => tf.destroy()).not.toThrow();
  });
});
