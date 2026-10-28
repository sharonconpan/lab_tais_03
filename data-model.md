# Modelo de Datos — PokeDex Explorer

**Versión:** 1.0.0  
**Fecha:** 27/10/2026  
**Fase SDD:** plan  

> Este documento describe los tipos de dominio que circulan entre las tres capas. No describe estructuras internas de base de datos (no existe) ni formatos de la PokéAPI (descritos en research.md).

---

## 1. Tipos de dominio

```typescript
// src/domain/types.ts

/** Tipo de una criatura Pokémon */
export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

/** Entrada mínima del índice (obtenida del endpoint de lista) */
export interface PokemonEntry {
  id: number;          // número nacional
  name: string;        // nombre en minúsculas (slug de la API)
  displayName: string; // nombre formateado para mostrar al usuario
}

/** Habilidad referenciada desde la ficha */
export interface AbilityRef {
  name: string;       // slug
  isHidden: boolean;
}

/** Valor de una estadística base */
export interface BaseStat {
  name: 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';
  /** Etiqueta en español para mostrar en la UI */
  label: 'PS' | 'Ataque' | 'Defensa' | 'Ataque Esp.' | 'Defensa Esp.' | 'Velocidad';
  value: number;
}

/** Ficha completa de una criatura */
export interface PokemonDetail {
  id: number;
  name: string;
  displayName: string;
  imageUrl: string | null;  // null si la API no tiene imagen
  types: PokemonType[];     // 1 o 2 tipos
  heightDm: number;         // altura en decímetros
  weightHg: number;         // peso en hectogramos
  abilities: AbilityRef[];
  stats: BaseStat[];        // siempre 6 elementos, mismo orden
}

/** Detalle de una habilidad */
export interface AbilityDetail {
  name: string;
  displayName: string;          // nombre localizado (es o en)
  description: string;          // descripción localizada
  descriptionLanguage: 'es' | 'en'; // idioma de la descripción mostrada
}

/** Estado de una operación asíncrona */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; retryable: boolean };

/** Contexto de navegación que se restaura al volver de la ficha (RF-013) */
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
  page: number;      // base 1
  pageSize: number;  // siempre 20
  total: number;     // total de ítems en el conjunto completo
}
```

---

## 2. Mapeo de nombres de stats (API → dominio)

| Nombre en PokéAPI | `BaseStat.name` | `BaseStat.label` |
|---|---|---|
| `hp` | `hp` | `PS` |
| `attack` | `attack` | `Ataque` |
| `defense` | `defense` | `Defensa` |
| `special-attack` | `special-attack` | `Ataque Esp.` |
| `special-defense` | `special-defense` | `Defensa Esp.` |
| `speed` | `speed` | `Velocidad` |

---

## 3. Mapeo de nombres de tipos (API → mostrar)

Los tipos se reciben en inglés de la PokéAPI. Se traducen al español en la capa de servicios antes de exponerlos al dominio.

| API | Español |
|---|---|
| `normal` | Normal |
| `fire` | Fuego |
| `water` | Agua |
| `electric` | Eléctrico |
| `grass` | Planta |
| `ice` | Hielo |
| `fighting` | Lucha |
| `poison` | Veneno |
| `ground` | Tierra |
| `flying` | Volador |
| `psychic` | Psíquico |
| `bug` | Bicho |
| `rock` | Roca |
| `ghost` | Fantasma |
| `dragon` | Dragón |
| `dark` | Siniestro |
| `steel` | Acero |
| `fairy` | Hada |

---

## 4. Flujo de datos por caso de uso

### HU-01 y HU-02 — Catálogo y búsqueda

```
PokeApiClient.getPokemonIndex()
  → PokemonEntry[]
  → SearchController filtra en memoria
  → PokemonEntry[] (página)
  → PokemonList renderiza PokemonCard[]
```

### HU-03 — Ficha

```
PokeApiClient.getPokemonDetail(id)
  → PokemonDetail
  → DetailController guarda CatalogContext
  → DetailView renderiza
```

### HU-04 — Filtro por tipo

```
PokeApiClient.getPokemonByType(typeName)[]
  → Set<string> (nombres)
  → FilterController intersecta con búsqueda activa
  → PokemonEntry[] (página)
  → PokemonList renderiza
```

### HU-05 — Habilidad

```
PokeApiClient.getAbility(name)
  → AbilityDetail (con descriptionLanguage)
  → AbilityController
  → AbilityDetail renderiza (+ nota si descriptionLanguage === 'en')
```

### HU-06 — Comparación

```
PokeApiClient.getPokemonDetail(idA)
PokeApiClient.getPokemonDetail(idB)
  → PokemonDetail × 2
  → CompareController calcula CompareResult
  → ComparePanel renderiza señal por stat
```

---

*Documento sujeto a revisión humana (S-04) junto con plan.md.*
