# PRD — Frontend de El Cauquén por fases

**Estado:** decisiones de arquitectura cerradas el 2026-09-24 (ver [fase 1](#fase-1--decisiones-y-esquema)).  
**Alcance:** exclusivamente `elcauquen` (sitio público y admin). El backend (`../elcauquen-backend`) ya está desplegado y no se modifica desde acá.  
**Objetivo:** consumir la API en producción: un sitio público con el catálogo y un admin para que `owner` y `editor` administren categorías, tipos de medida, productos, galerías y orden. Cada fase es una unidad acotada para una sesión de implementación con agentes.

## 1. Fuentes y decisiones

Este PRD integra, del repo del backend:

- [`docs/openapi.json`](../../../elcauquen-backend/docs/openapi.json): formas de request, response y códigos de error. Manda para las formas HTTP.
- [`docs/contrato-api-borrador.md`](../../../elcauquen-backend/docs/contrato-api-borrador.md): reglas y flujos (sesión, ingesta de imágenes, galería, publicación, diferencias con el prototipo).
- [`CONTEXT.md`](../../../elcauquen-backend/CONTEXT.md): glosario del dominio. La UI y el código usan esos términos.
- [`docs/api-por-fases/fases/README.md`](../../../elcauquen-backend/docs/api-por-fases/fases/README.md) y su [`PRD.md`](../../../elcauquen-backend/docs/api-por-fases/PRD.md): reglas de negocio ya implementadas.
- Prototipo visual actual: [handoff](../elcauquen-admin-prototype-handoff-2026-09-22.md) y `admin/admin.js`. Es un prototipo, no el producto final: el contrato manda.

Si hay diferencias, prevalece el backend para reglas y formas HTTP.

Las decisiones de framework, topología, tipos, migración y render están en la
[fase 1](#fase-1--decisiones-y-esquema), con su motivo y sus fuentes.

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
- La posición 0 de la galería es la imagen principal y no puede ser un diseño; la UI lo comunica antes de que la API lo rechace.
- Un producto publicado no puede quedar inválido: la UI deshabilita o explica las acciones que la API rechazaría con `422`.

### Calidad mínima transversal

- Typecheck, lint y build pasan antes de cerrar cada fase.
- Tests mínimos, solo donde un error no se ve a simple vista: la traducción de errores del cliente HTTP y la lógica de estado (subida de imágenes, orden con `409`). Los componentes y la UI se verifican con el build y la prueba manual.
- Las variables de entorno se documentan en un ejemplo sin valores reales. Ningún secreto en el repo ni en el chat.
- Accesibilidad básica: formularios con etiquetas, foco visible y navegación por teclado en el admin.
- El sitio público conserva su rendimiento: imágenes con el tamaño adecuado (`url160`, `url640`, `url1600`) y dimensiones reservadas cuando sea posible.

## 4. Fases de implementación

**Uso:** una fase por sesión, con los prompts de §6. El avance de cada fase queda en [`fases/`](./fases/README.md).

| Fase | Entrega verificable | Depende de |
| --- | --- | --- |
| 0. Preparación externa | Railway con deploy automático, correo confirmado, `.env` local completo | Ninguna |
| 1. Decisiones y esquema | Proyecto Astro base, working tree limpio y `AGENTS.md` del front | 0 |
| 2. Capa de API tipada | Tipos generados y cliente probado contra producción | 1 |
| 3. Sitio público | Catálogo público consumiendo la API | 2 |
| 4. Login y sesión | Login, logout, `/restablecer` y guard de rutas | 2 |
| 5. Categorías y tipos de medida | CRUD completo en el admin | 4 |
| 6. Productos con medidas | CRUD de productos en borrador con medidas | 5 |
| 7. Galería e imágenes | Subida, etapas, publicar y volver a borrador | 6 |
| 8. Orden | Reordenamiento con manejo de `409` | 6 |
| 9. Integrantes | Alta y desactivación de editores (solo `owner`) | 4 |
| 10. Limpieza y cierre | Repo sin restos, DNS final | 3, 7, 8 y 9 |

Las fases 3 y 4 pueden ejecutarse en cualquier orden después de la 2; las 7, 8 y 9 pueden ejecutarse en cualquier orden después de sus dependencias.

### Fase 0 — Preparación externa

**Hacer (usuario):** revisar en Railway (`backend` → Settings → Source) por qué un push a `main` no dispara deploy; confirmar que llegó el mail de reset de Resend; agregar `RESET_PASSWORD_URL` al `.env` local del backend con el origen del dev server del front; tener a mano las credenciales del owner.

**Cerrar cuando:** un push a `main` del backend despliega solo, el mail llegó y `pnpm dev` del backend arranca.

### Fase 1 — Decisiones y esquema

Decisiones cerradas en la preparación (2026-09-24), con el usuario las de alcance y con evidencia
las técnicas. Versiones consultadas en npm ese día: `astro` 7.3.5 (Node ≥ 22.12), `@astrojs/react`
7.0.0, `@astrojs/vercel` 11.0.11, `openapi-typescript` 7.13.0, `openapi-fetch` 0.17.0.

**D1. Framework: Astro 7 con TypeScript; React solo en el admin.** El sitio público es Astro sin
React: la grilla y el contacto son HTML, y el visor es un `<script>` portado de `main.js`. Cada
página del admin es **una única isla** React `client:only="react"`, con el layout y la navegación
en Astro. Motivo:

- El sitio público casi no tiene estado, y Astro no manda JS salvo con una directiva `client:*`
  ([directivas](https://docs.astro.build/en/reference/directives-reference/)). Así se cumple el
  rendimiento de §3.
- El admin es estado de cliente (formularios con errores, etapas con consulta, orden con `409`). El
  prototipo en DOM nativo ya ocupa 1150 líneas en `admin/admin.js`.
- Next.js no le suma nada al admin: el front nunca ve la cookie de sesión (ver D2), así que todo
  sería `"use client"`, y el sitio público cargaría React en cada página.
- El Context de React no cruza islas ([estado entre islas](https://docs.astro.build/en/recipes/sharing-state-islands/)).
  Una isla por página evita tener que compartirlo; si dos islas necesitan estado común, se usa Nano
  Stores.

**D2. Topología: un proyecto Astro y un proyecto Vercel; el admin en
`https://admin.elcauquenartesanias.com.ar`.** Las páginas del admin viven en `src/pages/admin/`.
En `vercel.json`, un rewrite con `has: [{ "type": "host", "value": "admin.elcauquenartesanias.com.ar" }]`
lleva el host del admin a `/admin/*`, y los otros hosts redirigen `/admin/*` a ese host
([`has` en rewrites](https://vercel.com/docs/project-configuration/vercel-json)). El rewrite deja
pasar los archivos del build (`/_astro/*`) y los de `public/`, que las páginas del admin también
cargan. Motivo:

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
  `ADMIN_ORIGIN=http://localhost:4321` y `RESET_PASSWORD_URL=http://localhost:4321/admin/restablecer`
  (hoy apunta a `:5173/reset-password`); ver fase 4.

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
  sin mover dominios.

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
- Los `.jpeg`/`.jpg` originales quedan fuera de `public/`: todo lo que está en `public/` se publica,
  y hoy `.vercelignore` los excluye del deploy.

**D5. Render del catálogo público: SSR con ISR en Vercel (`@astrojs/vercel`, `isr`).** Solo las
páginas del catálogo usan `export const prerender = false`; el admin queda estático. Motivo:

- El HTML llega con los productos (SEO, sin salto de layout).
- Lo publicado aparece en el sitio al vencer la `expiration`, que se fija en la fase 3.
- La alternativa de estático con rebuild necesita un deploy hook que ni el backend ni el admin
  pueden disparar sin cambiar el contrato
  ([adapter de Vercel](https://docs.astro.build/en/guides/integrations-guide/vercel/)).

**Construir:**

- Borrar `docs/contrato-api-borrador.md` del front, que es una copia vieja.
- Resolver el working tree: commitear o descartar los cambios sin versionar.
- Crear el proyecto Astro en la raíz con pnpm, TypeScript estricto, `@astrojs/react` y
  `@astrojs/vercel`, con scripts de `typecheck`, `lint` y `build`, y `"framework": "astro"` en
  `vercel.json`.
- Mover el sitio actual a `public/` (D4), con las rutas de `.vercelignore`, `.gitignore` y los
  headers de `vercel.json` ajustadas.
- Crear el `AGENTS.md` del front con `/writing-for-agents`.

**Cerrar cuando:**

- `pnpm typecheck`, `pnpm lint` y `pnpm build` pasan.
- `pnpm preview` sirve en `/` el sitio actual sin diferencias visibles.
- El `AGENTS.md` apunta al PRD y registra solo instrucciones que no se deducen del código ni del
  PRD.
- Después del push, el deploy de producción en Vercel sirve el sitio actual en la raíz.

### Fase 2 — Capa de API tipada

**Construir:** copiar `openapi.json`, generar tipos con `openapi-typescript`, crear el cliente `fetch` con `credentials: 'include'` y el manejo de errores del contrato; script `pnpm gen:api`; variable de entorno de la URL de la API.

**Cerrar cuando:** `GET /api/categorias` funciona contra producción con tipos generados, el cliente tiene tests de la traducción de errores y `pnpm gen:api` es reproducible.

### Fase 3 — Sitio público

Decisiones cerradas en la preparación (2026-09-25), con el usuario las de alcance (F3-D1) y con
evidencia las técnicas. Fuentes: `@astrojs/vercel` 11.0.11 instalado
(`node_modules/@astrojs/vercel/dist/index.js`, `buildISRFolder`), la
[ISR de Vercel](https://vercel.com/docs/incremental-static-regeneration) y los componentes
`ProductoPublico`, `MedidaPublica`, `ImagenPublica` y `Precio` de `src/api/openapi.json`.

**F3-D1. Alcance: `/catalogo-nuevo` replica el sitio actual (grilla, visor y contacto), sin página
por producto ni filtro por categoría.** Solo se consume `GET /api/productos`. `/api/productos/:id`
y `/api/categorias` quedan sin uso; la página por producto y el filtro son mejoras opcionales.
Motivo: el sitio actual abre la ficha en un visor, no tiene filtro, y la fase se verifica contra él
sin regresiones visuales. Lo eligió el usuario.

**F3-D2. ISR con `expiration: 60` (segundos) en `vercel({ isr: { expiration: 60 } })`.** Motivo:

- La regeneración corre en segundo plano solo cuando llega un pedido después de vencer: a lo sumo
  una invocación por minuto y por ruta, y ninguna sin visitas.
- Un producto publicado, editado o vuelto a borrador se refleja en uno o dos minutos. El contrato
  pide que un borrador no siga visible (`Cache-Control: no-cache` en la API); un minuto es el
  retraso aceptado en D5.
- No hay revalidación a demanda: el `bypassToken` exige que alguien pida la página con un header
  secreto, y ni el backend ni el admin lo hacen sin cambiar el contrato.
- La ISR solo aplica a las páginas `prerender = false`; el admin sigue estático. El caché es por
  ruta: el adapter solo deja pasar sus propios parámetros (`allowQuery`), así que ninguna página
  ISR puede depender de la query string.

**F3-D3. Si la API falla, la página falla; no se renderiza vacía.** Un error de `pedir()` se deja
propagar (respuesta 500). Motivo: ante un status distinto de 200, 30x, 404 o 410, Vercel conserva
la versión cacheada y reintenta a los 30 s; una página vacía con 200 reemplazaría al catálogo.
Solo el primer pedido de un deploy, sin caché, ve el error. `{ productos: [] }` sí se renderiza,
con un mensaje de catálogo vacío.

**F3-D4. Migración del modelo viejo de `main.js` a `ProductoPublico`** (pendiente del contrato):

| Sitio actual | Catálogo nuevo |
| --- | --- |
| `placa` (ficha de la tarjeta) | `galeria[0]`, la imagen principal: `url640` en la tarjeta. |
| `variantes` (bloque "Diseños") | Imágenes con `esDiseno`: `url160` en el bloque; etiqueta `nombreDiseno` o "Diseño N". Sin diseños, no hay bloque. |
| `fotos` | El resto de la galería. |
| Visor | Toda la `galeria` en su orden: `url1600` completa, `url640` previa, `url160` en la tira. |
| `precio` (texto) | `'$' + Intl.NumberFormat('es-AR')` sobre `amount / 100`, con dos decimales solo si hay centavos: `$5.000`. `Intl` con `style: 'currency'` da `$ 5.000` y cambia el aspecto. |
| `medidas` (texto) | Un chip por medida: `tipo`, `valor` y `unidad` separados por espacio, omitiendo los `null`. |
| `desc` | `descripcion`; si es `null`, sin párrafo. |

`categoriaId` no se usa (F3-D1). Un producto publicado siempre tiene imagen principal, pero si
`galeria` llega vacía la tarjeta muestra el fondo sin imagen en lugar de fallar.

**F3-D5. Dimensiones: la tarjeta conserva `width`/`height` de 640 y el `aspect-ratio: 1 / 1` con
`object-fit: cover` de `styles.css`.** Los derivados se miden por lado mayor y la API no da ancho
ni alto (mejora opcional del backend), así que el contenedor cuadrado reserva el espacio.

**F3-D6. Datos de prueba locales: un fixture con el catálogo actual en forma `ProductoPublico`.**
Las URLs apuntan a los `.webp` de `public/assets/`, que ya tienen los tres tamaños, y un script
sirve `GET /api/productos` en local para correr con `PUBLIC_API_URL` apuntándole. Motivo:
producción está vacía y el backend local necesita R2 y el procesamiento para tener imágenes. Con
los mismos productos, `/catalogo-nuevo` se compara con `/` lado a lado.

**F3-D7. Estructura:** los estilos y el visor se portan desde `public/styles.css` y `public/main.js`
a `src/` (el visor como `<script>` de Astro, D1); `public/` queda intacto hasta la fase 10 (D4).
`noindex` con `<meta name="robots" content="noindex">`.

**Construir:** consumir `GET /api/productos` sin credenciales (F3-D1) con ISR de 60 s (F3-D2) y
errores propagados (F3-D3); la tarjeta y el visor con el mapeo de F3-D4 y F3-D5; el fixture local
(F3-D6). Portar el sitio de `public/` a Astro en `/catalogo-nuevo`, con `noindex` (F3-D7); el sitio
viejo sigue en `/`.

**Cerrar cuando:** `/catalogo-nuevo` se ve en producción con datos de la API y con ISR, sin datos hardcodeados y sin regresiones visuales respecto del sitio actual (con el catálogo vacío, probar además en local con datos de prueba).

### Fase 4 — Login y sesión

**Construir:** pantallas de login y logout; `GET /admin/sesion`; guard de rutas en el cliente (D2); `/restablecer` (lee `?token=` y llama a `POST /api/auth/reset-password`); rewrite por host y redirect de `/admin/*` en `vercel.json` (D2); tipado de `/api/auth/*`, que está fuera de `openapi.json` (D3).

**Hacer (usuario):** agregar `admin.elcauquenartesanias.com.ar` al proyecto Vercel (el único, D4) y su CNAME "DNS only" en Cloudflare; en el `.env` local del backend, `ADMIN_ORIGIN=http://localhost:4321` y `RESET_PASSWORD_URL=http://localhost:4321/admin/restablecer`.

**Cerrar cuando:** el owner real entra y sale, una ruta protegida sin sesión redirige al login y el reset de contraseña completo funciona de punta a punta.

### Fase 5 — Categorías y tipos de medida

**Construir:** CRUD de ambos, fijando el patrón de listado, formulario y errores que reusan las fases siguientes; manejo de `409 NOMBRE_EN_USO`.

**Cerrar cuando:** se crea, edita y borra en producción, y el error de nombre repetido se muestra en el campo.

### Fase 6 — Productos con medidas

**Construir:** CRUD de productos en borrador con precio en centavos, categoría opcional y medidas estructuradas (sin repetir tipo de medida).

**Cerrar cuando:** se crea, edita y borra un producto en producción y los `400`/`422` se muestran de forma legible.

### Fase 7 — Galería e imágenes

**Construir:** flujo `upload-url` → `PUT` a R2 → `confirmar` → consulta de etapa → `publicar`; cupo de seis, diseños, reordenamiento de la galería, reintento de fallidas y volver a borrador. Considerar `/prototype` para la UI de etapas.

**Cerrar cuando:** una imagen real se sube desde el browser, se procesa, se publica y se ve en `/catalogo-nuevo` (D4); el `PUT` a R2 pasa el CORS con el origen del admin.

### Fase 8 — Orden

**Construir:** reordenamiento global con `ordenVersion`; ante `409 ORDEN_DESACTUALIZADO`, recargar y avisar sin perder el trabajo del usuario.

**Cerrar cuando:** reordenar se refleja en `/catalogo-nuevo` (D4) y un conflicto simulado con dos pestañas se resuelve sin error.

### Fase 9 — Integrantes

**Construir:** listado, alta de editores y desactivación, visibles solo para `owner`; manejo de `403` para `editor`.

**Cerrar cuando:** el owner invita a un editor real, le llega el mail, activa su cuenta y entra; el editor no ve la sección.

### Fase 10 — Limpieza y cierre

**Construir:** pasar el catálogo de `/catalogo-nuevo` a `/`, sin `noindex`, y borrar el sitio viejo de `public/` (D4): `index.html`, `main.js` y `styles.css`. `public/assets/` queda, porque lo usan las fuentes y el logo de `src/catalogo/` y las imágenes de `pnpm api:fixture`; quitar el prototipo sin uso; revisar `vercel.json` y `.vercelignore`; documentar la operación.

**Hacer (usuario):** confirmar que el catálogo en producción ya está cargado antes del push del cambio de `/`.

**Cerrar cuando:** no quedan restos del prototipo, del sitio viejo ni documentación duplicada, y la raíz y `www` sirven el catálogo nuevo con datos de la API.

## 5. Riesgos y decisiones técnicas diferidas

| Tema | Tratamiento |
| --- | --- |
| Cookies y CORS entre orígenes | Probar en la fase 4 con el origen real. Si falla, revisar `ADMIN_ORIGIN` en Railway y los `trustedOrigins`; no se usa `*` con credenciales. |
| CORS de R2 | Se prueba por primera vez en la fase 7. Si falla el `PUT`, revisar `AllowedOrigins` y `Content-Type` en Cloudflare. |
| Cambio de origen del admin | Cambiar `ADMIN_ORIGIN`, `RESET_PASSWORD_URL` y el `AllowedOrigins` de R2 juntos. |
| Ancho y alto de imágenes | El backend no los guarda hoy; queda como mejora opcional del backend. |
| Catálogo vacío en producción | Se llena desde el admin (fases 5 a 7). Hasta la fase 10, `/` sirve el sitio viejo desde `public/` y el catálogo nuevo vive en `/catalogo-nuevo` (D4); con el catálogo vacío, probar además con datos de prueba locales. |
| Previews sin sesión | Un preview `*.vercel.app` no puede iniciar sesión contra la API de producción (D2); el admin se prueba en local o en `admin.*`. |

## 6. Prompts para sesiones con agentes

Tres prompts en orden de uso, reemplazando `N` por la fase. 6.1 va en una sesión propia y solo si
la definición de la fase deja decisiones abiertas; 6.3 va en la misma sesión que 6.2. Para correr
varias fases sin supervisión, ver [6.4](#64-loop-sin-supervisión).

### 6.1 Preparación

```text
Prepará la fase N de docs/frontend-por-fases/PRD.md, sin implementar código.

1. Leé la definición de N, sus pendientes en docs/frontend-por-fases/fases/README.md y el
   código pertinente. Enumerá las decisiones realmente abiertas y qué dato falta
   para cerrar cada una. Si no queda ninguna, terminá la preparación.
2. Resolvé primero lo comprobable en el repositorio y en el contrato del backend
   (../elcauquen-backend/docs/openapi.json y ../elcauquen-backend/docs/contrato-api-borrador.md).
   Para las preguntas técnicas que aún
   requieran fuentes externas, usá Context7 o la búsqueda web con preguntas concretas,
   alternativas y versiones; verificá en fuentes primarias lo que sustenta cada decisión.
3. Cerrá las decisiones técnicas con esa evidencia. Si una elección cambia una
   regla de producto, el contrato del backend o el alcance de la fase, presentá
   las alternativas y tu recomendación al usuario; esperá su decisión.
4. Invocá /domain-modeling contra ../elcauquen-backend/CONTEXT.md (el front no tiene
   CONTEXT.md propio): usá sus términos y, si una decisión agrega o cambia uno,
   proponé el cambio al usuario como pendiente del backend. Si no hay términos
   nuevos, decilo en el cierre.
5. Invocá /writing-for-agents y escribí en la definición de la fase del PRD cada
   decisión, su motivo y sus fuentes, numeradas FN-D1, FN-D2… (D1–D5 son las
   globales de la fase 1). fases/fase-N.md es el registro de la implementación:
   remite a esas decisiones sin copiarlas. Ajustá los pendientes de fases/README.md. Cerrá cuando
   cada pendiente de N esté resuelto, reasignado o descartado con motivo.
   Creá un commit local solo con esa documentación.
```

### 6.2 Implementación

```text
Implementá la fase N de docs/frontend-por-fases/PRD.md de punta a punta en esta sesión.

1. Arranque: leé docs/frontend-por-fases/fases/README.md, §1–3 del PRD, la definición
   de N y solo las partes del contrato del backend que esa fase usa
   (../elcauquen-backend/docs/openapi.json y la sección pertinente de
   ../elcauquen-backend/docs/contrato-api-borrador.md). Verificá las dependencias de N según
   la tabla del PRD; si alguna está abierta, retomá esa fase como alcance de la sesión.
2. Decisiones: resolvé vos los detalles técnicos compatibles con el PRD y el contrato.
   Consultame solo cuando la única salida cambie una regla de producto, el contrato del
   backend o el alcance de la fase, o cuando dos requisitos sean incompatibles; mientras
   esperás, seguí con lo que no depende de esa respuesta. Las mejoras opcionales van a
   "Mejoras opcionales (sin fase)" de fases/README.md.
3. Implementación: usá los tipos generados; no escribas a mano formas que estén en
   openapi.json. Verificá las APIs de terceros que incorpores en Context7 o
   documentación oficial para la versión utilizada. Los tests se limitan a lo que pide §3.
4. Validación: cada punto de "Cerrar cuando" queda verificado con evidencia que ejecutaste
   (test, comando o prueba contra producción) o asignado a mí con los pasos exactos para
   verificarlo. Typecheck, lint y build pasan. Lo que dependa de un push, un deploy o un
   paso de "Hacer (usuario)" pendiente queda asignado a mí, y la fase sigue abierta hasta
   que lo confirme.
5. Documentación: con /writing-for-agents, creá o actualizá el registro de la fase en
   docs/frontend-por-fases/fases/fase-N.md con lo implementado, las decisiones técnicas
   que tomaste y su motivo, las validaciones ejecutadas y los desvíos respecto de lo
   acordado. Actualizá fases/README.md con estado, enlaces, pendientes y el siguiente
   trabajo con qué leer. Actualizá el PRD si cambiaron reglas. En AGENTS.md agregá solo
   gotchas que no se deducen del código, de package.json ni del PRD; lo que ya dicen el PRD
   o estos prompts se referencia, no se copia.
6. Creá un commit local con solo los cambios de la fase trabajada, aunque queden
   criterios asignados a mí. Terminá con la lista de lo que tengo que hacer a mano, en
   el orden en que conviene hacerlo.
```

### 6.3 Revisión

```text
Review this session for improvements in the following categories. Base each
finding on evidence from the session. Omit categories without findings, and
present proposed changes before implementing them in order of severity.

- **Navigation**: how easy was it for the agent to find the right files? Are there hidden dependencies between files? Would a navigation pointer make it easier?
- **Automated checks**: are there automated checks that could catch errors the agent made? Linting, typing, tests? Start from the repo's existing guardrails so a check that exists but sits unwired or silently broken is the finding, not a reinvention.
- **Coding standards**: did the implementing agent break a repo convention, or have to infer one that isn't written down? Mechanical violations get a deterministic check; reserve written standards for genuine judgement calls.
```

### 6.4 Loop sin supervisión

`scripts/loop-fases.ps1` corre 6.1 y después 6.2 para cada fase, cada prompt en una sesión
`claude -p` nueva, y les agrega al final este bloque. Cada sesión es una iteración: una fase y un
prompt, sin contexto previo; lo único que pasa a la siguiente es lo commiteado (el PRD,
`fases/README.md` y `fases/fase-N.md`). El modelo es el de la configuración de Claude Code y el
esfuerzo lo fija el script (`medium` en 6.1, `low` en 6.2); mientras corre, Windows no se
suspende. 6.3 no corre en el loop. El script lee los tres bloques
de esta sección del PRD: editarlos acá cambia el loop.

```text
Modo loop: corrés sin supervisión y nadie va a responder. Estas reglas prevalecen sobre los
pasos de arriba que piden consultar o esperar al usuario.

- Una iteración: esta sesión cubre solo la fase N y solo el prompt de arriba. Al commitear,
  terminá; no sigas con otra fase ni con el prompt siguiente, que el script lanza en una sesión
  nueva. Todo lo que esa sesión necesite saber tiene que quedar escrito en fases/README.md o
  fases/fase-N.md, no en tu respuesta final.
- Producto intacto: decidí vos todo lo técnico. Cuando una elección toque una regla de
  producto, el contrato del backend o el alcance de la fase, elegí la opción que deja el
  producto como lo definen el PRD y el sitio actual. Si ninguna lo deja intacto, no la
  implementes: anotala en "Decisiones para el usuario" de fases/README.md, con alternativas y
  recomendación, y seguí con lo que no depende de ella. Lo que un paso pida proponer al
  usuario va a esa misma sección.
- Dependencias: una fase "🔎 Implementada" cuenta como cumplida. Si una dependencia de N sigue
  "⏳ Pendiente", terminá la sesión sin cambios y explicá por qué.
- Validación local: verificá contra el backend local como indica AGENTS.md, con llamadas a la
  API, los tests de §3 y typecheck, lint y build. Lo visual (un error en su campo, el foco, las
  etapas de la galería) y lo que pida producción, un push, un deploy o un paso de "Hacer
  (usuario)" va a "Verificaciones del usuario" de fases/README.md, bajo la fase N, con los
  pasos exactos.
- Estado: al cerrar 6.2, marcá N en la tabla de fases/README.md como "🔎 Implementada (fecha)"
  si le quedan verificaciones del usuario, o "✅ Cerrada (fecha)" si no.
- Límites: sin git push, sin deploys y sin cambios en ../elcauquen-backend, que solo se lee.
```
