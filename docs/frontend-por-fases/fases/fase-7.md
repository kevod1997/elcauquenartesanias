# Fase 7 — Galería e imágenes

## Definición

Decisiones cerradas en la preparación (2026-09-25). F7-D9 la eligió el usuario; las demás son
técnicas y no cambian el contrato. Reusan el patrón del admin (F5-D2 a F5-D6) y registran solo sus
desvíos. Fuentes: §Imagen de galería, §Ingesta, §Galería, §Publicación y §Publicación en 1 clic de
`contrato-api-borrador.md`; las rutas `/admin/productos/{id}/imagenes*`, `publicar`,
`volver-a-borrador` y el componente `ImagenGaleria` de `openapi.json`; §4 de
`Logica Negocio El Cauquen.md` y la guía de R2 del `README.md` del backend; el prototipo
(`admin/admin.js`: `renderGaleria`, `moverFoto`, `marcarPrincipal`, `toggleDiseno`, `quitarFoto`).

**CORS de R2, comprobado en la preparación:** con un `upload-url` del backend local, que firma contra
el bucket de producción, el preflight `OPTIONS` (`Access-Control-Request-Method: PUT`,
`Access-Control-Request-Headers: content-type`) respondió `204` con `Access-Control-Allow-Origin`
igual al origen, tanto para `http://localhost:4321` como para `https://admin.elcauquenartesanias.com.ar`.
El `PUT` desde el navegador se puede probar en local y en `admin.*`.

**F7-D1. La galería va en `/admin/productos/editar`, debajo del formulario y fuera del `<form>`.**
Es una sección "Galería (k/6)" que solo existe con un producto cargado (`?id=`). En el alta muestra
"Creá el producto para agregar imágenes." Cada acción (subir, ordenar, diseño, quitar) llama a la
API en el momento, sin botón de guardar. "Publicar" y "Volver a borrador" van en la cabecera, junto al
estado (F7-D9). Motivo:

- `upload-url` y las rutas de galería son por producto y persisten cada cambio; el borrador local del
  prototipo (`borrador.galeria` + "Guardar") no tiene equivalente en la API.
- Fuera del `<form>`, Enter en el nombre de un diseño no envía el producto (el HTML Standard no
  permite formularios anidados, como en F6-D6).
- La galería del estado vive en `producto.galeria` de `EditarProducto`: la respuesta del `PATCH` del
  producto la trae actualizada. "Recargar el producto" es `GET /admin/productos` y buscar el id (no
  hay `GET /admin/productos/{id}`); si ya no está, se muestra lo mismo que en F6-D1.

**F7-D2. Preprocesamiento en el navegador: lado mayor hasta 2560 px, JPEG con calidad 0,85 y siempre
recodificado.** El `<input type="file" multiple>` lleva
`accept="image/jpeg,image/png,image/webp"`. Cada archivo se decodifica con `createImageBitmap(file)`,
se escala sin agrandarlo para que su lado mayor quede en 2560 px como máximo, se dibuja en un
`<canvas>` pintado de blanco y se exporta con `toBlob('image/jpeg', 0.85)`. Después se libera el
bitmap con `close()`. El `contentType` que se manda es el `type` del blob. Errores, antes de pedir
`upload-url` (no ocupan cupo):

- si no se puede decodificar: "No se pudo leer «archivo». Elegí una imagen JPG, PNG o WebP.";
- si pasa de 10 485 760 bytes, el máximo de `tamanoBytes`: "«archivo» es demasiado grande.".

Motivo:

- El contrato pide el archivo "ya preprocesado (máx. 2560 px, JPEG)", y §4 de la lógica de negocio
  lo exige para las fotos de celular (HEIC, archivos gigantes).
- `createImageBitmap` aplica la orientación EXIF por defecto (`imageOrientation: "from-image"`,
  [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap)). Recodificar
  siempre descarta el EXIF, incluido el GPS, y los originales quedan en un bucket público (con una
  clave que no se puede adivinar; `README.md` del backend, §Cloudflare R2).
- El HTML Standard compone sobre negro opaco los formatos sin alfa, como JPEG
  ([serializar bitmaps](https://html.spec.whatwg.org/multipage/canvas.html#serialising-bitmaps-to-a-file)).
  El fondo blanco evita que un PNG transparente salga negro.
- Si el navegador no soporta el tipo pedido, `toBlob` exporta PNG
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)). Mandar el
  `type` del blob sigue siendo válido: la API acepta `image/png`.
