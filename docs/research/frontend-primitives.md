# Primitivas de front-end para El Cauquén Artesanías

Investigación contra fuentes primarias (specs W3C/WHATWG, MDN, documentación de proveedor,
`browser-compat-data` de MDN, la API Baseline de WebDX y caniuse). Fecha: 2026-08-11.

Contexto del sitio: HTML/CSS/JS vanilla, sin build step, deploy estático en Vercel.
Archivos: `index.html`, `main.js`, `styles.css`, `assets/*.jpeg`. Audiencia: consumidor
general argentino, mayoritariamente Chrome en Android + Safari en iOS.

Convención de documentación: **no existía ninguna** en el repo (el único `.md` era
`.agents/skills/frontend-design/SKILL.md`, que pertenece a un skill instalado, no a docs
del proyecto). Por lo tanto se creó `docs/research/frontend-primitives.md` según la
instrucción por defecto.

Nota sobre datos de soporte: los números de versión provienen de
[MDN browser-compat-data](https://github.com/mdn/browser-compat-data) y de la
[API de Baseline de WebDX](https://api.webstatus.dev/v1/features), consultadas
directamente el 2026-08-11. Cuando el resumidor de MDN devolvió versiones distintas a
BCD, se usó BCD (es la fuente que MDN misma renderiza).

---

## Resumen ejecutivo

1. **Lightbox animado**: usar `<dialog>` + `showModal()` con `::backdrop` y animar con
   `transition` sobre `opacity`/`transform` + `@starting-style` + `transition-behavior:
   allow-discrete`, **pero con un fallback de `transitionend`** para el cierre. Baseline
   suficiente: `<dialog>` desde Safari 15.4, `@starting-style` desde Safari 17.5,
   `transition-behavior` desde Safari 17.4.
2. **NO usar `closedby`**: Safari todavía no lo tiene (`version_added: "preview"` en BCD).
   El light-dismiss (clic afuera) hay que seguir implementándolo a mano, como ya hace
   `main.js`.
3. **NO depender de la propiedad CSS `overlay`**: es solo Chrome 117+ (Safari y Firefox
   no la soportan). Sin ella, el `<dialog>` sale del top layer al instante en el cierre;
   por eso el cierre se maneja con `transitionend` + `dialog.close()`.
4. **View Transitions API: SÍ es viable en 2026** para el crossfade de la imagen dentro
   del visor. Baseline "newly available" desde 2025-10-14 (Chrome 111, Safari 18,
   Firefox 144). Se usa con detección de feature de una línea; degrada a swap instantáneo.
5. **Crossfade + preload**: `startViewTransition` para el swap, y precargar las imágenes
   adyacentes con `new Image()` + `img.decode()` (Safari 11.1+). NO usar
   `<link rel=preload as=image>` para la galería completa: solo para la primera ficha.
6. **`prefers-reduced-motion`**: la spec MQ5 recomienda explícitamente **sustituir**
   movimiento por fades, no eliminar todo. Decisión: mantener el crossfade de opacidad,
   eliminar `transform`/scale, y saltear la View Transition.
7. **`:focus-visible`**: Baseline widely available desde 2022-03-14 (Safari 15.4). Usar
   `:focus-visible` con `outline` explícito en todos los `<button>` del sitio, que hoy
   tienen `border: none`. Sin fallback `@supports` (el piso de soporte ya no lo amerita).
8. **Lupa magnificadora**: `pointermove` + `requestAnimationFrame` (sin
   `getCoalescedEvents`, que en Safari recién llega en 18.2 y no aporta nada a una lupa),
   desactivada bajo `@media (hover: none), (pointer: coarse)`. **Ceiling honesto de
   magnificación con fuentes de 960×960 mostradas a ~300 CSS px en DPR 2: 1.6×.** Todo
   lo que pase de ahí es interpolación, no detalle.
9. **WebP**: para fichas de producto con tipografía fina, `-q` solo NO alcanza. Usar
   `cwebp -q 90 -m 6 -sharp_yuv` como piso, y `-near_lossless 60` (que fuerza modo
   lossless) para las placas con texto más chico. Mantener el fallback JPEG con
   `<picture>` es **innecesario** en 2026 (96,09 % de soporte global según caniuse; los
   únicos sin soporte son Safari ≤ 13.1 / iOS ≤ 13.7).
10. **Vercel**: el sitio se despliega zero-config como "Other" con output directory `.`
    (raíz). El default de `Cache-Control` es `public, max-age=0, must-revalidate`, así que
    **sí hace falta** un `vercel.json` con `headers` para cachear `/assets/*`. La
    optimización automática de imágenes de Vercel **no aplica** a `<img>` plano.
11. **Fuentes**: Playfair Display e Inter son SIL OFL 1.1 (verificado contra los `OFL.txt`
    del repo `google/fonts`), self-hosting permitido. Los `.woff2` oficiales salen de las
    URLs `fonts.gstatic.com` que devuelve la API `css2`. Usar `font-display: swap` +
    `<link rel=preload as=font crossorigin>`.

---

## 1. Animar un dialog / lightbox al abrir y al cerrar

Estado actual del sitio: `main.js` hace `visor.hidden = false` / `visor.hidden = true`
(líneas 171 y 180). El atributo `hidden` mapea a `display: none` en la hoja de estilos del
UA, y por eso el corte es duro en ambas direcciones: no hay forma de transicionar desde
`display: none` sin ayuda explícita
([HTML Standard, "Hidden elements"](https://html.spec.whatwg.org/multipage/rendering.html#hidden-elements)).

### (a) Patrón `transitionend` / `animationend` + toggle de clase

Es el patrón clásico y es el único que funciona sin piso de versión moderno: se agrega
una clase que dispara la transición, y se escucha
[`transitionend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/transitionend_event)
o [`animationend`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animationend_event)
para recién ahí aplicar `display: none` / `hidden` / `close()`.

Al abrir hay que forzar un reflow (o usar doble `requestAnimationFrame`) entre quitar
`display: none` y agregar la clase, porque el estilo inicial de un elemento recién
mostrado no dispara transición por sí solo — ese es exactamente el problema que
`@starting-style` vino a resolver
([CSS Transitions Level 2 §"before-change style"](https://drafts.csswg.org/css-transitions-2/#defining-before-change-style)).

Riesgo conocido: `transitionend` no dispara si la transición nunca arranca (por ejemplo
si `prefers-reduced-motion` la anuló, o si el valor final es igual al inicial). Siempre
hay que ponerle un `setTimeout` de guarda con la duración + margen.

**Soporte**: universal. `transitionend` y `animationend` existen desde antes de cualquier
navegador relevante en 2026.

### (b) `transition-behavior: allow-discrete` + `@starting-style` + `display` / `overlay`

`transition-behavior: allow-discrete` permite transicionar propiedades discretas. Por
defecto (`normal`) las transiciones **no** arrancan sobre propiedades discretas
([MDN: `transition-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-behavior),
[CSS Transitions 2 §transition-behavior](https://drafts.csswg.org/css-transitions-2/#transition-behavior-property)).

El caso `display` tiene manejo especial: al pasar de `display: none` a visible, el valor
cambia al 0 % de la animación (el elemento se ve durante toda la transición); al pasar de
visible a `display: none`, cambia al 100 % (el elemento desaparece recién al terminar).
Eso es lo que hace posible el fade-out sin JS.

`@starting-style` provee los valores "de origen" para elementos que se renderizan por
primera vez, que pasan de `display: none` a visible, o que se muestran en el top layer
([MDN: `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)).
Ojo con la especificidad: `@starting-style` y la regla original tienen la misma
especificidad, así que el bloque `@starting-style` debe ir **después**.

**Soporte (BCD / WebDX Baseline, consultado 2026-08-11):**

| Feature | Chrome | Safari (desktop e iOS) | Firefox | Baseline |
|---|---|---|---|---|
| `transition-behavior` | 117 | **17.4** (2024-03-05) | 129 | newly, 2024-08-06 |
| `@starting-style` | 117 | **17.5** (2024-05-13) | 129 | newly, 2024-08-06 |
| propiedad CSS `overlay` | 117 | **no soportada** | **no soportada** | limited |

Fuente: [WebDX Baseline API](https://api.webstatus.dev/v1/features?q=id:transition-behavior),
[`@starting-style`](https://api.webstatus.dev/v1/features?q=id:starting-style),
[BCD `css/properties/overlay.json`](https://github.com/mdn/browser-compat-data/blob/main/css/properties/overlay.json).

**Consecuencia crítica**: `overlay` es la propiedad que mantiene un elemento en el top
layer mientras se anima la salida. Como Safari y Firefox no la soportan, un `<dialog>`
cerrado con `close()` sale del top layer inmediatamente y el fade-out se corta.
`allow-discrete` sobre `display` alcanza para un lightbox que sea un `<div>` normal (no
top layer), pero **no** alcanza para animar la salida de un `<dialog>` modal fuera de
Chrome. Por eso la salida del `<dialog>` se resuelve con `transitionend` + `close()`.

### (c) `<dialog>` + `showModal()` + `::backdrop`

[HTML Standard §the dialog element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element).
Lo que `showModal()` da gratis y hoy `main.js` implementa a mano o no implementa:

- **Top layer**: el diálogo se renderiza por encima de todo, sin depender del `z-index`
  ni del stacking context del `.page`.
- **Inertness**: todo el resto del documento queda inerte automáticamente. Hoy el visor
  del sitio no lo hace: el catálogo detrás sigue siendo tabulable.
- **Focus trap**: el foco queda contenido dentro del diálogo. Hoy el sitio no atrapa el
  foco.
- **Foco inicial**: el UA enfoca el primer elemento enfocable del diálogo, o el elemento
  con `autofocus` si existe. `main.js` hace esto a mano (`.focus()` sobre `[data-cerrar]`,
  línea 176) — con `<dialog>` alcanza con poner `autofocus` en ese botón.
- **Restauración de foco**: al cerrar, el foco vuelve al elemento que abrió el diálogo.
  `main.js` lo hace a mano con `ultimoFoco` (líneas 170 y 182); con `<dialog>` es
  automático.
- **Esc**: cierra por platform action y dispara `cancel` y luego `close`. `main.js`
  maneja Escape a mano (línea 224).
- **`::backdrop`**: pseudo-elemento estilable para el fondo, transicionable igual que el
  diálogo ([MDN: `::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop)).
- **`closedby`**: `any` habilita light-dismiss (clic afuera), `closerequest` solo Esc y
  API, `none` solo API. El default para modales es equivalente a `closerequest`
  ([MDN: `<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)).

**Soporte:**

| Feature | Chrome | Safari | Firefox | Baseline |
|---|---|---|---|---|
| `<dialog>` | 37 | **15.4** (2022-03-14) | 98 | **widely available** desde 2022-03-14 |
| `inert` | 102 | 15.5 | 112 | widely, 2023-04-11 |
| `dialog[closedby]` | 134 | **`"preview"`** (no shipped) | 141 | **limited** |

Fuente: [BCD `html/elements/dialog.json`](https://github.com/mdn/browser-compat-data/blob/main/html/elements/dialog.json),
[WebDX](https://api.webstatus.dev/v1/features?q=id:dialog).
`"preview"` en BCD significa Safari Technology Preview, no una versión estable.

### Qué es seguro shipear en 2026 para Argentina

- `<dialog>` + `showModal()` + `::backdrop`: **sí, sin reservas.** Piso Safari 15.4
  (marzo 2022), widely available.
- `@starting-style` + `transition-behavior: allow-discrete` para la **entrada**: **sí.**
  Piso Safari 17.5 (mayo 2024). En un Safari más viejo, el diálogo simplemente aparece
  sin fade — degradación aceptable, no rompe nada.
- `overlay` / animación de **salida** puramente en CSS: **no.** Chrome-only.
- `closedby="any"`: **no.** Safari no lo tiene. El light-dismiss se sigue haciendo a mano.

### Recomendación para este sitio

Convertir `#visor` en un `<dialog>` real con `showModal()` (esto borra el `focus trap`, el
`inert`, el manejo de Esc y la restauración de foco de `main.js`), animar la **entrada**
con `@starting-style` + `transition-behavior: allow-discrete` sobre `opacity`/`transform`
(diálogo y `::backdrop`), y animar la **salida** agregando una clase `.cerrando` y
llamando `dialog.close()` en `transitionend` con un `setTimeout` de guarda; mantener el
light-dismiss manual por `click` en el backdrop (comparando `e.target === dialog`) porque
`closedby` no está en Safari.

---

## 2. View Transitions API

[Spec: CSS View Transitions Level 1](https://drafts.csswg.org/css-view-transitions-1/) ·
[MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)

`document.startViewTransition(callback)` toma una captura del estado viejo, ejecuta el
callback que muta el DOM, y anima entre ambos estados. El objeto `ViewTransition` expone
`ready`, `finished`, `updateCallbackDone` y `skipTransition()`. La animación por defecto
es exactamente un crossfade: *"Pairs of snapshots from the old and new state smoothly
transition from their old position and size to their new location, while their content
crossfades"*
([Chrome for Developers, same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document)).

Los elementos que se quieren animar por separado se marcan con `view-transition-name`, y
se estilan vía el árbol de pseudo-elementos `::view-transition` →
`::view-transition-group()` → `::view-transition-image-pair()` →
`::view-transition-old()` / `::view-transition-new()`.

**Soporte (WebDX Baseline, 2026-08-11):**

| Navegador | Versión | Fecha |
|---|---|---|
| Chrome / Chrome Android | 111 | 2023-03-07 |
| Edge | 111 | 2023-03-13 |
| **Safari / Safari iOS** | **18** | **2024-09-16** |
| Firefox / Firefox Android | 144 | 2025-10-14 |

**Baseline: "newly available" desde 2025-10-14.**
Fuente: [WebDX Baseline API — view-transitions](https://api.webstatus.dev/v1/features?q=id:view-transitions).
Posiciones de vendor: Apple `support`
([WebKit standards-positions #48](https://github.com/WebKit/standards-positions/issues/48)),
Mozilla `positive`
([mozilla standards-positions #677](https://github.com/mozilla/standards-positions/issues/677)).

Advertencia sobre WPT: el score de web-platform-tests estable de `chrome_android` para
esta feature es 0.255, muy por debajo del 0.97 de Chrome desktop
(mismo endpoint de WebDX). Es decir: la feature existe en Chrome Android desde 111 pero
hay áreas de la spec con comportamiento no conforme. Para un crossfade simple de una sola
imagen esto no debería morder, pero conviene no construir nada sofisticado encima.

**Patrón de degradación (recomendado por el equipo de Chrome, textual):**

```js
if (!document.startViewTransition) {
  updateTheDOMSomehow();
  return;
}
document.startViewTransition(() => updateTheDOMSomehow());
```

([Chrome for Developers](https://developer.chrome.com/docs/web-platform/view-transitions/same-document))

Sobre movimiento reducido, el equipo de Chrome es explícito: *"A preference for 'reduced
motion' doesn't mean the user wants no motion… you could choose a more subtle animation,
but one that still expresses the relationship between elements, and the flow of data."*

### Recomendación para este sitio

Sí, usar `document.startViewTransition` para el swap de imagen dentro del visor
(`pintar()` en `main.js`), envuelto en la guarda de una línea. Es literalmente la
herramienta correcta: la animación por defecto ya es el crossfade que se quiere, no hace
falta CSS extra, y donde no exista el swap es instantáneo — o sea, exactamente el
comportamiento de hoy. No usar view transitions para abrir/cerrar el visor (ahí el
`<dialog>` con transiciones CSS es más predecible).

---

## 3. Crossfade de imagen + preloading

### Dos capas apiladas vs. View Transitions

Dos capas apiladas (dos `<img>` o dos divs superpuestos, se hace fade de la opacidad de
una sobre la otra) es la técnica manual: funciona en todos lados, pero requiere gestionar
dos nodos, cuál está "arriba", y limpiar la clase al terminar. View Transitions hace lo
mismo declarativamente y ya es Baseline (ver §2). Con la guarda de feature detection, no
hay razón para escribir la máquina de estados a mano.

### `img.decode()` — qué garantiza realmente

[HTML Standard §`decode()`](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-img-decode) ·
[MDN: `HTMLImageElement.decode()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)

- Devuelve una promesa que se resuelve cuando la decodificación terminó.
- Garantía de la spec: el UA debe *"ensure that the decoded media data stays readily
  available until at least the end of the next successful update the rendering step"*.
  Es decir: garantiza que **el siguiente frame puede pintar la imagen sin costo de
  decodificación** — no garantiza nada más allá de ese frame, y la spec reconoce que bajo
  presión de memoria o con imágenes muy grandes el UA puede no poder honrarlo.
- Rechaza con `EncodingError` si el documento se vuelve inactivo, si `src` cambia, o si
  los datos de la imagen son inválidos.
- Caso de uso documentado: decodificar en paralelo e insertar en el DOM recién cuando
  terminó, para evitar frames perdidos.

Lo que `decode()` **no** hace: no descarga nada por sí solo si la imagen no tiene `src`
seteado. El patrón es `const im = new Image(); im.src = url; await im.decode();`.

`HTMLImageElement.complete` es un booleano sincrónico: verdadero cuando la imagen terminó
de cargar (o cuando no hay `src`). Sirve como fast-path para saltear el await, pero
`complete === true` **no** implica que la imagen esté decodificada
([MDN: `complete`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/complete)).

**Soporte** (BCD `api/HTMLImageElement.json`): `decode()` Chrome 64 / **Safari 11.1** /
Firefox 68. `complete` universal. `fetchPriority` Chrome 102 / Safari 17.2 / Firefox 132.

### `<link rel=preload as=image>` y `fetchpriority`

[HTML Standard §link type "preload"](https://html.spec.whatwg.org/multipage/links.html#link-type-preload) ·
[MDN: `rel=preload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)

`<link rel="preload" as="image" href="...">` fuerza una descarga temprana con alta
prioridad. Es apropiado solo para recursos que **se van a usar en la carga actual**;
precargar toda una galería compite por ancho de banda con el HTML/CSS crítico y empeora
LCP. Para responsive existen `imagesrcset` / `imagesizes`
([Baseline: preloading responsive images, widely available desde 2023-12-11](https://api.webstatus.dev/v1/features?q=preload)).

`fetchpriority` (`high` / `low` / `auto`) ajusta la prioridad relativa dentro del mismo
tipo de recurso ([Fetch Standard §request priority](https://fetch.spec.whatwg.org/#request-priority)).
Baseline "newly available" desde 2024-10-29 (Chrome 103, Safari 17.2, Firefox 132).

### Cómo precargar imágenes adyacentes sin bloquear

El patrón correcto para una galería es **no** usar `<link rel=preload>` para las vecinas,
sino disparar la descarga en JS después de que el visor ya se pintó, con prioridad baja:

```js
function precargar(url) {
  const im = new Image();
  if ('fetchPriority' in im) im.fetchPriority = 'low';
  im.decoding = 'async';
  im.src = url;
  return im.decode().catch(() => {});   // decode() rechaza con EncodingError; se ignora
}
```

Esto no bloquea nada porque no es un recurso descubierto por el preload scanner y porque
`fetchPriority = 'low'` lo pone detrás de lo que ya está en vuelo. Al llamarse recién
después de abrir el visor, no compite con el LCP de la portada.

### Recomendación para este sitio

En `abrir()`, además de pintar la ficha actual, precargar `items[idx±1]` con el helper de
arriba; en `pintar()`, envolver el cambio de imagen en `document.startViewTransition` con
la guarda de feature detection, y hacer `await img.decode()` antes de mutar el DOM para
que el crossfade nunca arranque contra un frame vacío. Agregar un único
`<link rel="preload" as="image" fetchpriority="high">` en `index.html` **solo** para
`assets/logo.jpg` (es el LCP de la portada); nada más.

---

## 4. `prefers-reduced-motion`

### Semántica exacta de la spec

[Media Queries Level 5 §prefers-reduced-motion](https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion)

> "The `prefers-reduced-motion` media feature is used to detect if the user has requested
> that the system minimize the amount of motion or animation."

Valores:

- `no-preference` — "Indicates that the user has made no preference known to the system."
- `reduce` — "Indicates that user has notified the system that they prefer an interface
  that minimizes motion and animation."

La nota de la spec es la parte que más importa y que casi siempre se ignora:

> "In particular, it is recommended that authors disable auto-playing video and animation,
> as well as **use fades or opacity changes rather than motion-based animation**, where
> possible."

O sea: la spec **no** pide apagar todo. Pide **sustituir** movimiento por fade.

**Soporte**: Baseline widely available desde 2020-01-15 (Chrome 74, **Safari 10.1 /
iOS Safari 10.3**, Firefox 63). WPT score 1.0 en todos los navegadores.
([WebDX](https://api.webstatus.dev/v1/features?q=id:prefers-reduced-motion))

### WCAG 2.2 SC 2.3.3

[Understanding SC 2.3.3: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)

Texto normativo, **Nivel AAA**:

> "Motion animation triggered by interaction can be disabled, unless the animation is
> essential to the functionality or the information being conveyed."

"Motion animation" está definido como *"addition of steps between conditions to create the
illusion of movement or to give a sense of a smooth transition"*. La sección de intent
señala que se cumple con cualquiera de: evitar animación innecesaria, dar un control de
usuario para desactivarla, o apoyarse en `prefers-reduced-motion`.

Relevante para este sitio: los cambios de **opacidad y color solos no constituyen motion
animation** — solo cuentan los cambios que afectan tamaño, forma o posición percibidos.
Un crossfade puro ya es la variante conforme.

Nota: SC 2.3.3 es AAA, no AA. Pero la implementación (una media query) es de costo
prácticamente cero, así que no hay razón para no cumplirlo.

### Recomendación para este sitio

Un solo bloque en `styles.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

...**pero con una excepción explícita**: mantener el crossfade de opacidad del visor con
una duración corta (≈120 ms) y eliminar solo los `transform`/`scale`. Y en JS, saltear
`startViewTransition` cuando
`matchMedia('(prefers-reduced-motion: reduce)').matches` sea verdadero, llamando
directamente a la función de actualización del DOM. Eso es exactamente lo que la nota de
MQ5 pide: fades sí, movimiento no.

---

## 5. `:focus-visible`

[Selectors Level 4 §the-focus-visible-pseudo](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo) ·
[MDN: `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)

Definición de la spec: *"an E element that has user input focus, and the UA has determined
that a focus ring or other indicator should be drawn"*. La decisión es del UA — la spec no
normativiza la heurística, la delega deliberadamente.

Heurísticas que documenta MDN sobre cuándo hace match en la práctica:

- Navegación por teclado (Tab) → sí.
- Foco movido programáticamente por script → sí (el UA asume que el usuario necesita saber
  dónde está el foco).
- Elementos de entrada de texto que requieren input → sí, incluso con mouse.
- Click con mouse o touch sobre un `<button>` → **no** (el usuario ya sabe dónde tocó).

Diferencia con `:focus`: `:focus` matchea siempre que el elemento tenga el foco;
`:focus-visible` solo cuando el indicador es útil. Ese es el motivo por el que
`:focus { outline: none }` es un antipatrón de accesibilidad y `:focus-visible` no lo es.

**Soporte**: Baseline **widely available** desde 2022-03-14. Chrome 86 (2020-10-20),
Firefox 85 (2021-01-26), **Safari 15.4 / iOS Safari 15.4** (2022-03-14).
([WebDX](https://api.webstatus.dev/v1/features?q=id:focus-visible))

Contraste del indicador: WCAG 2.1 SC 1.4.11 (Non-text Contrast) exige mínimo **3:1**
entre el indicador de foco y el fondo adyacente
([Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).

### Patrón correcto para `<button>` con `border: none`

El problema es que un `<button>` con `border: none` y `background` custom pierde el
outline nativo de la plataforma en varios UAs, o el outline queda invisible contra el
fondo. Los botones de este sitio en esa situación son: `.card__foto`, `.visor__cerrar`,
`.visor__nav`, los de `.variantes__lista` y los de `.visor__tiras`.

```css
:where(button, a, [tabindex]):focus-visible {
  outline: 2px solid var(--foco, #1f5d3a);
  outline-offset: 2px;
  border-radius: inherit;   /* para que el outline siga la forma del botón */
}
```

Notas de implementación:

- Usar `outline`, no `box-shadow`: `outline` respeta el modo de alto contraste forzado de
  Windows, `box-shadow` no
  ([MDN: `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)).
- `outline-offset` positivo evita que el anillo se coma el borde del thumbnail.
- El fallback `@supports not selector(:focus-visible) { … :focus … }` que documenta MDN ya
  **no hace falta**: el piso de soporte es Safari 15.4 / 2022 y la feature es widely
  available.
- No agregar `:focus { outline: none }` global. Si algún caso puntual lo necesita, usar
  `:focus:not(:focus-visible) { outline: none }`, que preserva el anillo por teclado.

### Recomendación para este sitio

Agregar la regla `:focus-visible` de arriba con `:where()` (especificidad 0, no pelea con
nada) al principio de `styles.css`, con un color que dé ≥ 3:1 contra el fondo crema del
sitio y contra las fotos oscuras — un verde oscuro o el mismo negro del texto. No usar
fallback `@supports`, no tocar `:focus`.

---

## 6. Lupa magnificadora que sigue al cursor

### `pointermove` vs `mousemove`

[Pointer Events Level 3 (W3C)](https://w3c.github.io/pointerevents/) ·
[MDN: `pointermove`](https://developer.mozilla.org/en-US/docs/Web/API/Element/pointermove_event)

Pointer Events unifica mouse, touch y lápiz en un solo modelo de eventos, y expone
`pointerType` (`"mouse"` / `"pen"` / `"touch"`), presión, tilt y ancho/alto del contacto.
Usar `pointermove` y filtrar por `e.pointerType === 'mouse'` es estrictamente mejor que
`mousemove`, porque los eventos de mouse en touch son compatibilidad emulada y llegan
tarde y de a saltos.

**Soporte**: Baseline widely available desde 2020-07-28 (Chrome 55, **Safari 13**,
Firefox 59). ([WebDX](https://api.webstatus.dev/v1/features?q=id:pointer-events-api))

### `getCoalescedEvents()`

[MDN: `PointerEvent.getCoalescedEvents()`](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/getCoalescedEvents)

Los UAs fusionan múltiples updates de posición en un solo `pointermove` por frame:
*"Instead of a stream of many pointermove events, user agents coalesce multiple updates
into a single event. This helps with performance… but there is a reduction in the
granularity and accuracy when tracking, especially with fast and large movements."*
`getCoalescedEvents()` devuelve las posiciones intermedias descartadas. Aplica solo a
`pointermove` y `pointerrawupdate`, y requiere secure context.

**Soporte**: Chrome 58, Firefox 59, **Safari 18.2**
([BCD `api/PointerEvent.json`](https://github.com/mdn/browser-compat-data/blob/main/api/PointerEvent.json)).
No es Baseline.

**Para una lupa esto es irrelevante y no debe usarse.** Las posiciones intermedias
importan para aplicaciones de dibujo, donde hay que reconstruir la trayectoria completa.
Una lupa solo necesita **la última posición** — dibujar las intermedias sería literalmente
trabajo tirado a la basura, porque solo el último frame es visible.

### Batching con `requestAnimationFrame`

[HTML Standard §animation frames](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames) ·
[MDN: `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
Baseline widely available desde 2015 (Chrome 24, Safari 7, Firefox 23).

El patrón correcto: el handler de `pointermove` solo guarda las coordenadas en una
variable y agenda un rAF si no hay uno pendiente. Escribir estilos directamente en el
handler puede causar múltiples layouts por frame.

```js
let x = 0, y = 0, pendiente = false;
stage.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  x = e.clientX; y = e.clientY;
  if (!pendiente) { pendiente = true; requestAnimationFrame(dibujar); }
}, { passive: true });

function dibujar() { pendiente = false; /* escribir estilos con x, y */ }
```

`{ passive: true }` es correcto acá porque la lupa no llama `preventDefault()`
([MDN: `addEventListener` options](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#passive)).

### Desactivar en touch

[Media Queries Level 5 §mf-interaction](https://drafts.csswg.org/mediaqueries-5/#mf-interaction) ·
[MDN: `hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover) ·
[MDN: `pointer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)

- `hover: none` — el mecanismo de entrada primario no puede hacer hover, o hacerlo es
  incómodo (celulares, tablets).
- `pointer: coarse` — el mecanismo primario tiene precisión limitada (dedo).

Ambos se refieren al **mecanismo de entrada primario**; `any-hover` / `any-pointer`
consideran todos los disponibles. Para desactivar una lupa, se quiere el primario.

**Soporte**: "Interaction media queries" Baseline widely available desde 2018-12-11
(Chrome 41, **Safari 9**, Firefox 64)
([WebDX](https://api.webstatus.dev/v1/features?q=pointer)).

Regla decisiva: dado que la audiencia es mayoritariamente móvil, la lupa debe estar
envuelta en `@media (hover: hover) and (pointer: fine)` y el listener JS no debe siquiera
adjuntarse si `matchMedia('(hover: hover) and (pointer: fine)').matches` es falso.

### Matemática de `background-size` / `background-position`

Con la capa magnificada implementada como un `background-image` (que es lo que ya usa este
sitio: `visorImg.style.backgroundImage`, `main.js:206`):

Sean `D` el ancho en CSS px de la imagen mostrada, `Z` el factor de zoom, `L` el diámetro
de la lente, y `(fx, fy)` la posición del cursor como fracción [0,1] de la imagen mostrada.

```
background-size:     (D * Z)px auto
background-position: (L/2 - fx * D * Z)px  (L/2 - fy * D * Z)px
```

**No** usar porcentajes en `background-position` para esto: los porcentajes alinean el
punto `P` de la imagen con el punto `P` del área de posicionamiento, es decir el offset
resultante es `P × (anchoContenedor − anchoImagen)`, no `P × anchoImagen`
([MDN: `background-position`, sintaxis de porcentaje](https://developer.mozilla.org/en-US/docs/Web/CSS/background-position)).
Con la lente y la imagen de tamaños distintos, la fórmula de porcentaje da un resultado
distinto al deseado. Los píxeles son inequívocos.

Conviene además clampear el resultado para que la lente nunca muestre área fuera de la
imagen: `pos ∈ [L - D*Z, 0]`.

### `image-rendering`

[CSS Images 3 §the-image-rendering](https://drafts.csswg.org/css-images-3/#the-image-rendering) ·
[MDN: `image-rendering`](https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering)

Valores: `auto` (algoritmo del UA, típicamente resampleo bilineal), `smooth` (maximizar
suavidad, interpolación bilineal), `high-quality` (**no implementado en ningún
navegador**), `crisp-edges` (nearest-neighbor, preserva contraste y bordes sin suavizar),
`pixelated` (nearest-neighbor a múltiplo entero, luego interpolación suave). Solo tiene
efecto cuando la imagen se escala.

**Para esta lupa el valor correcto es `auto` (o sea, no tocarlo).** `pixelated` y
`crisp-edges` están pensados para pixel art y line art de baja resolución; aplicados a
fotografías de madera y a tipografía antialiaseada producen bordes escalonados feos.
Nota de soporte: `crisp-edges` sin prefijo recién llegó a Chrome 148 (Baseline newly
2026-05-07), lo cual es otra razón para no usarlo
([WebDX](https://api.webstatus.dev/v1/features?q=image-rendering)).

### Techo honesto de magnificación — el cálculo

Datos: fuente `S = 960 px`, mostrada a `D ≈ 300 CSS px`, en pantalla con `DPR = 2`.

- Píxeles de dispositivo usados hoy para mostrarla: `D × DPR = 300 × 2 = 600 px`.
- La imagen ya se está **reduciendo** a `600 / 960 = 0.625`. Hay un 60 % de píxeles
  sobrantes que el usuario no está viendo.
- Con la lupa a zoom `Z`, el `background-size` es `D × Z` CSS px = `D × Z × DPR` píxeles
  de dispositivo.
- Hay detalle real **mientras** `D × Z × DPR ≤ S`, es decir `300 × Z × 2 ≤ 960`.

**`Z ≤ 1.6`.**

A `Z = 1.6` la fuente mapea exactamente 1:1 contra los píxeles físicos de la pantalla: ese
es el máximo de información recuperable. **Un zoom de 2×, 3× o 4× sobre estas imágenes no
revela un solo detalle nuevo: es puramente interpolación**, y en tipografía fina eso se ve
directamente como texto borroso — el usuario percibe que la lupa "no funciona".

Para ofrecer honestamente `Z = 3` en la misma presentación harían falta fuentes de
`300 × 3 × 2 = 1800 px` de lado. Para `Z = 2`, `1200 px`.

### Recomendación para este sitio

Implementar la lupa solo bajo `@media (hover: hover) and (pointer: fine)`, con
`pointermove` filtrado por `pointerType !== 'touch'`, batching con `requestAnimationFrame`,
sin `getCoalescedEvents`, `image-rendering` en `auto`, y `background-position` en píxeles
con clamp. **Y fijar el zoom en `1.6×` con los assets actuales de 960 px** — o, mejor,
reexportar las placas a 1800 px de lado (§7) y recién ahí ofrecer `2.5×–3×`. Prometer más
zoom del que la fuente soporta es peor que no tener lupa.

---

## 7. Conversión y entrega WebP

### `cwebp`: qué dice Google sobre calidad, y por qué `-q` solo no alcanza para texto

[Documentación oficial de `cwebp`](https://developers.google.com/speed/webp/docs/cwebp)

- **`-q float`**: *"Specify the compression factor for RGB channels between 0 and 100.
  The default is 75."* … *"Best quality is achieved by using a value of 100."*
- **`-m int`**: método de compresión, `0` a `6`, **default `4`**. Valores más altos =
  más tiempo de encoding, mejor calidad/tamaño. Para un batch de 10 imágenes que se
  encodean una sola vez, `-m 6` es gratis.
- **`-sharp_yuv`**: *"Use more accurate and sharper RGB->YUV conversion. Note that this
  process is slower than the default 'fast' RGB->YUV conversion."*
- **`-near_lossless int`**: *"Specify the level of near-lossless image preprocessing. This
  option adjusts pixel values to help compressibility, but has minimal impact on the
  visual quality. **It triggers lossless compression mode automatically.** The range is 0
  (maximum preprocessing) to 100 (no preprocessing, the default). The typical value is
  around 60. Note that lossy with `-q 100` can at times yield better results."*
  ([man page de cwebp en libwebp](https://github.com/webmproject/libwebp/blob/main/man/cwebp.1))
- **`-z int`**: *"Switch on lossless compression mode with the specified level between 0
  and 9, with level 0 being the fastest, 9 being the slowest."* Recomendado `-z 6`.
  **`-z` controla el esfuerzo de compresión lossless, no la calidad.**
- **`-lossless`**: *"Encode the image without any loss."*
- **`-preset string`**: *"Specify a set of pre-defined parameters to suit a particular
  type of source material. Possible values are: default, photo, picture, drawing, icon,
  text. Since `-preset` overwrites the other parameters' values (except the `-q` one),
  this option should preferably appear first in the order of the arguments."*

El preset `text` está definido en el header oficial de libwebp como `WEBP_PRESET_TEXT //
text-like`, junto a `WEBP_PRESET_PHOTO // outdoor photograph, with natural lighting`,
`WEBP_PRESET_PICTURE // digital picture, like portrait, inner shot` y
`WEBP_PRESET_DRAWING // hand or line drawing, with high-contrast details`
([libwebp `src/webp/encode.h`](https://github.com/webmproject/libwebp/blob/main/src/webp/encode.h)).
El mismo header confirma los defaults: *"the default values are lossless=0 and
quality=75."*

**Por qué esto importa para las placas de este sitio.** El WebP lossy se basa en VP8, que
usa subsampling de croma: la información de color se guarda a la mitad de resolución en
ambos ejes. En tipografía fina, esa pérdida de resolución cromática es exactamente donde
aparecen los halos de color en los bordes de las letras. `-sharp_yuv` existe precisamente
para mitigarlo (conversión RGB→YUV más precisa). Subir `-q` reduce el ruido de
cuantización pero **no** cambia el subsampling de croma — por eso `-q` solo no resuelve el
problema del texto.

> UNVERIFIED: no encontré en la documentación pública de Google una afirmación explícita
> y textual del tipo "use lossless/near-lossless para imágenes con texto". La página
> [WebP Compression Techniques](https://developers.google.com/speed/webp/docs/compression)
> describe los algoritmos lossy y lossless pero no da esa recomendación en esos términos.
> El razonamiento sobre subsampling de croma de arriba está sustentado por la existencia y
> descripción de `-sharp_yuv` y por la existencia del preset `text`, no por una frase
> normativa de Google. **Verificar empíricamente**: encodear una placa con
> `-q 90 -sharp_yuv`, otra con `-near_lossless 60`, y comparar a 200 % de zoom.

**Comandos concretos:**

```bash
# Fotos de producto (mates, texturas de madera) — sin texto fino
cwebp -preset photo -q 82 -m 6 -sharp_yuv -metadata none in.jpeg -o out.webp

# Placas / fichas con tipografía fina — piso de calidad
cwebp -q 90 -m 6 -sharp_yuv -metadata none in.jpeg -o out.webp

# Placas donde el texto más chico todavía se degrada — modo lossless
cwebp -near_lossless 60 -z 6 -metadata none in.png -o out.webp
```

`-metadata none` es el default documentado y elimina EXIF/ICC, ahorrando bytes.

### El elemento `<picture>` y si sigue haciendo falta el fallback JPEG

[HTML Standard §the picture element](https://html.spec.whatwg.org/multipage/embedded-content.html#the-picture-element)

El algoritmo de selección de fuente recorre los `<source>` en orden y usa el primero cuyo
`type` sea soportado; el `<img>` final es el fallback obligatorio y es el que lleva `alt`,
`width`, `height`, `loading` y `decoding`.

```html
<picture>
  <source srcset="assets/cazuelas-placa.webp" type="image/webp">
  <img src="assets/cazuelas-placa.jpeg" alt="Ficha de cazuelas artesanales"
       width="960" height="960" loading="lazy" decoding="async">
</picture>
```

**Soporte de `<picture>`**: Baseline widely available desde 2016-03-21 (Chrome 38,
Safari 9.1, Firefox 38).

**Soporte de WebP**: Baseline **widely available** desde 2023-03-16. Chrome 32 (2014-01),
Firefox 65 (2019-01), **Safari 14 / iOS Safari 14 (2020-09-16)**
([WebDX](https://api.webstatus.dev/v1/features?q=id:webp); la spec de referencia es
[RFC 9649](https://www.rfc-editor.org/info/rfc9649/)).

Datos de caniuse (consultados 2026-08-11 desde
[`features-json/webp.json`](https://github.com/Fyrd/caniuse/blob/main/features-json/webp.json)):
**`usage_perc_y` = 96.09 %**, `usage_perc_a` = 0.09 %. Las últimas versiones sin soporte
son Safari 13.1 y iOS Safari 13.4–13.7 — es decir, iPhones que se quedaron en iOS 13
(2019). Ver también [caniuse: WebP image format](https://caniuse.com/webp).

**Veredicto**: el ~4 % sin soporte no es "4 % de la audiencia de este sitio", es
mayoritariamente navegadores viejos de escritorio y bots. Para una audiencia de consumidor
argentino en 2026, iOS 13 es residual. Mantener el JPEG duplica el peso del repo y agrega
un elemento por cada imagen, a cambio de casi nada.

### Recomendación para este sitio

Convertir las 13 imágenes a WebP con `-q 90 -m 6 -sharp_yuv` (y `-near_lossless 60` para
las placas cuyo texto no aguante), servirlas como `.webp` directo en `<img>` **sin
`<picture>` y sin fallback JPEG**, y aprovechar la reexportación para subir las placas a
**1800 px de lado** (necesario para que la lupa de §6 sea honesta a 3×). Agregar siempre
`width` y `height` explícitos para evitar CLS.

---

## 8. Deploy estático en Vercel

Todo lo de esta sección proviene exclusivamente de `vercel.com/docs`.

### Detección zero-config de un sitio estático sin `package.json`

[Configuring a Build](https://vercel.com/docs/builds/configure-a-build):

> "However, if no framework is detected, **'Other'** will be selected."

Y sobre el output directory:

> "For projects that do not require building, you might want to serve the files in the
> root directory. In this case, do the following: Choose 'Other' as the Framework Preset.
> **This sets the output directory as `public` if it exists or `.` (root directory of the
> project) otherwise.** If your project doesn't have a `public` directory, it will serve
> the files from the root directory."

Y la sección "Skip Build Step":

> "Some static projects do not require building. For example, a website with only
> HTML/CSS/JS source files can be served as-is. In such cases, you should: Specify 'Other'
> as the framework preset, Enable the Override option for the Build Command, Leave the
> Build Command empty. This prevents running the build, and your content is served
> directly."

Este repo no tiene `package.json` ni directorio `public/`, así que el output directory es
la raíz y `index.html` se sirve en `/` sin configuración alguna.
[Vercel Drop](https://vercel.com/docs/deployments) lo confirma para el caso sin Git:
*"Vercel detects your framework and builds it, or deploys your files as-is when there's no
framework."*

### `Cache-Control` por defecto — ¿hacen falta headers custom?

[Cache-Control headers](https://vercel.com/docs/caching/cache-control-headers):

> "**Default `cache-control` value.** The default value is
> `cache-control: public, max-age=0, must-revalidate` which instructs both the CDN and
> the browser not to cache."

[Vercel CDN Cache](https://vercel.com/docs/caching/cdn-cache), sección "Static files
caching":

> "Static files are **automatically cached on Vercel's global network** for the lifetime
> of the deployment after the first request. If a static file is unchanged, the cached
> value can persist across deployments due to the hash used in the filename."

**Interpretación decisiva**: Vercel cachea los assets en su CDN por vos, pero el header
que llega al **navegador** es `public, max-age=0, must-revalidate`. O sea: cada visita
repetida dispara una revalidación condicional contra el edge por cada `.jpeg`. Con 13
imágenes eso son 13 round-trips evitables en cada carga. **Sí hacen falta headers custom**,
y `assets/` es un buen candidato porque los nombres de archivo son estables y el contenido
también.

Tabla de recomendaciones de la misma página: para "Immutable static assets (hashed JS,
CSS, fonts)" el header recomendado es `max-age=31536000, immutable`. Como los nombres acá
**no** llevan hash, `immutable` con un año es peligroso (no habría forma de actualizar una
foto sin renombrarla). Un valor intermedio es lo correcto.

### Esquema exacto de `vercel.json`

[Static Configuration with vercel.json](https://vercel.com/docs/project-configuration/vercel-json):

**`headers`** — *"Type: Array of header Object."*

| Propiedad | Descripción (textual de los docs) |
|---|---|
| `source` | "A pattern that matches each incoming pathname (excluding querystring)." |
| `headers` | "A non-empty array of key/value pairs representing each response header." |
| `has` | "An optional array of `has` objects with the `type`, `key` and `value` properties. Used for conditional path matching based on the presence of specified properties." |
| `missing` | "An optional array of `missing` objects… based on the absence of specified properties." |

**`cleanUrls`** — *"Type: Boolean. Default Value: `false`."*
*"When set to `true`, all HTML files and Vercel functions will have their extension
removed. When visiting a path that ends with the extension, a 308 response will redirect
the client to the extensionless path."*

**`trailingSlash`** — *"Type: Boolean. Default Value: `undefined`."*
- `false` → `/about/` redirige 308 a `/about`.
- `true` → `/about` redirige 308 a `/about/`; rutas con extensión de archivo no redirigen.
- `undefined` (default) → ninguna redirección; ambos sirven el mismo contenido. Los docs
  advierten: *"This is not recommended because it could lead to search engines indexing
  two different pages with duplicate content."*

Nota adicional de los docs: la propiedad `public` **ya no se soporta y causa fallas de
deployment** — no incluirla.

`vercel.json` propuesto:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800" }
      ]
    },
    {
      "source": "/(styles.css|main.js)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

Dos detalles de comportamiento documentados que justifican esa forma:
`s-maxage` se consume en el proxy de Vercel y **no** se reenvía al cliente (*"Vercel's
proxy consumes `s-maxage` for all requests. After processing it, the CDN does not include
it in the final HTTP response to the client"*), así que el navegador recibe solo el
`max-age` corto; y *"Vercel doesn't allow bypassing the cache for static files by design."*

### Optimización automática de imágenes en un sitio estático sin framework

[Image Optimization with Vercel](https://vercel.com/docs/image-optimization), sección "How
Image Optimization works":

> "The optimization process starts with your component choice in your codebase: **If you
> use a standard HTML `img` element, the browser will be instructed to bypass optimization
> and serve the image directly from its source.** If you use a framework's `Image`
> component (like `next/image`) it will use Vercel's image optimization pipeline."

Es decir: **no**, no aplica. La optimización se invoca por URL —
`/_next/image?url=…&w=…&q=…` en Next.js, o `/_vercel/image?url=…&w=…&q=…` en Nuxt/Astro/
otros. Los docs indican que para un framework propio hay que declararlo vía
[Build Output API `images`](https://vercel.com/docs/build-output-api/configuration#images).

Se podría, en teoría, apuntar los `src` a mano a `/_vercel/image?url=/assets/x.jpeg&w=960&q=80`
declarando `images` en `vercel.json`. **No conviene**: agrega costo facturable por
transformación y por lectura de caché de imagen
([Limits and pricing](https://vercel.com/docs/image-optimization/limits-and-pricing)) para
resolver un problema que se resuelve gratis convirtiendo a WebP en build local (§7). Los
propios docs listan como caso donde la optimización *no* es necesaria: "Small icons or
thumbnails (under 10 KB)" y contenido que ya está optimizado.

### Recomendación para este sitio

Dejar el deploy zero-config como está (preset "Other", output directory raíz, build
command vacío), agregar el `vercel.json` de arriba con `cleanUrls: true`,
`trailingSlash: false` y el header de cache para `/assets/*`, y **no** usar la
optimización de imágenes de Vercel: convertir a WebP localmente y commitear los archivos.

---

## 9. Self-hosting de Google Fonts

Estado actual: `index.html` líneas 9–11 cargan Playfair Display e Inter desde
`fonts.googleapis.com` con `preconnect`. Eso implica dos conexiones a terceros en el
critical path y una request bloqueante de CSS antes de que se descubran los `.woff2`.

### Licencia

Verificado contra los archivos de licencia del repositorio oficial de Google Fonts:

- **Playfair Display**:
  [`ofl/playfairdisplay/OFL.txt`](https://github.com/google/fonts/blob/main/ofl/playfairdisplay/OFL.txt)
  — *"Copyright 2017 The Playfair Display Project Authors
  (https://github.com/clauseggers/Playfair-Display), with Reserved Font Name 'Playfair
  Display'. This Font Software is licensed under the SIL Open Font License, Version 1.1."*
  El [`METADATA.pb`](https://github.com/google/fonts/blob/main/ofl/playfairdisplay/METADATA.pb)
  confirma `license: "OFL"`.
- **Inter**: [`ofl/inter/OFL.txt`](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt)
  — *"Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter). This Font
  Software is licensed under the SIL Open Font License, Version 1.1."*

Texto de la licencia
([SIL OFL 1.1 oficial](https://openfontlicense.org/open-font-license-official-text/)):
permite *"use, study, copy, merge, embed, modify, redistribute, and sell modified and
unmodified copies of the Font Software"*. Condiciones relevantes para self-hosting:

- *"Neither the Font Software nor any of its individual components, in Original or
  Modified Versions, may be sold by itself."* — irrelevante acá, no se venden las fuentes.
- Cada copia debe incluir el aviso de copyright y la licencia. **Acción concreta:**
  commitear los `OFL.txt` junto a los `.woff2`, p. ej. `assets/fonts/OFL-Inter.txt` y
  `assets/fonts/OFL-PlayfairDisplay.txt`.
- Los Reserved Font Names ("Playfair Display") no pueden usarse en versiones modificadas
  sin permiso escrito. Subsetear con `pyftsubset` técnicamente produce una versión
  modificada; renombrar la familia en el `@font-face` (`font-family: 'Playfair Local'`)
  evita cualquier ambigüedad. En la práctica el ecosistema no lo hace, pero es gratis.
- *"…does not apply to any document created using the Font Software"* — el sitio en sí no
  queda bajo OFL.

**Self-hosting: explícitamente permitido.** No hace falta atribución visible en la página.

### De dónde sacar los `.woff2` oficiales

Dos rutas de primera mano:

1. **La API `css2` de Google Fonts.** Pedir
   `https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap` con un
   User-Agent moderno devuelve bloques `@font-face` apuntando a URLs
   `https://fonts.gstatic.com/s/inter/v20/…woff2`, ya subseteadas por `unicode-range`
   (latin, latin-ext, greek, cyrillic, …). Descargar solo el bloque `latin` (y `latin-ext`
   si se usan caracteres como `ñ`/`á` fuera del rango latin — sí se usan: "Cauquén",
   "artesanías", "cóncavos"). Verificado ejecutando la request el 2026-08-11.
2. **El repositorio [`google/fonts`](https://github.com/google/fonts)**, que distribuye
   los `.ttf` (variables y estáticos) más el `OFL.txt`. Requiere convertir a WOFF2 vos
   mismo. Más control, más trabajo.

La ruta 1 es preferible: los archivos ya vienen optimizados y subseteados por Google.

> Nota de precisión: la descarga desde el botón "Download family" de `fonts.google.com`
> entrega TTF, no WOFF2. Los WOFF2 solo se obtienen vía la API `css2`. UNVERIFIED en el
> sentido de que no encontré una página de docs de Google que documente esto
> explícitamente — es una observación directa del comportamiento de ambos endpoints.

### Patrón `@font-face` + `font-display` + `preload`

[MDN: `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) ·
[CSS Fonts 4 §font-display-desc](https://drafts.csswg.org/css-fonts-4/#font-display-desc)

La línea de tiempo tiene tres períodos: **block** (si la fuente no cargó, se renderiza una
fallback **invisible**), **swap** (se renderiza la fallback visible y se cambia si la
fuente llega) y **failure** (fallback normal permanente). Los valores:

- `auto` — la estrategia la define el UA.
- `block` — período de block **corto**, período de swap **infinito**.
- `swap` — período de block **extremadamente pequeño**, período de swap **infinito**.
- `fallback` — block extremadamente pequeño, swap **corto**.
- `optional` — block extremadamente pequeño, **sin** período de swap.

`swap` es la elección correcta para un catálogo: el texto es visible desde el primer frame
(evita FOIT y penalizaciones de LCP) al costo de un reflow tipográfico.
**Soporte**: Baseline widely available desde 2020-01-15 (Chrome 60, Safari 11.1,
Firefox 58) ([WebDX](https://api.webstatus.dev/v1/features?q=font-display)).

Sobre el `preload`, [MDN: `rel=preload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)
es explícito en el punto que más se equivoca la gente:

> "When preloading resources that are fetched with CORS enabled (e.g. `fetch()`,
> `XMLHttpRequest` or fonts), special care needs to be taken to setting the `crossorigin`
> attribute on your `<link>` element. The attribute needs to be set to match the
> resource's CORS and credentials mode, **even when the fetch is not cross-origin**."
> … "Because of various reasons, these have to be fetched using anonymous-mode CORS (see
> [Font fetching requirements](https://drafts.csswg.org/css-fonts/#font-fetching-requirements))."

Sin `crossorigin`, el preload de una fuente **se descarga dos veces**: una por el preload
y otra por el `@font-face`, porque son requests con modos CORS distintos.

Implementación completa:

```html
<!-- en <head>, ANTES del <link rel=stylesheet> -->
<link rel="preload" href="/assets/fonts/inter-latin-400.woff2"
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/playfair-latin-700.woff2"
      as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/assets/fonts/inter-latin-400.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6,
                 U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F,
                 U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

Precargar **solo** los pesos que aparecen above the fold. El `index.html` actual pide
Playfair 400/500/600/700 e Inter 400/500/600 — siete archivos. Reducirlo a lo que
realmente se usa; con self-hosting cada peso extra es un archivo que hay que servir.

### Nota específica de Vercel

No hay guía de Vercel específica sobre self-hosting de fuentes para sitios estáticos sin
framework en `vercel.com/docs` (la guía de fuentes que existe es de `next/font`, propia de
Next.js). Lo único aplicable es lo de §8: las fuentes self-hosted en `/assets/fonts/`
quedan cubiertas por el header de `Cache-Control` de `/assets/(.*)`. Los docs de Vercel
recomiendan `max-age=31536000, immutable` para "Immutable static assets (hashed JS, CSS,
**fonts**)" — y como los `.woff2` de una familia versionada **sí** son inmutables en la
práctica (nunca cambia el contenido de `inter-latin-400.woff2`), acá sí se justifica
darles su propia regla con un año e `immutable`.

### Recomendación para este sitio

Self-hostear. Descargar los `.woff2` de los bloques `latin` y `latin-ext` que devuelve la
API `css2` para Inter 400/600 y Playfair Display 700 (auditar primero qué pesos usa
`styles.css` de verdad), guardarlos en `assets/fonts/` junto a los dos `OFL.txt`,
declararlos con `@font-face` + `font-display: swap` + `unicode-range`, precargar solo esos
tres archivos con `as="font" type="font/woff2" crossorigin`, borrar las tres líneas de
`fonts.googleapis.com` / `fonts.gstatic.com` de `index.html`, y darles en `vercel.json` una
regla `"source": "/assets/fonts/(.*)"` con
`Cache-Control: public, max-age=31536000, immutable`.

---

## Apéndice: tabla consolidada de pisos de soporte

Todas las versiones son de [MDN browser-compat-data](https://github.com/mdn/browser-compat-data)
y de la [API de Baseline de WebDX](https://api.webstatus.dev/v1/features), consultadas el
2026-08-11.

| Feature | Chrome | Safari / iOS | Firefox | Baseline | ¿Shipear? |
|---|---|---|---|---|---|
| `<dialog>` + `showModal()` | 37 | 15.4 | 98 | widely (2022-03-14) | Sí |
| `::backdrop` | — | 15.4 | 98 | widely | Sí |
| `inert` | 102 | 15.5 | 112 | widely (2023-04-11) | Sí (gratis vía `showModal`) |
| `transition-behavior: allow-discrete` | 117 | 17.4 | 129 | newly (2024-08-06) | Sí (entrada) |
| `@starting-style` | 117 | 17.5 | 129 | newly (2024-08-06) | Sí (entrada) |
| propiedad CSS `overlay` | 117 | ✗ | ✗ | limited | **No** |
| `dialog[closedby]` | 134 | ✗ (preview) | 141 | limited | **No** |
| `document.startViewTransition` | 111 | 18 | 144 | newly (2025-10-14) | Sí, con guarda |
| `img.decode()` | 64 | 11.1 | 68 | — | Sí |
| `<link rel=preload>` | 50 | 11.1 | 85 | widely (2021-01-26) | Sí |
| `fetchpriority` | 103 | 17.2 | 132 | newly (2024-10-29) | Sí, con `in` check |
| `prefers-reduced-motion` | 74 | 10.1 / 10.3 | 63 | widely (2020-01-15) | Sí |
| `:focus-visible` | 86 | 15.4 | 85 | widely (2022-03-14) | Sí, sin fallback |
| Pointer Events | 55 | 13 | 59 | widely (2020-07-28) | Sí |
| `getCoalescedEvents()` | 58 | 18.2 | 59 | limited | No (innecesario) |
| `hover` / `pointer` MQ | 41 | 9 | 64 | widely (2018-12-11) | Sí |
| `image-rendering` | 41 | 10 | 93 | widely (2021-10-05) | Usar `auto` |
| `crisp-edges` sin prefijo | 148 | 7 | 65 | newly (2026-05-07) | No |
| WebP | 32 | 14 | 65 | widely (2023-03-16) | Sí, sin fallback |
| `<picture>` | 38 | 9.1 | 38 | widely (2016-03-21) | Innecesario |
| `font-display` | 60 | 11.1 | 58 | widely (2020-01-15) | Sí |
| `popover` | 116 | 17 | 125 | newly (2025-01-27) | No (usar `<dialog>`) |
