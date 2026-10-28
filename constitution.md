# Constitución del Proyecto — PokeDex Explorer

**Versión:** 1.1.0
**Ratificada:** 27/10/2026
**Última enmienda:** 27/10/2026
**Proceso:** SDD según Piskala (2026)

---

## Propósito

PokeDex Explorer es una aplicación web que consume la PokéAPI (https://pokeapi.co) para permitir a los usuarios buscar criaturas Pokémon, filtrarlas por tipo, consultar sus habilidades y estadísticas, y comparar dos registros entre sí.

Esta constitución establece los principios no negociables que gobiernan el diseño, desarrollo, pruebas y entrega del proyecto. Toda decisión técnica, de diseño o de proceso debe poder trazarse a al menos uno de estos principios.

> Las herramientas y tecnologías concretas (framework, bundler, librería de pruebas, etc.) **no se fijan aquí**; se deciden durante la fase de planificación (`plan`).

---

## 1. Calidad de Código

### C-01 — Responsabilidad única por módulo
**DEBE** existir un módulo distinto para cada responsabilidad principal: interfaz de usuario, lógica de negocio y acceso a datos.
**NO DEBE** un mismo módulo mezclar renderizado, reglas de dominio y llamadas a la API.
> *Justificación:* facilita el mantenimiento independiente, las pruebas unitarias aisladas y la incorporación de nuevos colaboradores sin riesgo de efectos secundarios cruzados.

### C-02 — Separación explícita de capas
**DEBE** existir una capa de acceso a datos que abstraiga todas las llamadas a la PokéAPI; el resto del código **NO DEBE** invocar endpoints directamente.
> *Justificación:* un único punto de contacto con la API simplifica el mockeo en pruebas y permite cambiar la fuente de datos sin tocar la lógica ni la interfaz.

### C-03 — Manejo explícito de errores
**DEBE** capturarse y comunicarse toda condición de error (fallo de red, recurso no encontrado, respuesta malformada) con un mensaje claro al usuario y un registro en consola/log.
**NO DEBE** silenciarse ninguna excepción con un bloque vacío (`catch {}` sin contenido).
> *Justificación:* los fallos silenciosos generan estados inconsistentes difíciles de diagnosticar y degradan la experiencia de usuario.

### C-04 — Sin secretos en el repositorio
**NO DEBE** incluirse ningún token, credencial, clave de API ni valor sensible en el código fuente ni en archivos rastreados por el sistema de control de versiones.
**DEBE** usarse un mecanismo de variables de entorno o un gestor de configuración externo para cualquier valor sensible.
> *Justificación:* la exposición de secretos en repositorios es una de las vulnerabilidades de seguridad más frecuentes y de mayor impacto.

---

## 2. Pruebas

### P-01 — Pruebas junto con cada funcionalidad
**DEBE** entregarse al menos una prueba automatizada para cada nueva funcionalidad o corrección de defecto en la misma revisión de cambios que introduce el cambio.
**NO DEBE** integrarse código de producción sin su prueba correspondiente.
> *Justificación:* las pruebas escritas en paralelo al código garantizan que los criterios de aceptación sean verificables y evitan la deuda técnica acumulada.

### P-02 — Cobertura mínima del 80 % en la lógica
**DEBE** mantenerse una cobertura de pruebas automatizadas igual o superior al 80 % sobre los módulos de lógica de negocio y acceso a datos.
**NO DEBE** reducirse la cobertura por debajo de ese umbral en ninguna entrega.
> *Justificación:* un umbral concreto hace el criterio verificable y evita discusiones subjetivas sobre si "hay suficientes pruebas".

### P-03 — API simulada (mock) en las pruebas
**DEBE** usarse una implementación simulada de la PokéAPI en todas las pruebas automatizadas; **NO DEBE** ninguna prueba realizar llamadas reales a la red.
> *Justificación:* las pruebas que dependen de servicios externos son lentas, inestables y no reproducibles en entornos sin conectividad.

### P-04 — Ninguna entrega con pruebas fallando
**NO DEBE** integrarse ni desplegarse código que tenga pruebas automatizadas en estado fallido.
**DEBE** corregirse cualquier prueba rota antes de continuar con la siguiente tarea.
> *Justificación:* tolerar pruebas rotas invalida el conjunto de pruebas como red de seguridad y normaliza el trabajo en deuda técnica.

---

## 3. Experiencia de Usuario

### U-01 — Diseño visual consistente
**DEBE** aplicarse un sistema de diseño coherente (paleta de colores, tipografía, espaciado, componentes) en toda la aplicación.
**NO DEBE** haber discrepancias visuales evidentes entre secciones de la misma pantalla.
> *Justificación:* la consistencia visual reduce la carga cognitiva y genera confianza en el producto.

### U-02 — Diseño responsive
**DEBE** la aplicación ser usable y visualmente correcta en dispositivos móviles (≥ 320 px), tablets y escritorio.
**NO DEBE** ningún elemento principal quedar oculto, truncado o inaccesible en ninguno de esos rangos.
> *Justificación:* una porción significativa de los usuarios accede desde dispositivos móviles; ignorar ese contexto excluye a parte de la audiencia.

### U-03 — Estados de carga, error y sin resultados
**DEBE** mostrarse un indicador de carga mientras se espera cualquier respuesta de la API, un mensaje de error cuando la operación falla y un estado vacío cuando no hay resultados que mostrar.
**NO DEBE** dejarse la interfaz en blanco o congelada sin retroalimentación al usuario.
> *Justificación:* la falta de retroalimentación hace que el usuario no sepa si la aplicación funciona, lo que genera abandono y confusión.

### U-04 — Mensajes en español
**DEBE** todo texto visible para el usuario (etiquetas, mensajes de error, placeholders, notificaciones) estar redactado en español.
**NO DEBE** aparecer texto en otro idioma en la interfaz de usuario, salvo nombres propios del dominio Pokémon (e.g., nombres de criaturas).
> *Justificación:* el público objetivo es hispanohablante; la coherencia idiomática es parte de la experiencia de usuario.

### U-05 — Accesibilidad básica
**DEBE** cumplirse como mínimo el nivel AA de las WCAG 2.1 en los criterios de contraste de color, navegación por teclado y etiquetas en elementos de formulario e imagen.
**NO DEBE** ningún elemento interactivo carecer de una etiqueta accesible.
> *Justificación:* la accesibilidad no es opcional; garantiza que personas con discapacidades puedan usar la aplicación y reduce el riesgo legal.

---

## 4. Rendimiento

### R-01 — Carga inicial menor a 3 segundos
**DEBE** el tiempo hasta la primera carga útil de la aplicación en una conexión de banda ancha típica ser inferior a 3 segundos.
**NO DEBE** desplegarse una versión que supere ese umbral sin una justificación técnica aprobada.
> *Justificación:* una carga inicial prolongada deteriora la experiencia desde el primer contacto y puede llevar al usuario a abandonar la aplicación antes de interactuar con ella.

### R-02 — Interacciones menores a 200 ms
**DEBE** toda interacción del usuario (búsqueda, filtro, navegación entre páginas) producir retroalimentación visible en menos de 200 ms.
**NO DEBE** bloquearse la interfaz con operaciones síncronas pesadas.
> *Justificación:* respuestas por encima de 200 ms se perciben como lentas y degradan la sensación de fluidez.

### R-03 — Paginación en listas largas
**DEBE** cualquier lista que pueda superar 20 elementos implementar paginación o carga incremental.
**NO DEBE** renderizarse en un solo ciclo una lista con más de 20 ítems sin mecanismo de control.
> *Justificación:* renderizar cientos de ítems simultáneamente degrada el rendimiento y la usabilidad.

### R-04 — Caché de respuestas de la API
**DEBE** implementarse una estrategia de caché para las respuestas de la PokéAPI con una vigencia mínima de 5 minutos por entrada, de manera que recursos ya consultados no generen una nueva petición de red durante ese periodo.
**NO DEBE** el caché impedir que la aplicación reintente una petición tras un error ni que el usuario pueda refrescar los datos explícitamente.
> *Justificación:* el caché reduce la latencia percibida, el consumo de datos y la carga sobre la API pública; la vigencia mínima y la posibilidad de refresco garantizan que los datos no queden obsoletos indefinidamente ni bloqueen la recuperación ante fallos.

### R-05 — Respeto de los límites de la PokéAPI
**DEBE** la aplicación respetar las políticas de uso de la PokéAPI, incluyendo no generar ráfagas de peticiones que puedan ser interpretadas como abuso.
**NO DEBE** realizarse ningún mecanismo de scraping masivo ni superar los límites de tasa documentados por la API.
> *Justificación:* la PokéAPI es un servicio público gratuito; su abuso perjudica a toda la comunidad que depende de él.

---

## 5. Flujo de Trabajo SDD (Piskala, 2026)

### S-01 — La especificación es la fuente de verdad
**DEBE** toda decisión de implementación trazarse a un artefacto de especificación previo (`constitution`, `specify`, `clarify` o `plan`).
**NO DEBE** escribirse código de producción para una funcionalidad que no tenga especificación aprobada.
> *Justificación:* el SDD garantiza que el equipo construye lo correcto antes de construirlo correctamente.

### S-02 — La especificación describe qué, no cómo
**DEBE** cada artefacto de especificación expresar el comportamiento esperado y los criterios de aceptación sin prescribir tecnologías, estructuras de datos internas ni algoritmos concretos.
**NO DEBE** una especificación contener decisiones de implementación que correspondan a la fase `plan` o `tasks`.
> *Justificación:* mezclar el qué con el cómo cierra opciones de diseño prematuramente y reduce la flexibilidad del equipo.

### S-03 — Requisitos con criterios Given / When / Then
**DEBE** cada requisito funcional incluir al menos un escenario expresado en formato `Given / When / Then` que sea directamente trazable a una o más pruebas automatizadas.
**NO DEBE** aceptarse un requisito sin criterio de aceptación verificable.
> *Justificación:* los criterios GWT hacen los requisitos inequívocos y transforman la especificación en un contrato ejecutable.

### S-04 — Revisión humana entre fases
**DEBE** un ser humano revisar y aprobar explícitamente cada artefacto producido en una fase antes de iniciar la siguiente.
**NO DEBE** avanzarse a la siguiente fase si existe al menos una observación sin resolver del artefacto anterior.
> *Justificación:* la revisión humana entre fases es el mecanismo de control de calidad del proceso SDD; omitirla anula su valor.

### S-05 — Orden de fases
**DEBE** respetarse el orden: `constitution` → `specify` → `clarify` → `plan` → `tasks` → `analyze` → `implement` → `validate`.
**DEBE** la fase `analyze`, junto con su checklist asociada, ejecutarse completamente y sin hallazgos críticos abiertos antes de iniciar `implement`.
**NO DEBE** saltarse ni invertirse ninguna fase sin una enmienda formal a esta constitución.
> *Justificación:* el orden de fases asegura que cada etapa tiene los insumos necesarios de la etapa anterior; exigir que `analyze` cierre sin hallazgos críticos evita que defectos de diseño conocidos se trasladen a la implementación.

### S-06 — Commits convencionales
**DEBE** todo commit seguir la especificación de Conventional Commits (https://www.conventionalcommits.org), con tipo, alcance opcional y una descripción breve y clara.
**NO DEBE** integrarse un commit con mensaje genérico o sin tipo declarado (e.g., `fix stuff`, `changes`).
> *Justificación:* los commits convencionales permiten generar changelogs automáticos, facilitan la revisión y hacen trazable el historial.

### S-07 — Repositorio en GitHub
**DEBE** el repositorio principal del proyecto estar alojado en GitHub y ser la única fuente canónica del código.
**NO DEBE** mantenerse ninguna copia autorizada fuera de ese repositorio sin declaración explícita en el plan.
> *Justificación:* un único repositorio canónico elimina ambigüedades sobre qué versión es la oficial.

### S-08 — Validación y deriva
**DEBE** cuando la validación (`validate`) revele una discrepancia entre el comportamiento del código y la especificación, tomarse una decisión explícita y registrada: corregir el código para que cumpla la especificación, o revisar la especificación porque el requisito cambió.
**DEBE** la especificación seguir siendo la autoridad en caso de conflicto; ninguna desviación del código invalida la especificación sin una enmienda formal.
**DEBE** cualquier actualización derivada de esa decisión aplicarse de forma sincronizada: especificación y código se modifican en la misma revisión de cambios.
**DEBE** la implementación avanzar en incrementos pequeños y validados, completando y validando una historia de usuario antes de comenzar la siguiente.
**NO DEBE** dejarse una discrepancia sin resolución explícita ni postergarse indefinidamente su registro.
> *Justificación:* la deriva entre especificación y código es la principal causa de que el SDD pierda su valor; exigir una decisión explícita y sincronizada mantiene la especificación como fuente de verdad real, no solo nominal, e implementar en incrementos pequeños limita el alcance de cada discrepancia posible.

---

## 6. Gobernanza

### G-01 — Enmiendas con justificación escrita
**DEBE** cualquier propuesta de modificación a esta constitución presentarse por escrito, especificando el principio afectado, la razón del cambio y el impacto esperado.
**NO DEBE** modificarse ningún principio sin que la propuesta haya sido revisada y aprobada por al menos un miembro del equipo distinto del proponente.
> *Justificación:* la gobernanza escrita crea un registro de decisiones que protege al equipo de cambios arbitrarios o no consensuados.

### G-02 — Versionado semántico de la constitución
**DEBE** toda enmienda aprobada incrementar el número de versión de este documento siguiendo Semantic Versioning (https://semver.org):
- **MAJOR** para cambios que contradicen o eliminan un principio existente.
- **MINOR** para nuevos principios o ampliaciones que no contradicen los existentes.
- **PATCH** para correcciones de redacción que no alteran el significado.

**NO DEBE** publicarse una nueva versión sin actualizar el campo `Versión` en el encabezado de este documento.
> *Justificación:* el versionado semántico hace explícito el peso de cada cambio y permite a cualquier parte interesada entender de un vistazo si una revisión es disruptiva o menor.

---

## Resumen de Principios

| ID    | Área               | Enunciado breve                                             |
|-------|--------------------|-------------------------------------------------------------|
| C-01  | Calidad de código  | Responsabilidad única por módulo                            |
| C-02  | Calidad de código  | Separación explícita de capas                               |
| C-03  | Calidad de código  | Manejo explícito de errores                                 |
| C-04  | Calidad de código  | Sin secretos en el repositorio                              |
| P-01  | Pruebas            | Pruebas junto con cada funcionalidad                        |
| P-02  | Pruebas            | Cobertura mínima del 80 % en la lógica                      |
| P-03  | Pruebas            | API simulada (mock) en las pruebas                          |
| P-04  | Pruebas            | Ninguna entrega con pruebas fallando                        |
| U-01  | UX                 | Diseño visual consistente                                   |
| U-02  | UX                 | Diseño responsive                                           |
| U-03  | UX                 | Estados de carga, error y sin resultados                    |
| U-04  | UX                 | Mensajes en español                                         |
| U-05  | UX                 | Accesibilidad básica (WCAG 2.1 AA)                          |
| R-01  | Rendimiento        | Primera carga útil < 3 segundos                             |
| R-02  | Rendimiento        | Interacciones < 200 ms                                      |
| R-03  | Rendimiento        | Paginación en listas largas                                 |
| R-04  | Rendimiento        | Caché con vigencia mínima de 5 min, reintento y refresco    |
| R-05  | Rendimiento        | Respeto de los límites de la PokéAPI                        |
| S-01  | SDD                | La especificación es la fuente de verdad                    |
| S-02  | SDD                | La especificación describe qué, no cómo                     |
| S-03  | SDD                | Requisitos con criterios Given / When / Then                |
| S-04  | SDD                | Revisión humana entre fases                                 |
| S-05  | SDD                | Orden de fases; analyze sin hallazgos críticos antes de implement |
| S-06  | SDD                | Commits convencionales con descripción breve y clara        |
| S-07  | SDD                | Repositorio canónico en GitHub                              |
| S-08  | SDD                | Validación y deriva: decisión explícita, cambio sincronizado |
| G-01  | Gobernanza         | Enmiendas con justificación escrita                         |
| G-02  | Gobernanza         | Versionado semántico de la constitución                     |

---

## Registro de Cambios

### v1.1.0 — 27/10/2026

| # | Principio | Tipo de cambio | Descripción |
|---|-----------|----------------|-------------|
| 1 | S-08 (nuevo) | MINOR | Se agrega el principio de Validación y deriva: decisión explícita ante discrepancias, especificación como autoridad, cambio sincronizado entre especificación y código, implementación en incrementos pequeños y validados. |
| 2 | S-05 | MINOR | Se agrega la obligación de ejecutar `analyze` y su checklist sin hallazgos críticos abiertos antes de iniciar `implement`. |
| 3 | R-04 | MINOR | Se añade vigencia mínima de 5 minutos por entrada de caché y se explicita que el caché no impide reintentar tras error ni refrescar a pedido del usuario. |
| 4 | R-01 | PATCH | Se elimina la referencia a "estudios de UX"; la justificación se reformula con argumento propio. Se reemplaza "TTI" por "primera carga útil". |
| 5 | Varios | PATCH | Sustitución de términos: "pull request" → "revisión de cambios" (P-01, P-04, S-06, S-08); "hilo principal" → "interfaz" (R-02); ejemplos de atributos `aria-label`/`alt`/`<label>` → "etiqueta accesible" (U-05). |
| 6 | S-06 | PATCH | Se elimina la exigencia de redacción "en imperativo"; se requiere una descripción breve y clara. |
| 7 | Encabezado y tabla | PATCH | Se añade campo "Última enmienda", se actualiza la tabla resumen con S-08 y las descripciones revisadas. Se agrega esta sección de registro de cambios. |

### v1.0.0 — 27/10/2026
Versión inicial ratificada con 27 principios en 6 secciones.

---

*La siguiente fase del proceso SDD es `specify`.*