- HEIC: en iOS, todos los navegadores convierten a JPEG al elegir el archivo, sea cual sea el
  `accept`. Safari de macOS convierte al primer tipo del `accept` si `image/heic` no está
  ([zenn.dev, Safari 17.6](https://zenn.dev/kou_pg_0131/articles/safari-input-file-heic), fuente
  secundaria; se comprueba en las verificaciones del usuario). Chrome de escritorio no decodifica
  HEIC: cae en el error de lectura.
- La calidad 0,85 es una elección de esta fase: con 2560 px deja el archivo muy por debajo de 10 MiB.

**F7-D3. Subida en secuencia, con `XMLHttpRequest` y progreso.** "Agregar imágenes" abre el selector.
Con 6 imágenes queda deshabilitado y la ayuda dice "La galería está completa (6 de 6).". Si se eligen
más archivos que el cupo libre, se suben los primeros y el toast avisa "Entraban N imágenes más: se
agregaron las primeras N.". Cada archivo pasa, uno por vez y en el orden elegido, por: preparar
(F7-D2) → `upload-url` → `PUT` → `confirmar` → consulta de etapa (F7-D4).

- Tras `upload-url`, la imagen se agrega a la galería local en la posición que fija el contrato: al
  final, o en la posición 0 si todas las anteriores son diseños. Tras `confirmar`, se reemplaza por la
  `imagen` de la respuesta.
- El `PUT` va a `uploadUrl` solo con el header `Content-Type` igual al pedido, sin credenciales. Se
  hace con `XMLHttpRequest`, que expone `upload.onprogress`
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequestUpload/progress_event)).
  `fetch` no expone el progreso de subida.
- Si falla el `PUT` (red o CORS, o un status que no es 2xx) o `confirmar` da `409`
  `SUBIDA_INCOMPLETA`, la tarjeta muestra "No se pudo subir." con "Reintentar" y "Quitar", y la
  secuencia sigue con el archivo siguiente. "Reintentar" vuelve a hacer el `PUT` con el mismo blob
  si `expiraEn` no pasó. Si pasó, quita la imagen y empieza de nuevo desde `upload-url`.
- `upload-url` con `422` `GALERIA_COMPLETA` (otro integrante llenó el cupo): se cortan los archivos
  que faltan, se recarga el producto y el aviso de la galería muestra el `mensaje`. El resto de los
  errores (`503` y los demás) también cortan la secuencia y van a ese aviso.
- Una imagen en `pendiente_subida` sin blob en esta página (otra pestaña, o una recarga a mitad de
  la subida) muestra "Subida sin terminar: quitala y volvé a agregarla." y solo "Quitar". La API la
  borra sola a la hora (subida abandonada).
- El aviso de `beforeunload` de F6-D3 también se activa mientras una imagen se está preparando,
  subiendo o confirmando.

**F7-D4. Consulta de etapa.** Toda imagen en `pendiente_procesamiento` o `procesando`, sea de esta
subida o ya presente al cargar la página, se consulta con `GET /admin/productos/{id}/imagenes/{imagenId}`.
La consulta es cada 2 s y, cuando la misma imagen pasa 2 minutos sin terminar, cada 15 s. Las
imágenes se consultan de a una, sin pedidos simultáneos. La consulta se pausa con `document.hidden`,
se reanuda con `visibilitychange` y se detiene al desmontar. Al llegar a `procesada` o `fallida`, la
imagen se reemplaza en la galería. Un `404` `IMAGEN_NO_ENCONTRADA` recarga el producto. Motivo: el
contrato pide 1–2 s, y una falla transitoria de R2 se reintenta a 1, 2, 4 y 8 minutos con la imagen
en `pendiente_procesamiento`. A 2 s, ese caso sumaría cientos de pedidos.

**F7-D5. Tarjetas de la galería, con etapas animadas** (pedido del usuario). Es una grilla de
tarjetas como la `.galeria`/`.foto` del prototipo. Cada tarjeta es un `<li>` y lleva:

- La imagen. Si está procesada: `<img>` con `src` `url160`, `srcset` `url160 160w, url640 640w`,
  `sizes="160px"` y `alt` "Imagen N de la galería". Si no, y hay blob local: su
  `URL.createObjectURL`, revocado al procesarse o al desmontar. Sin blob: el ícono de foto del
  prototipo.
