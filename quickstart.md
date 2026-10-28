# Quickstart — PokeDex Explorer

**Requisitos previos:** Node.js ≥ 18, npm ≥ 9, Git.

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/<org>/pokedex-explorer.git
cd pokedex-explorer
```

---

## 2. Instalar dependencias

```bash
npm ci
```

> `npm ci` usa exactamente las versiones del lockfile, garantizando reproducibilidad.

---

## 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador. Los cambios en `src/` se reflejan en tiempo real (HMR).

---

## 4. Ejecutar pruebas

```bash
# Todas las pruebas
npm test

# Con cobertura (umbral 80 % en services/ y application/)
npm run test:coverage

# Modo watch (desarrollo)
npm run test:watch
```

---

## 5. Verificar lint y formato

```bash
npm run lint          # ESLint
npm run format:check  # Prettier (solo verifica, no modifica)
npm run format        # Prettier (aplica cambios)
```

---

## 6. Construir para producción

```bash
npm run build
```

El resultado queda en `dist/`. Para previsualizar localmente:

```bash
npm run preview
```

---

## 7. Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm test` | Pruebas con Vitest |
| `npm run test:coverage` | Pruebas + informe de cobertura |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run lint` | Análisis estático con ESLint |
| `npm run format` | Formateo con Prettier |
| `npm run format:check` | Verificación de formato (CI) |
| `npm run build` | Build de producción con Vite |
| `npm run preview` | Previsualización del build |

---

## 8. Estructura de archivos clave

```
src/
├── presentation/   # Componentes DOM (sin lógica de negocio)
├── application/    # Controladores (estados idle/loading/success/error)
├── services/       # PokeApiClient, caché, http
├── domain/         # Tipos TypeScript compartidos
├── i18n/           # Textos en español (es.ts)
└── main.ts         # Punto de entrada

contracts/          # Interfaces públicas entre capas
tests/
├── unit/           # Pruebas unitarias
├── integration/    # Pruebas de integración
└── mocks/          # pokeApiMock.ts (nunca llama a la red real)
```

---

## 9. Convenciones de commits

Usar Conventional Commits (principio S-06):

```
feat(catalog): mostrar lista paginada de criaturas
fix(search): normalizar espacios al inicio y al final del término
test(cache): agregar prueba de expiración a los 5 minutos
docs(plan): actualizar plan.md a v1.0.0
```

Tipos permitidos: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `ci`.

---

## 10. Flujo de trabajo (SDD, principio S-05)

El proyecto sigue el orden de fases SDD:

```
constitution → specify → clarify → plan → tasks → analyze → implement → validate
```

Antes de implementar cualquier historia: revisar `specify.md` y `plan.md`. Antes de integrar: pasar lint, pruebas y build en CI.

---

*¿Dudas? Consulta `constitution.md`, `specify.md` o `plan.md` en la raíz del repositorio.*
