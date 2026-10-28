# Plan de Arquitectura — PokeDex Explorer

**Versión:** 1.0.0  
**Fecha:** 27/10/2026  
**Fase SDD:** plan  
**Constitución de referencia:** v1.1.0  
**Spec de referencia:** v1.3.0  
**Estado:** Pendiente de revisión humana (S-04)

---

## 1. Decisiones tecnológicas

| Área | Decisión | Justificación |
|------|----------|---------------|
| Bundler / entorno de desarrollo | Vite | Arranque instantáneo en desarrollo, HMR nativo, build optimizado con Rollup, sin configuración inicial |
| Lenguaje | TypeScript estricto (`"strict": true`) | Tipado completo reduce errores en tiempo de compilación y documenta contratos entre capas |
| Framework de UI | Ninguno — Vanilla TS | La funcionalidad requerida no justifica el coste de aprendizaje ni el tamaño de bundle de un framework; DOM API + módulos ES son suficientes |
| Pruebas unitarias e integración | Vitest | Nativo de Vite, misma configuración, compatible con la API de Jest |
| Pruebas basadas en propiedades | fast-check | Genera casos de borde automáticamente para la lógica de filtro, búsqueda y caché |
| Linter | ESLint con plugin TypeScript | Detecta errores estáticos y aplica convenciones de código |
| Formateador | Prettier | Formato consistente sin discusiones de estilo |
| Gestión de dependencias | npm (lockfile v3) | Estándar del ecosistema; lockfile garantiza reproducibilidad |
| Repositorio | GitHub | Requerido por S-07 |
| CI | GitHub Actions | Ejecuta lint, pruebas y build en cada revisión de cambios |

No se introduce ningún backend, base de datos ni servicio de autenticación.

---

## 2. Arquitectura en tres capas

```
┌─────────────────────────────────────────────┐
│             CAPA DE PRESENTACIÓN             │
│  Componentes DOM puros · sin lógica de negocio │
├─────────────────────────────────────────────┤
│             CAPA DE APLICACIÓN               │
│  Controladores · máquinas de estado          │
│  idle → loading → success | error            │
├─────────────────────────────────────────────┤
│             CAPA DE SERVICIOS                │
│  PokeApiClient · caché · timeout · reintento │
└─────────────────────────────────────────────┘
```

Cada capa solo depende de la inmediatamente inferior. Ningún componente de presentación invoca la API directamente (C-02).

---

## 3. Estructura de directorios

```
pokedex-explorer/
├── src/
│   ├── presentation/          # Componentes DOM
│   │   ├── SearchBar.ts
│   │   ├── PokemonCard.ts
│   │   ├── PokemonList.ts
│   │   ├── Pagination.ts
│   │   ├── TypeFilter.ts
│   │   ├── DetailView.ts
│   │   ├── AbilityDetail.ts
│   │   ├── ComparePanel.ts
│   │   ├── LoadingIndicator.ts
│   │   └── ErrorMessage.ts
│   ├── application/           # Controladores
│   │   ├── CatalogController.ts
│   │   ├── SearchController.ts
│   │   ├── DetailController.ts
│   │   ├── FilterController.ts
│   │   ├── AbilityController.ts
│   │   └── CompareController.ts
│   ├── services/              # Acceso a datos
│   │   ├── PokeApiClient.ts
│   │   ├── cache.ts
│   │   └── http.ts
│   ├── domain/                # Tipos e interfaces
│   │   └── types.ts
│   ├── i18n/                  # Textos en español
│   │   └── es.ts
│   └── main.ts                # Punto de entrada
├── tests/
│   ├── unit/
│   ├── integration/
│   └── mocks/
│       └── pokeApiMock.ts
├── contracts/                 # Interfaces públicas entre capas
│   ├── IPokeApiClient.ts
│   ├── ICacheStore.ts
│   ├── IController.ts
│   └── IComponent.ts
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── specify.md
├── constitution.md
├── vite.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
└── package.json
```

---

## 4. Componentes de presentación

| Componente | Responsabilidad | RF cubiertos |
|---|---|---|
| `SearchBar` | Campo de búsqueda, validación visual, debounce | RF-004..RF-011 |
| `PokemonCard` | Tarjeta de criatura: imagen, número, nombre | RF-001, RF-003 |
| `PokemonList` | Rejilla de tarjetas; estado vacío | RF-001, RF-007, RF-016 |
| `Pagination` | Controles anterior/siguiente, indicador de página | RF-002, RF-027 |
| `TypeFilter` | Selector multivalor de tipos con nota de máx. 2 tipos | RF-014, RF-017, RF-028 |
| `DetailView` | Ficha completa: imagen, datos, stats, habilidades | RF-012, RF-013 |
| `AbilityDetail` | Panel de habilidad con fallback de idioma | RF-018, RF-019 |
| `ComparePanel` | Vista paralela con señal textual/simbólica por stat | RF-020..RF-022, RF-029 |
| `LoadingIndicator` | Spinner/esqueleto durante carga | RF-023 |
| `ErrorMessage` | Mensaje de error + botón reintentar | RF-024, RF-025 |

