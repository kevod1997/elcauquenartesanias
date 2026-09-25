# Fase 9 — Integrantes

## Definición

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Reusan el patrón del admin (F5-D2 a F5-D6) y registran solo sus desvíos. Fuentes:
§Integrantes y §Contraseña de `contrato-api-borrador.md`; `/admin/integrantes*` y el componente
`Integrante` de `openapi.json`; `elcauquen-backend/src/admin/integrantes.ts` (esquema del alta) y
`src/auth/{integrantes,auth}.ts` (mensajes, desactivación, correo); `requestPasswordReset` de
`better-auth` 1.7.5 (`dist/api/routes/password.mjs`); `z.email()` de Zod 4
(`zod/v4/core/regexes.js`); el [`<input type="email">` de MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/email)
y el [no-validate state](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html)
del HTML Standard.

Glosario: la UI usa "integrante", "owner", "editor" y "desactivado" (el `activo` de la API). Para
el primer ingreso dice "definir su contraseña", no "activar su cuenta": un editor recién dado de
alta ya tiene `activo: true`. "Desactivado" no está en `CONTEXT.md`; la propuesta quedó en los
pendientes del backend de [README.md](./README.md#mejoras-opcionales-sin-fase).

**F9-D1. Una página `/admin/integrantes`, y su enlace en la barra solo para el `owner`.** Protegida,
prerenderizada y con una isla (D1, F5-D1). La entrada de `secciones` en `Admin.astro` lleva una marca
de "solo owner" (el enlace se dibuja con un atributo, por ejemplo `data-solo-owner`), y `admin.css`
lo oculta mientras `#barra` no tenga `data-rol="owner"` (F4-D3). Motivo:

- El `rol` llega en el cliente (D2: el front no ve la sesión). Con la regla CSS sobre `data-rol`, el
  editor nunca ve el enlace, ni antes de que resuelva la sesión, y no hace falta más JS en el layout.
- El enlace oculto no es un control de acceso: la API responde `403` al editor (F9-D2).

**F9-D2. El editor en `/admin/integrantes` ve un aviso, sin pedir el listado.** Tras
`exigirSesion()`, con `rol` distinto de `owner`, la isla muestra "Solo el owner gestiona los
integrantes." con un enlace a `/admin`. Un `403` `SIN_PERMISO` de cualquier llamada lleva a la misma
vista. Motivo: `GET /admin/sesion` ya da el rol; pedir el listado solo para recibir el `403` es un
pedido de más, y el `403` sigue cubierto (§3).

**F9-D3. Listado.** Como F5-D2, en el orden de la API (por nombre). Cada fila muestra nombre, email
(`.lista__detalle`) y rol; el desactivado suma la etiqueta "Desactivado" (con el estilo de
`.estado`). Solo el editor activo tiene "Desactivar" (`btn--peligro btn--chico`,
`aria-label="Desactivar «X»"`). Los desactivados siguen en la lista. Motivo:

- §3 pide explicar antes lo que la API rechazaría: desactivar al owner da `422`
  `INTEGRANTE_NO_DESACTIVABLE`, y repetir sobre un desactivado no cambia nada (es idempotente).
- La API no borra ni reactiva integrantes, y el email de un desactivado sigue ocupado: sin la fila,
  un `409` `EMAIL_EN_USO` al dar de alta ese email no tendría explicación visible.

**F9-D4. Alta de editor.** Formulario arriba de la lista (F5-D3) con "Nombre" y "Email", y el botón
"Agregar editor" ("Agregando…" mientras envía). Ayuda del formulario: "Le llega un correo para
definir su contraseña. El enlace vence en una hora."

- Validación en el cliente, con los valores recortados: `nombre` de 1 a 100 (el esquema del alta;
  `maxLength` 100). `validarNombre` de `recursos.ts` recibe el máximo, con 40 por defecto. `email`
  vacío da "Escribí un email."; el input es `type="email"` y, con `validity.typeMismatch`, da
  "Revisá el email: no tiene un formato válido.". `noValidate` solo desactiva la validación
  interactiva al enviar (HTML Standard); `validity` se sigue calculando.
- `400` `SOLICITUD_INVALIDA` va al campo `email` con el mismo texto de formato. El chequeo del
  navegador acepta `a@b`, y `z.email()` del backend exige un dominio con punto: con el nombre ya
  validado, el `400` solo puede venir del email. El `mensaje` de la API ("Solicitud inválida: …")
  sale del detalle de Zod y no sirve para la UI.
- `409` `EMAIL_EN_USO` va al campo `email` con el `mensaje` de la API ("Ya existe un integrante con
  ese email."). El email no se compara en el cliente (F5-D3).
- Éxito: se vacía el formulario, se recarga la lista y el toast dice "Editor agregado. Le llega un
  correo para definir su contraseña.". No dice "enviado": el backend manda el correo sin esperar al
  proveedor y solo registra la falla.

Sin botón "Reenviar enlace". Si el editor no define la contraseña en una hora, abrir el enlace
vencido lo lleva a `INVALID_TOKEN`, que ofrece pedir otro (F4-D4). `requestPasswordReset` de
Better Auth busca al usuario por email sin exigir una cuenta con contraseña, así que funciona para
un editor que nunca la definió; `reset-password` crea esa cuenta al completarse.

**F9-D5. Desactivar con confirmación (F5-D4).** `confirmar({ titulo: '¿Desactivar a «X»?',
detalle: 'Se cierran sus sesiones y no puede volver a entrar. No se puede reactivar, y su email no
sirve para otra alta.', accion: 'Desactivar' })`. Con `200`: toast "Editor desactivado.", recarga
de la lista y foco al título (la fila sigue, pero sin el botón que abrió el diálogo). `404`
`INTEGRANTE_NO_ENCONTRADO` sigue F5-D3 (recarga y mensaje en el aviso de la lista); `422` y los demás
errores, al aviso de la lista con `mensajeDeError`. Motivo: la acción no se deshace desde la API, y
el detalle lo dice antes de confirmar.

**F9-D6. Estado y código.** Como F5-D6, en `src/admin/Integrantes.tsx`, con el tipo
`components['schemas']['Integrante']`. Sin tests nuevos: la fase no agrega lógica de estado que no
se vea (§3).

**F9-D7. Validación.**

- **Contra el backend local**, logueado como owner (F5-D7), con curl o `fetch` de Node:
  - `GET /admin/integrantes` → `200`, ordenado por nombre;
  - alta de `delivered+fase9@resend.dev` → `201` con `rol: editor`, `activo: true`; el mismo email en
    mayúsculas → `409` `EMAIL_EN_USO`; email `a@b` → `400` `SOLICITUD_INVALIDA`;
  - token de la tabla `verification` (AGENTS.md) en `/admin/restablecer?token=…`, contraseña definida
    y el editor entra; como editor, `GET /admin/integrantes` → `403` `SIN_PERMISO`;
  - desactivar → `200` con `activo: false` y su sesión da `401`; repetir → `200`; desactivar al
    owner → `422`; un id inexistente → `404`.
  El editor de prueba queda desactivado en la base local: la API no borra integrantes.
- **`astro dev`:** `/admin/integrantes` responde `200` con `noindex` y la isla.
- **En la UI local** (extensión de Chrome, backend local): como owner, alta con error de email en el
  campo, alta correcta con su toast, desactivar con el diálogo; como el editor de prueba, la barra sin
  "Integrantes" y el aviso de F9-D2 en `/admin/integrantes`.
- **En `admin.*`**, tras el push: el cierre exige un editor real, y su alta es permanente (la API no
  borra integrantes). El usuario da el email del editor y autoriza el alta en el chat de esa sesión;
  el agente la hace con la extensión y la sesión del owner. El editor define su contraseña desde el
  correo y entra, y el usuario confirma que no ve "Integrantes".

**Construir:** `src/pages/admin/integrantes.astro` y `src/admin/Integrantes.tsx` (F9-D2 a F9-D5); el
enlace "solo owner" de la barra y su regla en `admin.css` (F9-D1); el máximo como parámetro de
`validarNombre` (F9-D4).

**Cerrar cuando:** el owner invita a un editor real, le llega el mail, activa su cuenta y entra; el editor no ve la sección.

## Implementado

- `src/pages/admin/integrantes.astro` y `src/admin/Integrantes.tsx`: aviso del editor (F9-D2), listado
  (F9-D3), alta de editor (F9-D4) y desactivación con confirmación (F9-D5).
- `src/admin/Admin.astro`: "Integrantes" en `secciones` con `soloOwner`, dibujado con
  `data-solo-owner`; `admin.css` lo oculta mientras `.panel__bar` no tenga `data-rol='owner'` (F9-D1).
- `src/admin/recursos.ts`: `validarNombre(nombre, maximo = NOMBRE_MAXIMO)`.
- `admin.css`: `.estado--desactivado` y `.lista__rol`.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `resolverAcceso(e)` en la isla: `401` va al login y `403` `SIN_PERMISO` a la vista de F9-D2; el listado, el alta y la desactivación lo llaman primero | Un solo lugar para "cualquier llamada" de F9-D2; el `403` no se muestra como error de campo ni de lista. |
| El máximo de 100 es `NOMBRE_INTEGRANTE_MAXIMO` en `Integrantes.tsx`, no en `recursos.ts` | Solo lo usa el alta de integrantes; `recursos.ts` recibe el máximo como parámetro. |
| Al desactivar, solo el éxito y el `404` recargan la lista y enfocan el título; `422` y los demás errores quedan en el aviso sin recargar | Con `422` o un error de red la lista no cambió, y el foco sigue en el botón que abrió el diálogo. |
| El rol se muestra con el término de la API ("owner", "editor") en `.lista__rol`, junto a la etiqueta | Son los términos del glosario (F9 "Glosario"). |
| "Desactivado" usa `.estado` con `.estado--desactivado` (crema y texto suave) | Neutro: el verde y el ámbar ya significan publicado y borrador. |
| El aviso de F9-D2 es `.aviso--error` con `role="alert"` y el enlace "Volver al inicio" dentro | Mismo aviso que los errores de lista; el título "Integrantes" queda arriba. |
| El email del alta lleva `autoComplete="off"` y `spellCheck={false}` | Es el email de otra persona: el autocompletado del navegador propone el del owner. |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; hints ya existentes, entre ellos `FormEvent` deprecado),
  `pnpm test` (84) y `pnpm build` pasan.
- Contra el backend local (owner, `Origin: http://localhost:4321`), con un script Node de `fetch` fuera
  del repo:
  - `GET /admin/integrantes` → `200`, ordenado por nombre ("Editor fase 4" ×5, "Owner Local");
  - alta de `delivered+fase9@resend.dev` → `201` con `rol: editor`, `activo: true`; el mismo email en
    mayúsculas → `409` `EMAIL_EN_USO` ("Ya existe un integrante con ese email."); `a@b` → `400`
    `SOLICITUD_INVALIDA`;
  - con el token de `verification`, `POST /api/auth/reset-password` → `200`; el editor inicia sesión
    (`200`), `GET /admin/sesion` da `rol: editor`, y `GET` y `POST /admin/integrantes` → `403`
    `SIN_PERMISO`;
  - sobre `delivered+fase9c@resend.dev` (mismos pasos): desactivar → `200` con `activo: false`, su
    sesión da `401`, repetir → `200`, iniciar sesión → `403`; desactivar al owner → `422`
    `INTEGRANTE_NO_DESACTIVABLE`; un id inexistente → `404` `INTEGRANTE_NO_ENCONTRADO`.
- `astro dev`: `/admin/integrantes` responde `200` con `noindex`, la isla `Integrantes.tsx` y el enlace
  con `data-solo-owner`.
- En la UI local (extensión de Chrome, sesión de owner, `PUBLIC_API_URL=http://localhost:3001`):
  - enviar vacío: "Escribí un nombre." y "Escribí un email." en sus campos, foco en "Nombre";
  - `no-es-email` → "Revisá el email: no tiene un formato válido." (del cliente), `a@b` → el mismo texto
    (del `400`: el navegador lo acepta, `typeMismatch` es `false`), el email repetido en mayúsculas →
    "Ya existe un integrante con ese email."; foco en "Email", descrito por la ayuda y el error;
  - alta de "Editor Prueba UI" (`delivered+fase9b@resend.dev`): toast de F9-D4, formulario vacío y la
    fila en la lista con "Desactivar";
  - "Desactivar" abrió el diálogo de F9-D5 con el foco en "Cancelar"; al confirmar (también sobre
    `delivered+fase9d@resend.dev`): toast "Editor desactivado.", la fila con "Desactivado" y sin botón,
    foco en el título;
  - con `data-rol` en `editor` o sin él, el enlace "Integrantes" queda `display: none`; con `owner`, se ve.
- Quedan en la base local, desactivados, `delivered+fase9b`, `fase9c` y `fase9d`; `delivered+fase9`
  queda activo como editor de prueba (`EDITOR_TEST_*` en `.env.test.local`).
- El usuario (2026-09-25), en la UI local con el editor de prueba: la barra sin "Integrantes" y, en
  `/admin/integrantes`, el aviso de F9-D2.

## Desvíos

- F9-D7 pedía curl; se usó `fetch` de Node con los mismos pedidos, como en las fases 7 y 8.
- La contraseña del editor de prueba se definió por la API, no en `/admin/restablecer`: el agente no
  escribe contraseñas en el navegador. La página ya se validó en la fase 4.
- Las pruebas de desactivar por la API usaron un segundo editor (`fase9c`) para dejar activo al de
  `delivered+fase9` y probar su vista en la UI.
- El cierre no se probó en `admin.*` con un editor real (F9-D7 y "Cerrar cuando"): el usuario dio por
  suficiente la validación local (2026-09-25). El alta en producción queda para cuando haga falta un
  editor real.

