# Tareas de Implementación — PokeDex Explorer

**Versión:** 1.0.0
**Fecha:** 27/10/2026
**Fase SDD:** tasks
**Plan de referencia:** v1.0.0
**Spec de referencia:** v1.3.0
**Estado:** Pendiente de revisión humana (S-04)

---

## Convenciones

- **[P]** — la tarea puede ejecutarse en paralelo con otras marcadas [P] dentro del mismo bloque.
- **Archivo** — ruta relativa desde la raíz del repositorio.
- **RF** — requisito(s) funcional(es) de `specify.md` que la tarea cubre o ejercita.
- Cada tarea es atómica: produce un commit convencional propio y deja las pruebas en verde (P-04).
- El orden dentro de cada fase es el orden de implementación recomendado; las tareas [P] pueden solaparse.

---

## Definición del MVP

El MVP comprende las fases **PREP**, **BASE** y las historias **HU-01** y **HU-02**.
Con el MVP desplegado el usuario puede explorar el catálogo completo, navegar entre páginas y buscar criaturas por nombre o número, incluyendo nombres con caracteres especiales y todos los casos límite de validación.

---

## FASE PREP — Preparación del proyecto

> Objetivo: repositorio funcional con Vite + TypeScript estricto, linter, formateador, runner de pruebas y cobertura configurada. Sin código de negocio.

### PREP-01 — Inicializar proyecto Vite + TypeScript estricto [P]

**Archivo:** `package.json`, `vite.config.ts`, `tsconfig.json`
**RF:** —
**Qué hace:** `npm create vite@latest` con plantilla `vanilla-ts`; activar `"strict": true` en `tsconfig.json`; verificar que `npm run build` produce un bundle limpio.

### PREP-02 — Configurar ESLint con plugin TypeScript [P]

**Archivo:** `.eslintrc.json`, `package.json`
**RF:** —
**Qué hace:** instalar `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`; añadir script `lint`; verificar con `npm run lint` sobre `src/`.

### PREP-03 — Configurar Prettier [P]

**Archivo:** `.prettierrc`, `.prettierignore`, `package.json`
**RF:** —
**Qué hace:** instalar `prettier`; añadir scripts `format` y `format:check`; asegurar que `.eslintrc.json` desactiva reglas de formato que conflicten con Prettier.

### PREP-04 — Configurar Vitest con cobertura V8 [P]

**Archivo:** `vite.config.ts`, `package.json`
**RF:** —
**Qué hace:** instalar `vitest`, `@vitest/coverage-v8`; configurar `coverage.include` sobre `src/services/**` y `src/application/**`; configurar `thresholds: { lines: 80, functions: 80, branches: 80 }`; añadir scripts `test`, `test:coverage`, `test:watch`; ejecutar `npm run test:coverage` (pasa porque no hay código aún).

### PREP-05 — Crear estructura de directorios y tipos de dominio [P]

**Archivo:** `src/domain/types.ts`, `src/i18n/es.ts`
**RF:** —
**Qué hace:** crear los directorios `src/presentation/`, `src/application/`, `src/services/`, `src/domain/`, `src/i18n/`, `tests/unit/`, `tests/integration/`, `tests/mocks/`, `contracts/`; copiar los tipos de `data-model.md` a `src/domain/types.ts`; crear `src/i18n/es.ts` con todas las cadenas de texto en español necesarias (mensajes de error, etiquetas, notas de idioma, etc.).

### PREP-06 — Configurar GitHub Actions CI [P]

**Archivo:** `.github/workflows/ci.yml`
**RF:** —
**Qué hace:** crear workflow con pasos `npm ci`, `npm run lint`, `npm run format:check`, `npm run test:coverage`, `npm run build`; verificar que el workflow pasa en la rama principal.

---

## FASE BASE — Servicios de infraestructura

> Objetivo: `PokeApiClient` completo con caché, timeout, cancelación y manejo de errores tipados. Esta capa es prerrequisito para todas las historias. Las tareas [P] dentro de BASE pueden ejecutarse en paralelo una vez creados los contratos.

### BASE-01 — Copiar contratos entre capas

**Archivo:** `contracts/IPokeApiClient.ts`, `contracts/ICacheStore.ts`, `contracts/IController.ts`, `contracts/IComponent.ts`
**RF:** —
**Qué hace:** los archivos ya existen desde la fase `plan`; verificar que compilan sin errores con `tsc --noEmit`.