- La marca "Principal" en la posición 0 si no es un diseño; si es un diseño, "Diseño" y su nombre.
- La etapa, con texto y barra:

  | Situación | Texto | Barra |
  | --- | --- | --- |
  | Se está preparando (cliente) | "Preparando…" | indeterminada |
  | Se está subiendo (cliente) | "Subiendo… N %" | `<progress value max="100">` |
  | `pendiente_procesamiento` | "Pendiente de procesamiento" | indeterminada |
  | `procesando` | "Procesando…" | indeterminada |
  | `fallida` | el `error` de la API y "Reintentar" (`reintentar`) | ninguna |
  | `pendiente_subida` sin blob | ver F7-D3 | ninguna |

  La barra indeterminada es un `<progress>` sin `value`, animado con CSS `:indeterminate`. Cada
  `<progress>` lleva `aria-label` ("Subiendo imagen N"), porque el texto interno no es su etiqueta
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)). Con
  `prefers-reduced-motion: reduce` queda quieta.
- Una sola región `role="status"`, visualmente oculta, anuncia los finales: "Imagen N procesada." /
  "Imagen N fallida.". Con una región por tarjeta, el lector de pantalla leería cada cambio.

**F7-D6. Orden de la galería con botones, sin arrastrar.** Cada tarjeta lleva "Mover antes" y
"Mover después" (íconos con `aria-label` "Mover antes la imagen N"), deshabilitados en las puntas.
Si la imagen no es la principal ni un diseño, lleva además "Hacer principal", que la mueve a la
posición 0. Cada movimiento manda `PUT /admin/productos/{id}/imagenes/orden` con la lista completa, y
la `galeria` de la respuesta reemplaza la local. Antes de llamar, una función pura revisa el orden
nuevo. Si no vale, el toast explica y no se llama a la API:

- un diseño primero habiendo imágenes que no lo son: "La imagen principal no puede ser un diseño.";
- en un publicado, una primera que no es una imagen válida: "En un producto publicado, la principal
  tiene que ser una imagen procesada que no sea un diseño.".

Errores: `ORDEN_GALERIA_INVALIDO` recarga el producto y avisa "La galería cambió mientras la
ordenabas. Revisá el orden y volvé a intentar.". `DISENO_EN_PRINCIPAL` y `SIN_IMAGEN_PRINCIPAL`
recargan el producto y muestran el `mensaje`. Mientras corre un `upload-url` o una operación de
galería, los botones de orden, diseño y quitar se deshabilitan, así la lista enviada coincide con la
del servidor. Motivo: los botones se usan con teclado (§3), como en el prototipo, y la regla se
comunica antes de que la API la rechace (§3).

**F7-D7. Diseños.** La casilla "Es un diseño" manda `PATCH {esDiseno}`. En la imagen de la posición
0, marcarla no llama a la API (el contrato da `422` aunque sea la única): el toast dice "La imagen
principal no puede ser un diseño. Hacé principal otra imagen primero." y la casilla vuelve a su
valor. Tras cambiar `esDiseno` se recarga el producto, porque desmarcar cuando todas son diseños la
pasa a la posición 0. Si es diseño, aparece "Nombre del diseño" (opcional, `maxLength` 60 del
contrato). Se guarda al salir del campo o con Enter, solo si cambió (recortado; `""` se manda
`null`), con el toast "Nombre del diseño guardado.". Sus errores van bajo el campo.

**F7-D8. Quitar una imagen.** "Quitar" confirma con el diálogo de F5-D4: "¿Quitar esta imagen?", con
el detalle "Se borra de la galería. No se puede deshacer.". Después, `DELETE`, toast "Imagen
quitada." y recarga del producto (el backend puede reordenar). En un publicado, quitar la última
imagen válida no abre el diálogo: el aviso de la galería dice "Es la última imagen válida de un
producto publicado: volvé a borrador para quitarla.". El `409` `ULTIMA_IMAGEN_VALIDA` se muestra
igual si llega. Si la imagen se está subiendo, se aborta el `XMLHttpRequest` antes del `DELETE`.

**F7-D9. Publicar en pasos separados** (decisión del usuario, 2026-09-25): crear el producto → subir
imágenes → "Publicar". El "Publicar en 1 clic" de §4 de la lógica de negocio queda en tres pasos; el
contrato lo describe como una orquestación del cliente, así que no cambia.

