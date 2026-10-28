/** Error de red: sin conectividad o fallo genérico de fetch */
export class NetworkError extends Error {
  readonly retryable = true;
  constructor(message = 'Error de red. Comprueba tu conexión.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** Recurso no encontrado (HTTP 404) */
export class NotFoundError extends Error {
  readonly retryable = false;
  constructor(resource: string) {
    super(`No se encontró: ${resource}`);
    this.name = 'NotFoundError';
  }
}

/** La petición superó el límite de tiempo de 10 s */
export class TimeoutError extends Error {
  readonly retryable = true;
  constructor() {
    super('La solicitud tardó demasiado. Intenta de nuevo.');
    this.name = 'TimeoutError';
  }
}

/** Extrae un mensaje legible de cualquier error capturado */
export function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Error desconocido.';
}