### BASE-02 — Implementar tipos de error tipados [P]

**Archivo:** `src/services/errors.ts`, `tests/unit/errors.test.ts`
**RF:** RF-024, RF-025
**Qué hace:** definir y exportar `NetworkError`, `NotFoundError`, `TimeoutError` como clases que extienden `Error` con propiedad `retryable: boolean`; escribir prueba que verifica tipo, mensaje y `retryable` de cada uno.

### BASE-03 — Implementar caché en memoria [P]

**Archivo:** `src/services/cache.ts`, `tests/unit/cache.test.ts`
**RF:** RF-024 (no cachea errores), constitución R-04
**Qué hace:** implementar `MemoryCache` que satisface `ICacheStore`; TTL por defecto 5 min; `get` devuelve `undefined` si expiró; `set` no almacena si el valor es un `Error`; `invalidate` borra una entrada; `clear` vacía todo. Pruebas con fast-check: invariante «un valor recuperado antes de TTL siempre es el mismo que se almacenó»; caso de expiración con tiempo simulado (vi.useFakeTimers); caso de invalidación manual.

### BASE-04 — Implementar wrapper HTTP con timeout y cancelación [P]

**Archivo:** `src/services/http.ts`, `tests/unit/http.test.ts`
**RF:** RF-025
**Qué hace:** función `httpGet(url, signal?)` que usa `fetch` con `AbortController` interno; lanza `TimeoutError` a los 10 s mediante `AbortSignal.timeout`; lanza `NotFoundError` ante 404; lanza `NetworkError` ante fallo de red (`TypeError`); expone `cancel()`. Pruebas usando `vi.stubGlobal('fetch', ...)` para simular cada caso.

### BASE-05 — Implementar PokeApiClient

**Archivo:** `src/services/PokeApiClient.ts`, `tests/unit/PokeApiClient.test.ts`
**RF:** RF-001, RF-004, RF-005, RF-012, RF-014, RF-018, RF-024, RF-025
**Qué hace:** implementar los 5 métodos de `IPokeApiClient` usando `http.ts` y `cache.ts`; mapear respuestas de la API al dominio (stats, tipos, habilidades); `getPokemonIndex` solicita `limit=100000&offset=0` y extrae `id` desde la URL; `getAbility` elige `flavor_text_entries` en `es`, si no existe elige `en` y marca `descriptionLanguage: 'en'`; `cancelAll` aborta todas las señales activas. Pruebas con `pokeApiMock.ts` (fetch simulado); cubrir: índice cacheado (segunda llamada no genera petición), detalle de criatura, criatura sin imagen (`imageUrl: null`), habilidad en español, habilidad solo en inglés, `NotFoundError` ante 404, `TimeoutError` simulado, `cancelAll`.

### BASE-06 — Crear mock de PokéAPI para pruebas [P]

**Archivo:** `tests/mocks/pokeApiMock.ts`, `tests/mocks/fixtures/`
**RF:** —
**Qué hace:** implementar `MockPokeApiClient` que satisface `IPokeApiClient` con respuestas predefinidas; incluir fixtures JSON mínimos para: índice con 5 criaturas, detalle de Pikachu (id 25), detalle de criatura sin imagen, habilidad con descripción en español, habilidad sin descripción en español (solo inglés), lista de tipos, criaturas por tipo. Este mock es el que usan todas las pruebas de integración.

---

## HU-01 — Explorar el catálogo [P1] · MVP

> Prerrequisito: FASE BASE completa.

### HU01-01 — Prueba de integración: carga inicial del catálogo

**Archivo:** `tests/integration/catalog.test.ts`
**RF:** RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026
**Qué hace:** escribir pruebas antes de la implementación (TDD); usando `MockPokeApiClient`, verificar: lista renderiza tarjetas ordenadas por número; aparece `LoadingIndicator` antes de recibir datos; criatura sin imagen muestra placeholder; error de API muestra `ErrorMessage` con botón reintentar; timeout muestra mensaje de tiempo agotado. Estas pruebas deben fallar hasta que los componentes existan (rojo → verde).

### HU01-02 — Componente `LoadingIndicator` [P]

