# Informe de Análisis de Consistencia — PokeDex Explorer

**Versión:** 1.0.0
**Fecha:** 27/10/2026
**Fase SDD:** analyze
**Artefactos analizados:**
- `constitution.md` v1.1.0
- `specify.md` v1.3.0
- `plan.md` v1.0.0
- `tasks.md` v1.0.0
- `data-model.md` v1.0.0
- `research.md` v1.0.0
- `contracts/IPokeApiClient.ts`, `ICacheStore.ts`, `IController.ts`, `IComponent.ts`

**Estado:** Pendiente de revisión humana (S-04)

---

## Resumen Ejecutivo

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico | 2 |
| 🟠 Alto    | 5 |
| 🟡 Medio   | 6 |
| 🔵 Bajo    | 5 |
| **Total**  | **18** |

Los hallazgos críticos afectan a la trazabilidad de casos límite hacia pruebas automatizadas (CL-07, CL-09) y a una inconsistencia de comportamiento en el estado sin resultados entre spec y plan. Deben resolverse antes de iniciar `implement` (constitución S-05).

---

## Hallazgos Críticos 🔴

### AN-01 — CL-07 y CL-09 no tienen tarea asignada
**Severidad:** Crítico
**Archivo / sección:** `tasks.md` → Trazabilidad RF→Tarea; `specify.md` § 7 Casos Límite
**Descripción:**
La spec exige (CE-06) que «10 de 10 casos límite tienen prueba automatizada en estado pasado». Sin embargo, la tabla de trazabilidad de `tasks.md` no asigna ninguna tarea a CL-07 («Pérdida de conexión durante una operación» → RF-024) ni a CL-09 («Uso en pantalla de 320 px de ancho» → RF-026).

- RF-024 sí está cubierto por BASE-02, BASE-05 y HU01-03, pero ninguna de esas tareas menciona explícitamente el caso CL-07 (pérdida de conexión en curso, distinto de error al iniciar).
- RF-026 está cubierto solo por HU01-08, que indica «verificar manualmente», lo que viola P-01 («al menos una prueba automatizada»).

**Impacto:** CE-06 no se cumplirá sin prueba automatizada de CL-07 y CL-09. Constitución P-01 violada para CL-09.
**Corrección sugerida:** agregar sub-tarea en BASE-05 o HU01-03 para CL-07 (simular `AbortError` mientras una petición está en curso); agregar sub-tarea en HU01-08 o nueva tarea HU01-09 con prueba automatizada de viewport 320 px usando JSDOM/vitest-browser.

---

### AN-02 — Estado sin resultados: comportamiento inconsistente entre spec y plan
**Severidad:** Crítico
**Archivo / sección:** `specify.md` § RF-007 / HU-02 Esc. 5; `plan.md` § 7 Estrategia de búsqueda; `tasks.md` HU02-05
**Descripción:**
RF-007 dice: «la aplicación muestra un mensaje en español y ofrece limpiar el término». HU-02 Esc. 5 añade: «se ofrece la posibilidad de limpiar la búsqueda **y volver al catálogo completo**».

El plan (§7) y la tarea HU02-05 modelan el caso sin resultados como `success` con array vacío, dejando al componente `PokemonList` la responsabilidad de mostrar el estado vacío. Eso es coherente, pero ninguna tarea especifica que `PokemonList` (HU01-05) ni `SearchController` (HU02-05) deban emitir o gestionar la acción «volver al catálogo completo» (limpiar búsqueda + restaurar catálogo). El componente `SearchBar` solo tiene `onClear`, cuyo efecto en HU02-06 no está descrito.

**Impacto:** El escenario GWT de HU-02 Esc. 5 no tiene tarea que lo implemente íntegramente; puede quedar sin verificar en pruebas de integración.
**Corrección sugerida:** aclarar en HU02-05 o HU02-06 que `onClear` de `SearchBar` limpia el término Y activa `CatalogController`; añadir ese caso en `tests/integration/search.test.ts` (HU02-01).

---

## Hallazgos Altos 🟠