Ningún componente contiene lógica de negocio ni invoca servicios directamente. Recibe datos y emite eventos (C-01).

---

## 5. Controladores de aplicación

Cada controlador implementa la interfaz `IController` y gestiona un estado de la forma:

```
idle → loading → success
              ↘ error → (reintento) → loading
```

| Controlador | HU gestionada | Estado que mantiene |
|---|---|---|
| `CatalogController` | HU-01 | página actual, lista de criaturas por página |
| `SearchController` | HU-02 | término, índice completo de nombres (cacheado), resultados, página |
| `DetailController` | HU-03 | criatura activa, contexto de vuelta (término + tipos + página) |
| `FilterController` | HU-04 | tipos seleccionados, lista filtrada |
| `AbilityController` | HU-05 | habilidad activa, idioma disponible |
| `CompareController` | HU-06 | criatura A, criatura B, resultado de comparación stat a stat |

---

## 6. Servicio PokeApiClient

### 6.1 Endpoints consumidos

| Endpoint | Uso |
|---|---|
| `GET /pokemon?limit=100000&offset=0` | Obtiene el índice completo de nombres (una vez, cacheado) |
| `GET /pokemon/{id}` | Detalle de criatura (nombre, tipos, stats, habilidades, imagen, altura, peso) |
| `GET /type` | Lista de todos los tipos disponibles |
| `GET /type/{nombre}` | Criaturas que pertenecen a un tipo (para filtro OR) |
| `GET /ability/{nombre}` | Detalle de habilidad con entradas de texto por idioma |

No se consumen otros endpoints. No se realiza scraping masivo (R-05).

### 6.2 Caché en memoria

- Vigencia mínima de 5 minutos por entrada (R-04).
- Estructura: `Map<string, { data: unknown; expiresAt: number }>`.
- Una entrada errónea **no** se almacena en caché; el siguiente intento hace una petición nueva.
- El usuario puede forzar refresco pasando `{ forceRefresh: true }` al cliente.

### 6.3 Timeout y cancelación

- Cada petición se envuelve con `AbortController`; si supera 10 s se aborta y se lanza `TimeoutError` (RF-025).
- El cliente expone `cancel()` para que el controlador pueda abortar peticiones en curso al desmontar la vista.

### 6.4 Reintento

- Un único reintento automático ante error de red (no ante 4xx).
- El reintento **no** usa la caché; hace una petición fresca.

---

## 7. Estrategia de búsqueda

1. Al arrancar (o la primera vez que se necesita), `SearchController` solicita `GET /pokemon?limit=100000&offset=0` y almacena el array `[{ name, url }]` en caché permanente de sesión.
2. Ante cada búsqueda, filtra ese array en memoria:
   - Si el término es numérico: busca coincidencia exacta en el número extraído de la URL.
   - Si es texto: `name.includes(término.toLowerCase().trim())`.
3. El resultado filtrado se pagina en cliente (RF-027).
4. Una sola petición de red para el índice durante toda la sesión (R-05).

---

## 8. Filtro por tipo (lógica OR)

1. Al cargar `TypeFilter`, se solicita `GET /type` para obtener la lista de tipos y se cachea.
2. Al seleccionar tipos, por cada tipo seleccionado se solicita `GET /type/{nombre}` (con caché).
3. Se une la lista de nombres de todas las respuestas (Set para deduplicar).
4. Se intersecta con el resultado de búsqueda activo si lo hay (RF-015).
5. El resultado final se pagina en cliente.

---

## 9. Restauración de contexto al volver de la ficha

El `DetailController` guarda antes de navegar a la ficha:
- término de búsqueda activo
- tipos seleccionados
- número de página

Al pulsar «volver», restaura ese estado en `SearchController` + `FilterController` + `CatalogController` antes de renderizar la lista (RF-013).

---

## 10. Comparación (sección dedicada)

`CompareController` gestiona dos slots independientes (slot A y slot B).
- Cada slot tiene su propio `SearchBar` y muestra una `PokemonCard` al seleccionar.
- Al iniciar la comparación valida que A ≠ B (RF-022).
- Las stats se comparan valor a valor; el resultado es `'A' | 'B' | 'tie'` por cada stat.
- `ComparePanel` renderiza la señal textual/simbólica correspondiente (RF-020, RF-021).

