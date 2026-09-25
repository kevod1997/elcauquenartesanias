# Fase 4 — Login y sesión

## Definición

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

## Implementado

- `src/api/auth.ts`: `crearAuth` (las cuatro llamadas de F4-D2) y `traducirErrorAuth`; la instancia
  `auth` sale de `src/api/index.ts`. Los códigos se suman a `CodigoErrorCliente` como `CodigoErrorAuth`
  en `src/api/cliente.ts`. Tests en `src/api/auth.test.ts`.
- `src/admin/sesion.ts` (F4-D3): `obtenerSesion` (memorizada, `null` con `401`), `exigirSesion`
  (guard), `irAlLogin`, `destinoSeguro` y `redirigirSiNoAutenticado`, que usan las fases 5 a 9
  ante un `ErrorApi` en cualquier llamada.
- `src/admin/mensajes.ts`: `mensajeDeError(error)`, textos en español por código. Las fases
  siguientes lo reusan para los errores generales.
- `src/admin/Admin.astro` y `admin.css` (F4-D5). Props `titulo` y `protegida` (por defecto `true`:
  barra con integrante y "Cerrar sesión"). El rol queda en `data-rol` de `#barra` para la fase 9.
- Páginas `src/pages/admin/{index,ingresar,restablecer}.astro`, cada una con una isla
  `client:only="react"` (`Inicio.tsx`, `Ingresar.tsx`, `Restablecer.tsx`).
- `vercel.json`: los cuatro redirects por host de F4-D1. `.env.example` con el puerto 3001.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `crearAuth` con `fetch` inyectable, como `crearCliente` | Los tests de traducción no tocan la red. |
| `exigirSesion()` sin sesión redirige y devuelve una promesa que nunca resuelve | La isla queda en "Cargando…" hasta que el navegador se va; no hay estado intermedio que dibujar. |
| La barra del layout ignora los errores de `GET /admin/sesion` | El guard y el aviso son de la isla, que lee la misma promesa; así el error se muestra una vez. |
| `destinoSeguro` acepta solo `/admin/…`; `/admin` a secas cae en el valor por defecto, que es el mismo | F4-D3. |
| Validación de 8 a 128 caracteres y de coincidencia en el cliente, con `noValidate` y el error en el campo | F4-D4; el mensaje queda junto al campo con `aria-invalid` y el foco vuelve al campo con error. |
| Sin `autoFocus` en los campos | Lo marca la regla `a11y/noAutofocus` de Biome. |
| `!important` en `[hidden]` y en `prefers-reduced-motion`, con `biome-ignore` | Portados del prototipo; `hidden` tiene que ganarle al `display` de `.panel__acciones`. |
| Cerrar sesión con error muestra un `alert` | La barra no tiene lugar para avisos; la fase 5 fija el patrón de avisos y puede reemplazarlo. |

## Validaciones ejecutadas

- `pnpm test`: 23 tests pasan (12 nuevos de `auth.test.ts`: cuerpo y `credentials`, los seis
  códigos, `429` → `DEMASIADOS_INTENTOS`, otro `code`, la forma del contrato y el HTML →
  `RESPUESTA_INESPERADA`, falla de `fetch` → `SIN_CONEXION`).
- `pnpm typecheck` (0 errores), `pnpm lint` y `pnpm build` pasan. El build genera
  `admin/index.html`, `admin/ingresar/index.html` y `admin/restablecer/index.html`.
- Contra el backend local (`localhost:3001`, `Origin: http://localhost:4321`), con `crearAuth` y
  `crearCliente` en un test temporal que guarda la cookie (se borró después):
  - `GET /admin/sesion` sin cookie → 401 `NO_AUTENTICADO`; contraseña mala → 401 `INVALID_EMAIL_OR_PASSWORD`.
  - Owner entra, `GET /admin/sesion` da `rol: owner`; sale y la sesión da 401.
  - F4-D6 de punta a punta: alta de `delivered+fase4e@resend.dev`, token de `verification`,
    contraseña corta → 400 `PASSWORD_TOO_SHORT`, reset ok, el mismo token otra vez → 400
    `INVALID_TOKEN`, el editor entra con `rol: editor`, sale (401) y, desactivado, recibe 403
    `INTEGRANTE_DESACTIVADO`. `request-password-reset` con un email inexistente → 200.
  - CORS: `access-control-allow-origin: http://localhost:4321` con credenciales.
- `astro dev`: `/admin`, `/admin/ingresar` y `/admin/restablecer?token=x` responden 200 con
  `noindex` y la isla.

## Desvíos

- Los editores de prueba `delivered+fase4`, `+fase4b` a `+fase4e@resend.dev` quedaron desactivados en
  la base local: la API no borra ni reactiva integrantes. `+fase4` ya estaba desactivado desde la
  preparación, así que la prueba usó etiquetas nuevas.
- En una corrida, el primer `reset-password` falló con `SIN_CONEXION` (fetch de Node); repetido dio
  la respuesta esperada. No se reprodujo.
- Lo visual y lo que pide producción no se probó en el navegador: ver las verificaciones del usuario.
- El build de Astro no incluye los redirects de `vercel.json` en `.vercel/output/config.json` local
  (tampoco sus `headers`). Que Vercel los aplique en el deploy queda por verificar; si no, pasarlos a
  `redirects` de `astro.config.ts` o a `vercel.ts`.

## Verificaciones del usuario

Después del push a `main` y del paso "Hacer (usuario)" de la fase 4 (dominio `admin.*` en Vercel,
CNAME "DNS only" en Cloudflare, `ADMIN_ORIGIN` y `RESET_PASSWORD_URL` en Railway):

1. Redirects (F4-D1): `https://admin.elcauquenartesanias.com.ar/` lleva a `/admin`;
   `/restablecer?token=abc` lleva a `/admin/restablecer?token=abc`;
   `https://elcauquenartesanias.com.ar/admin/ingresar` lleva a `admin.*/admin/ingresar`; `/` y
   `/catalogo-nuevo` del dominio principal siguen igual. Si ninguno redirige, Vercel no tomó los
   `redirects` de `vercel.json` (ver "Desvíos", más arriba).
2. Guard: en una ventana privada, `admin.*/admin` redirige a `/admin/ingresar?volver=%2Fadmin`.
3. Login: con las credenciales del owner real, entra y vuelve a `/admin` con su nombre en la barra.
   Una contraseña mala muestra "El email o la contraseña no son correctos." sobre el botón.
4. Con sesión, abrir `/admin/ingresar` lleva directo a `/admin`.
5. "Cerrar sesión" lleva a `/admin/ingresar`, y `/admin` vuelve a pedir login.
6. Reset: en `/admin/restablecer`, pedir el enlace con el email del owner; llega el mail, el enlace
   abre `admin.*/admin/restablecer?token=…`. Probar dos contraseñas distintas (error debajo del
   segundo campo, con foco) y después una válida; el aviso de éxito enlaza al login y la contraseña
   nueva funciona. Volver a abrir el mismo enlace y enviar: muestra "El enlace venció o ya se usó".
7. Teclado: con Tab se recorren los campos y botones con el foco visible.
