# El Cauquén — frontend

Sitio público y admin en Astro que consume la API de `../elcauquen-backend`. El plan, las
decisiones D1–D5 y las reglas estables (§3) están en el [PRD](./docs/frontend-por-fases/PRD.md);
el avance, en [`fases/`](./docs/frontend-por-fases/fases/README.md).

- **Al agregar una dependencia con build scripts**, pnpm la bloquea con `ERR_PNPM_IGNORED_BUILDS`;
  usá `pnpm approve-builds <paquete>` (sin argumento es interactivo).
- **Al cambiar dependencias o `pnpm-workspace.yaml`**, probá en una copia
  `npx pnpm@10 install --frozen-lockfile` y `npx pnpm@10 build`: Vercel instala con pnpm 9 o 10
  aunque el lockfile se escriba con pnpm 12.
- **`pnpm build` en Windows falla con `EPERM ... symlink`** si el modo desarrollador está apagado:
  el adapter de Vercel copia `node_modules` con symlinks a la función SSR. Buildeá en un contenedor
  (`docker run` con `node:24` sobre una copia del repo) o activá el modo desarrollador.
- **`astro dev` lee `PUBLIC_API_URL` del `.env` local**; para apuntar a otra API (el fixture o
  producción), pasala en la línea de comando, que tiene prioridad.
- **TypeScript queda en 6**: `astro check` no acepta la 7.
- **`pnpm peers check` marca `typescript` para `openapi-typescript`** (pide `^5`): genera bien con
  la 6 y el chequeo de `pnpm lint` lo cubre; no bajes TypeScript por eso.