- En borrador, la cabecera muestra "Publicar" (`btn--primario`). Se habilita si `galeria[0]` es una
  imagen válida. Si no, está deshabilitado y un texto al lado, enlazado con `aria-describedby`,
  explica el motivo:
  - sin imágenes, o todas son diseños: "Para publicar, agregá una imagen que no sea un diseño.";
  - la principal se está subiendo o procesando: "Se puede publicar cuando la imagen principal
    termine de procesarse.", con la barra indeterminada de F7-D5 (pedido del usuario);
  - la principal está `fallida`: "La imagen principal falló: reintentala o hacé principal otra.".
- Al publicar, si el formulario tiene cambios sin guardar (F6-D3), primero los guarda con el mismo
  flujo de "Guardar cambios". Si guardar falla, no publica. Después, `POST publicar`: el `estado`
  pasa a publicado y el toast dice "Producto publicado. Aparece en el catálogo en hasta un minuto."
  (ISR de 60 s, F3-D2). El `422` `SIN_IMAGEN_PRINCIPAL` recarga el producto y muestra el `mensaje`.
- En publicado, la cabecera muestra "Volver a borrador" (`btn--secundario`). Confirma "¿Volver a
  borrador «X»?", con el detalle "Deja de verse en el catálogo.", y después llama a
  `volver-a-borrador` y muestra el toast "Producto en borrador.".
- Mientras envían, los botones dicen "Publicando…" / "Volviendo…". Solo cambia el `estado` del
  producto cargado; el formulario conserva lo escrito.

**F7-D10. Imagen principal en `/admin/productos`.** Cada fila suma, primero, una miniatura de 48 px
(`.fila__foto` del prototipo). Si `galeria[0]` es una imagen válida, es `<img>` con `url160`,
`width`/`height` 48, `object-fit: cover` y `alt=""` (el nombre ya está en la fila). Si no, el ícono
de foto. Motivo: pendiente de F6-D2.

**F7-D11. Estado y código.** Como F5-D6/F6-D7. La isla nueva `src/admin/Galeria.tsx` va dentro de
`EditarProducto` y recibe la galería y un callback para reemplazarla o recargar el producto. El
estado de las subidas (blob, URL de vista previa, progreso, `XMLHttpRequest`) es un mapa por
`imagenId` dentro de `Galeria`: sobrevive a que `producto.galeria` se reemplace. Las reglas puras van
en `src/admin/galeria.ts`: medidas escaladas, cupo libre, posición de una imagen nueva, revisión de un
orden (F7-D6), motivo para no publicar (F7-D9), última imagen válida (F7-D8), intervalo de consulta
(F7-D4) y transiciones de una subida. El canvas va en `src/admin/preprocesar.ts`, que usa el DOM y no
tiene tests.

**F7-D12. Validación.**

- **Tests de `galeria.ts`**, la lógica de estado que pide §3:
  - medidas escaladas (3000×4000 → 1920×2560; 800×600 sin cambios);
  - posición nueva al final y en 0 con todos diseños;
  - órdenes rechazados (diseño primero; publicado con principal sin procesar);
  - motivos de no publicar;
  - última válida;
  - intervalo a los 2 minutos;
  - transiciones de subida y reintento con `expiraEn` vencido.
- **Contra el backend local**, logueado como owner (F5-D7), con curl y solo imágenes de
  `public/assets/` (AGENTS.md):
  - `upload-url` → `PUT` → `confirmar` → consulta hasta `procesada`;
  - `publicar` → aparece en `GET /api/productos`;
  - `PUT` de orden con un diseño primero → `422` `DISENO_EN_PRINCIPAL`;
  - `PATCH esDiseno` en la posición 0 → `422`;
  - `DELETE` de la última válida de un publicado → `409` `ULTIMA_IMAGEN_VALIDA`;
  - `volver-a-borrador`;
  - un séptimo `upload-url` → `422` `GALERIA_COMPLETA`;
  - borrar por la API todo lo creado.
- **`astro dev`:** sirve `/admin/productos/editar` con la isla.
- **Verificaciones del usuario:** la subida desde el navegador (local y `admin.*`, incluida una foto
  HEIC del iPhone), las barras, publicar y ver el producto en `/catalogo-nuevo`.

**Construir:** la galería de `/admin/productos/editar` (F7-D1 a F7-D8); "Publicar" y "Volver a
borrador" (F7-D9); la miniatura del listado (F7-D10); `galeria.ts` con tests y `preprocesar.ts`
(F7-D11).