### AN-03 — RF-027 asigna `Pagination` (HU01-06) como cobertura, pero HU01-06 no declara RF-027
**Severidad:** Alto
**Archivo / sección:** `tasks.md` → Trazabilidad RF-027; tarea HU01-06
**Descripción:**
La tabla de trazabilidad lista HU01-06 como cobertura de RF-027 («paginación de resultados de búsqueda»). Sin embargo, la tarea HU01-06 declara únicamente RF-002 («paginación del catálogo»). El componente `Pagination` es el mismo para ambos casos, pero RF-027 requiere que la paginación opere sobre el conjunto filtrado por búsqueda, no solo sobre el catálogo. Esta distinción no aparece en las pruebas de HU01-06.
**Impacto:** RF-027 puede quedar sin cobertura de prueba unitaria explícita en el componente; solo la prueba de integración HU02-01 lo cubre.
**Corrección sugerida:** añadir RF-027 al campo RF de HU01-06 o documentar que `Pagination` es agnóstico a la fuente y que RF-027 se verifica en HU02-01 y HU02-05.

---

### AN-04 — `FilterController.clearSearch()` viola la separación de controladores
**Severidad:** Alto
**Archivo / sección:** `tasks.md` → HU04-04; `plan.md` § 5 Controladores
**Descripción:**
La tarea HU04-04 indica que `FilterController` expone un método `clearSearch()` que «solo limpia el término». Limpiar el término de búsqueda es responsabilidad de `SearchController`, no de `FilterController` (C-01, responsabilidad única). Si `FilterController` mantiene o limpia el término, duplica estado con `SearchController`, generando riesgo de divergencia.
**Impacto:** Viola C-01; puede generar estados inconsistentes entre controladores cuando se limpian de forma independiente.
**Corrección sugerida:** eliminar `clearSearch()` de `FilterController`; que `main.ts` coordine directamente `SearchController.clear()` ante el evento del botón «limpiar búsqueda», y que `FilterController` solo gestione tipos.

---

### AN-05 — `IPokeApiClient.getPokemonByType` devuelve `PokemonEntry[]` pero el plan necesita `Set<string>`
**Severidad:** Alto
**Archivo / sección:** `contracts/IPokeApiClient.ts` → `getPokemonByType`; `plan.md` § 8 Filtro por tipo; `tasks.md` HU04-02
**Descripción:**
El contrato `IPokeApiClient` define `getPokemonByType(typeName): Promise<PokemonEntry[]>`. El plan (§8) describe que se une el resultado de varias llamadas como `Set<string>` de nombres. La tarea HU04-02 recibe `Map<PokemonType, Set<string>>` como argumento de `applyTypeFilter`.

La conversión de `PokemonEntry[]` a `Set<string>` debe ocurrir en algún lugar (servicio o controlador), pero ninguna tarea la asigna explícitamente. Además, devolver `PokemonEntry[]` del servicio es más útil (tiene `id` y `displayName`), pero la firma del contrato no especifica si el `id` viene poblado desde el endpoint `/type/{name}`, que solo devuelve `{ name, url }`, no el `id` directamente.
**Impacto:** Riesgo de implementación incorrecta del cliente o de la función de filtro; el `id` extraído de la URL puede fallar para formas alternativas.
**Corrección sugerida:** documentar en `IPokeApiClient` que `getPokemonByType` devuelve entradas con `id` extraído de la URL (igual que `getPokemonIndex`), o cambiar el tipo de retorno a `Pick<PokemonEntry, 'name'>[]` para reflejar la realidad del endpoint.

---

### AN-06 — Ninguna tarea cubre la navegación principal (`<nav>`) como elemento accesible
**Severidad:** Alto
**Archivo / sección:** `tasks.md` → HU06-05; `plan.md` § 11 Accesibilidad; `specify.md` CE-04
**Descripción:**
El plan (§11) establece que la navegación usa `<nav>`. HU06-05 agrega el enlace «Comparar» a la navegación principal. Sin embargo, ninguna tarea crea un componente o módulo de navegación principal (`<nav>`) con prueba asociada; la navegación aparece de forma orgánica en `main.ts` sin tarea dedicada.

