/**
 * HU01-03 — Pruebas unitarias: ErrorMessage
 * RF-024, RF-025
 */
import { describe, it, expect, vi } from 'vitest';
import { ErrorMessage } from '../../src/presentation/ErrorMessage';

describe('ErrorMessage', () => {
  it('tiene role=alert', () => {
    const comp = new ErrorMessage({ message: 'Error', retryable: true, onRetry: () => {} });
    expect(comp.element.getAttribute('role')).toBe('alert');
  });

  it('muestra el mensaje de error', () => {
    const comp = new ErrorMessage({ message: 'Sin conexión', retryable: true, onRetry: () => {} });
    expect(comp.element.textContent).toContain('Sin conexión');
  });

  it('cuando retryable=true muestra botón Reintentar', () => {
    const comp = new ErrorMessage({ message: 'Error', retryable: true, onRetry: () => {} });
    const btn = comp.element.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn?.textContent?.toLowerCase()).toContain('reintentar');
  });

  it('cuando retryable=false NO muestra botón', () => {
    const comp = new ErrorMessage({ message: 'Error', retryable: false, onRetry: () => {} });
    const btn = comp.element.querySelector('button');
    expect(btn).toBeNull();
  });

  it('onRetry se invoca al hacer clic en Reintentar', () => {
    const spy = vi.fn();
    const comp = new ErrorMessage({ message: 'Error', retryable: true, onRetry: spy });
    const btn = comp.element.querySelector('button')!;
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onRetry no se invoca si retryable=false (no hay botón)', () => {
    const spy = vi.fn();
    new ErrorMessage({ message: 'Error', retryable: false, onRetry: spy });
    // No hay botón; spy no debe ser llamado
    expect(spy).not.toHaveBeenCalled();
  });

  it('update reemplaza mensaje y botón', () => {
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    const comp = new ErrorMessage({ message: 'Error 1', retryable: true, onRetry: spy1 });

    comp.update({ message: 'Error 2', retryable: true, onRetry: spy2 });
    expect(comp.element.textContent).toContain('Error 2');
    expect(comp.element.textContent).not.toContain('Error 1');

    // El botón debe llamar al nuevo spy
    comp.element.querySelector('button')!.click();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy1).not.toHaveBeenCalled();
  });

  it('update puede quitar el botón cambiando retryable a false', () => {
    const comp = new ErrorMessage({ message: 'Error', retryable: true, onRetry: () => {} });
    expect(comp.element.querySelector('button')).not.toBeNull();

    comp.update({ message: 'Error', retryable: false, onRetry: () => {} });
    expect(comp.element.querySelector('button')).toBeNull();
  });

  it('destroy no lanza errores', () => {
    const comp = new ErrorMessage({ message: 'Error', retryable: true, onRetry: () => {} });
    expect(() => comp.destroy()).not.toThrow();
  });
});
