# Especificación de Requisitos — PokeDex Explorer

**Versión:** 1.3.0
**Fecha:** 27/10/2026
**Última enmienda:** 27/10/2026
**Fase SDD:** specify
**Constitución de referencia:** v1.1.0
**Estado:** Pendiente de revisión humana (S-04)

---

## 1. Propósito del Documento

Este documento describe **qué** debe hacer PokeDex Explorer y **por qué** cada comportamiento tiene valor para el usuario. No prescribe tecnologías, frameworks, arquitectura ni algoritmos de implementación; esas decisiones corresponden a las fases `plan` y `tasks`.

Toda historia de usuario y todo requisito funcional de este documento son trazables a la constitución v1.1.0 (principios S-01, S-02, S-03).

---

## 2. Visión del Producto

PokeDex Explorer es una enciclopedia interactiva de criaturas Pokémon, accesible desde cualquier navegador, dirigida al público general y presentada íntegramente en español. Su propósito es permitir que cualquier persona explore, busque, filtre y compare criaturas Pokémon utilizando los datos públicos de la PokéAPI (https://pokeapi.co), sin necesidad de registro ni conocimiento técnico previo.

---

## 3. Público Objetivo y Supuestos

- **Público:** cualquier persona con acceso a un navegador web; no se requiere cuenta de usuario ni experiencia previa.
- **Idioma:** toda la interfaz está en español; los nombres propios del dominio Pokémon (nombres de criaturas, tipos, habilidades) se muestran tal como los proporciona la PokéAPI o su traducción oficial al español cuando esté disponible.
- **Fuente de datos:** exclusivamente la PokéAPI. No se almacenan ni editan datos propios.
- **Conexión:** se asume conectividad a internet; el modo sin conexión está fuera de alcance.

---

## 4. Fuera de Alcance

Las siguientes funcionalidades quedan **explícitamente excluidas** de esta versión:

- Cuentas de usuario, autenticación o perfiles personales.
- Cadenas evolutivas y árboles de evolución.
- Simulaciones de batalla o combate.
- Edición, creación o eliminación de datos de criaturas.
- Funcionamiento sin conexión a internet (modo offline).

---

## 5. Historias de Usuario

Las historias están priorizadas: **P1** es indispensable para el lanzamiento, **P2** aporta valor diferencial, **P3** es deseable pero postergable. Cada historia es independiente: puede desarrollarse, probarse y entregarse sin depender de otra historia del mismo nivel de prioridad.

---

### HU-01 — Explorar el catálogo [P1]

**Como** visitante de la aplicación,
**quiero** ver una lista paginada de todas las criaturas Pokémon con su imagen, número y nombre,
**para** descubrir y explorar el catálogo completo sin necesidad de saber qué busco.

#### Criterios de aceptación

**Escenario 1 — Carga inicial del catálogo**
- **Given** que el usuario abre la aplicación por primera vez
- **When** la página termina de cargar
- **Then** se muestra una lista de criaturas con imagen, número nacional y nombre para cada una
- **And** la lista está ordenada por número nacional ascendente
- **And** se muestra un indicador de carga mientras se obtienen los datos

**Escenario 2 — Navegación entre páginas**
- **Given** que el catálogo tiene más criaturas de las que caben en una página
- **When** el usuario pulsa "siguiente página" o "página anterior"
- **Then** se carga el siguiente o anterior bloque de criaturas sin recargar toda la aplicación
- **And** se indica visualmente en qué página se encuentra el usuario y cuántas páginas hay en total

**Escenario 3 — Criatura sin imagen disponible**
- **Given** que una criatura no tiene imagen en la PokéAPI
- **When** se muestra esa criatura en la lista
- **Then** se muestra un elemento visual alternativo que ocupa el mismo espacio que una imagen normal
- **And** el resto de la información (número y nombre) se muestra con normalidad

**Escenario 4 — Error al cargar el catálogo**
- **Given** que la PokéAPI no responde o devuelve un error
- **When** el usuario intenta cargar el catálogo
- **Then** se muestra un mensaje de error comprensible en español
- **And** se ofrece una opción para reintentar la carga

**Escenario 5 — Tiempo de respuesta excedido**
- **Given** que la PokéAPI tarda más de 10 segundos en responder
- **When** el usuario está esperando el catálogo
- **Then** la aplicación cancela la espera, muestra un mensaje de tiempo agotado en español y ofrece reintentar

**Escenario 6 — Pantalla de 320 px de ancho**
- **Given** que el usuario accede a la aplicación desde un dispositivo con pantalla de 320 px de ancho
- **When** el catálogo se muestra
- **Then** todos los elementos del catálogo (imagen, número, nombre, controles de paginación) son visibles y operables sin desplazamiento horizontal
- **And** ningún elemento funcional queda oculto, truncado o inaccesible

---

### HU-02 — Buscar una criatura [P1]

**Como** visitante de la aplicación,
**quiero** buscar criaturas por nombre o por número sobre todo el catálogo disponible en la PokéAPI,
**para** encontrar rápidamente una criatura específica sin tener que navegar por todo el catálogo.

#### Criterios de aceptación

**Escenario 1 — Búsqueda por nombre exacto**
- **Given** que el usuario escribe el nombre completo de una criatura en el campo de búsqueda
- **When** confirma la búsqueda
- **Then** se muestran las criaturas cuyo nombre coincide exactamente (sin distinguir mayúsculas ni minúsculas)

**Escenario 2 — Búsqueda por nombre parcial**
- **Given** que el usuario escribe parte del nombre de una criatura
- **When** confirma la búsqueda
- **Then** se muestran todas las criaturas cuyo nombre contiene ese fragmento, sin distinguir mayúsculas ni minúsculas ni espacios sobrantes al inicio o al final

**Escenario 3 — Búsqueda por número nacional**
- **Given** que el usuario escribe el número nacional de una criatura (e.g., "25")
- **When** confirma la búsqueda
- **Then** se muestra la criatura cuyo número nacional es exactamente ese valor

**Escenario 4 — Nombres con caracteres especiales**
- **Given** que el usuario busca una criatura cuyo nombre contiene caracteres especiales (e.g., "Mr. Mime", "Farfetch'd")
- **When** escribe el nombre incluyendo esos caracteres
- **Then** se encuentra y muestra la criatura correcta

**Escenario 5 — Sin resultados**
- **Given** que el usuario realiza una búsqueda que no coincide con ninguna criatura
- **When** confirma la búsqueda
- **Then** se muestra un mensaje en español indicando que no se encontraron resultados para ese término
- **And** se ofrece la posibilidad de limpiar la búsqueda y volver al catálogo completo

**Escenario 6 — Campo de búsqueda vacío**
- **Given** que el campo de búsqueda está vacío
- **When** el usuario intenta confirmar la búsqueda
- **Then** se muestra un mensaje de validación en español indicando que debe ingresar un término antes de buscar
- **And** no se realiza ninguna petición a la API

**Escenario 7 — Texto con símbolos no válidos**
- **Given** que el usuario escribe en el campo de búsqueda una cadena compuesta solo por símbolos o caracteres no alfanuméricos (e.g., "???", "###")
- **When** confirma la búsqueda
- **Then** se muestra un mensaje de validación en español indicando que el término ingresado no es válido
- **And** no se realiza ninguna petición a la API

**Escenario 8 — Número inexistente**
- **Given** que el usuario busca un número nacional que no corresponde a ninguna criatura conocida
- **When** confirma la búsqueda
- **Then** se muestra un mensaje en español indicando que no existe una criatura con ese número
- **And** se ofrece la posibilidad de limpiar la búsqueda

**Escenario 9 — Doble acción rápida**
- **Given** que el usuario confirma la búsqueda dos veces en sucesión rápida
- **When** se procesan ambas acciones
- **Then** la aplicación realiza una sola petición y muestra un único conjunto de resultados, sin duplicar peticiones ni mostrar estados intermedios inconsistentes

**Escenario 10 — Paginación de resultados de búsqueda**
- **Given** que la búsqueda produce más resultados de los que caben en una página
- **When** se muestran los resultados
- **Then** se aplica la misma paginación que en el catálogo general, con controles de navegación entre páginas e indicación de página actual y total de páginas

---

### HU-03 — Ver la ficha de una criatura [P2]

**Como** visitante de la aplicación,
**quiero** consultar la ficha completa de una criatura,
**para** conocer sus características detalladas: imagen, número, nombre, tipos, altura, peso, habilidades y estadísticas base.

#### Criterios de aceptación

**Escenario 1 — Apertura de la ficha**
- **Given** que el usuario selecciona una criatura del catálogo o de los resultados de búsqueda
- **When** se abre la ficha
- **Then** se muestran: imagen, número nacional, nombre, tipo o tipos, altura, peso, lista de habilidades y las seis estadísticas base (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad)
- **And** se muestra un indicador de carga mientras se obtienen los datos

**Escenario 2 — Criatura sin imagen**
- **Given** que la criatura seleccionada no tiene imagen en la PokéAPI
- **When** se muestra su ficha
- **Then** se presenta un elemento visual alternativo en el espacio reservado para la imagen
- **And** todos los demás datos se muestran con normalidad

**Escenario 3 — Volver a la lista conservando contexto**
- **Given** que el usuario llegó a la ficha después de realizar una búsqueda, con uno o más tipos seleccionados y estando en una página concreta del catálogo
- **When** pulsa la opción de volver
- **Then** regresa a la lista con el mismo término de búsqueda activo, los mismos tipos seleccionados y en la misma página en que estaba antes de abrir la ficha

**Escenario 4 — Error al cargar la ficha**
- **Given** que la PokéAPI no responde al solicitar los datos de una criatura
- **When** el usuario intenta abrir la ficha
- **Then** se muestra un mensaje de error en español con opción de reintentar

**Escenario 5 — Tiempo de respuesta excedido**
- **Given** que la PokéAPI tarda más de 10 segundos en responder al solicitar una ficha
- **When** el usuario está esperando
- **Then** la aplicación cancela la espera, muestra un mensaje en español y ofrece reintentar

---

### HU-04 — Filtrar por tipo [P2]

**Como** visitante de la aplicación,
**quiero** filtrar las criaturas por uno o más tipos,
**para** explorar solo las criaturas de los tipos que me interesan.

#### Criterios de aceptación

**Escenario 1 — Filtro por un tipo**
- **Given** que el usuario selecciona un tipo del selector de tipos
- **When** aplica el filtro
- **Then** la lista muestra únicamente las criaturas que tienen ese tipo (ya sea como tipo primario o secundario)
- **And** la lista resultante está paginada con las mismas reglas que el catálogo general

**Escenario 2 — Filtro por múltiples tipos**
- **Given** que el usuario selecciona dos o más tipos del selector
- **When** aplica el filtro
- **Then** la lista muestra las criaturas que tienen al menos uno de los tipos seleccionados (lógica OR)
- **And** la lista resultante está paginada con las mismas reglas que el catálogo general

**Escenario 3 — Filtro combinado con búsqueda**
- **Given** que el usuario tiene activa una búsqueda por nombre o número
- **When** además selecciona un tipo
- **Then** la lista muestra solo las criaturas que cumplen tanto el término de búsqueda como el tipo seleccionado

**Escenario 4 — Tipo sin resultados**
- **Given** que la combinación de filtros activos no produce ningún resultado
- **When** se aplica el filtro
- **Then** se muestra un mensaje en español indicando que no hay criaturas para esa combinación
- **And** se ofrece la opción de "limpiar filtros", que quita únicamente los tipos seleccionados y conserva el texto de búsqueda activo
- **And** se ofrece también la opción de "limpiar la búsqueda", que quita únicamente el texto de búsqueda y conserva los tipos seleccionados

**Escenario 5 — Eliminar filtro de tipo**
- **Given** que el usuario tiene uno o más tipos seleccionados
- **When** deselecciona un tipo
- **Then** la lista se actualiza inmediatamente para reflejar los filtros restantes

---

### HU-05 — Consultar el detalle de una habilidad [P2]

**Como** visitante de la aplicación,
**quiero** ver el detalle de cada habilidad que aparece en la ficha de una criatura,
**para** entender qué hace esa habilidad sin salir de la aplicación.

#### Criterios de aceptación

**Escenario 1 — Ver detalle de habilidad con descripción en español**
- **Given** que el usuario está en la ficha de una criatura y ve la lista de sus habilidades
- **When** selecciona una habilidad que tiene descripción disponible en español en la PokéAPI
- **Then** se muestra el nombre y la descripción de esa habilidad en español
- **And** se muestra un indicador de carga mientras se obtiene el detalle

**Escenario 2 — Cerrar el detalle**
- **Given** que el usuario está viendo el detalle de una habilidad
- **When** elige cerrar o volver
- **Then** regresa a la ficha de la criatura sin perder ningún dato ya cargado

**Escenario 3 — Error al cargar el detalle**
- **Given** que la PokéAPI no responde al solicitar el detalle de una habilidad
- **When** el usuario intenta consultarla
- **Then** se muestra un mensaje de error en español con opción de reintentar

**Escenario 4 — Tiempo de respuesta excedido**
- **Given** que la PokéAPI tarda más de 10 segundos en responder
- **When** el usuario está esperando el detalle de una habilidad
- **Then** la aplicación cancela la espera, muestra un mensaje en español y ofrece reintentar

**Escenario 5 — Habilidad sin descripción en español**
- **Given** que el usuario selecciona una habilidad que no tiene descripción disponible en español en la PokéAPI
- **When** se muestra el detalle de esa habilidad
- **Then** se muestra la descripción en inglés (el idioma de respaldo disponible en la PokéAPI)
- **And** junto a la descripción aparece una nota en español indicando que la descripción no está disponible en español

---

### HU-06 — Comparar dos criaturas [P3]

**Como** visitante de la aplicación,
**quiero** acceder a una sección dedicada de comparación donde pueda buscar y elegir dos criaturas cualesquiera, y verlas una al lado de la otra con sus estadísticas base,
**para** decidir cuál tiene mejores valores en cada estadística sin necesidad de abrir ninguna ficha previamente.

#### Criterios de aceptación

**Escenario 1 — Comparación estándar**
- **Given** que el usuario selecciona dos criaturas distintas para comparar
- **When** accede a la vista de comparación
- **Then** se muestran las fichas de ambas criaturas en paralelo con sus seis estadísticas base
- **And** en cada estadística se indica cuál de las dos criaturas tiene el valor mayor mediante una señal que no depende únicamente del color, sino que incluye además una indicación textual o simbólica (por ejemplo, una etiqueta, un icono o un símbolo)

**Escenario 2 — Estadística empatada**
- **Given** que ambas criaturas tienen exactamente el mismo valor en una estadística
- **When** se muestra la comparación
- **Then** esa estadística se presenta indicando empate mediante una señal que no depende únicamente del color, sino que incluye además una indicación textual o simbólica (por ejemplo, una etiqueta, un icono o un símbolo)
- **And** ninguna de las dos criaturas queda destacada sobre la otra en esa estadística

**Escenario 3 — Comparar una criatura consigo misma**
- **Given** que el usuario selecciona la misma criatura en ambas posiciones de la comparación
- **When** intenta iniciar la comparación
- **Then** se muestra un mensaje en español indicando que deben seleccionarse dos criaturas diferentes
- **And** no se realiza ninguna petición adicional a la API

**Escenario 4 — Error al cargar datos para comparación**
- **Given** que la PokéAPI no responde al obtener los datos de una de las dos criaturas
- **When** el usuario intenta comparar
- **Then** se muestra un mensaje de error en español identificando cuál de las dos criaturas no pudo cargarse, con opción de reintentar

**Escenario 5 — Tiempo de respuesta excedido en comparación**
- **Given** que la PokéAPI tarda más de 10 segundos al cargar datos para la comparación
- **When** el usuario está esperando
- **Then** la aplicación cancela la espera, muestra un mensaje en español y ofrece reintentar

**Escenario 6 — Indicador de carga durante la comparación**
- **Given** que el usuario inicia una comparación entre dos criaturas distintas
- **When** la aplicación solicita los datos de ambas criaturas a la PokéAPI
- **Then** se muestra un indicador de carga mientras se espera la respuesta
- **And** el indicador desaparece en cuanto los datos están disponibles y la comparación se presenta completa

**Escenario 7 — Acceso mediante sección dedicada**
- **Given** que el usuario navega a la sección de comparación desde la navegación principal de la aplicación
- **When** accede a esa sección
- **Then** se presentan dos selectores independientes, uno para cada criatura, cada uno con un campo de búsqueda por nombre o número que opera sobre el catálogo completo
- **And** el usuario puede seleccionar cualquier criatura en cualquiera de los dos selectores sin necesidad de haber visitado previamente la ficha de ninguna de ellas
- **And** la comparación solo se inicia una vez que ambos selectores tienen una criatura elegida

---

## 6. Requisitos Funcionales

> Cada RF es verificable de forma independiente. Ninguno menciona tecnología.

### Catálogo y Navegación

**RF-001** La aplicación muestra una lista paginada de criaturas Pokémon, ordenada por número nacional ascendente, con imagen, número y nombre por cada criatura.
*Trazabilidad: HU-01, Esc. 1*

**RF-002** La aplicación permite al usuario avanzar y retroceder entre páginas del catálogo sin recargar la aplicación completa, mostrando en todo momento el número de página actual y el total de páginas.
*Trazabilidad: HU-01, Esc. 2*

**RF-003** Cuando una criatura carece de imagen en la PokéAPI, la aplicación muestra un elemento visual alternativo que ocupa el mismo espacio, sin ocultar el número ni el nombre.
*Trazabilidad: HU-01, Esc. 3 / HU-03, Esc. 2*

### Búsqueda

**RF-004** La aplicación permite buscar criaturas por nombre (parcial o completo), sin distinguir mayúsculas, minúsculas ni espacios sobrantes al inicio o al final del término.
*Trazabilidad: HU-02, Esc. 1, 2*

**RF-005** La aplicación permite buscar criaturas por número nacional exacto.
*Trazabilidad: HU-02, Esc. 3*

**RF-006** La búsqueda reconoce y encuentra correctamente nombres que contienen caracteres especiales, como puntos, apóstrofos u otros signos propios del dominio Pokémon.
*Trazabilidad: HU-02, Esc. 4*

**RF-007** Cuando la búsqueda no produce resultados, la aplicación muestra un mensaje en español y ofrece limpiar el término.
*Trazabilidad: HU-02, Esc. 5*

**RF-008** Cuando el campo de búsqueda está vacío al confirmar, la aplicación muestra un mensaje de validación en español y no realiza ninguna petición a la API.
*Trazabilidad: HU-02, Esc. 6*

**RF-009** Cuando el término de búsqueda contiene únicamente símbolos o caracteres no alfanuméricos, la aplicación muestra un mensaje de validación en español y no realiza ninguna petición a la API.
*Trazabilidad: HU-02, Esc. 7*

**RF-010** Cuando el número buscado no corresponde a ninguna criatura conocida, la aplicación muestra un mensaje específico en español y ofrece limpiar la búsqueda.
*Trazabilidad: HU-02, Esc. 8*

**RF-011** Ante múltiples confirmaciones de búsqueda en rápida sucesión, la aplicación ejecuta una sola petición y presenta un único conjunto de resultados coherente.
*Trazabilidad: HU-02, Esc. 9*

### Ficha de Criatura

**RF-012** La ficha de una criatura muestra: imagen, número nacional, nombre, tipo o tipos, altura, peso, lista de habilidades y los valores de las seis estadísticas base (PS, Ataque, Defensa, Ataque Especial, Defensa Especial, Velocidad).
*Trazabilidad: HU-03, Esc. 1*

**RF-013** Al volver desde la ficha al catálogo, la aplicación restaura el término de búsqueda activo, los tipos seleccionados y la página en que se encontraba el usuario antes de abrir la ficha.
*Trazabilidad: HU-03, Esc. 3*

### Filtro por Tipo

**RF-014** La aplicación permite seleccionar uno o más tipos para filtrar el catálogo. Cuando se selecciona un solo tipo, muestra las criaturas que tienen ese tipo. Cuando se seleccionan dos o más tipos, muestra las criaturas que tienen al menos uno de ellos (lógica OR).
*Trazabilidad: HU-04, Esc. 1, 2*

**RF-015** El filtro por tipo es combinable con la búsqueda por nombre o número; la lista resultante cumple ambos criterios simultáneamente.
*Trazabilidad: HU-04, Esc. 3*

**RF-016** Cuando la combinación de filtros activos no produce resultados, la aplicación muestra un mensaje en español y ofrece limpiar los filtros.
*Trazabilidad: HU-04, Esc. 4*

**RF-017** Al deseleccionar un tipo, la lista se actualiza inmediatamente para reflejar los filtros restantes.
*Trazabilidad: HU-04, Esc. 5*

### Habilidades

**RF-018** Desde la ficha de una criatura, el usuario puede consultar el nombre y la descripción de cada una de sus habilidades. Si la descripción está disponible en español se muestra en español; si no está disponible en español, se muestra en inglés acompañada de una nota en español que indica que la descripción no está disponible en español.
*Trazabilidad: HU-05, Esc. 1, 5*

**RF-019** Al cerrar el detalle de una habilidad, el usuario regresa a la ficha de la criatura sin perder los datos ya cargados.
*Trazabilidad: HU-05, Esc. 2*

### Comparación

**RF-020** La aplicación permite seleccionar dos criaturas distintas y mostrarlas en paralelo con sus seis estadísticas base, indicando en cada estadística cuál de las dos tiene el valor mayor mediante una señal textual o simbólica que no depende únicamente del color.
*Trazabilidad: HU-06, Esc. 1*

**RF-021** Cuando ambas criaturas tienen el mismo valor en una estadística, esa estadística se presenta indicando empate mediante una señal textual o simbólica que no depende únicamente del color, sin destacar ninguna de las dos.
*Trazabilidad: HU-06, Esc. 2*

**RF-022** Cuando el usuario intenta comparar una criatura consigo misma, la aplicación muestra un mensaje en español y no realiza peticiones adicionales.
*Trazabilidad: HU-06, Esc. 3*

**RF-029** La comparación se realiza desde una sección dedicada accesible desde la navegación principal de la aplicación. Dicha sección ofrece dos selectores independientes, cada uno con búsqueda por nombre o número sobre el catálogo completo, y la comparación solo se activa cuando ambos selectores tienen una criatura elegida.
*Trazabilidad: HU-06, Esc. 7*

### Estados Transversales

**RF-023** Toda operación que requiera datos de la PokéAPI muestra un indicador de carga mientras espera la respuesta.
*Trazabilidad: HU-01 Esc. 1 / HU-03 Esc. 1 / HU-05 Esc. 1 / HU-06 Esc. 6*

**RF-024** Cuando la PokéAPI devuelve un error o no responde, la aplicación muestra un mensaje comprensible en español e incluye una opción para reintentar la operación.
*Trazabilidad: HU-01 Esc. 4 / HU-03 Esc. 4 / HU-05 Esc. 3 / HU-06 Esc. 4*

**RF-025** Cuando la PokéAPI no responde en 10 segundos, la aplicación cancela la espera, informa al usuario en español y ofrece reintentar.
*Trazabilidad: HU-01 Esc. 5 / HU-03 Esc. 5 / HU-05 Esc. 4 / HU-06 Esc. 5*

**RF-026** La aplicación es usable en pantallas de ancho igual o superior a 320 px sin que ningún elemento funcional quede inaccesible u oculto.
*Trazabilidad: HU-01 Esc. 6 / Constitución U-02*

**RF-027** La búsqueda por nombre o número se aplica sobre el catálogo completo disponible en la PokéAPI; cuando los resultados superan el tamaño de página, se presentan paginados con los mismos controles de navegación que el catálogo general.
*Trazabilidad: HU-02, Esc. 10*

**RF-028** El selector de tipos informa al usuario que cada criatura puede tener como máximo dos tipos, de manera que seleccionar más de dos tipos con lógica OR puede producir solapamientos; esta información se presenta como orientación, sin impedir la selección de más de dos tipos.
*Trazabilidad: HU-04, Esc. 2*

---

## 7. Casos Límite Documentados

Los siguientes casos deben estar cubiertos por pruebas automatizadas con escenarios GWT y no requieren comportamientos especiales más allá de los ya descritos en los RF:

| # | Caso límite | RF de referencia |
|---|-------------|------------------|
| CL-01 | Búsqueda con campo vacío | RF-008 |
| CL-02 | Búsqueda con solo símbolos (e.g., "???") | RF-009 |
| CL-03 | Número nacional inexistente | RF-010 |
| CL-04 | Nombres con caracteres especiales (Mr. Mime, Farfetch'd) | RF-006 |
| CL-05 | Criatura sin imagen disponible | RF-003 |
| CL-06 | Tipo sin ninguna criatura resultado | RF-016 |
| CL-07 | Pérdida de conexión durante una operación | RF-024 |
| CL-08 | Doble confirmación rápida de búsqueda | RF-011 |
| CL-09 | Uso en pantalla de 320 px de ancho | RF-026 |
| CL-10 | Comparar una criatura consigo misma | RF-022 |

---

## 8. Criterios de Éxito

Los siguientes criterios son medibles y no mencionan tecnología. Se verifican durante la fase `validate`.

| ID | Criterio | Umbral |
|----|----------|--------|
| CE-01 | El catálogo carga y es interactivo desde una conexión de banda ancha típica | < 3 segundos desde la primera solicitud |
| CE-02 | Las interacciones de búsqueda, filtro y paginación producen retroalimentación visible | < 200 ms tras la acción del usuario |
| CE-03 | Todos los textos visibles al usuario están en español | 100 % de los textos de la interfaz |
| CE-04 | Cumplimiento de accesibilidad WCAG 2.1 nivel AA en contraste, teclado y etiquetas | Sin fallos en auditoría automatizada de accesibilidad |
| CE-05 | Los datos ya consultados se muestran sin espera perceptible al volver a verlos en los 5 minutos siguientes | Verificable mediante prueba de acceso repetido a recursos ya solicitados |
| CE-06 | Todos los casos límite documentados tienen prueba automatizada en estado pasado | 10 de 10 casos con prueba verde |
| CE-07 | Ninguna operación queda en estado de carga indefinido; toda espera superior a 10 s produce mensaje y opción de reintento | Verificable en pruebas de tiempo de espera simulado |

---

## 9. Puntos que Requieren Clarificación

Todas las aclaraciones pendientes han sido resueltas en la fase `clarify` del 27/10/2026 y sus decisiones han sido incorporadas a los requisitos y escenarios de este documento. No quedan puntos abiertos para la fase `plan`.

| NC | Decisión tomada | Incorporada en |
|----|-----------------|----------------|
| NC-01 — Lógica AND/OR al filtrar por tipos | **OR**: se muestran las criaturas que tienen al menos uno de los tipos seleccionados | HU-04 Esc. 2, RF-014, RF-028 |
| NC-02 — Descripción de habilidad sin traducción al español | **Inglés + nota**: se muestra la descripción en inglés con nota en español indicando la ausencia de traducción | HU-05 Esc. 1, Esc. 5, RF-018 |
| NC-03 — Punto de entrada a la comparación | **Sección dedicada**: sección accesible desde la navegación principal con dos selectores independientes | HU-06 Esc. 7, RF-029 |

## 10. Trazabilidad Resumen

| Historia | RF relacionados | Casos límite | Criterios de éxito |
|----------|-----------------|--------------|-------------------|
| HU-01    | RF-001, RF-002, RF-003, RF-023, RF-024, RF-025, RF-026 | CL-05, CL-09 | CE-01, CE-02, CE-04, CE-06, CE-07 |
| HU-02    | RF-004, RF-005, RF-006, RF-007, RF-008, RF-009, RF-010, RF-011, RF-027 | CL-01, CL-02, CL-03, CL-04, CL-08 | CE-02, CE-04, CE-06 |
| HU-03    | RF-003, RF-012, RF-013, RF-023, RF-024, RF-025 | CL-05 | CE-01, CE-02, CE-04, CE-07 |
| HU-04    | RF-014, RF-015, RF-016, RF-017, RF-028 | CL-06 | CE-02, CE-04, CE-05, CE-06 |
| HU-05    | RF-018, RF-019, RF-023, RF-024, RF-025 | — | CE-03, CE-04, CE-05, CE-07 |
| HU-06    | RF-020, RF-021, RF-022, RF-023, RF-024, RF-025, RF-029 | CL-10 | CE-02, CE-04, CE-06, CE-07 |

---

*Documento pendiente de revisión humana (principio S-04). Las aclaraciones NC-01, NC-02 y NC-03 han sido resueltas. Una vez aprobado, la siguiente fase es `plan`.*

---

## 11. Registro de Cambios

### v1.1.0 — 27/10/2026

| # | Elemento | Tipo | Descripción |
|---|----------|------|-------------|
| 1 | CE-05 (era CE-06 en v1.0.0) | Corrección | Se reformula el criterio de caché eliminando la referencia a herramientas de red del navegador. Nuevo enunciado: "los datos ya consultados se muestran sin espera perceptible al volver a verlos en los 5 minutos siguientes". El umbral de verificación pasa a ser una prueba de acceso repetido. (El ID cambia de CE-06 a CE-05 por la renumeración del punto 9 de esta misma versión.) |
| 2 | HU-01 | Adición | Se agrega el Escenario 6 "Pantalla de 320 px de ancho" con GWT completo, cubriendo RF-026. |
| 3 | HU-06 | Adición | Se agrega el Escenario 6 "Indicador de carga durante la comparación" con GWT completo, cubriendo RF-023. |
| 4 | RF-023 | Corrección de trazabilidad | Se reemplaza "HU-06 (implícito)" por "HU-06 Esc. 6" ahora que el escenario existe explícitamente. |
| 5 | RF-026 | Corrección de trazabilidad | Se añade "HU-01 Esc. 6" a la trazabilidad, junto a la referencia a la constitución U-02. |
| 6 | HU-02 | Ampliación | El enunciado especifica que la búsqueda se aplica sobre todo el catálogo. Se agrega Escenario 10 "Paginación de resultados de búsqueda" con GWT. |
| 7 | RF-027 (nuevo) | Adición | La búsqueda se aplica al catálogo completo y sus resultados se paginan igual que el catálogo general. Trazabilidad: HU-02 Esc. 10. |
| 8 | CE-03 (v1.0.0) | Eliminación | Se elimina el criterio de cobertura de pruebas ≥ 80 % porque ya está cubierto por el principio P-02 de la constitución v1.1.0; duplicarlo aquí generaba redundancia y posible inconsistencia. |
| 9 | CE-04..CE-08 (v1.0.0) | Renumeración | Al eliminar CE-03, los criterios CE-04 a CE-08 pasan a ser CE-03 a CE-07. Todas las referencias en la tabla de trazabilidad se actualizan. |
| 10 | Encabezado | Actualización | Versión actualizada a 1.1.0 y añadido el campo "Última enmienda: 27/10/2026". |

### v1.3.0 — 27/10/2026

| # | Elemento | Tipo | Descripción |
|---|----------|------|-------------|
| 1 | HU-04 Esc. 2 | Resolución NC-01 | Lógica de combinación de tipos definida como OR: se muestran las criaturas que tienen al menos uno de los tipos seleccionados. Se elimina la marca `[NEEDS CLARIFICATION — NC-01]`. |
| 2 | RF-014 | Resolución NC-01 | Reescrito para declarar explícitamente la lógica OR en la combinación de múltiples tipos. |
| 3 | RF-028 (nuevo) | Resolución NC-01 | El selector informa al usuario que cada criatura tiene máximo dos tipos, sin impedir seleccionar más de dos. |
| 4 | HU-05 Esc. 1 | Resolución NC-02 | Ajustado para el caso en que la descripción sí existe en español (escenario de éxito principal). |
| 5 | HU-05 Esc. 5 (nuevo) | Resolución NC-02 | Escenario GWT para cuando no existe descripción en español: se muestra en inglés con nota en español. Se elimina la marca `[NEEDS CLARIFICATION — NC-02]`. |
| 6 | RF-018 | Resolución NC-02 | Reescrito para cubrir ambos casos: descripción en español disponible, y descripción en inglés con nota cuando no lo está. |
| 7 | HU-06 enunciado | Resolución NC-03 | Actualizado para reflejar que la comparación parte de una sección dedicada accesible desde la navegación principal. |
| 8 | HU-06 Esc. 7 (nuevo) | Resolución NC-03 | Escenario GWT para el acceso mediante sección dedicada con dos selectores independientes. Se elimina la marca `[NEEDS CLARIFICATION — NC-03]`. |
| 9 | RF-020 | Resolución NC-03 | Actualizado para alinear terminología con los escenarios revisados de HU-06. |
| 10 | RF-029 (nuevo) | Resolución NC-03 | Describe la sección dedicada de comparación: acceso desde navegación principal, dos selectores con búsqueda sobre catálogo completo, comparación activa solo cuando ambos tienen selección. |
| 11 | Sección 9 | Actualización | Reemplazada por tabla resumen de decisiones tomadas en `clarify`; ya no contiene marcas `[NEEDS CLARIFICATION]`. |
| 12 | Tabla de trazabilidad | Actualización | RF-028 añadido a HU-04; RF-029 añadido a HU-06. |
| 13 | Pie del documento | Actualización | Refleja que las 3 aclaraciones están resueltas y la siguiente fase es `plan`. |

### v1.2.0 — 27/10/2026

| # | Elemento | Tipo | Descripción |
|---|----------|------|-------------|
| 1 | HU-03 Esc. 3 | Ampliación | Al volver desde la ficha se restauran también los tipos seleccionados, además del término de búsqueda y la página. |
| 2 | RF-013 | Ampliación | Se añade la restauración de los tipos seleccionados al comportamiento de volver desde la ficha. |
| 3 | HU-05 Esc. 1 | Corrección | Se elimina el paréntesis "(o en el idioma disponible si no hay traducción al español)"; el caso sin traducción queda remitido a NC-02 sin resolverse. |
| 4 | HU-04 Esc. 4 | Precisión semántica | Se diferencia explícitamente "limpiar filtros" (quita tipos, conserva búsqueda) de "limpiar la búsqueda" (quita texto, conserva tipos). Ambas opciones se ofrecen ante lista vacía. |
| 5 | HU-06 Esc. 1 | Ampliación | El resaltado de la estadística mayor debe incluir indicación textual o simbólica; no puede depender únicamente del color. |
| 6 | HU-06 Esc. 2 | Ampliación | La indicación de empate debe incluir indicación textual o simbólica; no puede depender únicamente del color. |
| 7 | Tabla de trazabilidad | Corrección | CE-04 se asocia a todas las historias (aplica a toda la interfaz); CE-06 se asocia a HU-01, HU-02, HU-04 y HU-06 (las que tienen casos límite); CE-07 se asocia a HU-01, HU-03, HU-05 y HU-06 (las que tienen escenario de timeout). |

### v1.0.0 — 27/10/2026
Versión inicial con 6 historias de usuario, 26 RF, 10 casos límite y 8 criterios de éxito.
