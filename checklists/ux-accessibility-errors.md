# UX, Accesibilidad y Manejo de Errores — Checklist de Calidad de Requisitos: PokeDex Explorer

**Propósito:** Validar la completitud, claridad, consistencia y verificabilidad de los requisitos de experiencia de usuario, accesibilidad y manejo de errores en `specify.md` v1.3.0. Este checklist evalúa la calidad de los requisitos escritos, no si la implementación funciona.
**Creado:** 27/10/2026
**Especificación:** `specify.md` v1.3.0 · `constitution.md` v1.1.0

**Nota:** Este checklist es generado por `speckit.checklist` y es un artefacto de revisión de calidad de requisitos, de propiedad del revisor.
**Semántica de marcadores:** `[x]` significa que el revisor ha determinado que el criterio de calidad del requisito está satisfecho. No indica que la implementación esté completa.

---

## Categoría 1 — Completitud de Requisitos de Experiencia de Usuario

- [ ] CHK001 — ¿Están definidos los requisitos de estado vacío para **todas** las listas que pueden no tener resultados (catálogo, búsqueda, filtro por tipo)? [Completitud, Spec §HU-01 Esc.3 / HU-02 Esc.5 / HU-04 Esc.4]

- [ ] CHK002 — ¿Se especifica el comportamiento de la interfaz durante la transición entre el estado de carga y el estado de éxito (¿desaparece el indicador antes o después de mostrar los datos?)? [Completitud, Gap, Spec §RF-023]

- [ ] CHK003 — ¿Están definidos los requisitos de navegación global (elementos de navegación principal, sección «Comparar», estructura de la aplicación) con suficiente detalle para garantizar consistencia entre historias? [Completitud, Gap, Spec §HU-06 Esc.7 / RF-029]

- [ ] CHK004 — ¿Se documenta el comportamiento esperado cuando el usuario abre la ficha de una criatura sin haber realizado ninguna búsqueda ni filtrado (contexto de vuelta vacío)? [Completitud, Gap, Spec §HU-03 Esc.3 / RF-013]

- [ ] CHK005 — ¿Se especifica qué texto concreto (o criterio de redacción) debe mostrar el placeholder del campo de búsqueda? [Completitud, Gap, Spec §HU-02]

- [ ] CHK006 — ¿Están definidos los requisitos de orden de tabulación (tab order) para los elementos interactivos de la vista de comparación, donde hay dos `SearchBar` independientes en la misma pantalla? [Completitud, Gap, Spec §HU-06 Esc.7 / Constitución U-05]

- [ ] CHK007 — ¿La spec define si los nombres de habilidades en la ficha de una criatura se muestran en español o en el slug de la API (p. ej., «overgrow» vs. «Espesura»), antes de que el usuario consulte el detalle? [Completitud, Gap, Spec §RF-012 / RF-018]

---

## Categoría 2 — Claridad de Requisitos de Experiencia de Usuario

- [ ] CHK008 — ¿El término «elemento visual alternativo» (placeholder de imagen) en HU-01 Esc.3 y HU-03 Esc.2 está cuantificado con criterios visuales específicos (dimensiones, estilo, texto alternativo)? [Claridad, Spec §RF-003]

- [ ] CHK009 — ¿La expresión «sin espera perceptible» en CE-05 tiene una definición mensurable (umbral en ms) o se apoya únicamente en percepción subjetiva? [Claridad, Ambigüedad, Spec §CE-05]

- [ ] CHK010 — ¿El requisito «indicación textual o simbólica» para el resaltado de estadísticas en la comparación (HU-06 Esc.1 y Esc.2) especifica qué símbolos o textos son aceptables, o deja esa decisión abierta a la implementación? [Claridad, Spec §RF-020 / RF-021]

- [ ] CHK011 — ¿La descripción «mensaje comprensible en español» en RF-024 está operacionalizada con criterios de legibilidad, longitud máxima o nivel de lenguaje, o es subjetiva? [Claridad, Ambigüedad, Spec §RF-024]

- [ ] CHK012 — ¿El requisito de «nota en español» cuando la descripción de habilidad no está en español (HU-05 Esc.5) define el texto exacto o el criterio que debe cumplir esa nota? [Claridad, Spec §RF-018]

