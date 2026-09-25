# Fase 3 — Sitio público

**Estado:** abierta. Está implementada y validada en local; falta verificar `/catalogo-nuevo` en producción después del push (ver [Pendiente](#pendiente)).
**Definición:** [PRD, fase 3](../PRD.md#fase-3--sitio-público). Aplica F3-D1 a F3-D7, sin repetirlas acá.

## Implementado

- `src/pages/catalogo-nuevo.astro`:
  - `prerender = false`: pide `GET /api/productos` con `apiPublica` y `pedir()`, y deja propagar los errores (F3-D3).
  - Porta el hero, la grilla, el contacto y el footer de `public/index.html`, con `noindex`.
  - Con `{ productos: [] }` muestra un aviso (`.catalogo__vacio`) en lugar de la grilla.
- `astro.config.ts`: `vercel({ isr: { expiration: 60 } })` (F3-D2).
- `src/catalogo/`:
  - `presentacion.ts`: el mapeo de F3-D4 (precio, medidas, diseños, imágenes del visor) y las hileras mobile.
  - `Tarjeta.astro`, `Hilera.astro` (con el script de las flechas) y `Visor.astro` (con el script del visor, portado de `main.js`).
  - `contacto.ts`: teléfono, Instagram y enlaces de WhatsApp. Se calculan en el servidor, así que desaparecen `data-wa` y `data-ig`.
  - `catalogo.css`: `public/styles.css` con las fuentes en `/assets/fonts/` y formateado por Biome.
- `scripts/api-fixture/` (F3-D6):
  - `productos.ts`: el catálogo de `main.js` con el tipo `ProductoPublico`.
  - `servidor.mjs` (`pnpm api:fixture`, con `--vacio` y `--error`): sirve la API y los `.webp` de `public/assets/`. El uso está en el encabezado del archivo.
- `biome.json`:
  - Override para `.astro` con las reglas que Biome recomienda apagar por su soporte parcial. `astro check` sigue detectando lo que no se usa (`noUnusedLocals`).
  - `noDescendingSpecificity` apagada solo en `catalogo.css`.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Hileras mobile: un producto con diseños va solo en su hilera, después de la que se está llenando; el resto va de a cuatro (`hileras()` en `presentacion.ts`). | `main.js` tenía las hileras fijas por índice. Con el catálogo actual, la regla da las mismas: `[0-3] [4,5,7,8] [6] [9,10]`. En desktop, `--orden-producto` mantiene el orden de la API. |
| En el visor, la imagen previa es `url160` para los diseños y `url640` para el resto. | Así lo hacía `main.js`: el visor abre con la imagen que ya cargó la tarjeta. F3-D4 decía `url640` para todas; ver [Desvíos](#desvíos). |
| Los datos del visor viajan en un `<script type="application/json">`, con `<` escapado. El script del visor queda en el bundle de Astro. | `define:vars` vuelve inline el script y le quita el tipado. |
| Sin imagen principal, la tarjeta muestra el fondo en un `div` sin la lupa ni el visor. | F3-D4: la tarjeta no falla, y no hay nada que mostrar en el visor. |
| No se renderiza el contenedor `.medidas` si el producto no tiene medidas, ni el párrafo si `descripcion` es `null`. | El `gap` del cuerpo de la tarjeta dejaría un hueco. |
| Biome: se usan los overrides en lugar de `html.experimentalFullSupportEnabled`. | El soporte completo es experimental en Biome 2.5 y reformatea las plantillas ([soporte de lenguajes](https://biomejs.dev/internals/language-support/)). |

## Validaciones ejecutadas

- `pnpm typecheck` (0 errores), `pnpm lint` y `pnpm test` (11 tests) pasan.
- `pnpm build`: en Windows falla con `EPERM` al crear symlinks (ver [AGENTS.md](../../../AGENTS.md)). En un contenedor `node:24`, sobre una copia limpia, pasan `npx pnpm@10 install --frozen-lockfile` y `npx pnpm@10 build`. En `.vercel/output`:
  - `functions/_isr.prerender-config.json` tiene `"expiration": 60`.
  - `config.json` manda `/catalogo-nuevo` a `/_isr`, después de `{"handle":"filesystem"}`, así que `/` sigue sirviendo `public/index.html`.
- Con `pnpm api:fixture` y `PUBLIC_API_URL=http://localhost:4400 pnpm dev`:
  - Las tarjetas muestran los precios `$5.000` … `$4.200`, las medidas (`Ø interior 5 cm`, `Varios modelos`) y los cuatro diseños del mate, con sus enlaces de WhatsApp.
  - Las hileras coinciden con las de `main.js`.
  - `Intl` formatea `500050` como `$5.000,50`.
  - Capturas de Chrome headless de `/index.html` y `/catalogo-nuevo` a 1280 px y en mobile: misma distribución y los mismos textos.
  - Visor, probado por CDP y sin errores en la consola: la ficha de un producto sin fotos abre en modo único (`1 / 1`). El diseño "Fleje greca" abre en `4 / 5`. Siguiente y `→` vuelven al `1 / 5`. `Esc` cierra y restaura el `overflow`.
  - `--vacio` da 200 con el aviso; `--error` da 500 (F3-D3).
- Contra producción (`PUBLIC_API_URL=https://api.elcauquenartesanias.com.ar pnpm dev`): 200 con el aviso de catálogo vacío. La API devuelve `{"productos":[]}`.

## Desvíos

- F3-D4 dice `url640` como imagen previa del visor. Para los diseños se usa `url160`, como en `main.js` (ver Decisiones).
- Se corrigió un `aria-label` con mojibake de `main.js` ("Ver mÃ¡s productos de esta hilera").

## Pendiente

- Después del push, verificar `/catalogo-nuevo` en producción, con ISR (el usuario; pasos en [README](./README.md#fase-3)).
