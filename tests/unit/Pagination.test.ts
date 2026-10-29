/**
 * HU01-06 — Pruebas unitarias: Pagination
 * RF-002
 */
import { describe, it, expect, vi } from 'vitest';
import { Pagination } from '../../src/presentation/Pagination';

describe('Pagination', () => {
  it('muestra número de página actual', () => {
    const p = new Pagination({
      params: { page: 3, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    expect(p.element.textContent).toContain('3');
  });

  it('muestra total de páginas calculado', () => {
    // 100 / 20 = 5 páginas
    const p = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    expect(p.element.textContent).toContain('5');
  });

  it('desactiva botón Anterior en página 1', () => {
    const p = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    const prevBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Anterior"]')!;
    expect(prevBtn.disabled).toBe(true);
  });

  it('activa botón Anterior en páginas > 1', () => {
    const p = new Pagination({
      params: { page: 2, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    const prevBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Anterior"]')!;
    expect(prevBtn.disabled).toBe(false);
  });

  it('desactiva botón Siguiente en última página', () => {
    // 100 / 20 = 5 páginas → última es 5
    const p = new Pagination({
      params: { page: 5, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    const nextBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Siguiente"]')!;
    expect(nextBtn.disabled).toBe(true);
  });

  it('activa botón Siguiente cuando no es última página', () => {
    const p = new Pagination({
      params: { page: 4, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    const nextBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Siguiente"]')!;
    expect(nextBtn.disabled).toBe(false);
  });

  it('onPrev se invoca al hacer clic en Anterior', () => {
    const spy = vi.fn();
    const p = new Pagination({
      params: { page: 2, pageSize: 20, total: 100 },
      onPrev: spy,
      onNext: () => {},
    });
    const prevBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Anterior"]')!;
    prevBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('onNext se invoca al hacer clic en Siguiente', () => {
    const spy = vi.fn();
    const p = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: spy,
    });
    const nextBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Siguiente"]')!;
    nextBtn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('update refleja nueva página y estado de botones', () => {
    const p = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    const prevBtn = p.element.querySelector<HTMLButtonElement>('button[aria-label="Anterior"]')!;
    expect(prevBtn.disabled).toBe(true);

    p.update({ params: { page: 3, pageSize: 20, total: 100 }, onPrev: () => {}, onNext: () => {} });
    expect(prevBtn.disabled).toBe(false);
    expect(p.element.textContent).toContain('3');
  });

  it('destroy no lanza errores', () => {
    const p = new Pagination({
      params: { page: 1, pageSize: 20, total: 100 },
      onPrev: () => {},
      onNext: () => {},
    });
    expect(() => p.destroy()).not.toThrow();
  });
});
