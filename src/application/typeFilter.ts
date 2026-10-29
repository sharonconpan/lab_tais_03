/**
 * HU04-02 — Lógica pura: filtro OR por tipos
 * RF-014: un tipo seleccionado → solo criaturas de ese tipo
 * RF-015: dos tipos seleccionados → unión (OR) de los dos conjuntos,
 *         luego intersectado con el índice base (que puede ya ser el resultado
 *         de una búsqueda por nombre).
 *
 * Función pura — sin efectos secundarios ni dependencias externas.
 *
 * @param index       Conjunto base de criaturas a filtrar. Puede ser el índice
 *                    completo o el resultado de una búsqueda previa por nombre.
 * @param typeEntries Map<PokemonType, Set<string>> donde cada Set contiene los
 *                    nombres (name) de las criaturas que pertenecen a ese tipo.
 *                    La clave son los tipos seleccionados por el usuario.
 * @returns           Subconjunto de `index` cuyo `name` esté en la unión de
 *                    los sets de los tipos seleccionados. Sin duplicados.
 *                    Si el Map está vacío, devuelve el `index` sin modificar.
 */
import type { PokemonEntry, PokemonType } from '../domain/types';

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
