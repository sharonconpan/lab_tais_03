/**
 * HU02-02 — Pruebas unitarias: validateSearchTerm
 * RF-008, RF-009
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateSearchTerm } from '../../src/application/searchValidation';

describe('validateSearchTerm', () => {
  // ------------------------------------------------------------------ //
  // Casos explícitos — campo vacío (RF-008)                             //
  // ------------------------------------------------------------------ //
  it('string vacío devuelve { valid: false, reason: "empty" }', () => {
    const result = validateSearchTerm('');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('empty');
  });

  it('solo espacios devuelve { valid: false, reason: "empty" }', () => {
    const result = validateSearchTerm('   ');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('empty');
  });

  it('solo tabulación devuelve { valid: false, reason: "empty" }', () => {
    const result = validateSearchTerm('\t\n');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('empty');
  });

  // ------------------------------------------------------------------ //
  // Casos explícitos — solo símbolos (RF-009)                           //
  // ------------------------------------------------------------------ //
  it('"???" devuelve { valid: false, reason: "only-symbols" }', () => {
    const result = validateSearchTerm('???');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('only-symbols');
  });

  it('"###" devuelve { valid: false, reason: "only-symbols" }', () => {
    const result = validateSearchTerm('###');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('only-symbols');
  });

  it('"..." devuelve { valid: false, reason: "only-symbols" }', () => {
    const result = validateSearchTerm('...');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('only-symbols');
  });

  it('"@@@!!!" devuelve { valid: false, reason: "only-symbols" }', () => {
    const result = validateSearchTerm('@@@!!!');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('only-symbols');
  });

  // ------------------------------------------------------------------ //
  // Casos explícitos — válido                                            //
  // ------------------------------------------------------------------ //
  it('"pikachu" devuelve { valid: true }', () => {
    expect(validateSearchTerm('pikachu').valid).toBe(true);
  });

  it('"25" (número) devuelve { valid: true }', () => {
    expect(validateSearchTerm('25').valid).toBe(true);
  });

  it('"Mr. Mime" (con punto y espacio) devuelve { valid: true }', () => {
    expect(validateSearchTerm('Mr. Mime').valid).toBe(true);
  });

  it("\"Farfetch'd\" (con apóstrofo) devuelve { valid: true }", () => {
    expect(validateSearchTerm("Farfetch'd").valid).toBe(true);
  });

  it('"  pikachu  " (con espacios sobrantes) devuelve { valid: true }', () => {
    expect(validateSearchTerm('  pikachu  ').valid).toBe(true);
  });

  it('"a" (un solo carácter alfanumérico) devuelve { valid: true }', () => {
    expect(validateSearchTerm('a').valid).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Propiedades con fast-check                                           //
  // ------------------------------------------------------------------ //
  it('fast-check: todo string con al menos un alfanumérico es válido', () => {
    fc.assert(
      fc.property(
        // Generar un string que contenga al menos una letra ASCII o dígito
        fc.string({ minLength: 1 }).filter((s) => /[a-zA-Z0-9]/.test(s)),
        (term) => {
          const result = validateSearchTerm(term);
          return result.valid === true;
        }
      )
    );
  });

  it('fast-check: todo string vacío o solo blancos es reason: "empty"', () => {
    fc.assert(
      fc.property(
        // Strings de solo espacios (incluyendo vacío)
        fc.array(fc.constant(' '), { maxLength: 10 }).map((arr) => arr.join('')),
        (term) => {
          const result = validateSearchTerm(term);
          return !result.valid && result.reason === 'empty';
        }
      )
    );
  });
});
