/**
 * Mock de IPokeApiClient para pruebas.
 * Proporciona respuestas predefinidas sin hacer peticiones HTTP reales.
 * BASE-06 — mock para pruebas de integración y unitarias.
 */
import type { IPokeApiClient, FetchOptions } from '../../contracts/IPokeApiClient';
import type {
  PokemonEntry,
  PokemonDetail,
  AbilityDetail,
  PokemonType,
} from '../../src/domain/types';
import { NetworkError, NotFoundError, TimeoutError } from '../../src/services/errors';

// --- Fixtures ---

export const FIXTURE_INDEX: PokemonEntry[] = [
  { id: 1, name: 'bulbasaur', displayName: 'Bulbasaur', imageUrl: 'https://img/1.png' },
  { id: 4, name: 'charmander', displayName: 'Charmander', imageUrl: 'https://img/4.png' },
  { id: 7, name: 'squirtle', displayName: 'Squirtle', imageUrl: 'https://img/7.png' },
  { id: 25, name: 'pikachu', displayName: 'Pikachu', imageUrl: 'https://img/25.png' },
  { id: 39, name: 'jigglypuff', displayName: 'Jigglypuff', imageUrl: null },
];

export const FIXTURE_PIKACHU: PokemonDetail = {
  id: 25,
  name: 'pikachu',
  displayName: 'Pikachu',
  imageUrl: 'https://img/25.png',
  types: ['electric'],
  heightDm: 4,
  weightHg: 60,
  abilities: [
    { name: 'static', isHidden: false },
    { name: 'lightning-rod', isHidden: true },
  ],
  stats: [
    { name: 'hp', label: 'PS', value: 35 },
    { name: 'attack', label: 'Ataque', value: 55 },
    { name: 'defense', label: 'Defensa', value: 40 },
    { name: 'special-attack', label: 'Ataque Esp.', value: 50 },
    { name: 'special-defense', label: 'Defensa Esp.', value: 50 },
    { name: 'speed', label: 'Velocidad', value: 90 },
  ],
};

export const FIXTURE_NO_IMAGE: PokemonDetail = {
  id: 39,
  name: 'jigglypuff',
  displayName: 'Jigglypuff',
  imageUrl: null,
  types: ['normal', 'fairy'],
  heightDm: 5,
  weightHg: 55,
  abilities: [{ name: 'cute-charm', isHidden: false }],
  stats: [
    { name: 'hp', label: 'PS', value: 115 },
    { name: 'attack', label: 'Ataque', value: 45 },
    { name: 'defense', label: 'Defensa', value: 20 },
    { name: 'special-attack', label: 'Ataque Esp.', value: 45 },
    { name: 'special-defense', label: 'Defensa Esp.', value: 25 },
    { name: 'speed', label: 'Velocidad', value: 20 },
  ],
};

export const FIXTURE_ABILITY_ES: AbilityDetail = {
  name: 'static',
  displayName: 'Estática',
  description: 'Puede paralizar al contacto.',
  descriptionLanguage: 'es',
};

export const FIXTURE_ABILITY_EN_ONLY: AbilityDetail = {
  name: 'overgrow',
  displayName: 'Overgrow',
  description: 'Powers up Grass-type moves in a pinch.',
  descriptionLanguage: 'en',
};

// --- Comportamiento configurable ---

export type MockBehavior = 'success' | 'network-error' | 'not-found' | 'timeout';

export class MockPokeApiClient implements IPokeApiClient {
  private _indexBehavior: MockBehavior = 'success';
  private _detailBehavior: MockBehavior = 'success';
  private _abilityBehavior: MockBehavior = 'success';
  private _delay = 0;
  private _extraEntries: PokemonEntry[] = [];

  /** Configura el comportamiento de getPokemonIndex */
  setIndexBehavior(b: MockBehavior): this {
    this._indexBehavior = b;
    return this;
  }
  /** Configura el comportamiento de getPokemonDetail */
  setDetailBehavior(b: MockBehavior): this {
    this._detailBehavior = b;
    return this;
  }
  /** Configura el comportamiento de getAbility */
  setAbilityBehavior(b: MockBehavior): this {
    this._abilityBehavior = b;
    return this;
  }
  /** Añade retardo artificial (ms) — útil para probar el indicador de carga */
  setDelay(ms: number): this {
    this._delay = ms;
    return this;
  }
  /** Añade una entrada extra al índice (útil para tests de búsqueda con datos específicos) */
  addIndexEntry(entry: PokemonEntry): this {
    this._extraEntries.push(entry);
    return this;
  }

  private async _wait(): Promise<void> {
    if (this._delay > 0) await new Promise((r) => setTimeout(r, this._delay));
  }

  async getPokemonIndex(_options?: FetchOptions): Promise<PokemonEntry[]> {
    await this._wait();
    if (this._indexBehavior === 'network-error') throw new NetworkError();
    if (this._indexBehavior === 'timeout') throw new TimeoutError();
    if (this._indexBehavior === 'not-found') throw new NotFoundError('pokemon-index');
    return [...FIXTURE_INDEX, ...this._extraEntries];
  }

  async getPokemonDetail(
    idOrName: number | string,
    _options?: FetchOptions
  ): Promise<PokemonDetail> {
    await this._wait();
    if (this._detailBehavior === 'network-error') throw new NetworkError();
    if (this._detailBehavior === 'timeout') throw new TimeoutError();
    if (this._detailBehavior === 'not-found') throw new NotFoundError(String(idOrName));
    if (idOrName === 25 || idOrName === 'pikachu') return { ...FIXTURE_PIKACHU };
    if (idOrName === 39 || idOrName === 'jigglypuff') return { ...FIXTURE_NO_IMAGE };
    throw new NotFoundError(String(idOrName));
  }

  async getTypeList(_options?: FetchOptions): Promise<PokemonType[]> {
    return ['fire', 'water', 'electric', 'grass', 'normal', 'fairy'];
  }

  async getPokemonByType(typeName: PokemonType, _options?: FetchOptions): Promise<PokemonEntry[]> {
    return FIXTURE_INDEX.filter((e) => {
      if (typeName === 'electric') return e.id === 25;
      if (typeName === 'normal') return e.id === 39;
      if (typeName === 'fairy') return e.id === 39;
      return false;
    });
  }

  async getAbility(name: string, _options?: FetchOptions): Promise<AbilityDetail> {
    await this._wait();
    if (this._abilityBehavior === 'network-error') throw new NetworkError();
    if (this._abilityBehavior === 'timeout') throw new TimeoutError();
    if (this._abilityBehavior === 'not-found') throw new NotFoundError(name);
    if (name === 'static') return { ...FIXTURE_ABILITY_ES };
    if (name === 'overgrow') return { ...FIXTURE_ABILITY_EN_ONLY };
    throw new NotFoundError(name);
  }

  cancelAll(): void {
    /* no-op en mock */
  }
}
