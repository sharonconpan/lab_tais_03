import { describe, it, expect } from 'vitest';
import {
  NetworkError,
  NotFoundError,
  TimeoutError,
  toErrorMessage,
} from '../../src/services/errors';

describe('NetworkError', () => {
  it('es instancia de Error y tiene retryable=true', () => {
    const e = new NetworkError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('NetworkError');
    expect(e.retryable).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('incluye el recurso en el mensaje y tiene retryable=false', () => {
    const e = new NotFoundError('pikachu');
    expect(e.message).toContain('pikachu');
    expect(e.retryable).toBe(false);
    expect(e.name).toBe('NotFoundError');
  });
});

describe('TimeoutError', () => {
  it('es retryable y tiene nombre correcto', () => {
    const e = new TimeoutError();
    expect(e.retryable).toBe(true);
    expect(e.name).toBe('TimeoutError');
  });
});

describe('toErrorMessage', () => {
  it('devuelve message de un Error', () => {
    expect(toErrorMessage(new Error('fallo'))).toBe('fallo');
  });
  it('devuelve string genérico para no-Error', () => {
    expect(toErrorMessage(42)).toBe('Error desconocido.');
  });
});
