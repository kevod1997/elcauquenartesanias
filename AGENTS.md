# El Cauquén — frontend

Sitio público y admin en Astro que consume la API de `../elcauquen-backend`. El plan, las
decisiones D1–D5 y las reglas estables (§3) están en el [PRD](./docs/frontend-por-fases/PRD.md);
el avance, en [`fases/`](./docs/frontend-por-fases/fases/README.md).

- **Al agregar una dependencia con build scripts**, pnpm la bloquea con `ERR_PNPM_IGNORED_BUILDS`;
  usá `pnpm approve-builds <paquete>` (sin argumento es interactivo).
- **Al cambiar dependencias o `pnpm-workspace.yaml`**, probá en una copia
  `npx pnpm@10 install --frozen-lockfile` y `npx pnpm@10 build`: Vercel instala con pnpm 9 o 10
  aunque el lockfile se escriba con pnpm 12.
- **`pnpm build` en Windows necesita el modo desarrollador** (symlinks del adapter de Vercel); sin él
  falla con `EPERM ... symlink`.
- **`astro dev` lee `PUBLIC_API_URL` del `.env` local**; para apuntar a otra API (el fixture o
  producción), pasala en la línea de comando, que tiene prioridad.
- **Al validar el admin en local**, el backend corre en `http://localhost:3001` (`pnpm dev` en
  `../elcauquen-backend`; el 3000 lo ocupa otro proyecto) con `ADMIN_ORIGIN=http://localhost:4321`.
  El owner de prueba está en `.env.test.local` (`OWNER_TEST_EMAIL`, `OWNER_TEST_PASSWORD`); el
  login es `POST /api/auth/sign-in/email` con el header `Origin: http://localhost:4321`.
- **El backend local manda mails reales por Resend**: invitá solo a `delivered+<etiqueta>@resend.dev`.
  El token de invitación o de reset está en la tabla `verification`, con `identifier`
  `reset-password:<token>` (`docker exec elcauquen-backend-postgres-1 psql -U postgres -d elcauquen`).
- **El backend local sube al bucket R2 de producción**: usá solo imágenes de `public/assets/` y
  borrá por la API las imágenes de prueba al terminar.
- **TypeScript queda en 6**: `astro check` no acepta la 7.
- **`pnpm peers check` marca `typescript` para `openapi-typescript`** (pide `^5`): genera bien con
  la 6 y el chequeo de `pnpm lint` lo cubre; no bajes TypeScript por eso.
