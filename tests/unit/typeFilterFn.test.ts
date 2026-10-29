/**
 * HU04-02 — Pruebas unitarias: applyTypeFilter (función pura)
 * RF-014: filtro por un tipo → subconjunto correcto
 * RF-015: filtro OR por dos tipos → unión sin duplicados
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { applyTypeFilter } from '../../src/application/typeFilter';
import { FIXTURE_INDEX } from '../mocks/MockPokeApiClient';
import type { PokemonEntry, PokemonType } from '../../src/domain/types';

function makeTypeMap(entries: [PokemonType, string[]][]): Map<PokemonType, Set<string>> {
  return new Map(entries.map(([type, names]) => [type, new Set(names)]));
}

describe('applyTypeFilter', () => {
  it('map vacío → devuelve el índice completo sin modificar', () => {
    expect(applyTypeFilter(FIXTURE_INDEX, new Map())).toEqual(FIXTURE_INDEX);
  });

  it('un tipo: devuelve solo las criaturas de ese tipo', () => {
    const result = applyTypeFilter(FIXTURE_INDEX, makeTypeMap([['electric', ['pikachu']]]));
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('pikachu');
  });

  it('un tipo: criaturas ajenas al tipo no aparecen', () => {
    const result = applyTypeFilter(FIXTURE_INDEX, makeTypeMap([['fire', ['charmander']]]));
    expect(result.some((e) => e.name === 'pikachu')).toBe(false);
    expect(result.some((e) => e.name === 'bulbasaur')).toBe(false);
  });

  it('tipo sin criaturas en el índice → array vacío', () => {
    expect(applyTypeFilter(FIXTURE_INDEX, makeTypeMap([['ghost', ['gengar']]]))).toEqual([]);
  });

  it('dos tipos OR: unión de ambos conjuntos', () => {
    const result = applyTypeFilter(
      FIXTURE_INDEX,
      makeTypeMap([
        ['electric', ['pikachu']],
        ['normal', ['jigglypuff']],
      ])
    );
    expect(result.some((e) => e.name === 'pikachu')).toBe(true);
    expect(result.some((e) => e.name === 'jigglypuff')).toBe(true);
  });

  it('dos tipos que comparten una criatura: sin duplicados', () => {
    const result = applyTypeFilter(
      FIXTURE_INDEX,
      makeTypeMap([
        ['normal', ['jigglypuff']],
        ['fairy', ['jigglypuff']],
      ])
    );
    expect(result.filter((e) => e.name === 'jigglypuff').length).toBe(1);
  });

  it('índice restringido + tipo fuera del subconjunto → vacío', () => {
    const subset: PokemonEntry[] = [
      { id: 1, name: 'bulbasaur', displayName: 'Bulbasaur', imageUrl: null },
    ];
    expect(applyTypeFilter(subset, makeTypeMap([['electric', ['pikachu']]]))).toEqual([]);
  });

  it('índice restringido + tipo dentro del subconjunto → la criatura', () => {
    const subset: PokemonEntry[] = [
      { id: 25, name: 'pikachu', displayName: 'Pikachu', imageUrl: 'https://img/25.png' },
      { id: 7, name: 'squirtle', displayName: 'Squirtle', imageUrl: 'https://img/7.png' },
    ];
    const result = applyTypeFilter(subset, makeTypeMap([['electric', ['pikachu']]]));
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('pikachu');
  });

  it('preserva el orden del índice base', () => {
    const result = applyTypeFilter(
      FIXTURE_INDEX,
      makeTypeMap([
        ['electric', ['pikachu']],
        ['normal', ['jigglypuff']],
      ])
    );
    expect(result.findIndex((e) => e.name === 'pikachu')).toBeLessThan(
      result.findIndex((e) => e.name === 'jigglypuff')
    );
  });

  it('fast-check: resultado siempre subconjunto del índice base', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...FIXTURE_INDEX.map((e) => e.name)), { maxLength: 5 }),
        (names) => {
          const result = applyTypeFilter(FIXTURE_INDEX, makeTypeMap([['fire', names]]));
          return result.every((e) => FIXTURE_INDEX.some((o) => o.id === e.id));
        }
      )
    );
  });

  it('fast-check: con un tipo el resultado ⊆ criaturas de ese tipo', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...FIXTURE_INDEX.map((e) => e.name)), { maxLength: 3 }),
        (names) => {
          const nameSet = new Set(names);
          const result = applyTypeFilter(
            FIXTURE_INDEX,
            new Map<PokemonType, Set<string>>([['water', nameSet]])
          );
          return result.every((e) => nameSet.has(e.name));
        }
      )
    );
  });

  it('fast-check: sin duplicados en OR de dos tipos', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...FIXTURE_INDEX.map((e) => e.name)), { maxLength: 3 }),
        fc.array(fc.constantFrom(...FIXTURE_INDEX.map((e) => e.name)), { maxLength: 3 }),
        (a, b) => {
          const result = applyTypeFilter(
            FIXTURE_INDEX,
            makeTypeMap([
              ['fire', a],
              ['water', b],
            ])
          );
          const ids = result.map((e) => e.id);
          return ids.length === new Set(ids).size;
        }
      )
    );
  });
});
