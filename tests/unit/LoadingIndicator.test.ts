/**
 * HU01-02 — Pruebas unitarias: LoadingIndicator
 * RF-023
 */
import { describe, it, expect } from 'vitest';
import { LoadingIndicator } from '../../src/presentation/LoadingIndicator';

describe('LoadingIndicator', () => {
  it('cuando visible=true tiene role=status', () => {
    const comp = new LoadingIndicator({ visible: true });
    expect(comp.element.getAttribute('role')).toBe('status');
  });

  it('cuando visible=true tiene aria-live=polite', () => {
    const comp = new LoadingIndicator({ visible: true });
    expect(comp.element.getAttribute('aria-live')).toBe('polite');
  });

  it('cuando visible=true muestra texto en español no vacío', () => {
    const comp = new LoadingIndicator({ visible: true });
    expect(comp.element.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('cuando visible=false tiene aria-hidden=true', () => {
    const comp = new LoadingIndicator({ visible: false });
    expect(comp.element.getAttribute('aria-hidden')).toBe('true');
  });

  it('cuando visible=false no muestra texto visible', () => {
    const comp = new LoadingIndicator({ visible: false });
    expect(comp.element.textContent?.trim()).toBe('');
  });

  it('update cambia de oculto a visible correctamente', () => {
    const comp = new LoadingIndicator({ visible: false });
    expect(comp.element.getAttribute('aria-hidden')).toBe('true');

    comp.update({ visible: true });
    expect(comp.element.getAttribute('aria-hidden')).toBeNull();
    expect(comp.element.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('update cambia de visible a oculto correctamente', () => {
    const comp = new LoadingIndicator({ visible: true });
    expect(comp.element.textContent?.trim().length).toBeGreaterThan(0);

    comp.update({ visible: false });
    expect(comp.element.getAttribute('aria-hidden')).toBe('true');
    expect(comp.element.textContent?.trim()).toBe('');
  });

  it('destroy no lanza errores', () => {
    const comp = new LoadingIndicator({ visible: true });
    expect(() => comp.destroy()).not.toThrow();
  });
});
