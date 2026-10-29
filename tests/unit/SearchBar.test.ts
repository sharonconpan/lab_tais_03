/**
 * HU02-04 — Pruebas unitarias: SearchBar
 * RF-004, RF-006, RF-008, RF-009, RF-011
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SearchBar } from '../../src/presentation/SearchBar';

afterEach(() => vi.useRealTimers());

// Helpers
function getInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input')!;
}
function getSearchBtn(container: HTMLElement): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    (b) => b.getAttribute('data-action') === 'search' ||
           b.textContent?.toLowerCase().includes('buscar')
  ) as HTMLButtonElement;
}
function getClearBtn(container: HTMLElement): HTMLButtonElement {
  return Array.from(container.querySelectorAll('button')).find(
    (b) => b.getAttribute('data-action') === 'clear' ||
           b.textContent?.toLowerCase().includes('limpiar')
  ) as HTMLButtonElement;
}
function getValidationMsg(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-validation]') ??
         container.querySelector('[role="alert"]');
}

describe('SearchBar', () => {
  // ------------------------------------------------------------------ //
  // Estructura y accesibilidad                                           //
  // ------------------------------------------------------------------ //
  it('renderiza un input con label asociado', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });
    const input = getInput(bar.element);
    expect(input).not.toBeNull();
    // Label debe referenciar el input
    const label = bar.element.querySelector('label');
    expect(label).not.toBeNull();
    expect(label!.htmlFor).toBe(input.id);
  });

  it('tiene botón Buscar y botón Limpiar', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });
    expect(getSearchBtn(bar.element)).not.toBeNull();
    expect(getClearBtn(bar.element)).not.toBeNull();
  });

  it('tiene role=search en el contenedor', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });
    const formEl = bar.element;
    // El form o el wrapper debe tener role=search
    const hasRole =
      formEl.getAttribute('role') === 'search' ||
      formEl.querySelector('[role="search"]') !== null;
    expect(hasRole).toBe(true);
  });

  // ------------------------------------------------------------------ //
  // Campo vacío — RF-008                                                 //
  // ------------------------------------------------------------------ //
  it('campo vacío: clic en Buscar no invoca onSearch', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });

    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(500);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('campo vacío: muestra mensaje de validación en español', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });

    getSearchBtn(bar.element).click();

    const msg = getValidationMsg(bar.element);
    expect(msg).not.toBeNull();
    expect(msg!.style.display).not.toBe('none');
    expect(msg!.textContent!.trim().length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------ //
  // Solo símbolos — RF-009                                               //
  // ------------------------------------------------------------------ //
  it('solo símbolos: clic en Buscar no invoca onSearch', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });

    getInput(bar.element).value = '???';
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(500);
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('solo símbolos: muestra mensaje de validación', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });

    getInput(bar.element).value = '###';
    getSearchBtn(bar.element).click();

    const msg = getValidationMsg(bar.element);
    expect(msg).not.toBeNull();
    expect(msg!.style.display).not.toBe('none');
  });

  // ------------------------------------------------------------------ //
  // Búsqueda válida — RF-004                                             //
  // ------------------------------------------------------------------ //
  it('término válido: onSearch se invoca con el término limpio', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });

    getInput(bar.element).value = '  pikachu  ';
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(500);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('pikachu');
  });

  it('término válido: oculta el mensaje de validación previo', () => {
    vi.useFakeTimers();
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });

    // Primero provocar un error
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(500);
    const msgBefore = getValidationMsg(bar.element);
    expect(msgBefore!.style.display).not.toBe('none');

    // Ahora buscar algo válido
    getInput(bar.element).value = 'bulbasaur';
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(500);
    expect(msgBefore!.style.display).toBe('none');
  });

  // ------------------------------------------------------------------ //
  // Debounce — RF-011                                                    //
  // ------------------------------------------------------------------ //
  it('doble clic rápido: onSearch se invoca solo una vez (debounce)', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });

    getInput(bar.element).value = 'pikachu';
    getSearchBtn(bar.element).click();
    getSearchBtn(bar.element).click(); // segundo clic antes del debounce
    getSearchBtn(bar.element).click(); // tercer clic

    vi.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('dos búsquedas separadas por más de 300 ms producen dos llamadas', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });

    getInput(bar.element).value = 'pikachu';
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(400); // timer del primer clic expira

    getInput(bar.element).value = 'bulbasaur';
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(400); // timer del segundo clic expira

    expect(onSearch).toHaveBeenCalledTimes(2);
  });

  // ------------------------------------------------------------------ //
  // Botón Limpiar                                                        //
  // ------------------------------------------------------------------ //
  it('Limpiar: invoca onClear', () => {
    const onClear = vi.fn();
    const bar = new SearchBar({ onSearch: () => {}, onClear });

    getClearBtn(bar.element).click();
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('Limpiar: limpia el campo de texto', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });
    const input = getInput(bar.element);

    input.value = 'pikachu';
    getClearBtn(bar.element).click();
    expect(input.value).toBe('');
  });

  it('Limpiar: oculta el mensaje de validación si estaba visible', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });

    getSearchBtn(bar.element).click(); // fuerza validación (campo vacío)
    const msg = getValidationMsg(bar.element)!;
    expect(msg.style.display).not.toBe('none');

    getClearBtn(bar.element).click();
    expect(msg.style.display).toBe('none');
  });

  // ------------------------------------------------------------------ //
  // Caracteres especiales — RF-006                                       //
  // ------------------------------------------------------------------ //
  it("acepta apóstrofos y puntos en el término (Farfetch'd, Mr. Mime)", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const bar = new SearchBar({ onSearch, onClear: () => {} });

    getInput(bar.element).value = "Farfetch'd";
    getSearchBtn(bar.element).click();
    vi.advanceTimersByTime(500);
    expect(onSearch).toHaveBeenCalledWith("Farfetch'd");
  });

  // ------------------------------------------------------------------ //
  // destroy                                                              //
  // ------------------------------------------------------------------ //
  it('destroy no lanza errores', () => {
    const bar = new SearchBar({ onSearch: () => {}, onClear: () => {} });
    expect(() => bar.destroy()).not.toThrow();
  });
});
