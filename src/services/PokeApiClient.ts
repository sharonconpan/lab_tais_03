import type { IPokeApiClient, FetchOptions } from '../../contracts/IPokeApiClient';
import type { PokemonEntry, PokemonDetail, AbilityDetail, PokemonType, BaseStat } from '../domain/types';
import { MemoryCache } from './cache';
import { httpGet } from './http';
import { NotFoundError } from './errors';

const BASE_URL = 'https://pokeapi.co/api/v2';

const TYPE_LABELS: Record<string, string> = {
  normal:'Normal', fire:'Fuego', water:'Agua', electric:'Eléctrico',
  grass:'Planta', ice:'Hielo', fighting:'Lucha', poison:'Veneno',
  ground:'Tierra', flying:'Volador', psychic:'Psíquico', bug:'Bicho',
  rock:'Roca', ghost:'Fantasma', dragon:'Dragón', dark:'Siniestro',
  steel:'Acero', fairy:'Hada',
};

const STAT_MAP: Record<string, BaseStat['name']> = {
  hp: 'hp', attack: 'attack', defense: 'defense',
  'special-attack': 'special-attack', 'special-defense': 'special-defense', speed: 'speed',
};
const STAT_LABELS: Record<BaseStat['name'], BaseStat['label']> = {
  hp: 'PS', attack: 'Ataque', defense: 'Defensa',
  'special-attack': 'Ataque Esp.', 'special-defense': 'Defensa Esp.', speed: 'Velocidad',
};

function idFromUrl(url: string): number {
  const parts = url.replace(/\/$/, '').split('/');
  return parseInt(parts[parts.length - 1], 10);
}

function formatName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface RawPokemonListResponse {
  results: Array<{ name: string; url: string }>;
}
interface RawPokemonDetail {
  id: number;
  name: string;
  sprites: { front_default: string | null };
  types: Array<{ type: { name: string } }>;
  height: number;
  weight: number;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
}
interface RawTypeDetail {
  pokemon: Array<{ pokemon: { name: string; url: string } }>;
}
interface RawAbility {
  name: string;
  names: Array<{ name: string; language: { name: string } }>;
  flavor_text_entries: Array<{ flavor_text: string; language: { name: string } }>;
}

export class PokeApiClient implements IPokeApiClient {
  private cache = new MemoryCache();
  private controllers: AbortController[] = [];

  private newSignal(): AbortSignal {
    const ctrl = new AbortController();
    this.controllers.push(ctrl);
    return ctrl.signal;
  }

  cancelAll(): void {
    this.controllers.forEach((c) => c.abort());
    this.controllers = [];
  }

  async getPokemonIndex(options?: FetchOptions): Promise<PokemonEntry[]> {
    const key = 'pokemon-index';
    if (!options?.forceRefresh) {
      const cached = this.cache.get<PokemonEntry[]>(key);
      if (cached) return cached;
    }
    const raw = await httpGet<RawPokemonListResponse>(
      `${BASE_URL}/pokemon?limit=100000&offset=0`,
      this.newSignal()
    );
    const entries: PokemonEntry[] = raw.results.map((r) => ({
      id: idFromUrl(r.url),
      name: r.name,
      displayName: formatName(r.name),
      imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idFromUrl(r.url)}.png`,
    }));
    this.cache.set(key, entries);
    return entries;
  }

  async getPokemonDetail(idOrName: number | string, options?: FetchOptions): Promise<PokemonDetail> {
    const key = `pokemon-${idOrName}`;
    if (!options?.forceRefresh) {
      const cached = this.cache.get<PokemonDetail>(key);
      if (cached) return cached;
    }
    const raw = await httpGet<RawPokemonDetail>(
      `${BASE_URL}/pokemon/${idOrName}`,
      this.newSignal()
    );
    const detail: PokemonDetail = {
      id: raw.id,
      name: raw.name,
      displayName: formatName(raw.name),
      imageUrl: raw.sprites.front_default,
      types: raw.types.map((t) => t.type.name as PokemonType),
      heightDm: raw.height,
      weightHg: raw.weight,
      abilities: raw.abilities.map((a) => ({
        name: a.ability.name,
        isHidden: a.is_hidden,
      })),
      stats: raw.stats.map((s) => {
        const name = STAT_MAP[s.stat.name] ?? (s.stat.name as BaseStat['name']);
        return { name, label: STAT_LABELS[name], value: s.base_stat };
      }),
    };
    this.cache.set(key, detail);
    return detail;
  }

  async getTypeList(options?: FetchOptions): Promise<PokemonType[]> {
    const key = 'type-list';
    if (!options?.forceRefresh) {
      const cached = this.cache.get<PokemonType[]>(key);
      if (cached) return cached;
    }
    const raw = await httpGet<RawPokemonListResponse>(`${BASE_URL}/type`, this.newSignal());
    const types = raw.results
      .map((r) => r.name as PokemonType)
      .filter((t) => t in TYPE_LABELS);
    this.cache.set(key, types);
    return types;
  }

  async getPokemonByType(typeName: PokemonType, options?: FetchOptions): Promise<PokemonEntry[]> {
    const key = `type-${typeName}`;
    if (!options?.forceRefresh) {
      const cached = this.cache.get<PokemonEntry[]>(key);
      if (cached) return cached;
    }
    const raw = await httpGet<RawTypeDetail>(`${BASE_URL}/type/${typeName}`, this.newSignal());
    const entries: PokemonEntry[] = raw.pokemon.map((p) => ({
      id: idFromUrl(p.pokemon.url),
      name: p.pokemon.name,
      displayName: formatName(p.pokemon.name),
      imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idFromUrl(p.pokemon.url)}.png`,
    }));
    this.cache.set(key, entries);
    return entries;
  }

  async getAbility(name: string, options?: FetchOptions): Promise<AbilityDetail> {
    const key = `ability-${name}`;
    if (!options?.forceRefresh) {
      const cached = this.cache.get<AbilityDetail>(key);
      if (cached) return cached;
    }
    const raw = await httpGet<RawAbility>(`${BASE_URL}/ability/${name}`, this.newSignal());
    if (!raw.name) throw new NotFoundError(name);

    const esName = raw.names.find((n) => n.language.name === 'es')?.name;
    const displayName = esName ?? formatName(raw.name);

    const esText = raw.flavor_text_entries.find((e) => e.language.name === 'es')?.flavor_text;
    const enText = raw.flavor_text_entries.find((e) => e.language.name === 'en')?.flavor_text;
    const description = esText ?? enText ?? '';
    const descriptionLanguage: 'es' | 'en' = esText ? 'es' : 'en';

    const detail: AbilityDetail = { name: raw.name, displayName, description, descriptionLanguage };
    this.cache.set(key, detail);
    return detail;
  }
}
