# PRD — Frontend de El Cauquén por fases

**Alcance:** exclusivamente `elcauquen` (sitio público y admin). El backend (`../elcauquen-backend`) ya está desplegado y no se modifica desde acá.  
**Objetivo:** consumir la API en producción: un sitio público con el catálogo y un admin para que `owner` y `editor` administren categorías, tipos de medida, productos, galerías y orden. Cada fase es una unidad acotada para una sesión de implementación con agentes.

## 1. Fuentes y decisiones

Este PRD integra, del repo del backend:

- [`docs/openapi.json`](../../../elcauquen-backend/docs/openapi.json): formas de request, response y códigos de error. Manda para las formas HTTP.
- [`docs/contrato-api-borrador.md`](../../../elcauquen-backend/docs/contrato-api-borrador.md): reglas y flujos (sesión, ingesta de imágenes, galería, publicación, diferencias con el prototipo).
- [`CONTEXT.md`](../../../elcauquen-backend/CONTEXT.md): glosario del dominio. La UI y el código usan esos términos.
- [`docs/api-por-fases/fases/README.md`](../../../elcauquen-backend/docs/api-por-fases/fases/README.md) y su [`PRD.md`](../../../elcauquen-backend/docs/api-por-fases/PRD.md): reglas de negocio ya implementadas.
- Prototipo visual del admin: el handoff (`docs/elcauquen-admin-prototype-handoff-2026-09-22.md`) y `admin/`, retirados en la fase 10; siguen en el historial de git (`git show c0bc407:admin/admin.js`). Era un prototipo, no el producto final: el contrato manda.

Si hay diferencias, prevalece el backend para reglas y formas HTTP.