- [ ] CHK013 — ¿Las expresiones «limpiar filtros» y «limpiar la búsqueda» en HU-04 Esc.4 están definidas con precisión suficiente para distinguirlas visualmente en la interfaz (dos botones separados, una opción desplegable, etc.)? [Claridad, Spec §HU-04 Esc.4 / RF-016]

- [ ] CHK014 — ¿El requisito de «controles de paginación» en HU-01 Esc.6 (pantalla 320 px) define cuál es el comportamiento esperado cuando los controles no caben en una sola línea (apilamiento, menú, etc.)? [Claridad, Gap, Spec §RF-026]

---

## Categoría 3 — Consistencia de Requisitos de Experiencia de Usuario

- [ ] CHK015 — ¿Los requisitos de estado de carga son consistentes entre todas las historias que los usan (HU-01, HU-03, HU-05, HU-06)? ¿Se especifica el mismo componente (`LoadingIndicator`) para todos los casos o se permiten variaciones? [Consistencia, Spec §RF-023]

- [ ] CHK016 — ¿Los requisitos de paginación son consistentes entre la paginación del catálogo (RF-002), la paginación de resultados de búsqueda (RF-027) y la paginación de resultados filtrados (RF-014)? ¿Los tres usan los mismos controles y la misma semántica de «página X de Y»? [Consistencia, Spec §RF-002 / RF-014 / RF-027]

- [ ] CHK017 — ¿El requisito de restaurar el contexto al volver de la ficha (RF-013: término + tipos + página) es consistente con el comportamiento del botón «Limpiar» de `SearchBar`, que vacía el término? ¿Están alineados ambos flujos? [Consistencia, Conflicto, Spec §RF-013 / HU-02 Esc.5]

- [ ] CHK018 — ¿Los mensajes de error descritos para cada historia (HU-01 Esc.4, HU-03 Esc.4, HU-05 Esc.3, HU-06 Esc.4) siguen un patrón de redacción consistente, o cada uno puede tener un formato diferente? [Consistencia, Spec §RF-024]

- [ ] CHK019 — ¿Los requisitos de «botón volver» (HU-03) y «botón cerrar» (HU-05) son consistentes en denominación, posición visual y comportamiento de navegación a lo largo de la spec? [Consistencia, Spec §RF-013 / RF-019]

---

## Categoría 4 — Completitud de Requisitos de Accesibilidad

- [ ] CHK020 — ¿Están definidos los requisitos de accesibilidad para **todos** los elementos interactivos del catálogo (tarjetas de criatura, controles de paginación, campo de búsqueda, selector de tipos)? [Completitud, Spec §CE-04 / Constitución U-05]

- [ ] CHK021 — ¿Se especifican los requisitos de etiqueta accesible para el componente `TypeFilter` (selector multivalor)? En particular, ¿se define si cada opción de tipo necesita texto alternativo independiente del color del tipo? [Completitud, Gap, Spec §HU-04 / Constitución U-05]

- [ ] CHK022 — ¿Se especifican los requisitos de accesibilidad para el estado de carga (`LoadingIndicator`)? ¿Se indica que lectores de pantalla deben anunciar el inicio y fin de la carga? [Completitud, Gap, Spec §RF-023 / Constitución U-05]

- [ ] CHK023 — ¿Se define en la spec o en la constitución qué significa «navegación por teclado» para la vista de comparación, donde hay dos selectores independientes? ¿Se especifica el orden de foco entre slots, campos de búsqueda y botón de comparar? [Completitud, Gap, Spec §HU-06 / Constitución U-05]

- [ ] CHK024 — ¿Los requisitos de accesibilidad para la señal de «mayor» y «empate» en la comparación (HU-06 Esc.1 y Esc.2) especifican explícitamente que la señal debe funcionar para usuarios que no perciben el color (no solo «no depende únicamente del color»)? [Completitud, Spec §RF-020 / RF-021 / Constitución U-05]

- [ ] CHK025 — ¿La spec define requisitos de accesibilidad para el placeholder de imagen (imagen alternativa cuando `imageUrl` es `null`)? ¿Se especifica qué texto `alt` debe tener? [Completitud, Gap, Spec §RF-003]