**Cerrar cuando:** una imagen real se sube desde el browser, se procesa, se publica y se ve en `/catalogo-nuevo` (D4); el `PUT` a R2 pasa el CORS con el origen del admin.

## Implementado

- `src/admin/Galeria.tsx`: la isla de la galería (F7-D1 a F7-D8), con `Tarjeta` y `Etapa` (texto y
  `<progress>`). Cola de subidas, `XMLHttpRequest` a R2, consulta de etapa y región `role="status"`.
- `src/admin/galeria.ts` (reglas puras de F7-D11 más `imagenPendiente`, `conImagenNueva`, `mover` y
  `TIPOS_ACEPTADOS`) con `galeria.test.ts` (25 tests); `src/admin/preprocesar.ts` (canvas, F7-D2).
- `EditarProducto.tsx`: `guardar()` separado del `submit` (lo reusa "Publicar"), `recargar`,
  `cambiarGaleria`, `EstadoProducto` ("Publicar" con su motivo / "Volver a borrador") y la galería
  debajo del `<form>`, o "Creá el producto para agregar imágenes." en el alta.
- `Productos.tsx`: `Miniatura` de 48 px primera en cada fila (F7-D10).
- `src/admin/iconos.tsx`: íconos del prototipo (foto, flechas, estrella).
- `admin.css`: `.visualmente-oculto`, `.lista__foto`, `.publicar*`, `.galeria*`, `.foto*`,
  `.btn--icono` y las barras `progress` (`:indeterminate` animado, quieto con `prefers-reduced-motion`).

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `EditarProducto` importa `./Galeria.tsx` con extensión | En Windows, `./Galeria` sin extensión resuelve a `galeria.ts` (mismo nombre salvo mayúsculas) y `astro check` falla con `ts(1149)`. |
| Lo local de cada subida (blob, vista previa, `uploadUrl`, `Subida`) vive en un estado `Record` por `imagenId` con copia en `useRef` | Los flujos asíncronos (cola, reintento, `XMLHttpRequest`) leen el valor vigente sin esperar un render. |
| Subidas y reintentos de subida pasan por una sola cola de promesas | Cumple "uno por vez" también si se eligen más archivos o se reintenta a mitad de una secuencia. |
| El cupo descuenta los archivos elegidos que todavía no pidieron `upload-url` (`reservados`) | Elegir otra tanda durante una subida no pasa del máximo de 6. |
| `recargar` actualiza solo `galeria` y `estado` del producto cargado | El formulario y su comparación para el `PATCH` (F6-D3) no cambian por una recarga de la galería. |
| La consulta de etapa es un único efecto, reiniciado cuando cambia la lista de imágenes en proceso o `document.hidden`; espera el pedido en vuelo antes de seguir | Una sola consulta a la vez (F7-D4) aunque el efecto se reinicie a mitad de un pedido. |
| `confirmando` se muestra como "Subiendo… 100 %" y una `pendiente_subida` con archivo local sin subida activa, como "Subiendo…" indeterminado | F7-D5 no fija el texto de esos dos estados de transición. |
| Las tarjetas con subida fallida o sin terminar muestran solo sus acciones ("Reintentar"/"Quitar"), sin orden ni diseño | Es lo que pide F7-D3 para esas tarjetas; ordenar una imagen sin archivo no aporta. |
| Los errores de preparación se acumulan en el aviso de la galería; los de "Publicar" y "Volver a borrador", en el toast de error | F7-D2 y F7-D9 no fijan el lugar; el aviso de la galería ya junta los errores de subida. |
| Guardar el "Nombre del diseño" no bloquea los botones de la galería | F7-D6 bloquea orden, diseño y quitar; el nombre no cambia posiciones. |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; hints ya existentes), `pnpm test` (78, 25 nuevos de
  `galeria.ts`) y `pnpm build` pasan.
- Contra el backend local (owner, `Origin: http://localhost:4321`), con un script Node de `fetch` fuera
  del repo y `public/assets/asado-placa.webp` y `bowls-placa.webp`:
  - `upload-url` → `201`; preflight `OPTIONS` a R2 → `204` con `Access-Control-Allow-Origin:
    http://localhost:4321`; `PUT` → `200` con el mismo header; `confirmar` → `pendiente_procesamiento`;
    consulta cada 2 s → `procesada` en ~4 s, con `url160`;
  - `publicar` → `200 publicado`, y el producto aparece en `GET /api/productos`;
  - `PATCH esDiseno` en la posición 1 → `200`; `PUT` de orden con el diseño primero → `422`
    `DISENO_EN_PRINCIPAL`; `PATCH esDiseno` en la posición 0 → `422` `DISENO_EN_PRINCIPAL`;
  - `DELETE` de la única válida del publicado → `409` `ULTIMA_IMAGEN_VALIDA`; `volver-a-borrador` →
    `200 borrador`;
  - con 6 imágenes, el séptimo `upload-url` → `422` `GALERIA_COMPLETA`;
  - las 6 imágenes y el producto se borraron por la API; `GET /admin/productos` quedó vacío.
