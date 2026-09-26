# Fase 12 — Admin mobile y orden del catálogo con arrastre

## Definición

Pedido del usuario (2026-09-25): el admin tiene que ser cómodo en el teléfono, y el integrante tiene
que entender cómo se ve el catálogo público al ordenar, cosa que el número de posición de F8-D2 no le
muestra. No cambia el backend: el orden se sigue guardando con `PUT /admin/productos/orden` (F8-D3).

Decisiones cerradas en la preparación (2026-09-25). F12-D1 y el número de F12-D6 los eligió el
usuario; el resto son técnicas y no cambian el contrato. Sin términos nuevos en `CONTEXT.md`:
"hilera" es presentación del front y "orden sin guardar", estado de la página (F8). La "home" del
pedido es el **catálogo público** del glosario, y así la nombran la UI y estas decisiones. Fuentes:

- `@dnd-kit/react` y `@dnd-kit/dom` 0.5.0 (npm, 2026-09-12; `react` `^18 || ^19` como peer): la
  [doc de sortable](https://dndkit.com/react/hooks/use-sortable), la
  [del plugin de accesibilidad](https://dndkit.com/extend/plugins/accessibility) y la
  [del PointerSensor](https://dndkit.com/extend/sensors/pointer-sensor); en `@dnd-kit/dom/index.js`,
  los defaults del `PointerSensor`, del `KeyboardSensor` y del plugin `Accessibility`.
- Un prototipo descartable fuera del repo (Vite, React 19.3.0, 18 productos con borradores y uno con
  diseños), probado en Chrome con la extensión (F12-D5).
- El checklist de la skill `mobile-native` (`.claude/skills/mobile-native/SKILL.md`).
- El [patrón Tabs de la APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), las
  [unidades `cqi` de CSS Containment 3](https://www.w3.org/TR/css-contain-3/#container-lengths) y el
  [criterio 2.5.8 de WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- En el repo: `hileras()` en `src/catalogo/presentacion.ts`, `.grid` y el `@media (max-width: 560px)`
  de `catalogo.css`, `Productos.tsx`, `orden.ts` y `admin.css`. En el contrato, §Orden y la galería
  pública ("solo las imágenes procesadas").

**F12-D1. Hileras del catálogo público: un producto con diseños cierra la hilera en su posición.**
Cambia `hileras()`. Los productos van de a cuatro en el orden global; un producto con diseños cierra
la hilera que se está llenando (si tiene alguno) y ocupa la suya: `[A, B, D*, C, E, F]` da
`[A, B] · [D] · [C, E, F]`. Hoy da `[A, B, C, E] · [D] · [F]`. Reemplaza la regla del registro de la
fase 3 (hileras fijas del sitio viejo). Motivo, elegido por el usuario:

- Con la regla vieja, la posición de D en el teléfono no sale del orden global: arrastrarlo o moverlo
  con "Antes" y "Después" en la vista mobile no tiene una traducción limpia al orden guardado, y D
  nunca podía ir antes de la primera hilera.
- Con la nueva, las hileras son cortes del orden global. La vista del admin las muestra tal cual, y
  cada movimiento es un movimiento del orden global.
- En producción ningún producto publicado tiene diseños (`GET /api/productos`, 2026-09-25): el
  catálogo público no cambia hoy. Con cuatro productos antes de D, las hileras quedan completas.

**F12-D2. Reglas compartidas de hileras.** `hileras()` pasa a recibir, además de los productos, dos
funciones: si el producto tiene diseños y si se ve. Un producto que no se ve (borrador) queda en la
hilera que se está llenando sin contar para las cuatro, y nunca cierra una. Un producto con diseños
cierra la hilera solo si ya tiene alguno que se ve; si no, los borradores de adelante quedan con él.
El catálogo público pasa "tiene un diseño" y todos se ven; el admin pasa "tiene un diseño con etapa
`procesada`" (la galería pública trae solo procesadas) y "está publicado". Motivo: una sola regla;
sacando los borradores, el admin da las mismas hileras que el catálogo público, y así lo prueba el
test.

**F12-D3. Base mobile en `Admin.astro` y `admin.css`, según la skill `mobile-native`.** Corte en
`max-width: 560px`, el mismo del catálogo público: la vista del orden tiene que cambiar de grilla a
hileras en el mismo ancho, y un solo corte mantiene coherente todo el admin.

- Viewport `width=device-width, initial-scale=1, viewport-fit=cover`, sin `user-scalable` ni
  `maximum-scale`. Sin `interactive-widget=resizes-content`: con la barra fija abajo (F12-D4), subiría
  con el teclado y taparía el campo.
- Un `theme-color` `#4a331e` (el arriba de `.panel__bar`). Uno solo: el admin no tiene modo oscuro.
- `html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; }`. Sin
  `overscroll-behavior: none`: el admin es un documento, y recargar con cambios en el orden ya avisa
  por `beforeunload` (F8-D5).
- Todo `:hover` de `admin.css` va dentro de `@media (hover: hover) and (pointer: fine)`, y `.btn`,
  `.btn--icono`, las pestañas y los enlaces de la barra suman feedback en `:active`.
- `input`, `select` y `textarea` a 16px en `@media (pointer: coarse)`: iOS hace zoom con menos, y en
  desktop el formulario queda como está.
- `touch-action: manipulation` en `a`, `button` y `[role="tab"]`; `user-select: none` en botones,
  pestañas y la manija, con `-webkit-touch-callout: none` en la manija.
- El único `vh` (`.ingreso`, `clamp(24px, 8vh, 80px)`) pasa a `svh`: es una primera pantalla, y `svh`
  no se mueve cuando la barra del navegador se esconde. No hay otras alturas de viewport.
- Safe areas: `env(safe-area-inset-*, 0px)` en la cabecera (arriba y costados), en la barra de abajo
  (abajo y costados), en el toast y en el `padding-bottom` de `.panel__contenido`, que deja lugar a la
  barra.

**F12-D4. Navegación.** Las secciones son Productos · Categorías · Medidas · Integrantes. "Medidas"
es la etiqueta de la barra; la página sigue titulándose "Tipos de medida". Integrantes sigue oculto
salvo `data-rol="owner"` (F9-D1).

- Desktop: como hoy, arriba.
- Mobile: la misma `<nav aria-label="Secciones">` pasa a una barra fija abajo, con ícono arriba y
  etiqueta abajo, cada pestaña de 44px de alto o más y repartidas en partes iguales (3 para el
  editor, 4 para el owner). `aria-current="page"` marca la actual, con el color de `--dorado`.
- La cabecera queda fina arriba, con la marca, el nombre del integrante y "Cerrar sesión".
- Los íconos son SVG en línea en `Admin.astro`, con `aria-hidden` y el trazo de `iconos.tsx`: la barra
  es Astro y `iconos.tsx` es React.
- Sin barra en las páginas sin sesión (`protegida={false}`), como hoy.

**F12-D5. Librería de arrastre: `@dnd-kit/react` y `@dnd-kit/dom` 0.5.0, versión exacta.** El
prototipo pasó, así que no hace falta el plan B (`@dnd-kit/core` + `@dnd-kit/sortable`). `@dnd-kit/dom`
va como dependencia directa: de ahí se importan `PointerSensor`, `KeyboardSensor` y `Accessibility`,
y pnpm no deja importar dependencias transitivas. Lo que mostró el prototipo:

- **Mouse:** con `useSortable({ id, index, handle })`, arrastrar la manija reordena la grilla mientras
  se arrastra y `onDragEnd` da `source.initialIndex` y `source.index` (`isSortable`). React vuelve a
  dibujar la lista en el orden nuevo sin errores en consola, aun con separadores entre las tarjetas.
- **Touch:** con `PointerEvent` de `pointerType: 'touch'` sintéticos (neutralizando
  `setPointerCapture`, que rechaza un `pointerId` inventado) la tarjeta se mueve y se suelta en su
  lugar. El toque real, con el dedo, queda para el teléfono (Cerrar cuando).
- **Teclado:** con el foco en la manija, Espacio o Enter la toma, las flechas la mueven en las dos
  direcciones de la grilla, Espacio, Enter o Tab la sueltan y Escape cancela. La página se desplaza
  sola para seguirla, y al soltar el foco queda en la manija.
- **Scroll automático:** lo hace el plugin `AutoScroller`, incluido por defecto.
- **Anuncios:** `Accessibility.configure({ announcements, screenReaderInstructions })` los pasa al
  español. El plugin crea su región `aria-live` y agrega `aria-roledescription`, `aria-describedby`
  y `tabindex` solo si la manija no los tiene, así que los propios ganan. También le pone
  `aria-pressed`, que no se puede quitar.
- **Límites vistos:** en `dragover`, `source.index` todavía es el índice anterior (el prototipo
  anunció "posición 1" con la tarjeta ya en la 3), así que el anuncio usa el índice del `target`. Mientras se
  arrastra, los números de las tarjetas y los separadores no se mueven; se recalculan al soltar.
- **Touch por defecto:** el `PointerSensor` espera 250 ms con 5 px de tolerancia, aun sobre la
  manija. Se deja así: un pulgar que roza la manija al desplazar la página no arrastra. La manija
  lleva `touch-action: none`, para que el navegador no desplace mientras la sostienen.

**F12-D6. `/admin/productos` con dos pestañas en la misma isla: "Lista" y "Orden del catálogo".**
Patrón Tabs de la APG, con activación automática (el panel ya está en memoria): `role="tablist"`,
flechas izquierda y derecha, Inicio y Fin, y `tabindex` rotativo. La pestaña va en la URL:
`?vista=orden` para "Orden del catálogo" y sin parámetro para "Lista", con `history.replaceState`.
Una recarga vuelve a la misma pestaña, y cambiar de pestaña no agrega pasos al historial. Un valor
desconocido abre la "Lista".

- **Lista:** "Nuevo producto", "Editar", "Borrar" y el estado, en el orden **guardado**
  (`orden.cargado`), sin número, en un `<ol>`. Pierde "Subir", "Bajar" y "Guardar orden". Sin número
  porque el número de la vista del orden es la posición en el catálogo público (abajo), y un número
  distinto acá confundiría. En el orden guardado porque la Lista no muestra cambios sin guardar.
- **Pestaña con cambios:** mientras hay orden sin guardar, "Orden del catálogo" suma un punto
  (`aria-hidden`) y un "(sin guardar)" visualmente oculto en su nombre.
- **Orden del catálogo:** arriba, el texto explicativo; después, "Hay cambios en el orden sin
  guardar." y "Guardar orden" (F8-D1, F8-D3 y F8-D4 sin cambios). Abajo, la grilla. El conflicto
  `409`, el rebase ante recargas y el aviso al salir (F8-D4, F8-D5) siguen igual, porque el estado
  (`Orden`) sigue en la isla. Soltar una tarjeta no guarda.
- **Texto explicativo** (la redacción final es de la implementación): el catálogo público muestra
  los productos en este orden, de izquierda a derecha y de arriba abajo; en el teléfono se ven por
  hileras que se deslizan de costado, de hasta cuatro, y un producto con diseños va solo en la suya;
  los borradores no se ven hasta publicarlos; los cambios se ven al guardar, en hasta un minuto.
- **Número de cada tarjeta, elegido por el usuario:** la posición en el catálogo público. Los
  publicados se numeran 1, 2, 3… en el orden sin guardar; los borradores muestran "Borrador · no se
  ve", atenuados y arrastrables, sin número.

**F12-D7. La grilla del orden.**

- **Desktop (más de 560px):** la regla de `.grid` de `catalogo.css` (`repeat(auto-fill,
  minmax(min(290px, 100%), 1fr))` y `gap: clamp(20px, 4vw, 32px)`), con el mismo ancho que la grilla
  del catálogo público: `min(1140px, 100cqi - 40px)`, centrada, con `container-type: inline-size` en
  el `body` del admin. Motivo: las columnas dependen del ancho del contenedor, y el padding de
  `.panel__contenido` (`clamp(16px, 4vw, 40px)`) no es el del catálogo (`20px`, `max-width: 1180px`).
  A 1000px daría 2 columnas en el admin y 3 en el catálogo. `cqi` mide el contenido del `body`, igual
  que el catálogo, así que la barra de desplazamiento se descuenta igual en los dos.
- **Mobile:** 2 columnas con desplazamiento vertical y, antes de cada hilera (F12-D2), un separador
  "Hilera N" a todo el ancho (`grid-column: 1 / -1`). Un grupo con solo borradores no es una hilera
  del catálogo: su separador dice "No se ven".
- **Estructura:** una sola lista ordenable (`<ol>`), con los separadores como `<li aria-hidden="true">`
  entre las tarjetas y ocultos en desktop. El prototipo mostró que el reordenamiento de dnd-kit y el
  render de React conviven con esos separadores. El índice de cada `useSortable` cuenta solo
  tarjetas, así que coincide con la posición en el orden global.
- **Tarjeta:** la imagen principal (`url160` y `url640` en `srcset`, cuadrada y `loading="lazy"`;
  sin imagen válida, `IconoFoto` como F7-D10), el nombre, el número o "Borrador · no se ve" (F12-D6),
  la manija (un `<button>` con `aria-label` "Mover «X»" y un ícono de agarre) y "Antes" y "Después".
  Sin precio ni categoría.
- **Mientras se guarda** (F8-D3), las tarjetas quedan con `disabled` en `useSortable` y los botones,
  deshabilitados.

**F12-D8. Movimientos y anuncios.** Arrastrar, "Antes" y "Después" mueven en el orden global, y por
F12-D1 lo que se ve en mobile es ese orden cortado en hileras.

- "Antes" y "Después" mueven un lugar con `mover()` de `galeria.ts`, deshabilitados en las puntas.
  El foco vuelve al mismo botón de la tarjeta movida, o al otro si quedó deshabilitado (como F8-D2).
- Soltar una tarjeta hace `mover(sinGuardar, initialIndex, index - initialIndex)`; con el índice
  igual, o cancelado, no cambia nada.
- Una sola región `role="status"` visualmente oculta, la de F8-D2, anuncia el resultado de "Antes" y
  "Después"; los anuncios del arrastre van por la región del plugin. Textos: "«X», posición N de P en
  el catálogo." para un publicado; "«X», borrador: no se ve en el catálogo." para un borrador; al
  soltar, el mismo texto con la posición final; al cancelar, "Se canceló. «X» volvió a su lugar.". Las
  instrucciones del lector (`screenReaderInstructions`) explican Espacio, flechas y Escape.

**F12-D9. Listas como tarjetas en mobile, solo con CSS.** Debajo de 560px, `.lista` deja de ser una
caja con filas y pasa a tarjetas apiladas (`gap`, borde y radio por `.lista__fila`). Las acciones van
en su propia línea, a todo el ancho, y cada botón o enlace de `.lista__acciones` (`.btn--chico`,
`.btn--icono`) mide 44px de alto o más. Aplica a Productos (la "Lista"), Categorías, Tipos de medida e
Integrantes, y la fila de edición en línea (`.lista__fila--edicion`) sigue a todo el ancho. Motivo:
las cuatro islas ya usan las clases de F5-D2. 44px supera el mínimo de WCAG 2.5.8 (24px) y es el
tamaño de toque de las guías de iOS; con 24px, "Editar" y "Borrar" juntos se tocan por error.

**F12-D10. Código y tests.**

- `src/catalogo/presentacion.ts`: `hileras()` con la regla de F12-D1 y los parámetros de F12-D2.
  Tests nuevos en `presentacion.test.ts`: el producto con diseños corta la hilera, al principio y al
  final; hileras de cuatro; borradores que no cuentan, adelante de un producto con diseños y solos al
  final; y la propiedad de F12-D2 (sin los borradores, las hileras del admin son las del catálogo
  público).
- `src/admin/orden.ts`: la numeración de F12-D6 (posición en el catálogo o `null` para un borrador),
  con tests. `rebasar` y `hayCambios` siguen.
- `Productos.tsx` suma las pestañas; la grilla del orden puede ir en un componente propio en otro
  archivo, siempre dentro de la misma isla. Si su nombre coincide con un módulo salvo mayúsculas,
  se importa con extensión (AGENTS.md).
- `@dnd-kit/react` y `@dnd-kit/dom` 0.5.0 exactas; al agregarlas, la prueba con pnpm 10 de AGENTS.md.

**Construir:** F12-D1 y F12-D2 en `presentacion.ts`; la base mobile (F12-D3) y la navegación (F12-D4)
en `Admin.astro` y `admin.css`; las pestañas y la vista "Orden del catálogo" (F12-D5 a F12-D8); las
listas como tarjetas (F12-D9); los tests de F12-D10.

**Cerrar cuando:**

- En `pnpm test`, los tests de hileras y de numeración pasan; typecheck, lint y build también.
- En un teléfono real, el integrante navega con las pestañas de abajo, el contenido respeta las safe
  areas, los inputs no hacen zoom y las acciones de las listas se tocan sin errores.
- En "Orden del catálogo", arrastra con el dedo, con el mouse y con el teclado; "Antes" y "Después"
  mueven la tarjeta; los separadores coinciden con el carrusel del catálogo público en el teléfono; y a
  un mismo ancho de desktop, la grilla tiene las mismas columnas que el catálogo.
- "Guardar orden" guarda y maneja el `409` como en la fase 8, y una recarga con `?vista=orden` vuelve
  a esa pestaña.
- Con lector de pantalla, la manija se anuncia con su nombre y las instrucciones, y mover con teclado
  anuncia la posición en español.

## Implementado

- `src/catalogo/presentacion.ts` (F12-D1, F12-D2): `hileras(productos, conDisenos, seVe?)`, genérica,
  y `tieneDisenos` para el catálogo público; `index.astro` la llama con `tieneDisenos`. Tests en
  `presentacion.test.ts`.
- `src/admin/orden.ts`: `estaPublicado` y `tieneDisenoProcesado` (los predicados del admin de F12-D2),
  `posiciones()` (la numeración de F12-D6, con test en `orden.test.ts`) y `textoPosicion()` (los textos
  de F12-D8).
- `Admin.astro` (F12-D3, F12-D4): viewport con `viewport-fit=cover`, `theme-color`, la barra con un SVG
  por sección ("Medidas" en la barra) y `main` con un `div.panel__marco` adentro.
- `admin.css`: base mobile, `:hover` dentro de `(hover: hover) and (pointer: fine)` con su `:active`,
  inputs a 16px con `(pointer: coarse)`, safe areas, `svh` en `.acceso`, pestañas (`.pestanas*`), la
  grilla del orden (`.orden__*`) y el bloque `@media (max-width: 560px)` con la barra de abajo, las
  listas como tarjetas y la grilla de 2 columnas con separadores.
- `Productos.tsx` (F12-D6): pestañas "Lista" (orden guardado, sin mover) y "Orden del catálogo", con
  `?vista=orden`. El estado `Orden`, el guardado con `409` y el aviso al salir siguen en la isla.
- `OrdenCatalogo.tsx` (F12-D5, F12-D7, F12-D8): la grilla con `DragDropProvider` y `useSortable`, la
  manija, "Antes" y "Después", y los anuncios del plugin `Accessibility`. `IconoAgarre` en `iconos.tsx`.
- `@dnd-kit/react` y `@dnd-kit/dom` 0.5.0 exactas en `dependencies`.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `container-type: inline-size` en `main.panel__contenido`, sin padding a los costados; el padding pasa a `.panel__marco` | En el `body` (F12-D7) cortaba la propagación de su fondo al lienzo: en una página más corta que la ventana, el fondo quedaba sin pintar abajo. `main` ocupa el ancho del `body`, así que `100cqi` mide lo mismo. |
| La grilla del orden sale del ancho de `.seccion` (640px) con `width: min(1140px, 100cqi - 40px)` y márgenes negativos | El encabezado, las pestañas y la Lista quedan en 640px como las otras secciones; solo la grilla tiene el ancho del catálogo. |
| El `Accessibility` configurado se suma a los plugins por defecto (`plugins={(d) => [...d, accesibilidad]}`) | El registro de dnd-kit deduplica por plugin y se queda con las últimas opciones, sin sacar `AutoScroller`, `Cursor`, `Feedback` ni `PreventSelection`. |
| Los anuncios leen los productos por una ref | El plugin toma las funciones al crearse y no las renueva en cada render. |
| Anuncio al tomar: "Tomaste «X», posición N de P en el catálogo." | F12-D8 no fijó el texto de `dragstart`; es el mismo de la posición con el verbo delante. |
| `aria-roledescription="arrastrable"` en la manija | Si falta, el plugin pone "draggable", en inglés. |
| Instrucciones: "Para tomar el producto, apretá Espacio o Enter. Con las flechas lo llevás a otro lugar; Espacio o Enter lo sueltan y Escape cancela." | Las teclas por defecto del `KeyboardSensor` (Tab también suelta). |
| "Antes" y "Después" con el nombre del producto en un `span` visualmente oculto | El nombre accesible empieza con la etiqueta visible (WCAG 2.5.3) y distingue cada tarjeta. |
| En la barra de abajo, las pestañas no actuales van en `--arena` al 62% y la actual en `--dorado` con una marca de 2px arriba | Con `--arena` pleno, la actual en dorado se veía más apagada que las demás. |
| En mobile, `.lista__nombre` crece (`flex: 1`) y la fila alinea al inicio | Con `space-between`, un nombre que ocupaba dos líneas quedaba contra el borde derecho. |
| `.btn` y `.btn--icono` se achican a 0,97 en `:active` | Feedback al apoyar el dedo (skill `mobile-native`), con 100 ms. |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; los 16 hints ya existentes), `pnpm test` (94, con los de
  hileras y `posiciones`) y `pnpm build` pasan. En una copia, `npx pnpm@10 install --frozen-lockfile` y
  `npx pnpm@10 build` también.
- UI local (extensión de Chrome, sesión del editor de prueba, backend local) con 11 productos de prueba
  cargados por SQL en la base local (borradores, uno publicado con diseños y uno en borrador con
  diseños), reusando las claves de derivados de la imagen existente; se borraron por SQL al terminar
  para no tocar R2:
  - a 1300, 1000, 800 y 600px, la grilla del orden y la `.grid` del catálogo público, en iframes del
    mismo ancho, dan las mismas columnas y el mismo ancho;
  - a 390px, los separadores dan "Hilera 1: Cazuelas, A, B, C · Hilera 2: borrador x, D · Hilera 3: E,
    F, G, H · No se ven: y, z", y los carruseles del catálogo, "[Cazuelas, A, B, C] · [D] · [E, F, G,
    H]";
  - arrastre con `PointerEvent` sintéticos: el mouse mueve A a la posición 3 y anuncia "«Prueba F12 A»,
    posición 3 de 9 en el catálogo."; el touch sin sostener no arrastra y sosteniendo sí;
  - teclado real: Espacio toma ("Tomaste «Prueba F12 B», posición 2 de 9…", `aria-pressed="true"`),
    flecha abajo baja una fila y anuncia la posición 4, Escape anuncia "Se canceló. «Prueba F12 B»
    volvió a su lugar." y la devuelve, Espacio suelta, y el foco queda en la manija;
  - "Antes" y "Después" mueven y anuncian por la región de estado (el borrador: "…borrador: no se ve en
    el catálogo."); en la primera tarjeta el foco pasa a "Después";
  - "Guardar orden" guarda y la Lista muestra el orden nuevo; con la versión subida por SQL, el `409`
    muestra el aviso de F8-D4 y conserva el orden del usuario;
  - las pestañas: flechas, Inicio y Fin cambian de pestaña y de URL sin sumar pasos al historial;
    `?vista=orden` recarga en esa pestaña y `?vista=cualquiera`, en la Lista; con cambios, la pestaña se
    llama "Orden del catálogo (sin guardar)" y muestra el punto;
  - a 390px: la barra de abajo con las 3 pestañas del editor, las listas de Productos y Tipos de medida
    como tarjetas con acciones de 44px, la manija y "Antes"/"Después" de 44px, y el formulario de
    producto sin desborde horizontal.

## Desvíos

- `container-type` va en `main` y no en el `body` (F12-D7), por el fondo; el ancho medido es el mismo.
- El dispositivo real, el lector de pantalla y la barra de Integrantes del owner quedan para el usuario;
  la prueba local usó la sesión del editor.

## Verificaciones del usuario

Tras el push a `main` y el deploy, en `https://admin.elcauquenartesanias.com.ar`:

1. **Teléfono real** (iPhone con notch si hay uno a mano): en Productos, Categorías y Tipos de medida,
   la barra de abajo cambia de sección, no tapa el contenido al final de la página ni queda bajo el
   indicador de inicio, y la cabecera no queda bajo el notch. Tocar un campo (el nombre de una
   categoría nueva) no acerca la página. "Editar" y "Borrar" de cada tarjeta se tocan sin errores, y
   un botón no queda marcado después de tocarlo.
2. **Owner en el teléfono:** la barra muestra 4 pestañas, con Integrantes.
3. **Orden con el dedo:** en Productos → "Orden del catálogo", mantener apretada la manija (⠿) de una
   tarjeta y arrastrarla a otro lugar; la tarjeta se mueve y la página se desplaza sola cerca del borde.
   Desplazar la página tocando la foto no arrastra. "Antes" y "Después" mueven la tarjeta. Con los
   separadores "Hilera N" a la vista, abrir el catálogo público en el mismo teléfono: cada carrusel
   tiene los productos de su hilera. No guardar, o volver al orden original antes de guardar.
4. **Orden con el mouse en desktop:** arrastrar una tarjeta por la manija; se reordena mientras se
   arrastra y al soltar queda "Hay cambios en el orden sin guardar.". Recargar y aceptar el diálogo
   del navegador para descartar.
5. **Lector de pantalla** (NVDA o VoiceOver): con el foco en una manija se anuncia "Mover «X»" y las
   instrucciones; Espacio, una flecha y Espacio anuncian la posición en español.
