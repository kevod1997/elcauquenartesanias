# Fase 2 — Capa de API tipada

## Definición

**Construir:** copiar `openapi.json`, generar tipos con `openapi-typescript`, crear el cliente `fetch` con `credentials: 'include'` y el manejo de errores del contrato; script `pnpm gen:api`; variable de entorno de la URL de la API.

**Cerrar cuando:** `GET /api/categorias` funciona contra producción con tipos generados, el cliente tiene tests de la traducción de errores y `pnpm gen:api` es reproducible.

## Implementado

- `src/api/openapi.json`: copia versionada del contrato del backend. Vercel no tiene el repo del backend al lado, así que los tipos salen de esta copia.
- `src/api/schema.d.ts`: tipos generados con `openapi-typescript` 7.13.0.
- `scripts/gen-api.mjs`:
  - `pnpm gen:api` copia `../elcauquen-backend/docs/openapi.json` y regenera los tipos.
  - `--check` corre dentro de `pnpm lint` y falla si `schema.d.ts` no coincide con la copia, o si la copia no coincide con el backend (este último chequeo se saltea si el repo del backend no está al lado).
- `src/api/cliente.ts`:
  - `crearCliente`, sobre `openapi-fetch` 0.17.0.
  - `pedir()`: devuelve `data` o lanza `ErrorApi` (`status`, `codigo`, `message`).
  - `CodigoError`, derivado del componente `Error` generado.
- `src/api/index.ts`: dos instancias sobre `PUBLIC_API_URL`, `apiPublica` (`credentials: 'omit'`) y `apiAdmin` (`'include'`).
- `PUBLIC_API_URL` en el `env.schema` de `astro.config.ts` (`astro:env/client`, `url: true`, con la URL de producción por defecto). El ejemplo está en `.env.example`.
- `src/api/cliente.test.ts` (vitest 5.0.1, `pnpm test`): traducción de errores.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `pedir()` que lanza, en lugar de consumir `{ data, error }` en cada llamada | Una sola traducción de errores (§3); las pantallas reaccionan a `ErrorApi.status` y `codigo` (`401` al login, `409` según el código, etc.). |
| Códigos propios `SIN_CONEXION` (status 0, falla de `fetch`) y `RESPUESTA_INESPERADA` (error sin la forma del contrato) | No están en `openapi.json` porque la API no los emite. Cubren el `502` de Railway, un bloqueo de CORS y la forma `{ message, code }` de `/api/auth/*`, que la fase 4 va a traducir aparte. |
| Una fábrica y dos instancias, en lugar de un `credentials` por llamada | El PRD pide un solo cliente; el catálogo público no manda cookies y el admin siempre las manda (§1). |
| `astro:env` con valor por defecto de producción | Queda tipada y validada como URL. El sitio funciona sin `.env`; en local se apunta al backend con `PUBLIC_API_URL`. |
| Tipos sin formatear por Biome (excluidos en `biome.json`) | Son un artefacto: el `--check` compara la salida exacta de `openapi-typescript`. |
| `ErrorApi` sin parameter properties | La sintaxis queda borrable y el módulo corre también con `node` directo (se usó para la prueba contra producción). |

## Validaciones ejecutadas

- `pnpm test`: 11 tests pasan. Cubren un 2xx; 401, 403, 409, 422 y 503 con la forma del contrato; un 502 HTML, la forma de Better Auth y un 500 sin cuerpo como `RESPUESTA_INESPERADA`; una falla de `fetch` como `SIN_CONEXION`, con la causa, y `credentials` enviado.
- Contra producción (`https://api.elcauquenartesanias.com.ar`), con `crearCliente` y `pedir`:
  - `GET /api/categorias` → `{"categorias":[]}`.
  - `GET /admin/sesion` sin cookie → `ErrorApi` 401 `NO_AUTENTICADO`.
  - `GET /api/productos/no-existe` → 404 `PRODUCTO_NO_ENCONTRADO`.
- `pnpm gen:api` dos veces seguidas no deja diferencias, y `pnpm gen:api --check` pasa.
- `pnpm typecheck` (0 errores), `pnpm lint` y `pnpm build` pasan. En una copia limpia pasan también `npx pnpm@10 install --frozen-lockfile`, `npx pnpm@10 build` y el test.

## Desvíos

- `openapi-typescript` 7.13.0 declara `typescript: ^5.x` como peer, y `pnpm peers check` lo marca contra la 6.0.3. Genera bien con TS 6 (la salida pasa `--check` y `astro check`), así que se deja la advertencia.
- `.env`, `.env.example` y otras entradas `.env*` eran carpetas vacías sin versionar. El usuario las borró para poder crear `.env.example`.
