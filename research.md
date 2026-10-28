# Investigación Técnica — PokeDex Explorer

**Versión:** 1.0.0  
**Fecha:** 27/10/2026  
**Fase SDD:** plan  

---

## 1. PokéAPI — Endpoints relevantes

### 1.1 Índice de criaturas

```
GET https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0
```

Devuelve un objeto `{ count, results: [{ name, url }] }`. Con `limit=100000` se obtiene el catálogo completo en una sola petición (~1300 entradas a fecha de esta investigación). Este resultado se cachea en sesión y sirve como índice para la búsqueda local.

**Número nacional:** se extrae de la URL con `url.split('/').at(-2)`.

### 1.2 Detalle de criatura

```
GET https://pokeapi.co/api/v2/pokemon/{id|name}
```

Campos útiles:

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `number` | Número nacional |
| `name` | `string` | Nombre en minúsculas |
| `sprites.front_default` | `string \| null` | URL de imagen; puede ser `null` |
| `types[].type.name` | `string` | Nombre del tipo (en inglés) |
| `height` | `number` | Altura en decímetros |
| `weight` | `number` | Peso en hectogramos |
| `abilities[].ability.name` | `string` | Slug de la habilidad |
| `abilities[].is_hidden` | `boolean` | Si es habilidad oculta |
| `stats[].base_stat` | `number` | Valor base |
| `stats[].stat.name` | `string` | `hp`, `attack`, `defense`, `special-attack`, `special-defense`, `speed` |

### 1.3 Lista de tipos

```
GET https://pokeapi.co/api/v2/type
```

Devuelve `{ results: [{ name, url }] }`. Se usa para poblar el `TypeFilter`.

### 1.4 Criaturas por tipo

```
GET https://pokeapi.co/api/v2/type/{name}
```

Devuelve `{ pokemon: [{ pokemon: { name, url } }] }`. Se usa para implementar el filtro OR: se solicita cada tipo seleccionado y se une el resultado.

### 1.5 Detalle de habilidad

```
GET https://pokeapi.co/api/v2/ability/{name}
```

Campos útiles:

| Campo | Descripción |
|---|---|
| `name` | Slug de la habilidad |
| `names[].name` | Nombre localizado; filtrar por `language.name === 'es'` |
| `flavor_text_entries[].flavor_text` | Descripción; filtrar por `language.name === 'es'`, si no existe usar `language.name === 'en'` |

---

## 2. Comportamiento de la API ante errores

| Situación | Código HTTP | Comportamiento esperado en la app |
|---|---|---|
| Criatura no encontrada | 404 | Mostrar mensaje "no existe" (RF-010) |
| Error de servidor | 500 | Mostrar ErrorMessage + reintentar |
| Sin conexión | — (TypeError) | Capturar como NetworkError |
| Timeout > 10 s | — (AbortError) | Lanzar TimeoutError (RF-025) |

---

## 3. Nombres con caracteres especiales

La PokéAPI usa slugs en minúsculas sin caracteres especiales:

| Nombre visible | Slug en API |
|---|---|
| Mr. Mime | `mr-mime` |
| Farfetch'd | `farfetchd` |
| Nidoran♀ | `nidoran-f` |
| Nidoran♂ | `nidoran-m` |
| Porygon-Z | `porygon-z` |

La búsqueda del usuario se normaliza contra los nombres del índice: se compara el nombre de la API (minúsculas) con el término normalizado. El nombre visible para el usuario se obtiene del campo `name` del detalle, o se formatea desde el slug.

---

## 4. Imágenes

- `sprites.front_default` puede ser `null` para criaturas sin arte oficial en la generación 1.
- Las URLs de sprites son absolutas; se sirven desde `raw.githubusercontent.com`.
- Cuando la imagen es `null` se muestra un placeholder SVG incrustado (no requiere petición de red).

---

## 5. Límites de uso de la PokéAPI

- La PokéAPI no publica límites de tasa (rate limits) oficiales, pero la documentación recomienda uso responsable.
- Estrategia adoptada: índice de nombres solicitado una vez, tipos cacheados 5 min, detalles cacheados 5 min, sin polling, sin precarga masiva.
- La búsqueda y el filtro son locales (sin petición por carácter tecleado).

---

## 6. Tamaño de bundle estimado

| Módulo | Tamaño estimado (minificado + gzip) |
|---|---|
| TypeScript runtime (0, todo compilado) | 0 KB |
| Vite runtime mínimo | ~2 KB |
| Código de la aplicación | ~30-40 KB |
| **Total estimado** | **~35-45 KB** |

Sin framework de UI el bundle se mantiene muy por debajo del umbral de 3 s de carga inicial (R-01).

---

## 7. Compatibilidad de navegadores

Objetivo: navegadores modernos con soporte de ES2020+.

| API usada | Soporte |
|---|---|
| `fetch` | Chrome 42+, Firefox 39+, Safari 10.1+ |
| `AbortController` | Chrome 66+, Firefox 57+, Safari 12.1+ |
| `Map` / `Set` | Universal en modernos |
| CSS Grid / Flexbox | Universal en modernos |

Vite genera un build compatible con `"targets": ["es2020"]` sin polyfills adicionales.

---

*Este documento se revisará si cambia la versión de la PokéAPI o si se detectan discrepancias durante la implementación.*
