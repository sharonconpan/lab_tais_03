/**
 * HU06-02 — Pruebas unitarias: compareStats (función pura)
 * RF-020: para cada stat, identifica quién tiene el valor mayor ('A' | 'B')
 * RF-021: cuando los valores son iguales → 'tie'
 *
 * Cubre:
 * - A > B en todos los stats → todos 'A'
 * - B > A en todos los stats → todos 'B'
 * - Empate total (misma criatura) → todos 'tie'
 * - Simetría: compareStats(a, b) es el inverso de compareStats(b, a) para no empatados
 * - Todos los 6 nombres de stat están presentes en el resultado
 * - Stats mixtos (algunos A, algunos B, algunos tie)
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { compareStats } from '../../src/application/compareStats';
import type { PokemonDetail, BaseStat } from '../../src/domain/types';

// ------------------------------------------------------------------ //
// Factories                                                            //
// ------------------------------------------------------------------ //

/** Construye un PokemonDetail mínimo con stats personalizados */
function makeDetail(id: number, statsValues: number[]): PokemonDetail {
  const names: BaseStat['name'][] = [
    'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'
  ];
  const labels: BaseStat['label'][] = [
    'PS', 'Ataque', 'Defensa', 'Ataque Esp.', 'Defensa Esp.', 'Velocidad'
  ];
  return {
    id,
    name: `creature-${id}`,
    displayName: `Creature ${id}`,
    imageUrl: null,
    types: ['normal'],
    heightDm: 10,
    weightHg: 100,
    abilities: [],
    stats: names.map((name, i) => ({
      name,
      label: labels[i],
      value: statsValues[i] ?? 50,
    })),
  };
}

const STAT_NAMES: BaseStat['name'][] = [
  'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'
];

// ------------------------------------------------------------------ //
// Resultado contiene todos los stats                                   //
// ------------------------------------------------------------------ //
describe('compareStats — estructura del resultado', () => {
  it('devuelve un objeto con las 6 claves de stat', () => {
    const a = makeDetail(1, [35, 55, 40, 50, 50, 90]);
    const b = makeDetail(2, [115, 45, 20, 45, 25, 20]);
    const result = compareStats(a, b);

    for (const name of STAT_NAMES) {
      expect(result).toHaveProperty(name);
    }
  });

  it('todos los valores son "A", "B" o "tie"', () => {
    const a = makeDetail(1, [35, 55, 40, 50, 50, 90]);
    const b = makeDetail(2, [115, 45, 20, 45, 25, 20]);
    const result = compareStats(a, b);

    for (const val of Object.values(result)) {
      expect(['A', 'B', 'tie']).toContain(val);
    }
  });
});

// ------------------------------------------------------------------ //
// A > B en todos los stats                                             //
// ------------------------------------------------------------------ //
describe('compareStats — A domina en todos los stats', () => {
  it('todos los resultados son "A" cuando A tiene stats mayores', () => {
    const a = makeDetail(1, [100, 100, 100, 100, 100, 100]);
    const b = makeDetail(2, [10, 10, 10, 10, 10, 10]);
    const result = compareStats(a, b);

    for (const name of STAT_NAMES) {
      expect(result[name]).toBe('A');
    }
  });
});

// ------------------------------------------------------------------ //
// B > A en todos los stats                                             //
// ------------------------------------------------------------------ //
describe('compareStats — B domina en todos los stats', () => {
  it('todos los resultados son "B" cuando B tiene stats mayores', () => {
    const a = makeDetail(1, [10, 10, 10, 10, 10, 10]);
    const b = makeDetail(2, [100, 100, 100, 100, 100, 100]);
    const result = compareStats(a, b);

    for (const name of STAT_NAMES) {
      expect(result[name]).toBe('B');
    }
  });
});

// ------------------------------------------------------------------ //
// Empate total (misma criatura consigo misma)                          //
// ------------------------------------------------------------------ //
describe('compareStats — Empate total', () => {
  it('todos los resultados son "tie" al comparar una criatura consigo misma', () => {
    const a = makeDetail(25, [35, 55, 40, 50, 50, 90]);
    const result = compareStats(a, a);

    for (const name of STAT_NAMES) {
      expect(result[name]).toBe('tie');
    }
  });

  it('todos son "tie" cuando ambas criaturas tienen exactamente los mismos valores', () => {
    const a = makeDetail(1, [50, 50, 50, 50, 50, 50]);
    const b = makeDetail(2, [50, 50, 50, 50, 50, 50]);
    const result = compareStats(a, b);

    for (const name of STAT_NAMES) {
      expect(result[name]).toBe('tie');
    }
  });
});