Las decisiones de framework, topología, tipos, migración y render (D1–D5) están en
[§4](#4-decisiones-globales), con su motivo y sus fuentes.

Decisiones ya tomadas por el backend que el front respeta:

- No hay registro público. `owner` (único) gestiona integrantes; `editor` administra el catálogo.
- La sesión es de Better Auth bajo `/api/auth/*`, con cookies: el admin siempre usa `credentials: 'include'`.
- El sitio público usa `/api/productos` y `/api/categorias` sin credenciales.
- Las imágenes se suben directo a R2 con URL firmada; nunca pasan por la API.

## 2. Resultado esperado y límites

El visitante ve el catálogo publicado con imágenes WebP en tres tamaños. Los usuarios internos inician sesión, administran el catálogo, suben y publican imágenes, y reordenan productos.

No se incluyen carrito, pago, stock, registro público ni cambios en el backend. Si el front necesita un cambio de contrato, se registra como pendiente para el backend y no se resuelve con un parche en el cliente.

## 3. Reglas que deben quedar estables

### Cliente y contrato

- Los tipos se generan desde `openapi.json`; no se escriben a mano. Un script (`pnpm gen:api`) los regenera y un chequeo detecta tipos desactualizados.
- Un solo cliente HTTP: base URL por entorno, `credentials: 'include'` en el admin y traducción de la forma de error del contrato (código legible por máquina + mensaje) a errores tipados.
- `401` redirige al login; `403` muestra falta de permiso; `409` se maneja según su código (`NOMBRE_EN_USO`, `ORDEN_DESACTUALIZADO`, etc.); `422` muestra la regla incumplida; `503` indica infraestructura no disponible.
- Los IDs son strings opacos. No se parsean ni se asume su formato.
- Los precios son enteros en centavos y la moneda es `ARS`; el formateo es solo de presentación.

### UI

- Los textos y nombres de la UI usan el glosario de `CONTEXT.md` (producto, borrador, publicado, galería, diseño, tipo de medida, etc.).
- La galería muestra las etapas de la imagen: pendiente de subida, pendiente de procesamiento, procesando, procesada y fallida, con reintento.
- **Patrón del admin** (listado, formularios y errores, confirmación, avisos, estado): F5-D2 a
  F5-D6 en la [fase 5](./fases/fase-5.md#definición). Las fases 6 a 9 lo reusan y registran solo
  sus desvíos.
- La posición 0 de la galería es la imagen principal y no puede ser un diseño; la UI lo comunica antes de que la API lo rechace.
- Un producto publicado no puede quedar inválido: la UI deshabilita o explica las acciones que la API rechazaría con `422`.

### Calidad mínima transversal

- Typecheck, lint y build pasan antes de cerrar cada fase.
- Tests mínimos, solo donde un error no se ve a simple vista: la traducción de errores del cliente HTTP y la lógica de estado (subida de imágenes, orden con `409`). Los componentes y la UI se verifican con el build y la prueba manual.
- Las variables de entorno se documentan en un ejemplo sin valores reales. Ningún secreto en el repo ni en el chat.
- Accesibilidad básica: formularios con etiquetas, foco visible y navegación por teclado en el admin.
- El sitio público conserva su rendimiento: imágenes con el tamaño adecuado (`url160`, `url640`, `url1600`) y dimensiones reservadas cuando sea posible.

## 4. Decisiones globales

Cerradas el 2026-09-24: las de alcance con el usuario y las técnicas con evidencia. Cada fase suma
las suyas (FN-Dk) en `fases/fase-N.md`.

**D1. Framework: Astro 7 con TypeScript; React solo en el admin.** El sitio público es Astro sin
React: la grilla y el contacto son HTML, y el visor es un `<script>` portado de `main.js`. Cada
página del admin es **una única isla** React `client:only="react"`, con el layout y la navegación
en Astro. Motivo:

- El sitio público casi no tiene estado, y Astro no manda JS salvo con una directiva `client:*`
  ([directivas](https://docs.astro.build/en/reference/directives-reference/)). Así se cumple el
  rendimiento de §3.
- El admin es estado de cliente (formularios con errores, etapas con consulta, orden con `409`). El
  prototipo en DOM nativo ya ocupaba 1150 líneas en `admin/admin.js`.
- Next.js no le suma nada al admin: el front nunca ve la cookie de sesión (ver D2), así que todo
  sería `"use client"`, y el sitio público cargaría React en cada página.
- El Context de React no cruza islas ([estado entre islas](https://docs.astro.build/en/recipes/sharing-state-islands/)).
  Una isla por página evita tener que compartirlo; si dos islas necesitan estado común, se usa Nano
  Stores.

**D2. Topología: un proyecto Astro y un proyecto Vercel; el admin en
`https://admin.elcauquenartesanias.com.ar`.** Las páginas del admin viven en `src/pages/admin/`.
En `vercel.json`, el host del admin lleva a `/admin/*` y los otros hosts redirigen `/admin/*` a ese
host ([`has`](https://vercel.com/docs/project-configuration/vercel-json)). El mecanismo, con
redirects y no un rewrite, está en [F4-D1](./fases/fase-4.md#definición). Motivo:

- Better Auth emite la cookie `SameSite=Lax`, solo para el host `api.*`, porque el backend no
  activa `crossSubDomainCookies` (`elcauquen-backend/src/auth/auth.ts` y
  `node_modules/better-auth/dist/cookies/index.mjs`). En un `fetch`, solo viaja si el pedido es del
  mismo sitio.
- `admin.*` y `api.*` son el mismo sitio. Un origen `*.vercel.app` sería cross-site, y además el
  CORS acepta un único `ADMIN_ORIGIN`.
- `admin.*` ya está en `ADMIN_ORIGIN`, en `RESET_PASSWORD_URL` y en el CORS de R2 (handoff del
  backend). Otro origen obliga a cambiar las tres cosas.
- El front no ve la sesión: el guard de rutas corre en el cliente con `GET /admin/sesion`, y las
  páginas del admin se prerenderizan.
- Un solo build comparte estilos, cliente API y tipos, sin workspace ni dos proyectos Vercel.

Consecuencias:

- Los previews `*.vercel.app` no pueden iniciar sesión contra la API de producción. El admin se
  prueba en local o en `admin.*`.
- Safari limita a 7 días las cookies de `api.*` porque es un CNAME a Railway
  ([WebKit](https://webkit.org/tracking-prevention/)). Coincide con la sesión por defecto de Better
  Auth (7 días), así que no cambia nada.
- En local, el admin corre en `http://localhost:4321/admin/`. El `.env` del backend necesita
  `ADMIN_ORIGIN=http://localhost:4321` y `RESET_PASSWORD_URL=http://localhost:4321/admin/restablecer`.

**D3. Tipos y cliente: `openapi-typescript` sobre `openapi.json` más `openapi-fetch`.** Se
descarta `hc<AppType>`. Motivo:

- `hc` exige la misma versión de Hono en los dos repos e importar el tipo del código del backend
  ([Hono RPC](https://hono.dev/docs/guides/rpc)).
- El backend publica `docs/openapi.json` generado y verificado como fuente de las formas HTTP
  ([ADR-0005](../../../elcauquen-backend/docs/adr/0005-las-formas-http-se-generan-del-codigo.md)).
- `openapi-fetch` devuelve `{ data, error, response }`, con `error` tipado desde las respuestas
  4xx/5xx, y acepta un `fetch` propio para los tests ([openapi-fetch](https://openapi-ts.dev/openapi-fetch/)).
- `/api/auth/*` queda fuera de `openapi.json`. Su tipado se decide en la fase 4.

**D4. Migración: el proyecto Vercel actual sigue siendo el único, y el sitio viejo se sirve desde
`public/`.** En la fase 1, `index.html`, `main.js`, `styles.css` y los `.webp` y fuentes de
`assets/` pasan tal cual a `public/`, que Astro copia sin tocar al build
([estructura](https://docs.astro.build/en/basics/project-structure/)). `/` sigue siendo el sitio
actual mientras no exista `src/pages/index.astro`. Las etapas de la migración:

- **Fases 1 a 9:** el admin crece en `/admin` y, desde la fase 4, también en el dominio `admin.*`
  del mismo proyecto. El catálogo nuevo se arma en `/catalogo-nuevo`, con `noindex`.
- **Fase 10:** el catálogo nuevo pasa a `/` y se borra el sitio viejo de `public/`. Es un commit,
  sin mover dominios. Hecho: el catálogo es `src/pages/index.astro` y `/catalogo-nuevo` ya no
  existe.

Motivo:

- Producción hoy devuelve `{"productos":[]}`. Cambiar la raíz antes de cargar el catálogo desde el
  admin (fases 5 a 7) la deja vacía.
- Desde la fase 4, el admin tiene que estar publicado en `admin.*` (CORS de la API y de R2, enlace
  del mail de contraseña). Con un solo proyecto no hay que desconectar Git, crear otro proyecto ni
  mover dominios. La ISR de D5 se prueba en producción sobre `/catalogo-nuevo`.
- El usuario eligió esta opción frente a congelar el proyecto actual y crear uno nuevo.

Cuidados:

- Vercel no detecta Astro en un proyecto que ya existe. `vercel.json` fija `"framework": "astro"`,
  que reemplaza al preset del panel
  ([`framework`](https://vercel.com/docs/project-configuration/vercel-json)).
- Todo lo que está en `public/` se publica. Los `.jpeg`/`.jpg` originales del sitio viejo quedaron
  fuera de `public/` hasta la fase 10, que los borró del repo.

**D5. Render del catálogo público: SSR con ISR en Vercel (`@astrojs/vercel`, `isr`).** Solo las
páginas del catálogo usan `export const prerender = false`; el admin queda estático. Motivo:

- El HTML llega con los productos (SEO, sin salto de layout).
- Lo publicado aparece en el sitio al vencer la `expiration`, que se fija en la fase 3.
- La alternativa de estático con rebuild necesita un deploy hook que ni el backend ni el admin
  pueden disparar sin cambiar el contrato
  ([adapter de Vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/)).

## 5. Fases de implementación

**Uso:** una fase por sesión, con los [prompts](./prompts.md). Cada fase tiene su definición
(decisiones FN-Dk, construir, cerrar cuando) y su registro en `fases/fase-N.md`; el estado, en
[`fases/README.md`](./fases/README.md).

| Fase | Entrega verificable | Depende de |
| --- | --- | --- |
| 0. Preparación externa | Railway con deploy automático, correo confirmado, `.env` local completo | Ninguna |
| [1. Decisiones y esquema](./fases/fase-1.md) | Proyecto Astro base, working tree limpio y `AGENTS.md` del front | 0 |
| [2. Capa de API tipada](./fases/fase-2.md) | Tipos generados y cliente probado contra producción | 1 |
| [3. Sitio público](./fases/fase-3.md) | Catálogo público consumiendo la API | 2 |
| [4. Login y sesión](./fases/fase-4.md) | Login, logout, `/restablecer` y guard de rutas | 2 |
| [5. Categorías y tipos de medida](./fases/fase-5.md) | CRUD completo en el admin | 4 |
| [6. Productos con medidas](./fases/fase-6.md) | CRUD de productos en borrador con medidas | 5 |
| [7. Galería e imágenes](./fases/fase-7.md) | Subida, etapas, publicar y volver a borrador | 6 |
| [8. Orden](./fases/fase-8.md) | Reordenamiento con manejo de `409` | 6 |
| [9. Integrantes](./fases/fase-9.md) | Alta y desactivación de editores (solo `owner`) | 4 |
| [10. Limpieza y cierre](./fases/fase-10.md) | Repo sin restos, DNS final | 3, 7, 8 y 9 |
| [11. Mejoras opcionales del front](./fases/fase-11.md) | Páginas 404 y 500 propias, formulario de producto sin mensajes viejos, Productos como inicio del admin y botón para ver la contraseña | 10 |
| [12. Admin mobile y orden con arrastre](./fases/fase-12.md) | Admin cómodo en el teléfono y el orden del catálogo en una grilla que se arrastra | 11 |

Las fases 3 y 4 pueden ejecutarse en cualquier orden después de la 2; las 7, 8 y 9 pueden ejecutarse en cualquier orden después de sus dependencias.

## 6. Riesgos y decisiones técnicas diferidas

| Tema | Tratamiento |
| --- | --- |
| Cookies y CORS entre orígenes | Probar en la fase 4 con el origen real. Si falla, revisar `ADMIN_ORIGIN` en Railway y los `trustedOrigins`; no se usa `*` con credenciales. |
| CORS de R2 | Se prueba por primera vez en la fase 7. Si falla el `PUT`, revisar `AllowedOrigins` y `Content-Type` en Cloudflare. |
| Cambio de origen del admin | Cambiar `ADMIN_ORIGIN`, `RESET_PASSWORD_URL` y el `AllowedOrigins` de R2 juntos. |
