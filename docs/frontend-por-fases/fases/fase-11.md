# Fase 11 — Mejoras opcionales del front

## Definición

Reúne las "Mejoras opcionales (sin fase)" de [README.md](./README.md) que se resuelven sin cambiar el
backend, más dos pedidos del usuario (2026-09-25).

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato; no usan endpoints nuevos ni suman términos al glosario. Fuentes: las
[páginas de error de Astro](https://docs.astro.build/en/basics/astro-pages/); en `node_modules`,
`astro` 7.3.5 (`dist/core/errors/default-handler.js`, `renderDefaultError`) y `@astrojs/vercel`
11.0.11 (`dist/index.js`, la ruta final de `/404`, y `dist/lib/redirects.js`); el
`.vercel/output/config.json` del último build; el
[patrón Button de la APG](https://www.w3.org/WAI/ARIA/apg/patterns/button/); las
[buenas prácticas de formularios de login de web.dev](https://web.dev/articles/sign-in-form-best-practices);
el [botón de revelar contraseña de Edge](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/password-reveal);
y, sobre gestores de contraseñas que siguen el `type`, el
[bug 1330228 de Firefox](https://bugzilla.mozilla.org/show_bug.cgi?id=1330228) y
[Create Amazing Password Forms](https://www.chromium.org/developers/design-documents/create-amazing-password-forms/)
de Chromium.

**F11-D1. 404 propia: `src/pages/404.astro`, prerenderizada.** Con esa página, el adapter termina
`config.json` con `{ "src": "/.*", "dest": "/404.html", "status": 404 }` en vez de mandar a la función
la 404 por defecto de Astro (hoy `^(/404/?)$` va a `/_isr`). La regla no mira el host, y los
redirects de `vercel.json` corren antes: en `admin.*`, una ruta desconocida pasa a `/admin/<ruta>`
y termina en esta misma página. Contenido: el logo, "No encontramos esta página", una línea de
ayuda y un enlace "Ir al inicio" a `/`. Motivo del enlace: en la raíz lleva al catálogo y en `admin.*`,
por F11-D5, a Productos. Una página estática no conoce el host, y un texto como "Ver el catálogo"
estaría mal en el admin.

**F11-D2. 500 propia: `src/pages/500.astro` con `export const prerender = false`.** No llama a la
API y no muestra el `error` que recibe (la doc de Astro advierte que el stack expone el código).
Ofrece reintentar (enlace a `/`) y los accesos de WhatsApp e Instagram de `contacto.ts`. Motivo:

- Astro muestra la 500 propia solo en páginas que se renderizan a pedido. Acá es solo `/`: el admin es
  estático y nunca falla en el servidor.
- Prerenderizada, `renderDefaultError` la pide por `fetch` al origen del request, y sin
  `security.allowedDomains` usa `http://localhost`. El adapter de Vercel no da un
  `prerenderedErrorPageFetch` propio, así que el `fetch` falla y la respuesta sale vacía. A pedido,
  la página se renderiza desde el bundle de la función.
- La respuesta mantiene el `500`, así que F3-D3 sigue igual: Vercel conserva la versión cacheada de
  `/`. En `astro dev` se ve la página y el error va a la terminal (doc de Astro), lo que permite
  el cierre con `pnpm api:fixture --error`.

**F11-D3. Un layout del catálogo en `src/catalogo/` para `index.astro`, 404 y 500.** Lleva `<html>`,
el `<head>` que hoy está en `index.astro` (viewport, favicon, preload de las fuentes Playfair), el
`import` de `catalogo.css`, y `title` y `description` como props. El nombre lo elige la
implementación. Motivo: sin el layout, las tres páginas repiten el mismo `<head>`, y una fuente o un
favicon nuevos habría que cambiarlos en tres lugares.

**F11-D4. En el formulario de producto, un error de campo se borra al editar ese campo.** Se aplica
a nombre, precio, categoría y descripción en `EditarProducto.tsx`, y al nombre de `AltaRapida`: el
`onChange` quita la clave de `errores`, o hace `setErrorNombre(null)`. La validación completa sigue
corriendo al enviar. Además, al guardar el producto (alta o edición), las dos altas rápidas se
cierran y se vacían: `EditarProducto` suma 1 a un contador que usa como `key` de los dos
`AltaRapida`. Motivo:

- Tras editar el campo, su error ya no describe lo tipeado. Revalidar en cada tecla mostraría
  "Escribí el precio." mientras se borra para corregir.
- El nombre repetido de una alta rápida queda abandonado cuando el integrante guarda el producto sin
  crearla. El `key` remonta el componente cerrado y no hace falta sumar una prop de "cerrar".

**F11-D5. `/admin` redirige a `/admin/productos` con un redirect de Astro.** En `astro.config.ts`:
`redirects: { '/admin': { status: 302, destination: '/admin/productos' } }`. Se borran
`src/pages/admin/index.astro` y `Inicio.tsx`. `/admin/productos` pasa a ser:

- el destino por defecto de `destinoSeguro()` en `sesion.ts` (lo usa `destino()` de `Ingresar.tsx`);
- el `href` de la marca en `Admin.astro`;
- el enlace del aviso de F9-D2 en `Integrantes.tsx`, que pasa a decir "Ir a productos";
- en `vercel.json`, el destino de la raíz del host del admin (`/admin/productos`) y del `/admin` de
  los otros hosts (`https://admin.elcauquenartesanias.com.ar/admin/productos`).

Motivo: el adapter traduce los redirects de Astro a rutas de Vercel con su status (`getRedirects`), y
`astro dev` también los sirve, así que `/admin` anda en local y en producción sin una página que
redirija por JS. Va `302` y no el `301` por defecto de Astro, como los `"permanent": false` de
`vercel.json`: un `301` queda en la caché del navegador si el inicio vuelve a cambiar. Los dos
destinos de `vercel.json` ahorran un salto; `/admin` sigue andando por el redirect de Astro.

**F11-D6. Campo de contraseña: `CampoContrasena` en `Campo.tsx`, con un botón de alternancia de nombre
fijo.** Se arma con `armar()` (label, ayuda y error como `Campo`). El input va envuelto en
`.campo__contrasena`, como `.campo__precio`, y el botón queda a la derecha, dentro del borde.

- El botón es `type="button"` con `aria-pressed` y un nombre que no cambia: "Mostrar contraseña" en
  `Ingresar`, y "Mostrar contraseña nueva" y "Mostrar contraseña repetida" en `Restablecer`. El
  estado se ve en el ícono (ojo, u ojo tachado cuando está presionado), que se suma a `iconos.tsx`
  con `aria-hidden`. Esto corrige el pedido original: `aria-pressed` y cambiar el texto
  (Mostrar/Ocultar) juntos contradicen la APG ("it is critical the label on a toggle does not change
  when its state changes"). Web.dev propone la otra variante: cambiar el texto sin `aria-pressed`. Se
  eligió la de la APG.
- Con la contraseña visible, el input pasa a `type="text"` con `autoCapitalize="off"`,
  `autoCorrect="off"` y `spellCheck={false}`: el teclado del teléfono no la corrige y el corrector no
  la procesa.
- Al enviar, el campo vuelve a `type="password"` antes de que corra el `onSubmit` de la isla: el
  componente escucha `submit` del `input.form` y cambia `input.type` en el DOM, además del estado.
  Un gestor de contraseñas que mire el `type` al enviar encuentra un campo de contraseña. Firefox
  sigue a los campos que alguna vez fueron `password`; otros gestores no lo garantizan.
- `.campo__contrasena input::-ms-reveal { display: none; }`: Edge suma su propio ojo a todo
  `type="password"`, y quedarían dos.
- `Ingresar` usa un solo campo, con `autoComplete="current-password"`. `Restablecer` usa dos, con
  `new-password`. En `Restablecer`, el error de largo va en "Contraseña nueva" y el de "no coinciden"
  en "Repetí la contraseña", con el `error` de cada campo. Hoy los dos errores se muestran bajo el
  segundo campo.

**Construir:**

- Páginas de error: `404.astro` (F11-D1) y `500.astro` (F11-D2) con la estética del catálogo, sobre el
  layout de F11-D3.
- Formulario de producto: los errores de campo y las altas rápidas de F11-D4.
- Productos como inicio: el redirect y los destinos de F11-D5. Las URLs actuales siguen andando.
- Contraseña: `CampoContrasena` (F11-D6) en `Ingresar` y en el paso "Definí tu contraseña" de
  `Restablecer`.

Sin tests nuevos: nada de esto tiene lógica de estado que §3 del PRD pida probar. Se verifica con el
build y la prueba manual.

**Cerrar cuando:** en producción, una ruta inexistente de la raíz y de `admin.*` responde `404` con la
página propia; la 500 propia se ve en local con `pnpm api:fixture --error`, con status `500`; en el
formulario de producto, el error de precio desaparece al editar el precio y el grupo de "Nueva
categoría" con el nombre repetido se cierra al guardar el producto; la raíz de `admin.*`, `/admin` y el
login sin `volver` llevan a `/admin/productos`; y en `Ingresar` y `Restablecer` cada campo de
contraseña se muestra y se oculta con su botón, con el mouse y con el teclado, y el lector de pantalla
anuncia el botón con su nombre y su estado (presionado o no).

## Implementado

- `src/catalogo/Pagina.astro`: layout del sitio público (F11-D3), con `titulo` y `descripcion` opcional.
  `index.astro` pasa a usarlo.
- `src/catalogo/PaginaError.astro`: el hero del catálogo a pantalla completa con logo, "Error N",
  título, ayuda, el enlace a `/` y un slot para más acciones. Lo usan `src/pages/404.astro` (F11-D1) y
  `src/pages/500.astro` (F11-D2, `prerender = false`, con WhatsApp e Instagram en el slot).
  `catalogo.css` suma `.error`, `.error__ayuda`, `.error__acciones` y `.error__enlace`.
- `EditarProducto.tsx` (F11-D4): `editar(campo, valor)` cambia el campo y borra su error (`categoriaId`
  borra `categoria`); el contador `guardados` sube al guardar y es la `key` de las dos `AltaRapida` (la
  de tipo lo recibe por la prop `reinicio` de `Medidas`); el nombre de `AltaRapida` hace
  `setErrorNombre(null)` en su `onChange`.
- F11-D5: `redirects` en `astro.config.ts`; `destinoSeguro()`, la marca de `Admin.astro`, el aviso de
  `Integrantes.tsx` ("Ir a productos") y los dos destinos de `vercel.json` apuntan a
  `/admin/productos`. Se borraron `src/pages/admin/index.astro` e `Inicio.tsx`.
- F11-D6: `CampoContrasena` en `Campo.tsx`, `IconoOjo` (con `tachado`) en `iconos.tsx`, y
  `.campo__contrasena` y `.campo__revelar` en `admin.css`. `Ingresar` usa uno; `Restablecer`, dos, con
  `errorNueva` y `errorRepetida` en lugar de `errorCampo`.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Las dos páginas de error comparten `PaginaError.astro` sobre `Pagina.astro` | Mismo hero y estructura; la 500 solo suma los accesos de contacto por el slot. |
| Títulos: "No encontramos esta página" (404) y "No pudimos cargar el catálogo" (500); enlaces "Ir al inicio" y "Reintentar" | La 500 solo ocurre en `/` (F11-D2), así que el título nombra lo que falló. |
| `.error` fija `font-family: Inter` | `.page`, que la fija en el catálogo, no envuelve las páginas de error: sin ella el cuerpo salía en serif. |
| `editar()` en `EditarProducto` solo para nombre, precio, categoría y descripción; `cambiar()` sigue para las medidas | Son los campos con error propio en `errores` (F11-D4). |
| `CampoContrasena` escucha `submit` en `input.form` con `addEventListener`, sin `capture` | El listener del formulario corre en el target, antes de que el evento llegue a la raíz donde React atiende el `onSubmit` de la isla. |
| El botón lleva `aria-label` y `title` con el mismo nombre fijo | El contenido es solo el ícono (`aria-hidden`); `title` da el nombre al mouse. |
| `autoCapitalize`, `autoCorrect` y `spellCheck` se agregan solo con la contraseña visible | F11-D6: con `type="password"` el navegador ya no los aplica. |
| En `.campo__contrasena`, el contorno de foco del input se dibuja en el envoltorio (`:has(input:focus-visible)`) | Con el contorno en el input, el botón quedaba como una caja aparte dentro del borde. El botón conserva su contorno. |
| En `Restablecer`, los errores usan el `error` de `CampoContrasena` (sin `role="alert"`) | Es el cableado de `Campo` (F5-D3): el foco va al campo inválido, que queda descrito por su error. |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; 16 hints ya existentes, entre ellos `FormEvent`
  deprecado), `pnpm test` (84) y `pnpm build` pasan.
- `.vercel/output/config.json` del build: `^/admin$` → `302` a `/admin/productos` antes de
  `filesystem`; `^(/500/?)$` y `^(/)$` van a `/_isr`; la última ruta es
  `{ "src": "^/.*$", "dest": "/404.html", "status": 404 }`. El prerender avisa
  `/admin/index.html (file not created, response body was empty)`: es el redirect, que el adapter sirve
  como ruta.
- `astro dev` con `pnpm api:fixture --error` (curl): `/` → `500` con "No pudimos cargar el catálogo";
  `/no-existe` y `/admin/no-existe` → `404` con la página propia; `/admin` → `302` a
  `/admin/productos`. En Chrome se ven las dos páginas con la estética del catálogo.
- UI local (extensión de Chrome, sesión del editor de prueba, backend local):
  - `/admin/ingresar` con sesión lleva a `/admin/productos` (el `destino()` sin `volver`);
  - alta de producto vacía: "Escribí un nombre." y "Escribí el precio."; al tipear en el precio se borra
    solo el suyo, y al tipear en el nombre, el del nombre;
  - "Nueva categoría" con un nombre existente: "Ya existe una categoría con ese nombre."; se borra al
    tipear. Con el nombre repetido en el grupo abierto, guardar el producto lo cerró y lo vació;
  - `/admin/restablecer?token=falso`: cada botón alterna `type` (`password` ↔ `text`) y `aria-pressed`
    con clic, Espacio y Enter; visible, el input tiene `autocapitalize="off"`, `autocorrect="off"` y
    `spellcheck=false`; al enviar, la repetida visible volvió a `password`; "abc" deja el error en
    "Contraseña nueva" (`aria-describedby="nuevaAyuda nuevaError"`) y dos contraseñas distintas, en
    "Repetí la contraseña";
  - `/admin/ingresar` con el backend detenido (así muestra el formulario sin cerrar la sesión): el botón
    "Mostrar contraseña" alterna con clic, Espacio y Enter.
  - El producto y la categoría de prueba se borraron por la API (`204`).
- En producción, tras el deploy (2026-09-25):
  - el usuario, con curl: `/no-existe` en la raíz → `404`; en `admin.*`, `/no-existe` → `307` a
    `/admin/no-existe` y `/` → `307` a `/admin/productos`;
  - el agente, con curl: `admin.*/admin/no-existe` → `404`; `admin.*/admin` → `302` a
    `/admin/productos`; `/admin` en la raíz → `307` a `admin.*/admin/productos`; la 404 de la raíz
    trae "No encontramos esta página";
  - el usuario confirmó el resto de las verificaciones (login sin `volver`, botón de la contraseña).

## Desvíos

- `PaginaError.astro` no estaba en F11-D3; es un componente del layout para no repetir el hero.
- `Ingresar` se probó con el backend detenido, no con la sesión cerrada: el agente no escribe
  contraseñas.
