/**
 * HU02-02 — Validación del término de búsqueda
 * RF-008: campo vacío no realiza petición y muestra mensaje de validación
 * RF-009: solo símbolos no realiza petición y muestra mensaje de validación
 *
 * Función pura — sin efectos secundarios ni dependencias externas.
 */

/** Resultado de la validación del término de búsqueda */
export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: 'empty' }
  | { valid: false; reason: 'only-symbols' };

/**
 * Valida que el término de búsqueda sea apto para realizar una consulta.
 *
 * - Devuelve `{ valid: true }` si el término contiene al menos un carácter
 *   alfanumérico (letra o dígito), tras aplicar trim().
 * - Devuelve `{ valid: false, reason: 'empty' }` si el término está vacío
 *   o solo tiene espacios en blanco.
 * - Devuelve `{ valid: false, reason: 'only-symbols' }` si el término tiene
 *   contenido pero ningún carácter alfanumérico (e.g. "???", "###", "...").
 */
export function validateSearchTerm(term: string): ValidationResult {
  const trimmed = term.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'empty' };
  }

  // Al menos un carácter alfanumérico (letra Unicode o dígito ASCII)
  if (!/[a-zA-Z0-9\u00C0-\u024F]/.test(trimmed)) {
    return { valid: false, reason: 'only-symbols' };
  }

  return { valid: true };
}