// ------------------------------------------------------------------ //
// Stats mixtos                                                         //
// ------------------------------------------------------------------ //
describe('compareStats — Stats mixtos', () => {
  it('Pikachu vs Jigglypuff: hp→B, attack→A, defense→A, special-attack→A, special-defense→A, speed→A', () => {
    // Pikachu:    hp=35,  atk=55, def=40, spa=50, spd=50, spe=90
    // Jigglypuff: hp=115, atk=45, def=20, spa=45, spd=25, spe=20
    const pikachu = makeDetail(25, [35, 55, 40, 50, 50, 90]);
    const jigglypuff = makeDetail(39, [115, 45, 20, 45, 25, 20]);
    const result = compareStats(pikachu, jigglypuff);

    expect(result['hp']).toBe('B');               // 35 < 115
    expect(result['attack']).toBe('A');            // 55 > 45
    expect(result['defense']).toBe('A');           // 40 > 20
    expect(result['special-attack']).toBe('A');    // 50 > 45
    expect(result['special-defense']).toBe('A');   // 50 > 25 → A gana
    expect(result['speed']).toBe('A');             // 90 > 20
  });

  it('stat individual: A mayor → "A"', () => {
    const a = makeDetail(1, [100, 10, 10, 10, 10, 10]);
    const b = makeDetail(2, [50, 10, 10, 10, 10, 10]);
    expect(compareStats(a, b)['hp']).toBe('A');
  });

  it('stat individual: B mayor → "B"', () => {
    const a = makeDetail(1, [10, 10, 10, 10, 10, 10]);
    const b = makeDetail(2, [10, 100, 10, 10, 10, 10]);
    expect(compareStats(a, b)['attack']).toBe('B');
  });

  it('stat individual: iguales → "tie"', () => {
    const a = makeDetail(1, [10, 10, 75, 10, 10, 10]);
    const b = makeDetail(2, [10, 10, 75, 10, 10, 10]);
    expect(compareStats(a, b)['defense']).toBe('tie');
  });
});

// ------------------------------------------------------------------ //
// Simetría: compareStats(a,b) es el inverso de compareStats(b,a)      //
// ------------------------------------------------------------------ //
describe('compareStats — Simetría', () => {
  it('si a→b da "A", entonces b→a da "B" para ese stat', () => {
    const a = makeDetail(1, [100, 100, 100, 100, 100, 100]);
    const b = makeDetail(2, [10, 10, 10, 10, 10, 10]);

    const ab = compareStats(a, b);
    const ba = compareStats(b, a);

    for (const name of STAT_NAMES) {
      if (ab[name] === 'A') expect(ba[name]).toBe('B');
      if (ab[name] === 'B') expect(ba[name]).toBe('A');
      if (ab[name] === 'tie') expect(ba[name]).toBe('tie');
    }
  });

  it('simetría con stats mixtos (pikachu vs jigglypuff y viceversa)', () => {
    const a = makeDetail(25, [35, 55, 40, 50, 50, 90]);
    const b = makeDetail(39, [115, 45, 20, 45, 25, 20]);

    const ab = compareStats(a, b);
    const ba = compareStats(b, a);

    for (const name of STAT_NAMES) {
      if (ab[name] === 'A') expect(ba[name]).toBe('B');
      if (ab[name] === 'B') expect(ba[name]).toBe('A');
      if (ab[name] === 'tie') expect(ba[name]).toBe('tie');
    }
  });
});

// ------------------------------------------------------------------ //
// Propiedades con fast-check                                           //
// ------------------------------------------------------------------ //
describe('compareStats — Propiedades (fast-check)', () => {
  it('FC: si todos los stats de A son estrictamente mayores, todos los resultados son "A"', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 50, max: 255 }),
          fc.integer({ min: 50, max: 255 }),
          fc.integer({ min: 50, max: 255 }),
          fc.integer({ min: 50, max: 255 }),
          fc.integer({ min: 50, max: 255 }),
          fc.integer({ min: 50, max: 255 }),
        ),
        fc.tuple(
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 1, max: 49 }),
          fc.integer({ min: 1, max: 49 }),
        ),
        (statsA, statsB) => {
          const a = makeDetail(1, [...statsA]);
          const b = makeDetail(2, [...statsB]);
          const result = compareStats(a, b);
          return STAT_NAMES.every((name) => result[name] === 'A');
        }
      )
    );
  });

  it('FC: si todos los stats son iguales, todos los resultados son "tie"', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
        ),
        (stats) => {
          const a = makeDetail(1, [...stats]);
          const b = makeDetail(2, [...stats]);
          const result = compareStats(a, b);
          return STAT_NAMES.every((name) => result[name] === 'tie');
        }
      )
    );
  });

  it('FC: simetría — compareStats(a,b) siempre es el inverso de compareStats(b,a)', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
        ),
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 1, max: 255 }),
        ),
        (statsA, statsB) => {
          const a = makeDetail(1, [...statsA]);
          const b = makeDetail(2, [...statsB]);
          const ab = compareStats(a, b);
          const ba = compareStats(b, a);
          return STAT_NAMES.every((name) => {
            if (ab[name] === 'A') return ba[name] === 'B';
            if (ab[name] === 'B') return ba[name] === 'A';
            return ba[name] === 'tie'; // tie → tie
          });
        }
      )
    );
  });
});
