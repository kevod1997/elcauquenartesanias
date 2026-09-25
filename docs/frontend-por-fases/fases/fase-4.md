# Fase 4 — Login y sesión

**Estado:** implementada el 2026-09-25; quedan las verificaciones del usuario en producción
([README](./README.md#verificaciones-del-usuario)).
**Definición:** [PRD, fase 4](../PRD.md#fase-4--login-y-sesión). Aplica F4-D1 a F4-D6, sin repetirlas
acá.

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
