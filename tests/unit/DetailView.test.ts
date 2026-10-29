/**
 * HU03-02 — Pruebas unitarias: DetailView
 * RF-003, RF-012, RF-013
 */
import { describe, it, expect, vi } from 'vitest';
import { DetailView } from '../../src/presentation/DetailView';
import { FIXTURE_PIKACHU, FIXTURE_NO_IMAGE } from '../mocks/MockPokeApiClient';
import type { PokemonDetail } from '../../src/domain/types';

// Helper
function queryText(el: HTMLElement, text: string): boolean {
  return el.textContent?.includes(text) ?? false;
}

describe('DetailView', () => {
  // ------------------------------------------------------------------ //
  // Campos obligatorios (RF-012)                                         //
  // ------------------------------------------------------------------ //
  it('muestra el número nacional', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, '25')).toBe(true);
  });

  it('muestra el nombre de la criatura', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, 'Pikachu')).toBe(true);
  });

  it('muestra el tipo de la criatura', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, 'electric')).toBe(true);
  });

  it('muestra todos los tipos cuando hay más de uno', () => {
    const view = new DetailView({ detail: FIXTURE_NO_IMAGE, onBack: () => {} });
    expect(queryText(view.element, 'normal')).toBe(true);
    expect(queryText(view.element, 'fairy')).toBe(true);
  });

  it('muestra la altura', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, '4')).toBe(true);
  });

  it('muestra el peso', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, '60')).toBe(true);
  });

  it('muestra las habilidades', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, 'static')).toBe(true);
    expect(queryText(view.element, 'lightning-rod')).toBe(true);
  });

  it('muestra las 6 etiquetas de estadística en español', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, 'PS')).toBe(true);
    expect(queryText(view.element, 'Ataque')).toBe(true);
    expect(queryText(view.element, 'Defensa')).toBe(true);
    expect(queryText(view.element, 'Ataque Esp.')).toBe(true);
    expect(queryText(view.element, 'Defensa Esp.')).toBe(true);
    expect(queryText(view.element, 'Velocidad')).toBe(true);
  });

  it('muestra los valores numéricos de las stats', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, '35')).toBe(true); // PS
    expect(queryText(view.element, '55')).toBe(true); // Ataque
    expect(queryText(view.element, '90')).toBe(true); // Velocidad
  });

  // ------------------------------------------------------------------ //
  // Imagen y alt accesible (RF-012)                                      //
  // ------------------------------------------------------------------ //
  it('imagen tiene atributo alt con el nombre de la criatura', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    const img = view.element.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('alt')).toBe('Pikachu');
    expect(img!.getAttribute('src')).toBe(FIXTURE_PIKACHU.imageUrl);
  });

  // ------------------------------------------------------------------ //
  // Placeholder cuando imageUrl es null (RF-003)                         //
  // ------------------------------------------------------------------ //
  it('muestra placeholder cuando imageUrl es null', () => {
    const view = new DetailView({ detail: FIXTURE_NO_IMAGE, onBack: () => {} });
    const img = view.element.querySelector('img');
    if (img) {
      expect(img.getAttribute('src')).not.toBe('');
      expect(img.getAttribute('src')).not.toBe('null');
    } else {
      const placeholder =
        view.element.querySelector('[data-placeholder]') ?? view.element.querySelector('svg');
      expect(placeholder).not.toBeNull();
    }
  });

  it('número y nombre siguen visibles cuando imageUrl es null', () => {
    const view = new DetailView({ detail: FIXTURE_NO_IMAGE, onBack: () => {} });
    expect(queryText(view.element, '39')).toBe(true);
    expect(queryText(view.element, 'Jigglypuff')).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Botón Volver (RF-013)                                                //
  // ------------------------------------------------------------------ //
  it('tiene botón Volver en español', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    const btn = Array.from(view.element.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('volver')
    );
    expect(btn).not.toBeUndefined();
  });

  it('onBack se invoca al hacer clic en Volver', () => {
    const spy = vi.fn();
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: spy });
    const btn = Array.from(view.element.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('volver')
    )!;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // ------------------------------------------------------------------ //
  // update — re-renderiza con nuevos datos                               //
  // ------------------------------------------------------------------ //
  it('update reemplaza el contenido con la nueva criatura', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(queryText(view.element, 'Pikachu')).toBe(true);

    view.update({ detail: FIXTURE_NO_IMAGE, onBack: () => {} });
    expect(queryText(view.element, 'Jigglypuff')).toBe(true);
    expect(queryText(view.element, 'Pikachu')).toBe(false);
  });

  it('update reemplaza el callback onBack', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: spy1 });

    view.update({ detail: FIXTURE_PIKACHU, onBack: spy2 });

    const btn = Array.from(view.element.querySelectorAll('button')).find((b) =>
      b.textContent?.toLowerCase().includes('volver')
    )!;
    btn.click();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy1).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------------ //
  // Accesibilidad — etiquetas semánticas                                 //
  // ------------------------------------------------------------------ //
  it('el elemento raíz es un article', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(view.element.tagName.toLowerCase()).toBe('article');
  });

  it('el nombre está en un h2', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    const h2 = view.element.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2!.textContent).toContain('Pikachu');
  });

  // ------------------------------------------------------------------ //
  // destroy                                                              //
  // ------------------------------------------------------------------ //
  it('destroy no lanza errores', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });
    expect(() => view.destroy()).not.toThrow();
  });

  // ------------------------------------------------------------------ //
  // Fixture de pikachu completo — cobertura total de campos (RF-012)    //
  // ------------------------------------------------------------------ //
  it('todos los campos de FIXTURE_PIKACHU están presentes en el DOM', () => {
    const view = new DetailView({ detail: FIXTURE_PIKACHU, onBack: () => {} });

    // id, displayName, types, height, weight, abilities, stats
    expect(queryText(view.element, String(FIXTURE_PIKACHU.id))).toBe(true);
    expect(queryText(view.element, FIXTURE_PIKACHU.displayName)).toBe(true);
    for (const type of FIXTURE_PIKACHU.types) {
      expect(queryText(view.element, type)).toBe(true);
    }
    expect(queryText(view.element, String(FIXTURE_PIKACHU.heightDm))).toBe(true);
    expect(queryText(view.element, String(FIXTURE_PIKACHU.weightHg))).toBe(true);
    for (const ability of FIXTURE_PIKACHU.abilities) {
      expect(queryText(view.element, ability.name)).toBe(true);
    }
    for (const stat of FIXTURE_PIKACHU.stats) {
      expect(queryText(view.element, stat.label)).toBe(true);
      expect(queryText(view.element, String(stat.value))).toBe(true);
    }
  });

  // ------------------------------------------------------------------ //
  // Criatura con stats personalizadas — no depende de fixture           //
  // ------------------------------------------------------------------ //
  it('renderiza correctamente una criatura con stats propias', () => {
    const custom: PokemonDetail = {
      id: 999,
      name: 'testmon',
      displayName: 'Testmon',
      imageUrl: null,
      types: ['fire', 'water'],
      heightDm: 10,
      weightHg: 100,
      abilities: [{ name: 'blaze', isHidden: false }],
      stats: [
        { name: 'hp', label: 'PS', value: 100 },
        { name: 'attack', label: 'Ataque', value: 80 },
        { name: 'defense', label: 'Defensa', value: 70 },
        { name: 'special-attack', label: 'Ataque Esp.', value: 90 },
        { name: 'special-defense', label: 'Defensa Esp.', value: 60 },
        { name: 'speed', label: 'Velocidad', value: 50 },
      ],
    };
    const view = new DetailView({ detail: custom, onBack: () => {} });
    expect(queryText(view.element, 'Testmon')).toBe(true);
    expect(queryText(view.element, 'fire')).toBe(true);
    expect(queryText(view.element, '100')).toBe(true); // PS value
    expect(queryText(view.element, 'blaze')).toBe(true);
  });
});
