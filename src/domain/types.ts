/** Tipo de una criatura Pokémon */
export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

/** Entrada mínima del índice */
export interface PokemonEntry {
  id: number;
  name: string;
  displayName: string;
  imageUrl: string | null;
}

/** Habilidad referenciada desde la ficha */
export interface AbilityRef {
  name: string;
  isHidden: boolean;
}

/** Valor de una estadística base */
export interface BaseStat {
  name: 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';
  label: 'PS' | 'Ataque' | 'Defensa' | 'Ataque Esp.' | 'Defensa Esp.' | 'Velocidad';
  value: number;
}

/** Ficha completa de una criatura */
export interface PokemonDetail {
  id: number;
  name: string;
  displayName: string;
  imageUrl: string | null;
  types: PokemonType[];
  heightDm: number;
  weightHg: number;
  abilities: AbilityRef[];
  stats: BaseStat[];
}

/** Detalle de una habilidad */
export interface AbilityDetail {
  name: string;
  displayName: string;
  description: string;
  descriptionLanguage: 'es' | 'en';
}

/** Estado de una operación asíncrona */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; retryable: boolean };

/** Contexto de navegación para restaurar al volver de la ficha (RF-013) */
export interface CatalogContext {
  searchTerm: string;
  selectedTypes: PokemonType[];
  page: number;
}

/** Resultado de comparar una estadística entre dos criaturas */
export type StatComparison = 'A' | 'B' | 'tie';

/** Resultado completo de la comparación */
export interface CompareResult {
  pokemonA: PokemonDetail;
  pokemonB: PokemonDetail;
  statResults: Record<BaseStat['name'], StatComparison>;
}

/** Parámetros de paginación */
export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}