CE-04 exige «sin fallos en auditoría automatizada de accesibilidad». Un `<nav>` sin `aria-label` o sin estructura semántica correcta generaría fallos en herramientas como axe-core. Ninguna tarea configura o ejecuta una auditoría de accesibilidad automatizada.
**Impacto:** CE-04 no tiene tarea verificable; la navegación puede carecer de semántica ARIA correcta.
**Corrección sugerida:** crear tarea PREP-07 o HU01-09 que configure `axe-core` o `@axe-core/vitest` y añada prueba de auditoría de accesibilidad sobre el DOM renderizado; documentar la estructura del `<nav>` en una tarea de HU06-05 o en una tarea de layout global.

---

### AN-07 — La tarea PREP-05 «copia» tipos de `data-model.md`, creando riesgo de deriva
**Severidad:** Alto
**Archivo / sección:** `tasks.md` → PREP-05; `constitution.md` S-08 Validación y deriva
**Descripción:**
PREP-05 indica «copiar los tipos de `data-model.md` a `src/domain/types.ts`». Si en el futuro `data-model.md` se actualiza, la copia puede quedar desincronizada. La constitución S-08 exige que «especificación y código se modifican en la misma revisión de cambios». Sin un mecanismo de verificación, la deriva entre `data-model.md` y `types.ts` puede pasar desapercibida.
**Impacto:** `types.ts` puede divergir de `data-model.md`; violación latente de S-08.
**Corrección sugerida:** reformular PREP-05 como «crear `src/domain/types.ts` basándose en `data-model.md` como fuente de verdad, marcando en ambos que son sincronizados»; añadir como criterio de done de PREP-05 que toda enmienda futura a `data-model.md` debe producir un commit que actualice también `types.ts`.

---

## Hallazgos Medios 🟡

### AN-08 — `AbilityRef` en `data-model.md` no incluye el nombre localizado
**Severidad:** Medio
**Archivo / sección:** `data-model.md` § 1 Tipos de dominio → `AbilityRef`; `specify.md` RF-012
**Descripción:**
`AbilityRef` solo contiene `{ name: string; isHidden: boolean }`. RF-012 exige que la ficha muestre «lista de habilidades», que implica mostrar el nombre de la habilidad en español al usuario. El slug (`name`) es interno de la API (e.g., `overgrow`); el nombre localizado en español (e.g., «Espesura») solo se obtiene desde `/ability/{name}` (campo `names[].name` con `language.name === 'es'`).

Si la ficha solo dispone de `AbilityRef`, mostrar el nombre en español requiere una petición por habilidad al cargar la ficha, lo que contradice el objetivo de rendimiento (R-02, carga < 200 ms de interacción) o implica una petición no documentada.
**Impacto:** `DetailView` no puede mostrar nombres de habilidades en español sin peticiones adicionales no modeladas; posible degradación de rendimiento o UX incorrecta.
**Corrección sugerida:** añadir `displayName?: string` a `AbilityRef` (a rellenar opcionalmente con la traducción española cuando esté disponible desde el detalle de la criatura, que sí incluye los nombres localizados en `abilities[].ability.name`), o documentar explícitamente que los nombres de habilidades se muestran en inglés en la ficha y solo se traducen al consultar el detalle.

---

### AN-09 — `CatalogController` no declara cómo obtiene las imágenes
**Severidad:** Medio
**Archivo / sección:** `tasks.md` → HU01-07; `plan.md` § 7 Estrategia de búsqueda; `contracts/IPokeApiClient.ts`
**Descripción:**
`CatalogController` usa `getPokemonIndex()` que devuelve `PokemonEntry[]`. `PokemonEntry` contiene `id`, `name`, `displayName` pero **no** `imageUrl`. Sin embargo, `PokemonCard` (HU01-04) acepta `{ imageUrl: string | null }`. Las imágenes solo están disponibles desde `getPokemonDetail(id)`.