**Archivo:** `src/presentation/LoadingIndicator.ts`, `tests/unit/LoadingIndicator.test.ts`
**RF:** RF-023
**Qué hace:** componente que acepta `{ visible: boolean }`; cuando `visible: true` renderiza un elemento con `role="status"` y `aria-live="polite"` con texto en español; cuando `false` lo oculta; prueba verifica ambos estados y atributos ARIA.

### HU01-03 — Componente `ErrorMessage` [P]

**Archivo:** `src/presentation/ErrorMessage.ts`, `tests/unit/ErrorMessage.test.ts`
**RF:** RF-024, RF-025
**Qué hace:** acepta `{ message: string; retryable: boolean; onRetry: () => void }`; cuando `retryable: true` muestra botón "Reintentar" con `role="alert"`; cuando `false` omite el botón; prueba verifica texto, `role`, presencia de botón y que `onRetry` se invoca al hacer clic.

### HU01-04 — Componente `PokemonCard` [P]

**Archivo:** `src/presentation/PokemonCard.ts`, `tests/unit/PokemonCard.test.ts`
**RF:** RF-001, RF-003
**Qué hace:** acepta `{ entry: PokemonEntry; imageUrl: string | null; onClick: (id: number) => void }`; muestra imagen con `alt` = nombre de la criatura; cuando `imageUrl` es `null` muestra SVG placeholder con mismo espacio visual; muestra número nacional y nombre; prueba verifica imagen, placeholder, número, nombre y que `onClick` se dispara.

### HU01-05 — Componente `PokemonList` [P]

**Archivo:** `src/presentation/PokemonList.ts`, `tests/unit/PokemonList.test.ts`
**RF:** RF-001, RF-007, RF-016
**Qué hace:** acepta `{ items: PokemonEntry[]; onSelect: (id: number) => void }`; cuando `items` está vacío muestra mensaje de estado vacío en español; cuando tiene ítems renderiza una `PokemonCard` por entrada; prueba verifica renderizado de lista y estado vacío.

### HU01-06 — Componente `Pagination` [P]

**Archivo:** `src/presentation/Pagination.ts`, `tests/unit/Pagination.test.ts`
**RF:** RF-002
**Qué hace:** acepta `{ params: PaginationParams; onPrev: () => void; onNext: () => void }`; muestra "Página X de Y"; desactiva "Anterior" en página 1; desactiva "Siguiente" en última página; botones con `aria-label` accesible; prueba verifica texto, estado de botones y callbacks.

### HU01-07 — Controlador `CatalogController`

**Archivo:** `src/application/CatalogController.ts`, `tests/unit/CatalogController.test.ts`
**RF:** RF-001, RF-002, RF-023, RF-024, RF-025
**Qué hace:** implementa `IController<PokemonEntry[]>`; al `load()` pasa por `idle → loading → success`; ante error pasa a `error` con `retryable: true`; ante timeout pasa a `error` con mensaje de tiempo agotado; `nextPage()` / `prevPage()` actualizan la página y vuelven a `loading → success`; prueba verifica cada transición de estado con `MockPokeApiClient`.

### HU01-08 — Conectar catálogo en `main.ts` y CSS responsive

**Archivo:** `src/main.ts`, `src/styles/catalog.css`
**RF:** RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026
**Qué hace:** instanciar `CatalogController` y los componentes de presentación; suscribirse al estado y actualizar DOM; CSS con grid responsive que funcione desde 320 px (RF-026, `min-width: 320px`); verificar manualmente en viewport 320 px y en escritorio.

---

## HU-02 — Buscar una criatura [P1] · MVP

> Prerrequisito: HU01-07 (índice cacheado), BASE-05.

### HU02-01 — Prueba de integración: búsqueda