---

## 11. Accesibilidad

- Todos los componentes usan elementos semánticos HTML (`<button>`, `<nav>`, `<main>`, `<section>`, `<article>`).
- Imágenes: atributo `alt` con nombre de la criatura o vacío cuando es decorativa.
- Formularios: `<label>` asociado a cada `<input>`.
- `LoadingIndicator`: `role="status"` + `aria-live="polite"`.
- `ErrorMessage`: `role="alert"`.
- Navegación por teclado: foco visible en todos los elementos interactivos.
- Contraste: paleta validada contra WCAG 2.1 AA (≥ 4.5:1 texto normal, ≥ 3:1 texto grande).

---

## 12. Internacionalización

Todos los textos visibles al usuario se centralizan en `src/i18n/es.ts` como objeto de constantes. Ningún componente contiene cadenas de texto en línea (U-04). Ejemplo:

```typescript
export const i18n = {
  buscar: 'Buscar',
  sinResultados: 'No se encontraron resultados para «{term}»',
  errorCarga: 'No se pudieron cargar los datos. Intenta de nuevo.',
  tiempoAgotado: 'La solicitud tardó demasiado. Intenta de nuevo.',
  reintentar: 'Reintentar',
  descripcionNoDisponible: 'Descripción no disponible en español.',
  // ...
} as const;
```

---

## 13. Pruebas

| Tipo | Herramienta | Objetivo | Cobertura mínima |
|---|---|---|---|
| Unitarias | Vitest | Lógica de filtro, búsqueda, caché, comparación, timeout | 80 % en `services/` y `application/` (P-02) |
| Basadas en propiedades | fast-check | Invariantes de filtro OR, paginación, caché | Incluidas en el 80 % |
| Integración | Vitest + mock | Flujo controlador → servicio → componente | Casos límite CL-01..CL-10 |

Todas las pruebas usan `pokeApiMock.ts`; ninguna realiza peticiones reales (P-03).

### Configuración de cobertura

```jsonc
// vite.config.ts
coverage: {
  provider: 'v8',
  include: ['src/services/**', 'src/application/**'],
  thresholds: { lines: 80, functions: 80, branches: 80 }
}
```

---

## 14. Rendimiento

| Objetivo | Estrategia |
|---|---|
| Carga inicial < 3 s (R-01) | Vite genera bundle mínimo; sin framework; imágenes de PokéAPI servidas desde CDN externo |
| Interacciones < 200 ms (R-02) | Filtro y búsqueda en memoria; sin bloqueo de interfaz; debounce en SearchBar |
| Paginación (R-03) | Página de 20 ítems en cliente; no se renderiza la lista completa |
| Caché 5 min (R-04) | `cache.ts` con Map + timestamp; no almacena errores |
| Respeto de la API (R-05) | Índice completo solicitado una vez; tipos cacheados; sin polling |

---

## 15. Flujo CI/CD

```yaml
# .github/workflows/ci.yml (resumen)
jobs:
  ci:
    steps:
      - npm ci
      - npm run lint          # ESLint
      - npm run format:check   # Prettier
      - npm run test           # Vitest con cobertura
      - npm run build          # Vite build
```

Ninguna revisión de cambios se integra si algún paso falla (P-04).

---

## 16. Verificación de conformidad con la constitución v1.1.0

| Principio | Satisfecho por |
|---|---|
| C-01 Responsabilidad única | Tres capas físicamente separadas en directorios distintos |
| C-02 Separación de capas | Solo `PokeApiClient` llama a la red; contratos en `contracts/` |
| C-03 Manejo de errores | `TimeoutError`, `NetworkError`, `NotFoundError` tipados; `ErrorMessage` siempre visible |
| C-04 Sin secretos | PokéAPI es pública; ninguna clave necesaria ni usada |
| P-01 Pruebas con funcionalidad | Política aplicada en CI: test obligatorio por RF |
| P-02 Cobertura 80 % | Umbral configurado en Vitest con fallo de build si no se alcanza |
| P-03 API simulada | `pokeApiMock.ts` sustituye `PokeApiClient` en todas las pruebas |
| P-04 Sin pruebas rotas | CI bloquea la integración si hay fallos |
| U-01..U-05 UX | Componentes semánticos, i18n centralizado, responsive CSS, accesibilidad explícita |
| R-01..R-05 Rendimiento | Ver sección 14 |
| S-01..S-08 SDD | Este artefacto sigue el orden de fases; spec es la fuente de verdad |
| G-01..G-02 Gobernanza | Cualquier cambio a este plan requiere nueva versión y justificación |

---

*Documento pendiente de revisión humana (principio S-04). Una vez aprobado, la siguiente fase es `tasks`.*
