/**
 * HU05-02 — Pruebas unitarias: AbilityDetail (componente)
 * RF-018: muestra nombre y descripción
 * RF-019: nota de idioma solo cuando descriptionLanguage === 'en'
 */
import { describe, it, expect, vi } from 'vitest';
import { AbilityDetail } from '../../src/presentation/AbilityDetail';
import {
  FIXTURE_ABILITY_ES,
  FIXTURE_ABILITY_EN_ONLY,
} from '../mocks/MockPokeApiClient';

// ------------------------------------------------------------------ //
// Renderizado con descripción en español (RF-018)                      //
// ------------------------------------------------------------------ //
describe('AbilityDetail — descripción en español', () => {
  it('muestra el displayName de la habilidad', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.textContent).toContain(FIXTURE_ABILITY_ES.displayName);
  });

  it('muestra la descripción', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.textContent).toContain(FIXTURE_ABILITY_ES.description);
  });

  it('NO muestra la nota cuando el idioma es "es" (RF-019)', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.textContent).not.toContain('no disponible en español');
    expect(view.element.querySelector('[data-lang-note]')).toBeNull();
  });

  it('tiene botón Cerrar', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    const btn = Array.from(view.element.querySelectorAll('button')).find(
      (b) => b.textContent?.toLowerCase().includes('cerrar')
    );
    expect(btn).not.toBeUndefined();
  });

  it('onClose se invoca al hacer clic en Cerrar', () => {
    const spy = vi.fn();
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: spy });
    const btn = Array.from(view.element.querySelectorAll('button')).find(
      (b) => b.textContent?.toLowerCase().includes('cerrar')
    )!;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('el nombre está en un h2', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    const h2 = view.element.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2!.textContent).toBe(FIXTURE_ABILITY_ES.displayName);
  });

  it('el elemento raíz es article.ability-detail', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.tagName.toLowerCase()).toBe('article');
    expect(view.element.classList.contains('ability-detail')).toBe(true);
  });
});

// ------------------------------------------------------------------ //
// Renderizado con descripción solo en inglés (RF-019)                  //
// ------------------------------------------------------------------ //
describe('AbilityDetail — descripción en inglés con nota', () => {
  it('muestra el displayName de la habilidad', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.textContent).toContain(FIXTURE_ABILITY_EN_ONLY.displayName);
  });

  it('muestra la descripción en inglés', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.textContent).toContain(FIXTURE_ABILITY_EN_ONLY.description);
  });

  it('muestra la nota de idioma cuando descriptionLanguage === "en" (RF-019)', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.textContent).toContain('no disponible en español');
  });

  it('la nota tiene data-lang-note', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.querySelector('[data-lang-note]')).not.toBeNull();
  });
});

// ------------------------------------------------------------------ //
// update                                                               //
// ------------------------------------------------------------------ //
describe('AbilityDetail — update', () => {
  it('update re-renderiza con nueva habilidad', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.textContent).toContain(FIXTURE_ABILITY_ES.displayName);

    view.update({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.textContent).toContain(FIXTURE_ABILITY_EN_ONLY.displayName);
    expect(view.element.textContent).not.toContain(FIXTURE_ABILITY_ES.displayName);
  });

  it('update: de "es" a "en" aparece la nota', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.querySelector('[data-lang-note]')).toBeNull();

    view.update({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.querySelector('[data-lang-note]')).not.toBeNull();
  });

  it('update: de "en" a "es" desaparece la nota', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_EN_ONLY, onClose: () => {} });
    expect(view.element.querySelector('[data-lang-note]')).not.toBeNull();

    view.update({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(view.element.querySelector('[data-lang-note]')).toBeNull();
  });

  it('update reemplaza el callback onClose', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: spy1 });

    view.update({ detail: FIXTURE_ABILITY_ES, onClose: spy2 });
    const btn = Array.from(view.element.querySelectorAll('button')).find(
      (b) => b.textContent?.toLowerCase().includes('cerrar')
    )!;
    btn.click();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy1).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------ //
// destroy                                                              //
// ------------------------------------------------------------------ //
describe('AbilityDetail — destroy', () => {
  it('destroy no lanza errores', () => {
    const view = new AbilityDetail({ detail: FIXTURE_ABILITY_ES, onClose: () => {} });
    expect(() => view.destroy()).not.toThrow();
  });
});