**Archivo:** `tests/integration/search.test.ts`
**RF:** RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027
**Qué hace:** pruebas (TDD) con `MockPokeApiClient`; verificar: búsqueda parcial sin distinción de mayúsculas; búsqueda por número exacto; nombres con caracteres especiales (Mr. Mime, Farfetch'd); sin resultados muestra mensaje; campo vacío no llama a la API; solo símbolos muestra validación; número inexistente muestra mensaje específico; doble confirmación rápida produce una sola petición; resultados paginados cuando superan 20.

### HU02-02 — Lógica de validación de término de búsqueda [P]

**Archivo:** `src/application/searchValidation.ts`, `tests/unit/searchValidation.test.ts`
**RF:** RF-008, RF-009
**Qué hace:** función pura `validateSearchTerm(term: string): ValidationResult`; devuelve `{ valid: true }` si hay al menos un carácter alfanumérico; `{ valid: false; reason: 'empty' }` si está vacío; `{ valid: false; reason: 'only-symbols' }` si solo contiene no-alfanuméricos; prueba con fast-check: todo string con al menos un alfanumérico es válido; todo string vacío es inválido.

### HU02-03 — Lógica de filtrado de índice en memoria [P]

**Archivo:** `src/application/searchFilter.ts`, `tests/unit/searchFilter.test.ts`
**RF:** RF-004, RF-005, RF-006, RF-010
**Qué hace:** función pura `filterIndex(index: PokemonEntry[], term: string): PokemonEntry[]`; si `term` es numérico: coincidencia exacta por `id`; si es texto: `name.includes(normalized(term))`; normalización: `toLowerCase().trim()`; prueba con fast-check: el índice filtrado siempre es subconjunto del índice original; prueba de casos especiales: `mr-mime`, `farfetchd`, número 25, número 99999 (no existe).

### HU02-04 — Componente `SearchBar` [P]

**Archivo:** `src/presentation/SearchBar.ts`, `tests/unit/SearchBar.test.ts`
**RF:** RF-004, RF-006, RF-008, RF-009, RF-011
**Qué hace:** acepta `{ onSearch: (term: string) => void; onClear: () => void }`; `<input>` con `<label>` asociado; botón "Buscar" y botón "Limpiar"; debounce de 300 ms para evitar doble confirmación (RF-011); muestra mensaje de validación inline cuando el término es inválido (sin llamar a `onSearch`); prueba verifica: label accesible, debounce (vi.useFakeTimers), mensaje de validación, `onSearch` no llamado con campo vacío o solo símbolos.

### HU02-05 — Controlador `SearchController`

**Archivo:** `src/application/SearchController.ts`, `tests/unit/SearchController.test.ts`
**RF:** RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027
**Qué hace:** implementa `IController<PokemonEntry[]>`; usa `filterIndex` y `validateSearchTerm`; pide el índice completo a `IPokeApiClient` (una sola vez, caché); ante búsqueda válida: `loading → success` con resultados paginados; ante sin resultados: `success` con array vacío (RF-007); ante número inexistente: `error` con mensaje específico (RF-010); `nextPage()` / `prevPage()` funcionan sobre el conjunto filtrado (RF-027); prueba verifica cada rama con `MockPokeApiClient`.

### HU02-06 — Conectar búsqueda en `main.ts`

**Archivo:** `src/main.ts`
**RF:** RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027
**Qué hace:** instanciar `SearchController` y conectar `SearchBar` al DOM junto al catálogo; cuando hay búsqueda activa, `PokemonList` muestra resultados de `SearchController`; cuando no hay búsqueda, muestra resultados de `CatalogController`; verificar manualmente los 10 escenarios de HU-02.

---

## HU-03 — Ver la ficha de una criatura [P2]

> Prerrequisito: HU-01 y HU-02 completas (MVP).

### HU03-01 — Prueba de integración: ficha y navegación de vuelta

**Archivo:** `tests/integration/detail.test.ts`
**RF:** RF-012, RF-013, RF-023, RF-024, RF-025
**Qué hace:** pruebas (TDD); verificar: ficha muestra todos los campos (imagen, número, nombre, tipos, altura, peso, habilidades, 6 stats); criatura sin imagen muestra placeholder; volver restaura término, tipos y página exactos (RF-013); error muestra `ErrorMessage`; timeout muestra mensaje específico.

### HU03-02 — Componente `DetailView` [P]

**Archivo:** `src/presentation/DetailView.ts`, `tests/unit/DetailView.test.ts`
**RF:** RF-012, RF-013
**Qué hace:** acepta `{ detail: PokemonDetail; onBack: () => void }`; renderiza todos los campos requeridos; botón "Volver" con texto en español; imagen con `alt`; placeholder cuando `imageUrl` es `null`; stats con etiquetas en español del mapeo de `data-model.md`; prueba verifica cada campo y el callback `onBack`.

### HU03-03 — Controlador `DetailController`

**Archivo:** `src/application/DetailController.ts`, `tests/unit/DetailController.test.ts`
**RF:** RF-012, RF-013, RF-023, RF-024, RF-025
**Qué hace:** implementa `IController<PokemonDetail>`; `load(idOrName)` transiciona `idle → loading → success | error`; antes de cargar, guarda `CatalogContext` (término + tipos + página); `back()` devuelve el `CatalogContext` guardado para que `main.ts` restaure el estado; prueba verifica guardado y restauración de contexto, `TimeoutError`, `NotFoundError`.

### HU03-04 — Conectar ficha en `main.ts`

**Archivo:** `src/main.ts`, `src/styles/detail.css`
**RF:** RF-012, RF-013, RF-023, RF-024, RF-025
**Qué hace:** al hacer clic en una tarjeta, mostrar `DetailView` (ocultar catálogo/búsqueda); al pulsar "Volver", ocultar ficha y restaurar catálogo con `CatalogContext`; CSS responsive para la ficha.

---

## HU-04 — Filtrar por tipo [P2]

> Prerrequisito: BASE-05, HU-01.

### HU04-01 — Prueba de integración: filtro por tipo

**Archivo:** `tests/integration/filter.test.ts`
**RF:** RF-014, RF-015, RF-016, RF-017, RF-028
**Qué hace:** pruebas (TDD); verificar: filtro por un tipo muestra solo criaturas de ese tipo; filtro por dos tipos aplica OR (unión); filtro combinado con búsqueda aplica ambos criterios; sin resultados muestra mensaje con opciones "limpiar filtros" y "limpiar búsqueda" por separado; deseleccionar tipo actualiza la lista inmediatamente; nota de máx. 2 tipos se muestra en el selector.

### HU04-02 — Lógica de filtro OR por tipos [P]

**Archivo:** `src/application/typeFilter.ts`, `tests/unit/typeFilter.test.ts`
**RF:** RF-014, RF-015
**Qué hace:** función pura `applyTypeFilter(index: PokemonEntry[], typeNameSets: Map<PokemonType, Set<string>>): PokemonEntry[]`; calcula la unión de los sets de criaturas para los tipos seleccionados; luego intersecta con `index` (que puede ya estar filtrado por búsqueda); prueba con fast-check: el resultado siempre es subconjunto de `index`; con un tipo seleccionado: resultado ⊆ criaturas de ese tipo.

### HU04-03 — Componente `TypeFilter` [P]

**Archivo:** `src/presentation/TypeFilter.ts`, `tests/unit/TypeFilter.test.ts`
**RF:** RF-014, RF-017, RF-028
**Qué hace:** acepta `{ types: PokemonType[]; selected: PokemonType[]; onChange: (selected: PokemonType[]) => void }`; renderiza botones/checkboxes por tipo con nombre en español; muestra nota informativa sobre el máximo de 2 tipos (RF-028); al seleccionar/deseleccionar llama a `onChange`; prueba verifica selección múltiple, nota visible, `onChange` con tipos correctos.

### HU04-04 — Controlador `FilterController`

**Archivo:** `src/application/FilterController.ts`, `tests/unit/FilterController.test.ts`
**RF:** RF-014, RF-015, RF-016, RF-017
**Qué hace:** implementa `IController<PokemonEntry[]>`; mantiene los tipos seleccionados; al cambiar tipos solicita `getPokemonByType` para cada nuevo tipo (caché); aplica `applyTypeFilter` sobre el resultado de `SearchController`; resultado vacío → estado `success` con array vacío; expone `clearTypes()` (solo quita tipos) y `clearSearch()` solo limpia el término; prueba verifica OR correcto, intersección con búsqueda, estado vacío.

### HU04-05 — Conectar filtro en `main.ts`

**Archivo:** `src/main.ts`, `src/styles/filter.css`
**RF:** RF-014, RF-015, RF-016, RF-017, RF-028
**Qué hace:** cargar lista de tipos con `getTypeList` al arrancar; mostrar `TypeFilter`; coordinar `SearchController` + `FilterController` para producir la lista final; botones "limpiar filtros" y "limpiar búsqueda" con comportamiento independiente (RF-016).

---

## HU-05 — Consultar el detalle de una habilidad [P2]

> Prerrequisito: HU-03.

### HU05-01 — Prueba de integración: detalle de habilidad

**Archivo:** `tests/integration/ability.test.ts`
**RF:** RF-018, RF-019, RF-023, RF-024, RF-025
**Qué hace:** pruebas (TDD); verificar: habilidad con descripción en español muestra descripción y sin nota; habilidad sin descripción en español muestra descripción en inglés con nota en español; cerrar habilidad vuelve a la ficha sin perder datos; error muestra `ErrorMessage`; timeout muestra mensaje específico.

### HU05-02 — Componente `AbilityDetail` [P]

**Archivo:** `src/presentation/AbilityDetail.ts`, `tests/unit/AbilityDetail.test.ts`
**RF:** RF-018, RF-019
**Qué hace:** acepta `{ detail: AbilityDetail; onClose: () => void }`; cuando `descriptionLanguage === 'es'` muestra solo nombre y descripción en español; cuando `'en'` muestra nombre, descripción en inglés y nota `i18n.descripcionNoDisponible`; botón "Cerrar" llama a `onClose`; prueba verifica ambas ramas y que la nota aparece/no aparece según idioma.

### HU05-03 — Controlador `AbilityController`

**Archivo:** `src/application/AbilityController.ts`, `tests/unit/AbilityController.test.ts`
**RF:** RF-018, RF-019, RF-023, RF-024, RF-025
**Qué hace:** implementa `IController<AbilityDetail>`; `load(name)` transiciona `idle → loading → success | error`; `close()` transiciona a `idle` (no descarta los datos de la ficha padre); prueba verifica descripción en español, descripción en inglés con `descriptionLanguage`, `TimeoutError`, `NetworkError`.

### HU05-04 — Conectar habilidad en `main.ts`

**Archivo:** `src/main.ts`
**RF:** RF-018, RF-019, RF-023, RF-024, RF-025
**Qué hace:** al hacer clic en una habilidad dentro de `DetailView`, mostrar `AbilityDetail` sobre la ficha (sin descartar el `PokemonDetail`); al cerrar, volver a `DetailView` con los datos intactos.

---

## HU-06 — Comparar dos criaturas [P3]

> Prerrequisito: BASE-05. Independiente de HU-03..HU-05.

### HU06-01 — Prueba de integración: comparación

**Archivo:** `tests/integration/compare.test.ts`
**RF:** RF-020, RF-021, RF-022, RF-023, RF-024, RF-025, RF-029
**Qué hace:** pruebas (TDD); verificar: acceso desde navegación principal muestra dos selectores; estadística mayor identificada con señal textual/simbólica; empate identificado con señal de empate; misma criatura en ambos slots muestra mensaje en español y no hace petición; error en una criatura muestra mensaje identificando cuál; timeout muestra mensaje; indicador de carga mientras se cargan ambas criaturas.

### HU06-02 — Lógica de comparación de stats [P]

**Archivo:** `src/application/compareStats.ts`, `tests/unit/compareStats.test.ts`
**RF:** RF-020, RF-021
**Qué hace:** función pura `compareStats(a: PokemonDetail, b: PokemonDetail): Record<BaseStat['name'], StatComparison>`; para cada stat: si `a > b` → `'A'`, si `b > a` → `'B'`, si igual → `'tie'`; prueba con fast-check: si todos los stats de A son mayores → todos son `'A'`; simetría: `compareStats(a, b)` es el inverso de `compareStats(b, a)` para valores no empatados; empate verificado con criatura consigo misma.

### HU06-03 — Componente `ComparePanel` [P]

**Archivo:** `src/presentation/ComparePanel.ts`, `tests/unit/ComparePanel.test.ts`
**RF:** RF-020, RF-021, RF-029
**Qué hace:** acepta `{ result: CompareResult | null; slotA: PokemonDetail | null; slotB: PokemonDetail | null; onSelectA: ...; onSelectB: ... }`; dos columnas con `PokemonCard` y stats; por cada stat donde `statResults[name] === 'A'`: muestra etiqueta textual "▲" o "Mayor" junto al valor de A; `=== 'B'`: junto al valor de B; `=== 'tie'`: muestra "=" o "Empate" sin destacar ninguna; la señal NO depende solo del color (RF-020, RF-021); prueba verifica etiquetas textuales para cada caso y que el estado sin selección muestra selectores vacíos.

### HU06-04 — Controlador `CompareController`

**Archivo:** `src/application/CompareController.ts`, `tests/unit/CompareController.test.ts`
**RF:** RF-020, RF-021, RF-022, RF-023, RF-024, RF-025, RF-029
**Qué hace:** gestiona dos slots; `selectA(idOrName)` y `selectB(idOrName)` cargan con `getPokemonDetail`; antes de comparar valida que `slotA.id !== slotB.id` (RF-022); cuando ambos están listos calcula `compareStats`; estado `error` diferencia qué slot falló (RF-024 de HU-06 Esc. 4); indicador de carga mientras cualquier slot está en `loading` (RF-023 / HU-06 Esc. 6); prueba cubre todos los escenarios.

### HU06-05 — Conectar comparación en `main.ts` y navegación

**Archivo:** `src/main.ts`, `src/styles/compare.css`
**RF:** RF-029, RF-020, RF-021, RF-022, RF-023, RF-024, RF-025
**Qué hace:** añadir enlace/botón "Comparar" en la navegación principal; al activar la sección, mostrar `ComparePanel` con `CompareController`; cada slot tiene `SearchBar` propio para buscar y seleccionar una criatura; CSS responsive para vista de dos columnas que colapsa en móvil.

---

## Trazabilidad RF → Tarea

| RF | Tarea(s) que lo cubren |
|---|---|
| RF-001 | HU01-04, HU01-05, HU01-07, HU01-08 |
| RF-002 | HU01-06, HU01-07, HU01-08 |
| RF-003 | HU01-04, HU01-05, HU01-08 |
| RF-004 | HU02-03, HU02-04, HU02-05, HU02-06 |
| RF-005 | HU02-03, HU02-05, HU02-06 |
| RF-006 | HU02-03, HU02-05, HU02-06 |
| RF-007 | HU01-05, HU02-05, HU02-06 |
| RF-008 | HU02-02, HU02-04, HU02-05 |
| RF-009 | HU02-02, HU02-04, HU02-05 |
| RF-010 | HU02-03, HU02-05, HU02-06 |
| RF-011 | HU02-04, HU02-05, HU02-06 |
| RF-012 | HU03-02, HU03-03, HU03-04 |
| RF-013 | HU03-03, HU03-04 |
| RF-014 | HU04-02, HU04-03, HU04-04, HU04-05 |
| RF-015 | HU04-02, HU04-04, HU04-05 |
| RF-016 | HU01-05, HU04-04, HU04-05 |
| RF-017 | HU04-03, HU04-04, HU04-05 |
| RF-018 | BASE-05, HU05-02, HU05-03, HU05-04 |
| RF-019 | HU05-02, HU05-03, HU05-04 |
| RF-020 | HU06-02, HU06-03, HU06-04, HU06-05 |
| RF-021 | HU06-02, HU06-03, HU06-04, HU06-05 |
| RF-022 | HU06-04, HU06-05 |
| RF-023 | HU01-02, HU01-07, HU03-03, HU05-03, HU06-04 |
| RF-024 | BASE-02, BASE-05, HU01-03, HU01-07, HU03-03, HU05-03, HU06-04 |
| RF-025 | BASE-04, BASE-05, HU01-03, HU01-07, HU03-03, HU05-03, HU06-04 |
| RF-026 | HU01-08 |
| RF-027 | HU01-06, HU02-05, HU02-06 |
| RF-028 | HU04-03, HU04-05 |
| RF-029 | HU06-03, HU06-04, HU06-05 |

---

## Recuento de tareas

| Fase | Tareas | [P] |
|---|---|---|
| PREP | 6 | 5 |
| BASE | 6 | 4 |
| HU-01 | 8 | 5 |
| HU-02 | 6 | 3 |
| HU-03 | 4 | 1 |
| HU-04 | 5 | 2 |
| HU-05 | 4 | 1 |
| HU-06 | 5 | 2 |
| **Total** | **44** | **23** |

---

*Documento pendiente de revisión humana (principio S-04). Una vez aprobado, la siguiente fase es `analyze`.*
