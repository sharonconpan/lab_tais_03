import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PokeApiClient } from '../../src/services/PokeApiClient';
import { NotFoundError } from '../../src/services/errors';

const makeResponse = (data: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => data } as Response);

describe('PokeApiClient', () => {
  let client: PokeApiClient;

  beforeEach(() => {
    client = new PokeApiClient();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('getPokemonIndex devuelve entradas mapeadas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
    })));
    const entries = await client.getPokemonIndex();
    expect(entries[0].id).toBe(1);
    expect(entries[0].displayName).toBe('Bulbasaur');
    expect(entries[0].imageUrl).toContain('1.png');
  });

  it('getPokemonIndex usa caché en segunda llamada', async () => {
    const spy = vi.fn().mockResolvedValue(makeResponse({
      results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
    }));
    vi.stubGlobal('fetch', spy);
    await client.getPokemonIndex();
    await client.getPokemonIndex();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('getPokemonDetail mapea stats y tipos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      id: 25, name: 'pikachu',
      sprites: { front_default: 'https://img.png' },
      types: [{ type: { name: 'electric' } }],
      height: 4, weight: 60,
      abilities: [{ ability: { name: 'static' }, is_hidden: false }],
      stats: [
        { base_stat: 35, stat: { name: 'hp' } },
        { base_stat: 55, stat: { name: 'attack' } },
        { base_stat: 40, stat: { name: 'defense' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
        { base_stat: 50, stat: { name: 'special-defense' } },
        { base_stat: 90, stat: { name: 'speed' } },
      ],
    })));
    const d = await client.getPokemonDetail(25);
    expect(d.id).toBe(25);
    expect(d.types).toContain('electric');
    expect(d.stats.find(s => s.name === 'hp')?.label).toBe('PS');
  });

  it('getPokemonDetail lanza NotFoundError ante 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({}, 404)));
    await expect(client.getPokemonDetail('nope')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('getPokemonDetail imageUrl es null cuando sprites.front_default es null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      id: 1, name: 'test',
      sprites: { front_default: null },
      types: [], height: 1, weight: 1, abilities: [],
      stats: [],
    })));
    const d = await client.getPokemonDetail(1);
    expect(d.imageUrl).toBeNull();
  });

  it('getAbility elige es cuando existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      name: 'overgrow',
      names: [{ name: 'Espesura', language: { name: 'es' } }],
      flavor_text_entries: [
        { flavor_text: 'Texto ES', language: { name: 'es' } },
        { flavor_text: 'English text', language: { name: 'en' } },
      ],
    })));
    const a = await client.getAbility('overgrow');
    expect(a.descriptionLanguage).toBe('es');
    expect(a.description).toBe('Texto ES');
    expect(a.displayName).toBe('Espesura');
  });

  it('getAbility cae a en cuando no hay es', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({
      name: 'overgrow',
      names: [],
      flavor_text_entries: [
        { flavor_text: 'English text', language: { name: 'en' } },
      ],
    })));
    const a = await client.getAbility('overgrow');
    expect(a.descriptionLanguage).toBe('en');
    expect(a.description).toBe('English text');
  });

  it('cancelAll aborta peticiones en curso', () => {
    // Solo verifica que no lanza
    expect(() => client.cancelAll()).not.toThrow();
  });
});
