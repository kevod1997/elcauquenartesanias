# Fase 3 — Sitio público

## Definición

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
| Hileras mobile: un producto con diseños va solo en su hilera, después de la que se está llenando; el resto va de a cuatro (`hileras()` en `presentacion.ts`). Reemplazada por F12-D1 ([fase 12](./fase-12.md)): el producto con diseños cierra la hilera en su posición. | `main.js` tenía las hileras fijas por índice. Con el catálogo actual, la regla da las mismas: `[0-3] [4,5,7,8] [6] [9,10]`. En desktop, `--orden-producto` mantiene el orden de la API. |
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
- Después del deploy:
  - El usuario confirmó que `https://elcauquenartesanias.com.ar/catalogo-nuevo` responde 200 con el aviso y que `/` sigue sirviendo el sitio viejo. El HTML trae `noindex`.
  - `curl -sI` a `/catalogo-nuevo`: con `Age: 73`, `X-Vercel-Cache: STALE`; el pedido siguiente, `HIT` con `Age: 1`. Después de otros 65 s se repitió el ciclo (`STALE` con `Age: 78`, luego `HIT` con `Age: 2`). La ISR regenera al vencer los 60 s.

## Desvíos

- F3-D4 dice `url640` como imagen previa del visor. Para los diseños se usa `url160`, como en `main.js` (ver Decisiones).
- Se corrigió un `aria-label` con mojibake de `main.js` ("Ver mÃ¡s productos de esta hilera").

