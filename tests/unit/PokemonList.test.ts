/**
 * HU01-05 — Pruebas unitarias: PokemonList
 * RF-001, RF-007, RF-016
 */
import { describe, it, expect, vi } from 'vitest';
import { PokemonList } from '../../src/presentation/PokemonList';
import type { PokemonEntry } from '../../src/domain/types';

const ENTRIES: PokemonEntry[] = [
  { id: 1, name: 'bulbasaur', displayName: 'Bulbasaur', imageUrl: 'https://img/1.png' },
  { id: 4, name: 'charmander', displayName: 'Charmander', imageUrl: 'https://img/4.png' },
  { id: 25, name: 'pikachu', displayName: 'Pikachu', imageUrl: 'https://img/25.png' },
];

describe('PokemonList', () => {
  it('con items vacíos muestra mensaje de estado vacío', () => {
    const list = new PokemonList({ items: [], onSelect: () => {} });
    const empty = list.element.querySelector('[data-empty]');
    expect(empty).not.toBeNull();
    expect(empty?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('con items vacíos no renderiza tarjetas', () => {
    const list = new PokemonList({ items: [], onSelect: () => {} });
    const cards = list.element.querySelectorAll('[data-pokemon-id]');
    expect(cards.length).toBe(0);
  });

  it('con items renderiza una tarjeta por entrada', () => {
    const list = new PokemonList({ items: ENTRIES, onSelect: () => {} });
    const cards = list.element.querySelectorAll('[data-pokemon-id]');
    expect(cards.length).toBe(ENTRIES.length);
  });

  it('cada tarjeta muestra el id correcto', () => {
    const list = new PokemonList({ items: ENTRIES, onSelect: () => {} });
    const ids = Array.from(list.element.querySelectorAll('[data-pokemon-id]')).map((el) =>
      el.getAttribute('data-pokemon-id')
    );
    expect(ids).toContain('1');
    expect(ids).toContain('4');
    expect(ids).toContain('25');
  });

  it('onSelect se invoca con el id al hacer clic en una tarjeta', () => {
    const spy = vi.fn();
    const list = new PokemonList({ items: ENTRIES, onSelect: spy });
    const firstCard = list.element.querySelector('[data-pokemon-id="1"]') as HTMLElement;
    firstCard.click();
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('update con lista vacía muestra estado vacío', () => {
    const list = new PokemonList({ items: ENTRIES, onSelect: () => {} });
    list.update({ items: [], onSelect: () => {} });
    const empty = list.element.querySelector('[data-empty]');
    expect(empty).not.toBeNull();
    const cards = list.element.querySelectorAll('[data-pokemon-id]');
    expect(cards.length).toBe(0);
  });

  it('update reemplaza tarjetas anteriores', () => {
    const list = new PokemonList({ items: ENTRIES, onSelect: () => {} });
    const newEntries: PokemonEntry[] = [
      { id: 7, name: 'squirtle', displayName: 'Squirtle', imageUrl: 'https://img/7.png' },
    ];
    list.update({ items: newEntries, onSelect: () => {} });
    const cards = list.element.querySelectorAll('[data-pokemon-id]');
    expect(cards.length).toBe(1);
    expect(cards[0].getAttribute('data-pokemon-id')).toBe('7');
  });

  it('destroy no lanza errores', () => {
    const list = new PokemonList({ items: ENTRIES, onSelect: () => {} });
    expect(() => list.destroy()).not.toThrow();
  });
});
