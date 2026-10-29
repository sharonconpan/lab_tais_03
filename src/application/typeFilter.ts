/**
 * HU04-02 — Lógica pura: filtro OR y AND por tipos
 * RF-014: un tipo seleccionado → solo criaturas de ese tipo
 * RF-015 (OR): dos tipos seleccionados → unión (OR) de los dos conjuntos,
 *         luego intersectado con el índice base.
 * RF-015 (AND): dos tipos seleccionados → intersección estricta (solo Pokémon
 *         que tengan AMBOS tipos).
 *
 * Funciones puras — sin efectos secundarios ni dependencias externas.
 */
import type { PokemonEntry, PokemonType } from '../domain/types';

/**
 * Filtro OR: devuelve criaturas que pertenezcan a AL MENOS UNO de los tipos.
 */
export function applyTypeFilter(
  index: PokemonEntry[],
  typeEntries: Map<PokemonType, Set<string>>
): PokemonEntry[] {
  // Sin tipos seleccionados → devolver el índice tal cual
  if (typeEntries.size === 0) {
    return index;
  }

  // Calcular la unión de todos los sets de nombres de los tipos seleccionados
  const unionNames = new Set<string>();
  for (const nameSet of typeEntries.values()) {
    for (const name of nameSet) {
      unionNames.add(name);
    }
  }

  // Intersectar con el índice base (preservando orden y evitando duplicados)
  return index.filter((entry) => unionNames.has(entry.name));
}

/**
 * Filtro AND: devuelve criaturas que pertenezcan a TODOS los tipos seleccionados.
 * Con un solo tipo el comportamiento es idéntico al OR.
 */
export function applyTypeFilterAnd(
  index: PokemonEntry[],
  typeEntries: Map<PokemonType, Set<string>>
): PokemonEntry[] {
  if (typeEntries.size === 0) {
    return index;
  }

  // Con un solo tipo, AND y OR son equivalentes
  if (typeEntries.size === 1) {
    return applyTypeFilter(index, typeEntries);
  }

  // Para cada entrada del índice, verificar que su nombre esté en TODOS los sets
  const sets = Array.from(typeEntries.values());
  return index.filter((entry) => sets.every((nameSet) => nameSet.has(entry.name)));
}