El plan no especifica si las imágenes se obtienen de forma diferida (lazy) por cada tarjeta o en un bloque al cargar la página. Si son diferidas, se necesita una petición por criatura visible (hasta 20), lo que puede afectar R-01/R-02. Si se pre-cargan, se necesita un mecanismo no modelado en los contratos.
**Impacto:** el flujo de datos de HU-01 está incompleto; `PokemonCard` no puede recibir `imageUrl` solo con `PokemonEntry`.
**Corrección sugerida:** una de dos: (a) añadir `imageUrl: string | null` a `PokemonEntry` (que el cliente construye desde la URL canónica de sprites sin hacer petición adicional: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`), que es la solución más eficiente; o (b) documentar el mecanismo de carga diferida de imágenes en el plan.

---

### AN-10 — `IController` no expone `load()`, `nextPage()` ni `retry()`
**Severidad:** Medio
**Archivo / sección:** `contracts/IController.ts`; `tasks.md` → HU01-07, HU02-05, HU04-04
**Descripción:**
`IController<TData>` solo define `state`, `subscribe` y `destroy`. Los controladores concretos añaden métodos como `load()`, `nextPage()`, `prevPage()`, `retry()`, `selectA()`, `selectB()`, etc. Al no estar en el contrato base, `main.ts` debe conocer el tipo concreto de cada controlador para llamar a estos métodos, lo que acopla la capa de orquestación a las implementaciones.
**Impacto:** no viola ningún principio de la constitución directamente, pero debilita el valor de los contratos como frontera entre capas (C-02). Puede complicar las pruebas de `main.ts`.
**Corrección sugerida:** aceptar la limitación como decisión de diseño explícita (documentarla en `IController.ts`) o crear interfaces específicas por controlador en `contracts/` que extiendan `IController`.

---

### AN-11 — El debounce de `SearchBar` puede enmascarar RF-011
**Severidad:** Medio
**Archivo / sección:** `tasks.md` → HU02-04; `specify.md` RF-011 / HU-02 Esc. 9
**Descripción:**
HU02-04 implementa un debounce de 300 ms en `SearchBar` como mecanismo para evitar doble confirmación (RF-011). Sin embargo, RF-011 describe el caso de «doble confirmación en rápida sucesión», que implica dos pulsaciones del botón «Buscar» o dos eventos «Enter» en < 300 ms. El debounce previene la segunda llamada solo si el usuario no ha liberado el teclado; si pulsa Enter dos veces con > 300 ms de separación, genera dos peticiones igualmente.

Además, la spec describe el comportamiento esperado como «la aplicación realiza **una sola petición**», lo que requiere cancelar la petición anterior en el controlador, no solo en el componente.
**Impacto:** RF-011 puede no estar completamente satisfecho con solo debounce en `SearchBar`; el controlador debe cancelar peticiones previas en curso.
**Corrección sugerida:** añadir en HU02-05 que `SearchController` cancela cualquier petición pendiente antes de iniciar una nueva; el debounce en `SearchBar` es una optimización complementaria, no la solución única.

---

### AN-12 — Falta tarea para `src/styles/` globales y sistema de diseño consistente
**Severidad:** Medio
**Archivo / sección:** `tasks.md` (ninguna tarea crea CSS base); `constitution.md` U-01, U-02
**Descripción:**
Las tareas HU01-08, HU03-04, HU04-05 y HU06-05 crean CSS por historia (`catalog.css`, `detail.css`, `filter.css`, `compare.css`). No existe tarea que defina: variables CSS globales (paleta de colores, tipografía, espaciado), reset/normalize, `index.css` base, ni que valide la consistencia visual entre secciones (U-01). La constitución exige que el sistema de diseño sea coherente en toda la aplicación.
**Impacto:** sin CSS base compartido, cada historia puede aplicar estilos inconsistentes; U-01 puede no cumplirse.
**Corrección sugerida:** añadir tarea PREP-07 (o HU01-08 ampliada) que cree `src/styles/global.css` con variables de diseño, reset y tipografía base compartida por todas las historias.

---

### AN-13 — `AsyncState.error` no modela el identificador de slot fallido en HU-06 Esc. 4
**Severidad:** Medio
**Archivo / sección:** `data-model.md` § 1 → `AsyncState`; `specify.md` HU-06 Esc. 4; `tasks.md` HU06-04
**Descripción:**
HU-06 Esc. 4 exige: «se muestra un mensaje de error identificando cuál de las dos criaturas no pudo cargarse». `AsyncState` solo tiene `{ status: 'error'; message: string; retryable: boolean }`. Para identificar qué slot (A o B) falló, `CompareController` necesita o bien dos `AsyncState` independientes (uno por slot) o bien extender el error con un campo adicional.

La tarea HU06-04 menciona que «el estado `error` diferencia qué slot falló» pero no especifica el mecanismo de modelado.
**Impacto:** `AsyncState` genérico es insuficiente para HU-06 Esc. 4 sin adaptación; riesgo de que la implementación no cumpla el escenario GWT.
**Corrección sugerida:** documentar en HU06-04 que `CompareController` mantiene dos `AsyncState` independientes (`stateA` y `stateB`), uno por slot, en lugar de un único `AsyncState<CompareResult>`.

---

## Hallazgos Bajos 🔵

### AN-14 — Registro de cambios de `specify.md` muestra v1.3.0 antes de v1.2.0
**Severidad:** Bajo
**Archivo / sección:** `specify.md` § 11 Registro de Cambios
**Descripción:**
El orden de las versiones en el registro es `v1.1.0` → `v1.3.0` → `v1.2.0` → `v1.0.0`. Las versiones no están en orden descendente cronológico. Esto no afecta a la funcionalidad pero dificulta la lectura del historial.
**Corrección sugerida:** reordenar el registro como `v1.3.0` → `v1.2.0` → `v1.1.0` → `v1.0.0`.

---

### AN-15 — `research.md` menciona `AbortSignal.timeout` pero `BASE-04` usa `AbortController` interno
**Severidad:** Bajo
**Archivo / sección:** `tasks.md` → BASE-04; `research.md` § 7 Compatibilidad
**Descripción:**
BASE-04 describe: «lanza `TimeoutError` a los 10 s mediante `AbortSignal.timeout`». `research.md` (§7) lista la compatibilidad de `AbortController` (Chrome 66+) pero no la de `AbortSignal.timeout` (Chrome 103+, Firefox 100+, Safari 16+). Para targets más antiguos `AbortSignal.timeout` no existe; habría que usar `setTimeout` + `AbortController` manualmente.
**Impacto:** si el target de compatibilidad incluye Chrome < 103 o Safari < 16, `AbortSignal.timeout` no funciona. El plan no fija explícitamente el target mínimo de versión de navegador más allá de «ES2020+».
**Corrección sugerida:** añadir `AbortSignal.timeout` a la tabla de compatibilidad de `research.md` con sus versiones mínimas, o cambiar la implementación de BASE-04 a `setTimeout` + `AbortController` manual para mayor compatibilidad.

---

### AN-16 — `tasks.md` declara `PREP-05` como [P] pero depende de `PREP-01`
**Severidad:** Bajo
**Archivo / sección:** `tasks.md` → PREP-01, PREP-05
**Descripción:**
PREP-05 crea directorios dentro de `src/`, que deben existir para que el proyecto Vite generado en PREP-01 tenga sentido. Si PREP-05 se ejecuta en paralelo con PREP-01 y PREP-01 no ha terminado aún, los directorios creados manualmente pueden ser sobreescritos por `npm create vite@latest`.
**Corrección sugerida:** añadir nota en PREP-05 indicando que depende de PREP-01; o quitar la marca [P] de PREP-05.

---

### AN-17 — `plan.md` § 9 describe `CatalogController` como destino de restauración pero no es quien guarda el contexto
**Severidad:** Bajo
**Archivo / sección:** `plan.md` § 9 Restauración de contexto; `tasks.md` HU03-03
**Descripción:**
El plan dice que «`back()` restaura ese estado en `SearchController` + `FilterController` + `CatalogController`», pero en `tasks.md` HU03-03 se indica que `back()` «devuelve el `CatalogContext` guardado para que `main.ts` restaure el estado». Ambas formulaciones son compatibles (main.ts es el que llama a los tres controladores), pero la redacción del plan puede dar a entender que `DetailController` llama directamente a los otros controladores, violando C-01.
**Corrección sugerida:** aclarar en `plan.md` § 9 que `main.ts` es el orquestador que recibe `CatalogContext` de `DetailController` y lo distribuye a los controladores pertinentes; los controladores no se llaman entre sí.

---

### AN-18 — Término «debounce» usado en tasks.md sin definir el tiempo en la spec
**Severidad:** Bajo
**Archivo / sección:** `tasks.md` → HU02-04; `specify.md` RF-011
**Descripción:**
La tarea HU02-04 fija un debounce de 300 ms. Este valor es una decisión de implementación que no aparece en la spec ni en el plan; RF-011 solo dice «una sola petición». 300 ms es razonable, pero al estar en `tasks.md` sin trazabilidad a la spec ni al plan, puede cambiarse sin notarlo como una divergencia.
**Corrección sugerida:** añadir en `plan.md` una decisión explícita sobre el debounce (valor y justificación), o simplemente documentar en HU02-04 que «el valor exacto de debounce es una decisión de implementación».

---

## Verificación de Cobertura RF

Todos los RF-001 a RF-029 tienen al menos una tarea asignada en la tabla de trazabilidad de `tasks.md`. No se detectan RF sin tarea.

| Verificación | Resultado |
|---|---|
| RF sin tarea | ✅ Ninguno (29/29 cubiertos) |
| Tareas sin RF (PREP y BASE son válidas) | ✅ Ninguna anomalía |
| Escenarios GWT sin tarea asociada | ⚠️ HU-02 Esc. 5 (acción «volver al catálogo») — AN-02 |
| Casos límite sin prueba automatizada | ⚠️ CL-07, CL-09 — AN-01 |

---

## Verificación de Principios de la Constitución v1.1.0

| Principio | Estado | Hallazgo |
|---|---|---|
| C-01 Responsabilidad única | ⚠️ | AN-04: `FilterController.clearSearch()` viola responsabilidad única |
| C-02 Separación de capas | ⚠️ | AN-10: `IController` no cierra la frontera completamente |
| C-03 Manejo de errores | ⚠️ | AN-13: `AsyncState` insuficiente para HU-06 Esc. 4 |
| C-04 Sin secretos | ✅ | PokéAPI es pública; no se detectan secretos |
| P-01 Pruebas con funcionalidad | ⚠️ | AN-01: CL-09 solo tiene verificación manual |
| P-02 Cobertura 80 % | ✅ | Umbral configurado en PREP-04 |
| P-03 API simulada | ✅ | `MockPokeApiClient` definido en BASE-06 |
| P-04 Sin pruebas rotas | ✅ | CI bloquea en PREP-06 |
| U-01 Diseño consistente | ⚠️ | AN-12: falta tarea de CSS global/sistema de diseño |
| U-02 Responsive | ⚠️ | AN-01: RF-026 solo tiene verificación manual |
| U-03 Estados de carga/error | ✅ | Cubierto por LoadingIndicator y ErrorMessage |
| U-04 Mensajes en español | ✅ | Centralizado en `es.ts` (PREP-05) |
| U-05 Accesibilidad | ⚠️ | AN-06: CE-04 sin tarea de auditoría automatizada |
| R-01..R-05 Rendimiento | ⚠️ | AN-09: flujo de imágenes en catálogo no modelado |
| S-01..S-08 SDD | ✅ | Orden de fases respetado |
| G-01..G-02 Gobernanza | ✅ | Sin enmiendas no documentadas detectadas |

---

## Tabla Resumen de Hallazgos

| ID | Severidad | Tipo | Archivo principal | Descripción breve |
|----|-----------|------|-------------------|-------------------|
| AN-01 | 🔴 Crítico | RF sin prueba automatizada | `tasks.md` | CL-07 y CL-09 sin tarea de prueba |
| AN-02 | 🔴 Crítico | Contradicción spec/plan | `specify.md`, `tasks.md` | Acción «volver al catálogo» de HU-02 Esc. 5 sin tarea |
| AN-03 | 🟠 Alto | Trazabilidad incorrecta | `tasks.md` | RF-027 en HU01-06 sin escenario de búsqueda |
| AN-04 | 🟠 Alto | Violación C-01 | `tasks.md` HU04-04 | `FilterController.clearSearch()` viola responsabilidad única |
| AN-05 | 🟠 Alto | Contrato ambiguo | `contracts/IPokeApiClient.ts` | `getPokemonByType` devuelve `PokemonEntry[]` pero el `id` no está en el endpoint |
| AN-06 | 🟠 Alto | CE sin tarea | `tasks.md` | CE-04 (accesibilidad) sin prueba automatizada de auditoría |
| AN-07 | 🟠 Alto | Riesgo de deriva S-08 | `tasks.md` PREP-05 | Tipos «copiados» pueden divergir de `data-model.md` |
| AN-08 | 🟡 Medio | Modelo incompleto | `data-model.md` | `AbilityRef` sin nombre localizado para mostrar en ficha |
| AN-09 | 🟡 Medio | Flujo de datos incompleto | `plan.md` § 7 | `PokemonEntry` sin `imageUrl`; `PokemonCard` no puede renderizar |
| AN-10 | 🟡 Medio | Contrato insuficiente | `contracts/IController.ts` | `IController` sin métodos de acción; acoplamiento en `main.ts` |
| AN-11 | 🟡 Medio | RF parcialmente cubierto | `tasks.md` HU02-04 | Debounce solo en UI no garantiza una petición única en el controlador |
| AN-12 | 🟡 Medio | Violación U-01 | `tasks.md` | Sin tarea de CSS global; riesgo de inconsistencia visual |
| AN-13 | 🟡 Medio | Modelo insuficiente | `data-model.md` → `AsyncState` | `AsyncState` no modela slot fallido de HU-06 Esc. 4 |
| AN-14 | 🔵 Bajo | Redacción | `specify.md` § 11 | Registro de cambios fuera de orden cronológico |
| AN-15 | 🔵 Bajo | Compatibilidad | `research.md` § 7 | `AbortSignal.timeout` no documentado en compatibilidad |
| AN-16 | 🔵 Bajo | Dependencia de tarea | `tasks.md` PREP-05 | PREP-05 marcada [P] pero depende de PREP-01 |
| AN-17 | 🔵 Bajo | Redacción ambigua | `plan.md` § 9 | `back()` restaura «en» controladores vs. «a través de» `main.ts` |
| AN-18 | 🔵 Bajo | Decisión no trazada | `tasks.md` HU02-04 | Valor de debounce (300 ms) no en spec ni en plan |

---

## Requisitos sin criterio verificable

Todos los RF tienen al menos un escenario GWT en `specify.md`. No se detectan RF sin criterio de aceptación verificable.

Los siguientes CE tienen criterio verificable pero **sin tarea automatizada** que los ejercite:

| CE | Descripción | Hallazgo |
|----|-------------|---------|
| CE-04 | Accesibilidad WCAG 2.1 AA | AN-06: sin tarea de auditoría |
| CE-06 | 10/10 casos límite con prueba verde | AN-01: CL-07, CL-09 sin prueba |

---

## Conclusión

Los dos hallazgos críticos (AN-01 y AN-02) deben resolverse antes de iniciar `implement` (principio S-05: `analyze` sin hallazgos críticos abiertos). Los cinco hallazgos altos son recomendables resolver en la misma fase; en particular AN-04 (viola C-01) y AN-09 (flujo de datos bloqueante). Los hallazgos medios y bajos pueden resolverse durante la implementación siempre que se registren las decisiones tomadas.

---

*Documento pendiente de revisión humana (principio S-04). Una vez que los hallazgos críticos estén resueltos y este informe sea aprobado, la siguiente fase es `implement`.*