---

## Categoría 5 — Claridad y Verificabilidad de Requisitos de Accesibilidad

- [ ] CHK026 — ¿El criterio CE-04 («sin fallos en auditoría automatizada de accesibilidad») define qué herramienta de auditoría se usará, o la elección queda abierta? ¿Puede este criterio ser verificado de forma reproducible? [Claridad, Mensurabilidad, Spec §CE-04]

- [ ] CHK027 — ¿El nivel WCAG 2.1 AA referenciado en CE-04 y en la constitución U-05 está aplicado a criterios concretos de la spec (contraste, teclado, etiquetas) o solo se menciona de forma genérica sin mapear a requisitos específicos? [Claridad, Spec §CE-04 / Constitución U-05]

- [ ] CHK028 — ¿El requisito de contraste (Constitución U-05: ≥ 4.5:1 texto normal, ≥ 3:1 texto grande) está referenciado o derivado en la spec para elementos concretos como los badges de tipo, los mensajes de error y las etiquetas de estadísticas? [Claridad, Gap, Spec §CE-04 / Constitución U-05]

- [ ] CHK029 — ¿La condición «ningún elemento funcional queda oculto, truncado o inaccesible» en HU-01 Esc.6 (320 px) define qué se considera «elemento funcional»? ¿Incluye los controles de paginación, el selector de tipos y el campo de búsqueda? [Claridad, Spec §RF-026]

---

## Categoría 6 — Completitud de Requisitos de Manejo de Errores

- [ ] CHK030 — ¿Se especifica el comportamiento esperado cuando **ambas** peticiones de la comparación fallan simultáneamente, no solo cuando falla una de las dos (HU-06 Esc.4 cubre solo el caso parcial)? [Completitud, Gap, Spec §HU-06 Esc.4 / RF-024]

- [ ] CHK031 — ¿Se define el comportamiento de la aplicación cuando el índice completo de criaturas (única petición de sesión) falla? ¿Puede el usuario reintentar sin recargar la página? [Completitud, Gap, Spec §HU-01 Esc.4 / HU-02]

- [ ] CHK032 — ¿La spec define qué ocurre si la petición de la lista de tipos (`GET /type`) falla al cargar `TypeFilter`? ¿Se muestra el selector vacío, un error, o se oculta el filtro? [Completitud, Gap, Spec §HU-04 / RF-014]

- [ ] CHK033 — ¿Se especifica el comportamiento cuando el usuario pulsa «Reintentar» y la segunda petición también falla? ¿Puede reintentar indefinidamente o hay un límite definido en los requisitos? [Completitud, Gap, Spec §RF-024]

- [ ] CHK034 — ¿Se describe el comportamiento de la interfaz durante el intervalo entre el inicio de la petición y la aparición del indicador de carga (latencia de renderizado del propio indicador)? [Completitud, Gap, Spec §RF-023]

- [ ] CHK035 — ¿La spec define cómo se gestiona la pérdida de conexión **durante** una espera activa (a mitad de descarga), distinto del caso de error al inicio de la petición? [Completitud, Gap, Spec §CL-07 / RF-024]

---

## Categoría 7 — Claridad y Verificabilidad de Requisitos de Manejo de Errores

- [ ] CHK036 — ¿El umbral de 10 segundos para el timeout (RF-025) está definido de forma consistente en todos los contextos donde se aplica (catálogo, ficha, habilidad, comparación), o solo en algunos escenarios? [Consistencia, Mensurabilidad, Spec §RF-025]

- [ ] CHK037 — ¿El término «comprensible» en RF-024 («mensaje comprensible en español») tiene criterios objetivos de verificación, o es subjetivo y depende del revisor? [Claridad, Ambigüedad, Spec §RF-024]

- [ ] CHK038 — ¿La propiedad `retryable` del estado de error (implícita en RF-024 y RF-025) está definida en los requisitos con criterios claros sobre cuándo un error es reintentable y cuándo no (p. ej., ¿un 404 es reintentable o no?)? [Claridad, Gap, Spec §RF-024 / RF-025]