- `astro dev`: `/admin/productos/editar` y `/admin/productos` responden `200` con `noindex` y la isla;
  Vite sirve `Galeria.tsx` y `galeria.ts` como módulos distintos.

## Desvíos

- Con cupo para una sola imagen, el toast dice "Entraba 1 imagen más: se agregó la primera." en vez
  del plural de F7-D3.
- La galería vacía muestra "Todavía no hay imágenes." (F7-D1 no fija el texto).
- F7-D12 pedía curl; se usó `fetch` de Node con los mismos pedidos para manejar la cookie y el `PUT`
  binario en un solo script.
- La isla no se probó en un navegador (preprocesamiento, `XMLHttpRequest`, barras, foco, lector de
  pantalla): ver las verificaciones del usuario.

## Verificaciones del usuario

Primero en local (`pnpm dev` con el backend local, AGENTS.md) y después del push a `main` en
`admin.*/admin`, logueado. Solo imágenes de `public/assets/` en local (suben al bucket de producción);
en `admin.*`, una foto real.

1. `/admin/productos/editar` (alta) muestra "Creá el producto para agregar imágenes."; crear el producto
   "Prueba F7": aparece "Galería (0/6)", "Todavía no hay imágenes." y "Publicar" deshabilitado con
   "Para publicar, agregá una imagen que no sea un diseño.".
2. "Agregar imágenes" con dos archivos: cada tarjeta pasa por "Preparando…", "Subiendo… N %" (barra que
   avanza), "Pendiente de procesamiento" / "Procesando…" (barra animada) y termina con la imagen. La
   primera dice "Principal". En DevTools → Network, el `PUT` a `…r2.cloudflarestorage.com` da `200`, sin
   error de CORS. Mientras "Publicar" espera, muestra "Se puede publicar cuando la imagen principal
   termine de procesarse." con barra.
3. Intentar cerrar la pestaña durante una subida: el navegador avisa.
4. Marcar "Es un diseño" en la principal: toast "La imagen principal no puede ser un diseño. Hacé
   principal otra imagen primero." y la casilla queda desmarcada. Marcarlo en la segunda: aparece
   "Nombre del diseño"; escribir "Aves" + Enter: toast "Nombre del diseño guardado." y la marca
   "Diseño: Aves".
5. "Mover antes" en el diseño: toast "La imagen principal no puede ser un diseño.", sin cambios. Con
   Tab, recorrer los botones de la tarjeta: foco visible y `aria-label` "Mover antes la imagen 2".
6. Elegir 6 archivos con 2 ya cargados: toast "Entraban 4 imágenes más: se agregaron las primeras 4.";
   con 6, "Agregar imágenes" queda deshabilitado con "La galería está completa (6 de 6).".
7. "Publicar" con un cambio sin guardar en el precio: guarda, publica, toast "Producto publicado.
   Aparece en el catálogo en hasta un minuto."; la píldora dice "Publicado". En hasta un minuto, el
   producto se ve en `/catalogo-nuevo` con su imagen (criterio de cierre).
8. En el publicado, "Quitar" en la única imagen válida: el aviso dice "Es la última imagen válida de un
   producto publicado: volvé a borrador para quitarla." sin diálogo.
9. "Volver a borrador": confirma "¿Volver a borrador «Prueba F7»?"; toast "Producto en borrador.".
10. "Quitar" otra imagen: diálogo "¿Quitar esta imagen?"; al confirmar, toast "Imagen quitada.".
11. `/admin/productos`: la fila de "Prueba F7" muestra la miniatura de 48 px.
12. En `admin.*` (Safari de macOS o iPhone), subir una foto HEIC: se sube como JPEG y se procesa. En
    Chrome de escritorio, un `.heic` da "No se pudo leer «archivo». Elegí una imagen JPG, PNG o WebP.".
13. Borrar "Prueba F7" desde el listado (borra su galería).
