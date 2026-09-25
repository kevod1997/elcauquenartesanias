# Fase 8 — Orden

## Definición

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Reusan el patrón del admin (F5-D2 a F5-D6) y registran solo sus desvíos. Fuentes: §Orden
de `contrato-api-borrador.md`; `PUT /admin/productos/orden` y `GET /admin/productos` de
`openapi.json`; `guardarOrden` y el mensaje de `OrdenDesactualizadoError` de
`elcauquen-backend/src/catalogo/productos.ts`; el handoff del prototipo (puntos 5 y "Orden de
exhibición") y `admin/admin.js` (`renderLedger`, `moverOrden`, `btnGuardarOrden`); el
[`moveBefore()` de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore). Sin
términos nuevos en `CONTEXT.md`: la UI usa "orden global", "producto" e "integrante"; "orden sin
guardar" es estado de la página, no del dominio.

**F8-D1. Reordenar en `/admin/productos`, con un orden sin guardar y el botón "Guardar orden".**
La lista pasa de `<ul>` a `<ol>` y cada fila suma, primero, su posición ("01", "02"…, `.fila__orden`
del prototipo, `aria-hidden`: el `<ol>` ya la anuncia). Los movimientos cambian solo el orden sin
guardar de la página. En la cabecera, antes de "Nuevo producto", va "Guardar orden"
(`btn--secundario`): deshabilitado mientras el orden sin guardar coincide con el cargado, y con
"Guardando…" mientras envía. Con cambios, un texto al lado dice "Hay cambios en el orden sin
guardar.". Motivo:

- El contrato manda la lista completa "como el botón «Guardar orden» del prototipo", y el handoff
  fija botones, sin arrastrar.
- La fase pide no perder el trabajo ante un `409`: ese trabajo es el orden sin guardar. Guardar en
  cada clic, como la galería (F7-D6), subiría `ordenVersion` en cada paso y abriría un `409` por
  movimiento a quien ordena en otra pestaña.
- Con 11 productos en el sitio actual (`public/main.js`), subir y bajar de a uno alcanza.

**F8-D2. "Subir" y "Bajar" por fila, con el foco devuelto a mano.** Dos botones de ícono
(`btn--icono`, flechas arriba y abajo del prototipo, que se suman a `iconos.tsx`) antes de
"Editar", con `aria-label` "Subir «X»" / "Bajar «X»"; deshabilitados en las puntas. El movimiento
usa `mover` de `galeria.ts` (es genérico). Después de mover, el foco vuelve al mismo botón de la fila
movida; si quedó deshabilitado (llegó a una punta), al otro. Una región `role="status"` visualmente
oculta (`.visualmente-oculto`, como F7-D5) anuncia "«X», posición N de M.". Motivo:

- React reordena filas con `key` moviendo nodos con `insertBefore`, que los saca y los vuelve a
  insertar: el nodo pierde `:focus` (MDN, `moveBefore()`, que lo preservaría pero no es Baseline).
- Sin el anuncio, quien usa lector de pantalla no sabe dónde quedó el producto.

**F8-D3. Guardar.** `PUT /admin/productos/orden` con el orden sin guardar y el `ordenVersion` del
último `GET /admin/productos`. Con `200`, la respuesta pasa a ser el orden cargado (`orden` y
`ordenVersion`) y el toast dice "Orden guardado. El catálogo se actualiza en hasta un minuto." (ISR
de 60 s, F3-D2). Mientras envía, "Subir", "Bajar" y "Borrar" quedan deshabilitados, así lo enviado
es lo que se ve.

**F8-D4. Conflicto: recargar, conservar el orden del usuario y pedir que vuelva a guardar.** Ante
`409` `ORDEN_DESACTUALIZADO`, se recarga el listado (productos y categorías) y el orden sin guardar
se **rebasa** sobre la lista nueva:

- los productos que siguen existiendo quedan en el orden relativo que eligió el usuario;
- los borrados por otro integrante se quitan;
- los nuevos van al final, en el orden de la API (donde el backend pone cada producto nuevo).

El `ordenVersion` pasa a ser el de la recarga y no se reenvía solo. Un `aviso` con `role="alert"`
sobre la lista dice "Otro integrante cambió los productos mientras ordenabas. Conservamos tu orden:
los nuevos quedaron al final y los borrados se quitaron. Revisalo y volvé a guardar.". Si el orden
rebasado coincide con el de la recarga, dice en cambio "Otro integrante cambió los productos; tu
orden ya coincide con el guardado." y "Guardar orden" queda deshabilitado. Motivo:

- Reintentar solo pisaría, sin que nadie lo vea, el orden que acaba de guardar el otro integrante;
  el contrato pide recargar y reintentar, y reintentar queda en manos de quien ordena.
- El mensaje de la API ("recargá el listado y volvé a ordenar") supone perder el trabajo; la página
  lo conserva, así que usa un texto propio.

`400` `ORDEN_INVALIDO` (la lista no coincide con los productos; con la versión comparada primero,
solo pasa por un error del cliente) sigue el mismo camino, con el `mensaje` de la API en el aviso. El
resto de los errores van al aviso de la lista con `mensajeDeError` y conservan el orden sin guardar;
`401` redirige primero (F4-D3).

**F8-D5. Las otras acciones de la lista conservan el orden sin guardar.**

- Toda recarga del listado (tras borrar, tras un conflicto) rebasa el orden sin guardar como F8-D4.
  Borrar sube `ordenVersion`, y la recarga trae la versión nueva, así el guardado siguiente no da
  `409`.
- Con cambios sin guardar, un listener de `beforeunload` avisa al salir, como F6-D3: cubre "Editar",
  "Nuevo producto", la barra y cerrar la pestaña.

**F8-D6. Estado y código.** Como F5-D6. En `Productos.tsx`: los productos cargados, el orden cargado
(`orden`, `ordenVersion`) y el orden sin guardar (ids). Las reglas puras van en `src/admin/orden.ts`
(`rebasar`, `hayCambios`), sin isla del mismo nombre, con `orden.test.ts`: la lógica del orden con
`409` es la que pide §3.

**F8-D7. Validación.**

- **Tests de `orden.ts`:** rebasar con un producto borrado, con uno nuevo (al final), con la lista
  reordenada por otro (gana el orden del usuario) y sin cambios; `hayCambios` con listas iguales y
  distintas.
- **Contra el backend local**, logueado como owner (F5-D7), con curl:
  - `GET /admin/productos` → `PUT` de orden con su `ordenVersion` → `200` con la versión siguiente;
  - repetir el `PUT` con la versión vieja → `409` `ORDEN_DESACTUALIZADO`;
  - con la versión actual, una lista a la que le falta un id → `400` `ORDEN_INVALIDO`; con un id
    repetido → `400` `SOLICITUD_INVALIDA`;
  - crear y borrar un producto suben `ordenVersion`; `publicar` no la cambia;
  - con dos productos publicados (imágenes de `public/assets/`, AGENTS.md), invertir el orden y ver
    el orden nuevo en `GET /api/productos`;
  - borrar por la API todo lo creado.
- **`astro dev`:** `/admin/productos` responde `200` con `noindex` y la isla.
- **Verificaciones del usuario**, en `admin.*`: subir y bajar con teclado (el foco sigue a la fila),
  guardar y ver el orden en `/catalogo-nuevo` al minuto, y el conflicto con dos pestañas (guardar en
  una, guardar en la otra: aviso de F8-D4 con el orden conservado, y guardar de nuevo funciona).

**Construir:** el orden en `/admin/productos` (F8-D1 a F8-D5); los íconos de subir y bajar;
`src/admin/orden.ts` con tests (F8-D6).

**Cerrar cuando:** reordenar se refleja en `/catalogo-nuevo` (D4) y un conflicto simulado con dos pestañas se resuelve sin error.
