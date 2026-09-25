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
