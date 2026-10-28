/**
 * HU01-04 — Pruebas unitarias: PokemonCard
 * RF-001, RF-003
 */
import { describe, it, expect, vi } from 'vitest';
import { PokemonCard } from '../../src/presentation/PokemonCard';
import type { PokemonEntry } from '../../src/domain/types';

const ENTRY_WITH_IMAGE: PokemonEntry = {
  id: 25,
  name: 'pikachu',
  displayName: 'Pikachu',
  imageUrl: 'https://img/25.png',
};

const ENTRY_NO_IMAGE: PokemonEntry = {
  id: 39,
  name: 'jigglypuff',
  displayName: 'Jigglypuff',
  imageUrl: null,
};

describe('PokemonCard', () => {
  it('tiene atributo data-pokemon-id con el id de la criatura', () => {
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: () => {} });
    expect(card.element.getAttribute('data-pokemon-id')).toBe('25');
  });

  it('muestra imagen con alt = nombre cuando imageUrl no es null', () => {
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: () => {} });
    const img = card.element.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://img/25.png');
    expect(img?.getAttribute('alt')).toBe('Pikachu');
  });

  it('muestra placeholder cuando imageUrl es null', () => {
    const card = new PokemonCard({ entry: ENTRY_NO_IMAGE, onClick: () => {} });
    const img = card.element.querySelector('img');
    // No debe haber un <img> con src de la imagen real
    if (img) {
      expect(img.getAttribute('src')).not.toContain('jigglypuff');
    }
    // Debe haber un SVG o elemento de placeholder
    const placeholder =
      card.element.querySelector('[data-placeholder]') ??
      card.element.querySelector('svg');
    expect(placeholder).not.toBeNull();
  });

  it('muestra número nacional', () => {
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: () => {} });
    expect(card.element.textContent).toContain('25');
  });

  it('muestra nombre de la criatura', () => {
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: () => {} });
    expect(card.element.textContent).toContain('Pikachu');
  });

  it('invoca onClick con el id correcto al hacer clic', () => {
    const spy = vi.fn();
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: spy });
    card.element.click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(25);
  });

  it('update cambia el contenido correctamente', () => {
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: () => {} });
    expect(card.element.textContent).toContain('Pikachu');

    card.update({ entry: ENTRY_NO_IMAGE, onClick: () => {} });
    expect(card.element.getAttribute('data-pokemon-id')).toBe('39');
    expect(card.element.textContent).toContain('Jigglypuff');
    // Ahora debe mostrar placeholder
    const placeholder =
      card.element.querySelector('[data-placeholder]') ??
      card.element.querySelector('svg');
    expect(placeholder).not.toBeNull();
  });

  it('destroy no lanza errores', () => {
    const card = new PokemonCard({ entry: ENTRY_WITH_IMAGE, onClick: () => {} });
    expect(() => card.destroy()).not.toThrow();
  });
});
