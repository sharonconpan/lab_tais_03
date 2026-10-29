/**
 * HU02-03 — Filtrado del índice en memoria
 * RF-004: búsqueda por nombre parcial/completo, sin distinción de mayúsculas
 * RF-005: búsqueda por número nacional exacto
 * RF-006: nombres con caracteres especiales (Mr. Mime, Farfetch'd, etc.)
 * RF-010: número inexistente → array vacío
 *
 * Función pura — sin efectos secundarios ni dependencias externas.
 */
import type { PokemonEntry } from '../domain/types';

/**
 * Normaliza un término de búsqueda para comparación:
 * minúsculas + trim. No elimina caracteres especiales para respetar RF-006.
 */
function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Normalización "fuzzy" para caracteres especiales del dominio Pokémon (RF-006).
 * Convierte puntos, apóstrofos, espacios y guiones a un único separador ("-")
 * para que "mr. mime" encuentre "mr-mime" y "farfetch'd" encuentre "farfetch'd".
 */
function normalizeSpecial(s: string): string {
  return normalize(s)
    .replace(/[.\s']+/g, '-')  // punto, espacio, apóstrofo → guión
    .replace(/-+/g, '-')       // guiones múltiples → uno
    .replace(/^-|-$/g, '');    // quitar guiones extremos
}

/**
 * Filtra el índice de criaturas según el término de búsqueda.
 *
 * - Si el término es un entero positivo (e.g. "25"), busca coincidencia
 *   exacta por `id` (RF-005). Si no hay coincidencia, devuelve [] (RF-010).
 * - Si el término es texto, devuelve todas las entradas cuyo `name`
 *   contenga el término normalizado como subcadena (RF-004, RF-006).
 *   Se realiza una doble comparación:
 *     1. Comparación directa normalizada (minúsculas + trim).
 *     2. Comparación con normalización especial (puntos/espacios/apóstrofos
 *        equivalen a guiones) para cubrir casos como "Mr. Mime" → "mr-mime".
 *
 * El término se recibe ya validado (no vacío, no solo símbolos).
 */
export function filterIndex(
  index: PokemonEntry[],
  term: string
): PokemonEntry[] {
  const normalized = normalize(term);

  // Detectar búsqueda numérica: solo dígitos tras el trim
  if (/^\d+$/.test(normalized)) {
    const id = parseInt(normalized, 10);
    return index.filter((e) => e.id === id);
  }

  const normalizedSpecial = normalizeSpecial(term);

  // Búsqueda textual: subcadena en name normalizado (directo o especial)
  return index.filter((e) => {
    const eName         = normalize(e.name);
    const eNameSpecial  = normalizeSpecial(e.name);
    return eName.includes(normalized) ||
           eNameSpecial.includes(normalizedSpecial) ||
           eName.includes(normalizedSpecial) ||
           eNameSpecial.includes(normalized);
  });
}
