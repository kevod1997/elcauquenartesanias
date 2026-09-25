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
En `vercel.json`, el host del admin lleva a `/admin/*` y los otros hosts redirigen `/admin/*` a ese
host ([`has`](https://vercel.com/docs/project-configuration/vercel-json)). El mecanismo, con
redirects y no un rewrite, está en [F4-D1](#fase-4--login-y-sesión). Motivo:

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

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Fuentes: el contrato del backend (§Sesión y §Contraseña de `contrato-api-borrador.md`,
`/admin/sesion` en `openapi.json`), `elcauquen-backend/src/auth/auth.ts` y `better-auth` 1.7.5
instalado en el backend (`dist/api/routes/password.mjs`, `sign-in.mjs`, `rate-limiter/index.mjs`),
la [configuración de `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json) y los
[redirects de Vercel](https://vercel.com/docs/routing/redirects).

**F4-D1. Las URLs del admin llevan `/admin/` en todos los hosts; el host del admin usa redirects,
sin rewrite.** Reemplaza el rewrite de D2. En `vercel.json`:

- Con `has: [{ "type": "host", "value": "admin.elcauquenartesanias.com.ar" }]`, todo lo que no
  empiece con `/admin`, `/_astro/` o `/assets/` redirige (307) a `/admin/<ruta>`; `/` va a `/admin`.
  Así `admin.*/` abre el admin y un enlace sin prefijo (`/restablecer?token=…`) sigue funcionando.
- Con `missing` de ese host, `/admin` y `/admin/*` redirigen al mismo camino en
  `https://admin.elcauquenartesanias.com.ar`, como pide D2.

Motivo:

- Vercel sirve el archivo antes de aplicar un rewrite ("precedence is given to the filesystem prior
  to rewrites being applied"). En `admin.*/`, `public/index.html` (el sitio viejo, D4) ganaría al
  rewrite. Los redirects corren antes: `getTransformedRoutes` de `@vercel/routing-utils` 6.6.0
  (el que usa `@astrojs/vercel`) emite redirects y headers antes de `{ handle: "filesystem" }`, y
  los rewrites después.
- Los redirects de Vercel conservan la query ("Query parameters pass through"), así que el
  `?token=` del mail llega a `/admin/restablecer`.
- Con el mismo camino en local (`localhost:4321/admin/…`) y en `admin.*`, los enlaces internos son
  siempre `/admin/…`, sin detectar el host.
- `has` no corre en local (`astro dev` no lee `vercel.json`): los redirects se prueban tras el deploy.

**F4-D2. `/api/auth/*` se tipa a mano en `src/api/auth.ts`, sin el cliente de Better Auth.** Son
cuatro llamadas con `fetch` directo y `credentials: 'include'` (`openapi-fetch` necesita la ruta en
`paths`):

| Función | Llamada | Éxito |
| --- | --- | --- |
| Iniciar sesión | `POST /api/auth/sign-in/email` `{ email, password }` | `200` y la cookie; el integrante se lee después con `GET /admin/sesion` |
| Cerrar sesión | `POST /api/auth/sign-out` `{}` | `200` |
| Pedir el enlace | `POST /api/auth/request-password-reset` `{ email }` | `200` siempre |
| Definir la contraseña | `POST /api/auth/reset-password` `{ newPassword, token }` | `200` `{ status: true }` |

Los errores `{ message, code }` se traducen a `ErrorApi` con estos códigos, que se suman a
`CodigoErrorCliente`: `INVALID_EMAIL_OR_PASSWORD` (401), `INVALID_EMAIL` (400),
`INTEGRANTE_DESACTIVADO` (403), `INVALID_TOKEN` (400), `PASSWORD_TOO_SHORT` y `PASSWORD_TOO_LONG`
(400). El `429` del rate limiting llega como `{ message }`, sin `code`, y se traduce al código propio
`DEMASIADOS_INTENTOS`. Otro `code` o forma da `RESPUESTA_INESPERADA`, y una falla de `fetch`,
`SIN_CONEXION`, como en `pedir()`. La traducción lleva tests (§3). La UI muestra mensajes propios en
español por código: los de Better Auth vienen en inglés. Motivo:

- Las formas de `/api/auth/*` están en el contrato (`contrato-api-borrador.md`), no en
  `openapi.json`; la regla de tipos generados de §3 cubre lo que está en `openapi.json`.
- El cliente de Better Auth es el paquete `better-auth` entero (sus exports `./client` y `./react`,
  con `nanostores` y `@better-fetch/fetch`) y, para tipar `role` y `active`, necesita el tipo del
  servidor o repetir sus campos: el mismo acople de versiones que descartó `hc` en D3.
- `get-session` no hace falta: `GET /admin/sesion` ya da el integrante tipado.
- Límites, verificados en `better-auth` 1.7.5: contraseña de 8 a 128 caracteres; en producción,
  3 intentos cada 10 s en `sign-in` y 3 por minuto en `request-password-reset`. El `X-Retry-After`
  del `429` no está expuesto por CORS (`app.ts` del backend no declara `exposeHeaders`), así que
  el aviso no da los segundos.

**F4-D3. Sesión y guard: un módulo `src/admin/sesion.ts` con la promesa de `GET /admin/sesion`
memorizada por página.** El script del layout (nombre del integrante y "Cerrar sesión") y la isla de
la página importan el mismo módulo, que Vite comparte en el bundle, así que hay un solo pedido por
página sin Nano Stores. Reglas:

- Una página protegida no muestra contenido hasta que la sesión resuelve. Con `401`, hace
  `location.replace('/admin/ingresar?volver=<ruta y query actuales>')`.
- Una función del módulo hace ese mismo redirect ante cualquier `ErrorApi` 401 (§3). La usan las
  fases 5 a 9 cuando la sesión vence a mitad de la edición.
- `volver` se acepta solo si empieza con `/admin/` y no con `//`; si no, se va a `/admin`. Evita un
  redirect abierto.
- Tras iniciar o cerrar sesión se navega con `location` (recarga completa), así la sesión
  memorizada se vuelve a pedir.
- `/admin/sesion` da el `rol`: el layout lo deja disponible para que la fase 9 muestre
  "Integrantes" solo al `owner`.

Motivo: D2 fija el guard en el cliente, y D1, una isla por página con el layout en Astro. Un módulo
compartido cubre las dos partes.

**F4-D4. Páginas y flujos**, todas prerenderizadas (D2) y con `<meta name="robots" content="noindex">`:

- `/admin/ingresar`: email y contraseña, sin "Recordarme" (sin `rememberMe`, Better Auth da la
  sesión de 7 días de D2). Si ya hay sesión, va directo al destino. Enlace "¿Olvidaste tu
  contraseña?" a `/admin/restablecer`.
- `/admin/restablecer`, con dos modos según la query:
  - Sin `token`, pide el email y llama a `request-password-reset`. Muestra siempre el mismo aviso
    ("Si el email es de un integrante activo, te llega un enlace que vence en una hora"), porque la
    API no revela si existe.
  - Con `token`, pide la contraseña nueva dos veces, con 8 a 128 caracteres y ambas iguales
    comprobados en el cliente. Al terminar, avisa que se cerraron sus otras sesiones y enlaza a
    `/admin/ingresar`. Con `INVALID_TOKEN`, explica que el enlace venció o ya se usó y ofrece
    pedir otro.
- `/admin` (inicio): página protegida mínima con el integrante de la sesión. Las secciones llegan
  en las fases 5 a 9.
- "Cerrar sesión" en la barra del layout.

Pedir el enlace entra en la fase: el criterio de cierre exige el reset de punta a punta, el
contrato lo expone para el admin y sin esa pantalla el owner no tiene cómo pedirlo. La activación
de un editor usa la misma página con `token` (fase 9).

**F4-D5. Layout y estilos del admin:** `src/admin/` con un layout Astro (`Admin.astro`) y
`admin.css`, que porta los tokens, las fuentes y la barra (`.panel__bar`) de `admin/admin.css` del
prototipo, con rutas a `/assets/fonts/`. Las páginas de ingreso y restablecimiento usan el mismo
layout sin la barra ni el guard. La fase 5 fija el patrón de formularios y errores sobre esta base.
Motivo: el prototipo es la referencia visual del admin (§1) y se borra en la fase 10.

**F4-D6. Validación local sin mails a direcciones inválidas.** El owner de prueba
(`owner@local.test`) sirve para entrar y salir, pero no para el reset: el backend local manda mails
reales por Resend (ver `AGENTS.md`). El reset de punta a punta se prueba con un editor
`delivered+fase4@resend.dev`:

1. Alta con `POST /admin/integrantes`, logueado como owner.
2. Token de la tabla `verification` (`identifier` `reset-password:<token>`), abierto en
   `/admin/restablecer?token=…`.
3. Iniciar sesión como ese editor, cerrar sesión y desactivarlo al terminar.

El `429` no se reproduce en local (el rate limiting de Better Auth corre solo en producción): se
cubre con el test de traducción. `.env.example` pasa a mostrar el puerto `3001` de `AGENTS.md`.

**Construir:** `src/api/auth.ts` con sus tests (F4-D2); `src/admin/sesion.ts` (F4-D3); el layout y
los estilos (F4-D5); `/admin`, `/admin/ingresar` y `/admin/restablecer` (F4-D4); los redirects por
host en `vercel.json` (F4-D1).

**Hacer (usuario):** agregar `admin.elcauquenartesanias.com.ar` al proyecto Vercel (el único, D4) y
su CNAME "DNS only" en Cloudflare; en Railway, `ADMIN_ORIGIN=https://admin.elcauquenartesanias.com.ar`
y `RESET_PASSWORD_URL=https://admin.elcauquenartesanias.com.ar/admin/restablecer` (F4-D1). El `.env`
local del backend ya tiene `ADMIN_ORIGIN=http://localhost:4321` y
`RESET_PASSWORD_URL=http://localhost:4321/admin/restablecer` (comprobado el 2026-09-25).

**Cerrar cuando:** el owner real entra y sale, una ruta protegida sin sesión redirige al login y el reset de contraseña completo funciona de punta a punta.

### Fase 5 — Categorías y tipos de medida

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Fuentes: §Categorías y §Tipos de medida de `contrato-api-borrador.md`; las rutas
`/admin/categorias*` y `/admin/tipos-medida*` y los componentes `Categoria` y `TipoMedida` de
`openapi.json`; los mensajes de `elcauquen-backend/src/catalogo/{categorias,tipos-medida}.ts`; el
prototipo (`admin/index.html`, `admin/admin.js`: modal "Categorías y medidas", `confirmar()` y
`mostrarToast()`); el [`<dialog>` de MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog),
el algoritmo [close the dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#close-the-dialog)
del HTML Standard y las [live regions de MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions).

Las F5-D2 a F5-D5 son el **patrón del admin**: las fases 6 a 9 lo reusan y documentan solo sus
desvíos.

**F5-D1. Una página por recurso: `/admin/categorias` y `/admin/tipos-de-medida`.** Cada una es
protegida, prerenderizada y con una sola isla (D1). La barra del layout suma un `<nav>` con
"Categorías" y "Tipos de medida"; el enlace de la página actual lleva `aria-current="page"`
(comparando `Astro.url.pathname` sin la barra final). La fase 6 suma "Productos" y la 9,
"Integrantes" (F4-D3). La UI dice "tipo de medida", nunca "medidas" a secas: en el glosario, una
medida es el valor de un producto. Motivo:

- El prototipo junta los dos en un modal con pestañas porque es una sola página. Con rutas, cada
  recurso tiene su URL (para `?volver=` de F4-D3 y para enlazarlo desde el formulario de producto
  de la fase 6, como el "Gestionar categorías" del prototipo) y su isla queda chica.
- Las rutas siguen a la API (`/admin/categorias`, `/admin/tipos-medida`).

Crear una categoría o un tipo desde el formulario de producto queda para la fase 6.

**F5-D2. Listado.** Cada página: título, formulario de alta arriba y la lista (`<ul>`) debajo.

- El orden es el de la API (por nombre, sin distinguir mayúsculas); el front no reordena.
- Cada fila muestra el nombre (y la unidad del tipo, o "sin unidad: texto libre") y los botones
  "Editar" y "Borrar", con nombre accesible que incluye el ítem (`aria-label="Editar Mates"`).
- "Editar" cambia la fila por el formulario de edición, con "Guardar" y "Cancelar"; Escape cancela.
  Una sola fila en edición a la vez. Se guarda solo con "Guardar" o Enter, no al perder el foco
  como el prototipo: un error de la API tiene que quedar en el campo.
- Tras crear, editar o borrar, se vuelve a pedir el listado con `GET`, sin insertar a mano: el
  orden lo define la collation del servidor, y así aparecen los cambios de otro integrante. La lista
  anterior queda visible mientras recarga.
- Vacía: "Todavía no hay categorías." (o "tipos de medida"). Primera carga: "Cargando…" después de
  `exigirSesion()`.
- Los errores de cargar o borrar se muestran en un `aviso--error` con `role="alert"` sobre la lista.

**F5-D3. Formularios y errores.** Sobre la base de la fase 4 (`Restablecer.tsx`):

- `<form noValidate onSubmit>`. El cliente valida lo que exige el esquema de `openapi.json`, con
  los valores recortados: `nombre` de 1 a 40 caracteres, `unidad` hasta 10 (vacía se manda `null`).
  Los inputs llevan `maxLength` 40 y 10 (el prototipo usa 30 y 8; manda el contrato).
- El nombre repetido no se compara en el cliente contra la lista: lo decide el `409`, que cubre las
  altas simultáneas y la regla de mayúsculas del servidor.
- Error de campo: el formulario mapea código a campo (`NOMBRE_EN_USO` → `nombre`). El texto va en un
  `campo__error` ligado con `aria-describedby`, el input queda con `aria-invalid` y recibe el foco.
  El texto es el de `mensajeDeError`, que para estos códigos da el `mensaje` de la API ("Ya existe
  una categoría con ese nombre.").
- Error sin campo (`SIN_CONEXION`, `SOLICITUD_INVALIDA` inesperado, `ERROR_INTERNO`, `503`,
  `RESPUESTA_INESPERADA`): `aviso--error` con `role="alert"` sobre el botón, hasta el próximo envío.
  Lo tipeado se conserva.
- `401` en cualquier llamada: `redirigirSiNoAutenticado(error)` primero (F4-D3).
- `404` (`CATEGORIA_NO_ENCONTRADA`, `TIPO_MEDIDA_NO_ENCONTRADO`) al editar o borrar: otro integrante
  lo borró. Se recarga el listado y se muestra el mensaje de la API en el aviso de la lista.
- Mientras envía, el botón queda deshabilitado con "Guardando…" (o "Creando…"): evita la doble alta.
- `PATCH` de un tipo manda `nombre` y `unidad` juntos; `unidad` vacía la quita (`null`).
- El alta de un tipo trae `cm` en la unidad, como el prototipo, con la ayuda "Dejala vacía para un
  valor de texto libre (ej. Talla única)".

El campo (label, input, ayuda y error) es un componente compartido de `src/admin/`; el nombre lo
elige la implementación.

**F5-D4. Confirmación de borrado con `<dialog>` y `showModal()`,** en un componente compartido
que devuelve si se confirmó, como `confirmar()` del prototipo. Sus estilos (`.confirmar`,
`.btn--peligro-solido`) y los del toast (`.toast`) se portan de `admin/admin.css` a
`src/admin/admin.css`.

- Textos: "¿Borrar la categoría «X»?" con "Los productos que la usan quedan sin categoría.", y
  "¿Borrar el tipo de medida «X»?" con "Las medidas de ese tipo quedan en sus productos, sin tipo."
  Botones "Cancelar" y "Borrar" (`btn--peligro-solido`), "Cancelar" primero en el DOM.
- `showModal()` enfoca el primer control (MDN), así que el foco inicial cae en "Cancelar" sin
  `autoFocus` (Biome marca `a11y/noAutofocus`). Escape dispara `cancel` y cuenta como cancelar.
- Al cerrar un modal, el navegador devuelve el foco al elemento que lo abrió (HTML Standard). Tras
  un borrado exitoso esa fila ya no existe, así que el foco va al título de la sección
  (`tabIndex={-1}`).
- El diálogo solo confirma: el `DELETE` corre después, y su error va al aviso de la lista (F5-D2).

**F5-D5. Avisos de éxito en un toast del layout, y "Cerrar sesión" sin `alert`.**

- `Admin.astro` incluye en el markup inicial una región vacía `role="status"` con
  `aria-live="polite"` y la clase `.toast` del prototipo. MDN: una live region tiene que existir
  antes de cambiar su contenido para que se anuncie.
- Un módulo `src/admin/avisos.ts` con DOM directo (sin React) expone `avisar(texto, tipo)`, que usan
  el script del layout y las islas. `ok` se oculta a los 4 s; `error` queda hasta el próximo aviso o
  hasta que se toca su botón "Cerrar".
- Éxitos: "Categoría creada.", "Categoría renombrada.", "Categoría borrada."; "Tipo de medida
  creado.", "…editado.", "…borrado.".
- Los errores de un formulario van en el formulario (F5-D3), no en el toast, que desaparece.
- "Cerrar sesión" fallido llama a `avisar(mensajeDeError(error), 'error')` en lugar de `alert`.

**F5-D6. Estado con `useState` y `useEffect` sobre `pedir(apiAdmin…)`, sin librería de datos.**
Se descartan TanStack Query, SWR y `useActionState`. Son pocas llamadas y la lista se recarga
entera tras cada cambio, igual que las islas de la fase 4. Los tipos salen de
`components['schemas']` (`Categoria`, `TipoMedida`) y los cuerpos, de `paths`.

**F5-D7. Validación.** Sin tests nuevos: la traducción de errores ya tiene los suyos y esta fase no
agrega lógica de estado que no se vea (§3). Contra el backend local, logueado como owner (una
sesión con cookie, como en la fase 4), comprobar con llamadas a la API:

- alta, y alta con otra grafía del mismo nombre → `409 NOMBRE_EN_USO`;
- renombrar a otra grafía del propio nombre → `200`, y al nombre de otra → `409`;
- un tipo con `unidad: ""` queda con `null`, y `PATCH` con `unidad: null` la quita;
- `PATCH` y `DELETE` de un id inexistente → `404`;
- borrar, y borrar al terminar todo lo creado.

Además, `astro dev` sirve las dos páginas con `noindex` y la isla. Lo visual (error en el campo con
foco, diálogo, toast, teclado, `aria-current`) y el CRUD en producción van a las verificaciones del
usuario.

**Construir:** `/admin/categorias` y `/admin/tipos-de-medida` con sus islas (F5-D1, F5-D2); los
componentes compartidos de campo y confirmación (F5-D3, F5-D4); `src/admin/avisos.ts` y el toast
del layout, que reemplaza el `alert` de "Cerrar sesión" (F5-D5); el `<nav>` de la barra (F5-D1).

**Cerrar cuando:** se crea, edita y borra en producción, y el error de nombre repetido se muestra en el campo.

### Fase 6 — Productos con medidas

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Reusan el patrón del admin (F5-D2 a F5-D5) y registran solo sus desvíos. Fuentes:
§Producto, §Medida y §Productos de `contrato-api-borrador.md`; las rutas `/admin/productos*` y los
componentes `Producto`, `Medida` y `Precio` de `openapi.json` (no hay `GET /admin/productos/{id}`);
`precioSchema` (`z.int().positive()`) de `elcauquen-backend/src/admin/productos.ts` y los mensajes de
`src/catalogo/productos.ts`; el prototipo (`admin/index.html` y `admin/admin.js`: `#modalProducto`,
`renderSelectCategoria`, `renderSelectTipoMedida`, `agregarMedida`); el
[`<form>` del HTML Standard](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)
(sin formularios anidados) y el [`beforeunload` de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).

**F6-D1. Dos páginas: `/admin/productos` (listado) y `/admin/productos/editar` (formulario).**
Protegidas, prerenderizadas y con una isla cada una (D1). El formulario sin query es el alta;
con `?id=<id>` edita ese producto. La barra suma "Productos" primero en `secciones`, marcado con
`aria-current` también en `/admin/productos/editar` (comparación por prefijo; hoy es exacta).
`/admin` sigue siendo el inicio de F4-D4. Motivo:

- La fase 7 suma la galería al mismo formulario: necesita espacio y un producto con id (la
  `upload-url` es por producto). Un modal como el del prototipo no alcanza.
- La URL recargable sirve para `?volver=` (F4-D3 guarda `pathname + search`).
- No existe `GET /admin/productos/{id}`: el formulario busca el producto en `GET /admin/productos`.
  Si no está, muestra el mensaje de `PRODUCTO_NO_ENCONTRADO` ("No existe ese producto.") y un
  enlace "Volver a productos", sin formulario.
- Tras crear, `history.replaceState` pasa a `?id=<nuevo>` y el formulario sigue abierto en modo
  edición (toast "Producto creado."). Guardar una edición también se queda (toast "Producto
  guardado."). El formulario tiene arriba un enlace "Volver a productos".

**F6-D2. Listado.** Como F5-D2, con estos desvíos:

- El orden es el global de la API (`productos` de `GET /admin/productos`); reordenar es la fase 8.
- Arriba, un enlace "Nuevo producto" (clase `btn btn--primario`) a `/admin/productos/editar`; no hay
  alta en la página.
- Cada fila: nombre; nombre de la categoría o "Sin categoría"; precio con `formatearPrecio` de
  `src/catalogo/presentacion.ts` (su parámetro pasa a `components['schemas']['Precio']`); estado con
  la píldora `.estado--borrador` / `.estado--publicado` del prototipo ("Borrador" / "Publicado");
  "Editar" (enlace a `editar?id=`) y "Borrar", con el nombre en `aria-label`. La foto principal es
  de la fase 7.
- Carga `GET /admin/productos` y `GET /admin/categorias` en paralelo. Vacío: "Todavía no hay
  productos."
- Borrar: "¿Borrar el producto «X»?" con "Se borran también sus medidas y su galería. No se puede
  deshacer."; si está publicado, además "Deja de verse en el catálogo.". Toast "Producto borrado.".

**F6-D3. Formulario del producto.** `<form noValidate>` con el patrón de F5-D3 (error de campo con
foco, aviso general sobre el botón, `401` primero). El `Campo` de `src/admin/` hoy solo arma
`<input>`: la implementación le suma `<select>` y `<textarea>` con el mismo cableado de label, ayuda
y error. Carga en paralelo productos, categorías y tipos de medida.

- `nombre`: 1 a 80 caracteres recortados (`maxLength` 80).
- `precio`: ver F6-D4.
- `categoriaId`: `<select>` con "Sin categoría" (`null`) y las categorías en el orden de la API; al
  lado, "Nueva categoría" y el enlace "Gestionar categorías" (F6-D6).
- `descripcion`: `<textarea>` hasta 400 (`maxLength`); recortada y vacía se manda `null`.
- `medidas`: ver F6-D5.
- Botón "Crear producto" / "Guardar cambios", con "Creando…" / "Guardando…" mientras envía.
- `PATCH` manda solo los campos que cambiaron respecto del producto cargado (`medidas` cuenta como
  cambio si difiere la lista de pares tipo y valor, en orden). Sin cambios no llama a la API y avisa
  "No hay cambios para guardar." en el toast. Motivo: la API "solo cambia lo enviado", así no se
  pisa lo que otro integrante editó en otro campo, y `PATCH` exige al menos un campo. Tras guardar,
  el producto de la respuesta pasa a ser el cargado.
- Errores de la API por código:
  - `CATEGORIA_INEXISTENTE` (`422`): al campo categoría; se recargan las categorías y el select pasa
    a "Sin categoría".
  - `TIPO_MEDIDA_INEXISTENTE` (`422`): al bloque de medidas; se recargan los tipos y las medidas
    cuyo tipo ya no está quedan sin tipo (`tipoMedidaId: null`), como hace el backend al borrar un
    tipo. El texto suma "Revisá las medidas y volvé a guardar."; no se reenvía solo.
  - `PRODUCTO_NO_ENCONTRADO` (`404`): como la carga sin producto de F6-D1.
  - `SOLICITUD_INVALIDA` (`400`) y el resto: aviso general con el `mensaje` de la API. La validación
    del cliente cubre el esquema, así que un `400` indica un caso no previsto.
- Cambios sin guardar: mientras el formulario difiere del cargado, un listener de `beforeunload`
  con `preventDefault()` y `returnValue = true` avisa al salir; se quita al guardar o al volver a
  coincidir (MDN recomienda escucharlo solo con cambios pendientes). Cubre "Volver a productos",
  los enlaces de gestión de F6-D6 y cerrar la pestaña.
- Un producto publicado se edita igual: estas rutas no cambian `estado` y ningún campo del
  formulario puede dejarlo sin imagen principal. El formulario muestra su estado; publicar y volver
  a borrador son de la fase 7.

**F6-D4. Precio en pesos, con centavos opcionales.** Input de texto con `inputMode="decimal"` y el
prefijo "$" del prototipo (`.campo__precio`). Acepta dígitos con, opcionalmente, `,` o `.` y 1 o 2
decimales (`15000`, `15000,5`, `15000,50`), y se convierte a centavos operando sobre el texto, sin
multiplicar un `number` por 100 (`19,99 * 100` da `1998.9999…`). Al editar se muestra
`amount / 100` con coma si hay centavos. Errores: vacío → "Escribí el precio."; formato inválido,
incluido un separador seguido de tres dígitos (`1.500`) → "Escribí el precio en pesos, sin puntos
de miles (ej. 15000 o 15000,50)."; cero → "El precio tiene que ser mayor a 0."; más de
`Number.MAX_SAFE_INTEGER` centavos → "El precio es demasiado alto.". Motivo:

- El prototipo usa `type="number"` en pesos enteros; el contrato y `formatearPrecio` admiten
  centavos, así que un producto con centavos se editaría sin perderlos.
- `type="number"` acepta `e` y `-`, y su separador decimal depende del navegador; en es-AR `1.500`
  es ambiguo, por eso se rechaza en vez de adivinar.
- La conversión va en funciones puras (`pesos → centavos` y `centavos → pesos`) con tests: un error
  de redondeo no se ve a simple vista (§3).

**F6-D5. Medidas.** Bloque con la lista de medidas y una fila para agregar, como el prototipo:

- Cada medida se muestra "Diámetro: 13 cm" (tipo, valor y unidad) con "Quitar" (`aria-label`
  "Quitar medida Diámetro: 13 cm"). Una medida sin tipo muestra su valor y "(sin tipo)": se
  conserva y se puede quitar, pero no se crea desde el formulario.
- Fila de alta: `<select>` "Tipo de medida" con todos los tipos ("Nombre (unidad)"), el campo
  "Valor" y "Agregar" (`type="button"`; Enter en el valor agrega y no envía el formulario). Si el
  tipo elegido ya tiene medida, precarga su valor y el botón dice "Actualizar": reemplaza en su
  lugar. Tras agregar, el select pasa al siguiente tipo sin medida. Así nunca se repite un tipo
  (el `400` no puede ocurrir).
- `valor`: 1 a 30 caracteres recortados. Con unidad, el tipo exige un número (`^\d+([.,]\d+)?$`,
  "Escribí un número, ej. 13 o 13,5."); sin unidad es texto libre. Se guarda tal como se escribió:
  el catálogo público lo muestra así (`textoMedida`). El error va al campo "Valor".
- Hasta 20: con 20, "Agregar" queda deshabilitado con la ayuda "Hasta 20 medidas.".
- Sin tipos: "Todavía no hay tipos de medida." en lugar de la fila, con "Nuevo tipo de medida".
- Las medidas se mandan en el orden de la lista; la API las devuelve igual.

**F6-D6. Crear categoría y tipo de medida desde el formulario.** Botones "Nueva categoría" (junto
al select de categoría) y "Nuevo tipo de medida" (junto a la fila de alta de medidas), cada uno con
un enlace "Gestionar categorías" / "Gestionar tipos de medida" a su página (F5-D1), en la misma
pestaña (el aviso de F6-D3 protege lo no guardado).

- El botón despliega debajo un grupo con el campo "Nombre" (y "Unidad", con `cm` por defecto, en el
  tipo), "Crear" y "Cancelar". Es un `<div role="group">`, no un `<form>`: el HTML Standard no
  permite formularios anidados. Enter en sus campos crea (con `preventDefault`, sin enviar el
  producto); Escape y "Cancelar" lo cierran y devuelven el foco al botón que lo abrió.
- Valida y maneja errores como F5-D3 (`validarNombre`, `esNombreEnUso` de `recursos.ts`;
  `NOMBRE_EN_USO` en su campo).
- Al crear: recarga la lista con `GET`, deja elegida la nueva (en el select de categoría o en el de
  tipo de medida, con el foco en "Valor"), cierra el grupo y avisa "Categoría creada." / "Tipo de
  medida creado.".
- Motivo del botón en lugar de la opción "+ Crear categoría nueva…" del prototipo: el select queda
  como una lista de valores; con la opción, el prototipo tiene que revertir el valor elegido, y con
  el select cerrado las flechas del teclado cambian el valor y disparan `change`, que abriría el
  grupo al recorrer las opciones.

**F6-D7. Estado y código.** Como F5-D6: `useState` y `useEffect` sobre `pedir(apiAdmin…)`, tipos
de `components['schemas']` y cuerpos de `paths`. Las reglas puras (precio, validación de medidas,
cambios para el `PATCH`) van en un módulo de `src/admin/` separado de las islas. La división en
componentes la elige la implementación.

**F6-D8. Validación.** Tests de la conversión de precio (F6-D4), incluidos `19,99` → `1999`, `0,5` →
`50`, `1.500` y `-1` rechazados, y la ida y vuelta de `centavos → pesos`. Contra el backend local,
logueado como owner (F5-D7), con curl:

- alta con categoría y medidas (con y sin tipo) → `201`, `estado: "borrador"`, medidas en orden;
- dos medidas con el mismo `tipoMedidaId` → `400`; `categoriaId` y `tipoMedidaId` inexistentes →
  `422` `CATEGORIA_INEXISTENTE` / `TIPO_MEDIDA_INEXISTENTE`; `precio.amount` 0 o decimal → `400`;
- `PATCH` con solo `precio` no cambia el resto; `PATCH` de `medidas` reemplaza la lista; `PATCH {}`
  → `400`; `PATCH` y `DELETE` de un id inexistente → `404`;
- borrar un tipo usado deja la medida con `tipoMedidaId: null` y el mismo `valor`;
- borrar todo lo creado al terminar.

Además, `astro dev` sirve las dos páginas con `noindex`, la isla y `aria-current` en "Productos".
Lo visual (errores en su campo, foco, alta rápida, medidas, aviso de salida) y el CRUD en
producción van a las verificaciones del usuario.

**Construir:** `/admin/productos` y `/admin/productos/editar` con sus islas (F6-D1 a F6-D3); el precio
y las medidas (F6-D4, F6-D5); el alta rápida de categoría y tipo (F6-D6); "Productos" en la barra
(F6-D1); las variantes `<select>` y `<textarea>` de `Campo` (F6-D3).

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
