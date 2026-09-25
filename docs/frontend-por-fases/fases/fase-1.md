# Fase 1 — Decisiones y esquema

**Estado:** abierta hasta que el usuario confirme el deploy de producción (ver [Pendientes](#pendientes-del-usuario)).
**Fecha:** 2026-09-24.
**Definición:** [PRD, fase 1](../PRD.md#fase-1--decisiones-y-esquema). Las decisiones D1–D5 ya estaban cerradas; este registro cubre la implementación.

## Implementado

- Proyecto Astro en la raíz: `package.json` (scripts `dev`, `build`, `preview`, `typecheck`, `lint`), `astro.config.ts` con `@astrojs/react` y `@astrojs/vercel`, `tsconfig.json` sobre `astro/tsconfigs/strictest`, `biome.json` y `pnpm-workspace.yaml`.
- Versiones fijadas: `astro` 7.3.5, `@astrojs/react` 7.0.0, `@astrojs/vercel` 11.0.11, `react`/`react-dom` 19.3.0, `typescript` 6.0.3, `@astrojs/check` 0.9.10, `@biomejs/biome` 2.5.14.
- Sitio viejo movido con `git mv` a `public/`: `index.html`, `main.js`, `styles.css`, los `.webp` y `assets/fonts/` (con sus licencias OFL). Los `.jpeg`/`.jpg` quedan en `assets/`.
- `vercel.json` con `"framework": "astro"`; `.vercelignore` y `.gitignore` ajustados (`dist/`, `.astro/`, `assets/`, `admin/`).
- `AGENTS.md` y `CLAUDE.md` (`@AGENTS.md`) del front.
- Working tree: se versionan el prototipo (`admin/`) y su handoff, que el PRD cita como fuentes; se confirma el borrado de los handoffs del 17/09 (el handoff del prototipo dice que se borraron a propósito). El renormalizado de CRLF eliminó las marcas `M` sin cambios de contenido.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| TypeScript 6.0.3, no 7 | `@astrojs/check` 0.9.10 declara `typescript: ^5 \|\| ^6` como peer. |
| Biome como linter, con la base del backend (`lineWidth` 120, comillas simples, sin `;`) y las reglas recomendadas | Mismo estilo en los dos repos. El backend usa `preset: none`; acá se dejan las recomendadas porque no hay código previo que las incumpla. |
| Sin páginas en `src/pages/` | `/` tiene que seguir siendo el sitio viejo (D4); cualquier página ahora sería un placeholder publicado. El build avisa `Missing pages directory` hasta la fase 3 o 4. |
| Adapter de Vercel sin `isr` | La `expiration` se fija en la fase 3 (D5). Sin páginas `prerender = false`, la salida es estática. |
| Orden de los headers de `/assets/*`: la regla de fuentes va última | En producción, `/assets/fonts/*` recibía `max-age=86400` porque la regla genérica, declarada después, pisaba a la de fuentes (Vercel aplica la última que coincide). |
| `minimumReleaseAgeExclude: astro@7.3.5` en `pnpm-workspace.yaml` | pnpm 12 lo agregó solo al instalar: 7.3.5 tiene menos días que la política de antigüedad mínima. Se puede quitar cuando la versión envejezca. |
| Lockfile compatible con pnpm 10 | Vercel instala con pnpm 9 o 10 para `lockfileVersion: 9.0` ([package managers](https://vercel.com/docs/package-managers)); pnpm 12 no está soportado. Se probó `pnpm@10 install --frozen-lockfile` y el build. |

## Validaciones ejecutadas

- `pnpm typecheck`: 0 errores, 0 advertencias. `pnpm lint`: sin hallazgos. `pnpm build`: completa (0 páginas; `public/` copiado a `.vercel/output/static`).
- En una copia limpia: `npx pnpm@10 install --frozen-lockfile` (pnpm 10.34.5) y `npx pnpm@10 build` completan.
- `pnpm preview` en `http://localhost:4321`: `/` responde 200 con el mismo `index.html`; `styles.css`, `main.js`, `logo.webp`, las fuentes y los derivados `-640.webp` responden 200; `/assets/velas.jpeg` responde 404 (quedó fuera, como pide D4).
- Salida del build contra `HEAD`: `index.html`, `main.js`, `styles.css` y las licencias OFL son idénticos al versionado salvo el CRLF de la copia local; el resto de `dist/` coincide con `public/` (más `_astro/`, sin referencias desde el sitio). Sin diferencias visibles por construcción.

## Desvíos

- **Tres docs sin versionar quedan para el usuario:** `docs/contrato-api-borrador.md` (el PRD pide borrarlo), `docs/Logica Negocio El Cauquen.md` y `docs/research/hono-better-auth-postgres.md` (copias idénticas de las del backend). El entorno bloqueó el borrado de archivos sin versionar. `docs/handoff-backend.md` también queda sin versionar: su contenido ya está en el PRD, en este `AGENTS.md` y en el README del backend.
- **Assets en 404 tras el primer deploy (`71658f3`):** `.vercelignore` tenía `assets/` sin ancla, que con la sintaxis de gitignore excluye también `public/assets/`; el sitio salió sin fotos, logo ni fuentes. Se anclaron todas las rutas con `/` (`/assets/`). Comprobado con `git check-ignore --no-index`: con el patrón viejo `public/assets/logo.webp` queda excluido; con el nuevo, incluido, y `assets/logo.jpg` sigue excluido. Tras el deploy de `e933ab1`, los 58 archivos de `public/assets/` responden 200 en producción. Los headers de `/assets/*` también se aplican a los 404, así que un navegador que abrió el sitio entre los dos deploys guarda el 404 un día: se resuelve con recarga forzada o en incógnito.
- **Headers de `vercel.json` con el adapter:** se aplican sobre la salida de la Build Output API. Verificado en producción tras `71658f3`: `/assets/fonts/inter-latin-var.woff2` devuelve `max-age=31536000, immutable` y `/assets/logo.webp`, `max-age=86400, stale-while-revalidate=2592000` (en 404, antes del arreglo de `.vercelignore`).

## Revisión de la sesión (prompt 6.3)

- **`scripts/check-vercelignore.mjs`, dentro de `pnpm lint`:** falla si `.vercelignore` excluye algo de `public/`, `src/` o la configuración del build. `astro build` y `astro preview` no leen `.vercelignore`, y por eso el 404 de los assets pasó las validaciones locales. Probado en rojo agregando `assets/` (lista los 58 archivos de `public/assets/`) y en verde con el archivo actual.
- **`.gitattributes` con `eol=lf`:** con `core.autocrlf=true`, la copia local en CRLF generaba marcas `M` sin cambios y diferencias falsas al comparar el build contra `HEAD`.
- **`AGENTS.md` reducido a lo no deducible** (pnpm con build scripts, pnpm 10 en Vercel, TypeScript 6). El resto duplicaba el PRD (§2, §3, D1–D5 y los prompts de §6) o `package.json`. El criterio de cierre de la fase en el PRD pasó a pedir solo eso.

## Pendientes del usuario

Cierran la fase; ver la lista ordenada en [README](./README.md).

1. Borrar `docs/research/hono-better-auth-postgres.md`, la única copia del backend que sigue sin versionar.
2. Confirmar, en incógnito o tras una recarga forzada, que se ven las fotos, el logo, las fuentes y el favicon. El agente ya verificó que los 58 archivos de `public/assets/` responden 200 en producción después de `e933ab1`.
