/**
 * HU06-02 — Lógica pura de comparación de estadísticas
 * RF-020: para cada stat, indica cuál de las dos criaturas tiene el valor mayor
 * RF-021: cuando los valores son iguales, indica empate
 *
 * Función pura: sin efectos secundarios, sin dependencias externas.
 * Complejidad O(n) donde n = número de stats (siempre 6).
 */
import type { PokemonDetail, BaseStat, StatComparison } from '../domain/types';

/**
 * Compara las seis estadísticas base de dos criaturas.
 *
 * @param a - Ficha completa de la criatura A
 * @param b - Ficha completa de la criatura B
 * @returns Un objeto con la comparación de cada stat:
 *   - 'A'   → la criatura A tiene el valor mayor
 *   - 'B'   → la criatura B tiene el valor mayor
 *   - 'tie' → ambas tienen el mismo valor
 */
export function compareStats(
  a: PokemonDetail,
  b: PokemonDetail
): Record<BaseStat['name'], StatComparison> {
  // Indexar los stats de B por nombre para acceso O(1)
  const statMapB = new Map<BaseStat['name'], number>(
    b.stats.map((s) => [s.name, s.value])
  );

  const result = {} as Record<BaseStat['name'], StatComparison>;

  for (const statA of a.stats) {
    const valA = statA.value;
    const valB = statMapB.get(statA.name) ?? 0;

    if (valA > valB) {
      result[statA.name] = 'A';
    } else if (valB > valA) {
      result[statA.name] = 'B';
    } else {
      result[statA.name] = 'tie';
    }
  }

  return result;
}
