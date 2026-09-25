# El Cauquén — frontend

Sitio público y admin del catálogo, en Astro con TypeScript, que consume la API del backend
(`../elcauquen-backend`, desplegado en `https://api.elcauquenartesanias.com.ar`). El plan y su avance
están en [`docs/frontend-por-fases/`](./docs/frontend-por-fases/fases/README.md): **antes de implementar
una fase**, leé ese README y la definición de la fase en el PRD.

## Comandos

Con pnpm y Node ≥ 22.12: `pnpm dev` (en `http://localhost:4321`), `pnpm build`, `pnpm preview`,
`pnpm typecheck` (`astro check`) y `pnpm lint` (Biome). Typecheck, lint y build pasan antes de cerrar
cada fase.

- **Al agregar una dependencia con build scripts**, pnpm la bloquea con `ERR_PNPM_IGNORED_BUILDS`;
  usá `pnpm approve-builds <paquete>`, que la registra en `pnpm-workspace.yaml`. `pnpm approve-builds`
  sin argumento es interactivo.
- **El lockfile se escribe con pnpm 12, pero Vercel instala con pnpm 9 o 10** (lo elige por
  `lockfileVersion: 9.0`). Al cambiar dependencias o `pnpm-workspace.yaml`, probá en una copia
  `npx pnpm@10 install --frozen-lockfile` y `npx pnpm@10 build`.
- `astro check` exige TypeScript 5 o 6: TypeScript queda en 6 aunque el backend use 7.

## Estructura

- `public/`: el sitio viejo (`index.html`, `main.js`, `styles.css`, `assets/`), que Astro copia tal
  cual y sirve en `/` hasta la fase 10. Se edita solo para arreglos del sitio en producción.
- `src/pages/`: páginas Astro. El catálogo nuevo vive en `/catalogo-nuevo` con `noindex` hasta la
  fase 10; el admin, en `src/pages/admin/`.
- `assets/`: los JPEG originales, fuente de los `.webp` de `public/assets/`. Quedan fuera de
  `public/` porque todo lo que está ahí se publica.
- `admin/`: prototipo descartable del admin en DOM nativo. Referencia visual, no código a portar; se
  borra en la fase 10.

## Decisiones que condicionan el código

El detalle y los motivos están en D1–D5 de la fase 1 del [PRD](./docs/frontend-por-fases/PRD.md).

- **Sitio público sin React** (D1): HTML de Astro y `<script>` para el visor.
- **Admin: una isla React `client:only="react"` por página** (D1), con layout y navegación en Astro.
  El Context de React no cruza islas; el estado compartido entre islas va en Nano Stores.
- **Un proyecto Vercel; el admin se publica en `https://admin.elcauquenartesanias.com.ar`** (D2), que
  `vercel.json` reescribe a `/admin/*` por host. La cookie de sesión es de `api.*` y solo viaja desde
  un origen del mismo sitio, así que un preview `*.vercel.app` no puede iniciar sesión: el admin se
  prueba en local o en `admin.*`. El guard de rutas corre en el cliente con `GET /admin/sesion`, y las
  páginas del admin se prerenderizan.
- **Tipos generados desde `openapi.json` del backend con `openapi-typescript`, y cliente con
  `openapi-fetch`** (D3). `/api/auth/*` queda fuera de `openapi.json`.
- **Catálogo público con SSR e ISR** (D5): solo sus páginas declaran `export const prerender = false`.

## Reglas del contrato y la UI

Las reglas estables están en §3 del [PRD](./docs/frontend-por-fases/PRD.md); las formas HTTP, en
`../elcauquen-backend/docs/openapi.json`, y los términos de la UI, en `../elcauquen-backend/CONTEXT.md`.
Ante una diferencia, manda el backend.

- Los tipos de la API salen del generado: toda forma que esté en `openapi.json` se importa de ahí.
- Los IDs son strings opacos; los precios, enteros en centavos en `ARS`, formateados solo al mostrar.
- Si el front necesita un cambio de contrato, se anota como pendiente del backend en
  `docs/frontend-por-fases/fases/README.md`.
- Tests solo para la traducción de errores del cliente HTTP y la lógica de estado (subida de imágenes,
  orden con `409`); la UI se verifica con el build y la prueba manual.

## Entorno

- Windows con PowerShell 5.1. Para editar archivos, usá Edit y Write: `Get-Content`/`Set-Content`
  rompen los acentos de los archivos UTF-8 sin BOM.
- Los secretos los carga el usuario en su terminal o en el panel de Vercel; las variables se documentan
  en un ejemplo sin valores reales.
