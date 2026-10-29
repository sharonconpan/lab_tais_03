/**
 * HU02-03 — Pruebas unitarias: filterIndex
 * RF-004, RF-005, RF-006, RF-010
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { filterIndex } from '../../src/application/searchFilter';
import type { PokemonEntry } from '../../src/domain/types';

const INDEX: PokemonEntry[] = [
  { id: 1, name: 'bulbasaur', displayName: 'Bulbasaur', imageUrl: 'https://img/1.png' },
  { id: 4, name: 'charmander', displayName: 'Charmander', imageUrl: 'https://img/4.png' },
  { id: 7, name: 'squirtle', displayName: 'Squirtle', imageUrl: 'https://img/7.png' },
  { id: 25, name: 'pikachu', displayName: 'Pikachu', imageUrl: 'https://img/25.png' },
  { id: 39, name: 'jigglypuff', displayName: 'Jigglypuff', imageUrl: null },
  { id: 83, name: "farfetch'd", displayName: "Farfetch'd", imageUrl: null },
  { id: 122, name: 'mr-mime', displayName: 'Mr. Mime', imageUrl: null },
];

describe('filterIndex', () => {
  // ------------------------------------------------------------------ //
  // Búsqueda por número exacto — RF-005                                 //
  // ------------------------------------------------------------------ //
  it('número "25" devuelve solo pikachu', () => {
    const result = filterIndex(INDEX, '25');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(25);
  });

  it('número "1" devuelve solo bulbasaur', () => {
    const result = filterIndex(INDEX, '1');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // Número inexistente — RF-010                                          //
  // ------------------------------------------------------------------ //
  it('número inexistente "99999" devuelve array vacío', () => {
    const result = filterIndex(INDEX, '99999');
    expect(result).toHaveLength(0);
  });

  // ------------------------------------------------------------------ //
  // Búsqueda por nombre exacto — RF-004                                  //
  // ------------------------------------------------------------------ //
  it('nombre exacto "pikachu" devuelve pikachu', () => {
    const result = filterIndex(INDEX, 'pikachu');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(25);
  });

  // ------------------------------------------------------------------ //
  // Sin distinción de mayúsculas — RF-004                               //
  // ------------------------------------------------------------------ //
  it('"PIKACHU" en mayúsculas encuentra pikachu', () => {
    const result = filterIndex(INDEX, 'PIKACHU');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(25);
  });

  it('"Pikachu" en PascalCase encuentra pikachu', () => {
    const result = filterIndex(INDEX, 'Pikachu');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(25);
  });

  // ------------------------------------------------------------------ //
  // Búsqueda por nombre parcial — RF-004                                 //
  // ------------------------------------------------------------------ //
  it('nombre parcial "chu" encuentra pikachu', () => {
    const result = filterIndex(INDEX, 'chu');
    expect(result.some((e) => e.id === 25)).toBe(true);
  });

  it('nombre parcial "saur" encuentra bulbasaur', () => {
    const result = filterIndex(INDEX, 'saur');
    expect(result.some((e) => e.id === 1)).toBe(true);
  });

  it('nombre parcial que coincide con varias criaturas devuelve todas', () => {
    // "saur" coincide con bulbasaur y charmander no, pero con squirtle no
    // "a" coincide con bulbasaur, charmander, pikachu, jigglypuff…
    const result = filterIndex(INDEX, 'a');
    expect(result.length).toBeGreaterThan(1);
  });

  // ------------------------------------------------------------------ //
  // Espacios sobrantes — RF-004                                          //
  // ------------------------------------------------------------------ //
  it('" pikachu " con espacios sobrantes encuentra pikachu', () => {
    const result = filterIndex(INDEX, '  pikachu  ');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(25);
  });

  // ------------------------------------------------------------------ //
  // Caracteres especiales — RF-006                                       //
  // ------------------------------------------------------------------ //
  it('"farfetch\'d" (con apóstrofo) encuentra farfetchd', () => {
    const result = filterIndex(INDEX, "farfetch'd");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(83);
  });

  it('"mr-mime" encuentra mr-mime', () => {
    const result = filterIndex(INDEX, 'mr-mime');
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(122);
  });

  it('"mr" parcial encuentra mr-mime', () => {
    const result = filterIndex(INDEX, 'mr');
    expect(result.some((e) => e.id === 122)).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Sin resultados textuales                                             //
  // ------------------------------------------------------------------ //
  it('término sin coincidencias devuelve array vacío', () => {
    const result = filterIndex(INDEX, 'zzznoencontrado');
    expect(result).toHaveLength(0);
  });

  // ------------------------------------------------------------------ //
  // Propiedades con fast-check                                           //
  // ------------------------------------------------------------------ //
  it('fast-check: el resultado es siempre un subconjunto del índice original', () => {
    const idSet = new Set(INDEX.map((e) => e.id));
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => /[a-zA-Z0-9]/.test(s)),
        (term) => {
          const result = filterIndex(INDEX, term);
          return result.every((e) => idSet.has(e.id));
        }
      )
    );
  });

  it('fast-check: búsqueda por nombre del índice siempre incluye esa criatura', () => {
    fc.assert(
      fc.property(fc.constantFrom(...INDEX), (entry) => {
        const result = filterIndex(INDEX, entry.name);
        return result.some((e) => e.id === entry.id);
      })
    );
  });

  it('fast-check: búsqueda por id siempre devuelve ≤1 resultado', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99999 }).map(String), (term) => {
        const result = filterIndex(INDEX, term);
        return result.length <= 1;
      })
    );
  });
});