- [ ] CHK039 — ¿El mensaje de error «identificando cuál de las dos criaturas no pudo cargarse» (HU-06 Esc.4) especifica si la identificación usa el nombre de la criatura, su número, o la posición (slot A / slot B)? [Claridad, Spec §HU-06 Esc.4]

- [ ] CHK040 — ¿El CE-07 («toda espera superior a 10 s produce mensaje y opción de reintento») puede verificarse de forma objetiva sin herramientas de simulación de red? ¿La spec indica el mecanismo de verificación? [Mensurabilidad, Spec §CE-07]

---

## Categoría 8 — Cobertura de Casos Límite y Flujos de Excepción

- [ ] CHK041 — ¿La spec define el comportamiento cuando la búsqueda por número devuelve un resultado, pero al solicitar el detalle de ese resultado la API devuelve 404 (inconsistencia entre índice y detalle)? [Cobertura, Gap, Spec §HU-02 / HU-03]

- [ ] CHK042 — ¿Se define el comportamiento cuando una criatura tiene más habilidades de las que caben en la vista de ficha sin desplazamiento? ¿Hay requisito de límite visual o de navegación? [Cobertura, Gap, Spec §RF-012]

- [ ] CHK043 — ¿La spec aborda el caso en que el usuario filtra por tipo, obtiene resultados, y luego escribe un término de búsqueda que no coincide con ninguna criatura del filtro activo? ¿El mensaje de estado vacío distingue este caso del caso de sin resultados global? [Cobertura, Gap, Spec §HU-04 Esc.4 / RF-016]

- [ ] CHK044 — ¿Se define el comportamiento cuando la aplicación recibe una respuesta de la PokéAPI con estructura inesperada o campos obligatorios ausentes (respuesta malformada)? [Cobertura, Gap, Spec §RF-024 / Constitución C-03]

- [ ] CHK045 — ¿La spec cubre el caso en que el usuario navega rápidamente de la ficha al catálogo y de vuelta antes de que la petición anterior haya terminado? ¿Se cancelan las peticiones anteriores? [Cobertura, Gap, Spec §RF-011 / RF-025]

---

## Categoría 9 — Idioma, Textos y Mensajes en Español

- [ ] CHK046 — ¿La spec define qué ocurre con los nombres de tipos Pokémon en la interfaz: ¿se muestran siempre en español (la traducción del plan), en inglés (la API), o dependiendo del contexto? ¿Es consistente con U-04? [Consistencia, Spec §RF-014 / RF-028 / Constitución U-04]

- [ ] CHK047 — ¿Los mensajes de validación de HU-02 (campo vacío, solo símbolos, número inexistente) especifican el texto exacto o solo el tipo de mensaje? ¿Puede el revisor verificar U-04 sin texto de referencia? [Claridad, Mensurabilidad, Spec §RF-008 / RF-009 / RF-010]

- [ ] CHK048 — ¿La excepción de «nombres propios del dominio Pokémon» en U-04 está acotada con suficiente precisión para que un implementador sepa qué puede aparecer en inglés (nombres de criaturas, tipos, habilidades) y qué no (etiquetas, botones, mensajes)? [Claridad, Spec §Sección 3 Supuestos / Constitución U-04]

- [ ] CHK049 — ¿El CE-03 («100 % de los textos de la interfaz en español») define si los textos generados dinámicamente (valores de altura, peso, estadísticas numéricas, unidades de medida) están incluidos en el alcance? [Claridad, Mensurabilidad, Spec §CE-03]

---

## Notas

- Marcar `[x]` solo cuando el revisor confirme que el criterio de calidad del requisito está satisfecho.
- Los ítems sin marcar requieren clarificación, corrección o evaluación adicional antes de iniciar `implement`.
- Los hallazgos del informe `analyze.md` que se solapan con este checklist: AN-08 (CHK007), AN-11 (CHK038), AN-13 (CHK039), AN-02 (CHK017).
- `/speckit.implement` lee el estado de los checkboxes como gate de calidad; no modifica los marcadores.
- Añadir comentarios o hallazgos inline bajo cada ítem si se detectan problemas concretos.
