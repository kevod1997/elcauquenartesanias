# Fase 13 — Orden del catálogo por hileras, con cortes manuales

## Definición

Pedido del usuario (2026-09-28): en el teléfono, la vista "Orden del catálogo" de F12-D6 a F12-D8 no se
entiende. Las hileras se ven como separadores de una grilla de dos columnas; la manija está sobre la
foto, y "Antes" y "Después" mueven de a un lugar. Además, el integrante quiere empezar una hilera nueva
donde elija, sin esperar a que la anterior tenga cuatro productos.

El diseño salió de un prototipo descartable con datos falsos:
`src/admin/prototipo-orden/`, ruta `/admin/productos/prototipo-orden`. El usuario eligió la variante
**E**, derivada de la C, con los ajustes que pidió en la misma sesión. El backend ya guarda los cortes
(fase 10 de `../elcauquen-backend`: `PUT /admin/productos/orden` con `cortes` opcional, `iniciaHilera` en
`Producto` y `ProductoPublico`, [ADR-0008](../../../../elcauquen-backend/docs/adr/0008-el-corte-de-hilera-es-una-marca-del-producto.md)).

**Decisiones del usuario (2026-09-28):**

- **F13-D1. Hileras con cortes manuales y tope de cuatro; sin la regla de diseños.** `hileras()` corta
  el orden global en cada producto con `iniciaHilera` que se vea y, además, cada cuatro productos que se
  vean. Un producto con diseños ya no va solo en su hilera: se descarta F12-D1. Motivo: la regla venía
  del sitio viejo, y con cortes manuales el integrante puede dejar un producto solo si quiere. Las
  tarjetas de un carrusel ya se estiran a la misma altura (`.product-row__track` es `flex`, y el botón
  de WhatsApp va al pie con `margin-top: auto`), así que mezclar productos con y sin diseños no rompe la
  hilera. `.product-row--single` sigue para una hilera de un producto.
- **F13-D2. La vista del orden en mobile es la de la variante E del prototipo:**
  - Cada renglón es una hilera, con su número a la izquierda y cuatro lugares; los vacíos van
    punteados. Antes de las hileras, un aviso corto: "Mantené apretado y arrastrá un producto para
    cambiarlo de lugar, o el número de una hilera para moverla entera."
  - Solo arrastre (dnd-kit, como F12-D5): mantener apretado un producto, o arrastrar el número para
    mover la hilera entera. Se sacan "Antes", "Después" y el menú "Mover a…". Con teclado se usa el
    `KeyboardSensor` de dnd-kit.
  - El destino se marca enseguida, y las hileras se reacomodan recién cuando el dedo se queda 450 ms
    sobre él, con transiciones de 320 a 400 ms. Al soltar se aplica aunque no hayan pasado los 450 ms.
  - Mientras se arrastra aparece un tacho, "Descartar movimiento": soltar ahí, o Escape, deja todo
    como estaba al tomarlo.
  - Al final, una zona "Soltá acá para empezar una hilera nueva", que funciona siempre gracias a los
    cortes manuales. Soltar en un lugar vacío de una hilera suma el producto a esa hilera.
  - Un chip "D" arriba a la derecha marca los productos con diseños.
- **F13-D3. Borradores aparte, abajo.** No aparecen en las hileras y se dividen en dos grupos:
  - "Listos para publicar" (`motivoParaNoPublicar(galeria) === null`): se arrastran a una hilera y
    quedan marcados "Nuevo" hasta guardar. Si se arrastran de vuelta a la sección, dejan de estar
    marcados.
  - "Todavía no se pueden publicar": muestran el motivo y un botón "Editar" a
    `/admin/productos/editar?id=…`.
- **F13-D4. "Guardar y publicar".** La barra de guardar dice "Guardar y publicar" cuando hay borradores
  soltados en una hilera. Guarda el orden con la lista completa de `cortes` y después publica cada uno
  (`POST .../publicar`). Si un `publicar` da `422`, el corte queda guardado (decisión 6 de la fase 10
  del backend). "Descartar" lleva color (fondo terracota suave), para que no parezca deshabilitado.

**Decisiones de la preparación (2026-09-28):**

- **F13-D5. El corte queda en el lugar (decisión del usuario).** Lo que se ve en las hileras es lo que se
  guarda:
  - El orden sin guardar (`Orden` de `Productos.tsx`) suma los cortes (cargados y sin guardar) y los
    borradores a publicar. Los cortes cargados salen de `iniciaHilera` de `GET /admin/productos`.
  - Si sale el primer producto de una hilera, el corte pasa al que le sigue en esa hilera. Si la hilera
    queda vacía, el corte desaparece.
  - Soltar sobre un producto lo pone antes de él. Si ese producto empezaba la hilera, el que llega toma
    su corte.
  - Soltar en un lugar vacío lo pone al final de esa hilera, antes del corte de la que sigue.
  - Si una hilera pasa de cuatro, el tope de F13-D1 corre el sobrante a la siguiente, hasta el próximo
    corte.
  - Mover una hilera entera pone corte al primero del bloque y al producto que lo sigue en su lugar
    nuevo. Así el bloque y la hilera de destino quedan como se veían. La hilera que seguía al bloque
    en su lugar viejo también queda con corte.
  - Los movimientos cambian ids de lugar en la lista completa. Un borrador que no se ve queda donde
    estaba y conserva su marca, que reaparece al publicarlo (ADR-0008 del backend).
  - "Guardar" manda siempre `cortes` completo, en el orden de `orden`: el contrato ("Cortes de hilera")
    deja al cliente decidir si el corte acompaña al producto.
  - Motivo: si el corte viajara con el producto, llevar el primero de una hilera a otro lado partiría la
    hilera de destino y juntaría la de origen con la anterior, y eso no es lo que el integrante ve al
    soltar.
- **F13-D6. Desktop usa la misma vista por hileras (decisión del usuario).** Un solo componente, con
  tarjetas más grandes pasando los 560px. Se borran la grilla de F12-D7, "Antes" y "Después"
  (`moverTarjeta`, el efecto de `foco` y los `data-mover`) y sus estilos. El texto de
  `.orden__explicacion` se reescribe sin la regla de diseños (F13-D1) y explica los cortes. Motivo: la
  grilla no muestra los cortes, y desde la computadora también hay que poder editarlos.
- **F13-D7. `hileras(productos, iniciaHilera, seVe)`.** Recibe una función que dice si el producto
  empieza una hilera, en lugar de `conDisenos`. Corta en cada producto que se ve con marca y cada cuatro
  que se ven. Un producto que no se ve no cuenta para las cuatro, y su marca se ignora. El público le
  pasa `(p) => p.iniciaHilera`, y el listado público solo trae publicados (contrato, "Productos
  públicos"). En la vista del orden, "se ve" es publicado o a publicar. Se borran `tieneDisenos` y
  `tieneDisenoProcesado`, salvo que el chip "D" use el segundo. Motivo: la misma función arma el
  catálogo y la vista, así coinciden (criterio de cierre).
- **F13-D8. El `409` rebasa también los cortes y los borradores a publicar (F8-D4).**
  - `hayCambios` compara `orden`, `cortes` y `aPublicar`. Sin cambios, gana la API.
  - Con cambios, `rebasar` sigue igual para los ids.
  - Los cortes sin guardar se conservan para los ids que siguen existiendo. Los productos nuevos
    llegan con su `iniciaHilera`, que es `false` al crearlos.
  - Un producto sale de `aPublicar` si se borró o si otro integrante ya lo publicó.
  - El mensaje de F8-D4 no cambia.
  - Motivo: el trabajo del integrante sobre las hileras es parte del orden sin guardar.
- **F13-D9. Si falla un `publicar` después de guardar el orden.**
  - Si el `PUT` falla, no se publica nada (F8-D4).
  - Si el `PUT` sale bien, los `publicar` van de a uno. Un error sigue con el resto, salvo un `401`, que
    redirige (F4).
  - Al terminar se recarga el listado, y los que fallaron vuelven a "Borradores".
  - El error va en el aviso `role="alert"` de la sección: "Se guardó el orden, pero no se pudo publicar
    «X»: {mensajeDeError}. Quedó en borradores." Hay una línea por producto, y el `422`
    `SIN_IMAGEN_PRINCIPAL` usa el texto de `mensajes.ts`.
  - Si todos salen bien: `avisar('Orden guardado y {n} publicado(s). El catálogo se actualiza en hasta un
    minuto.')`.
  - Motivo: el contrato garantiza que un `422` deja el producto como estaba (contrato, "Publicación").
    El corte ya guardado es la decisión 6 de la fase 10 del backend.
- **F13-D10. Teclado y lector de pantalla.**
  - Con teclado (`operation.activatorEvent instanceof KeyboardEvent`, en los tipos de
    `@dnd-kit/abstract` 0.5.0), cada movimiento se aplica sin la espera de 450 ms. La espera es para que
    el dedo no reacomode al pasar.
  - Cada producto de una hilera se anuncia como `«X», hilera N, lugar k`. Si tiene diseños, se agrega
    `, con diseños`. Si se va a publicar, `, nuevo: se publica al guardar`. El número de una hilera se
    anuncia como `Hilera N, con M productos: arrastrala para moverla entera`.
  - Textos del plugin `Accessibility`:

    | Momento | Texto |
    | --- | --- |
    | Instrucciones | "Para tomar un producto o una hilera, apretá Espacio o Enter. Con las flechas lo llevás a otro lugar; Espacio o Enter lo sueltan y Escape descarta el movimiento." |
    | Tomar | "Tomaste «X», hilera N, lugar k." / "Tomaste «X», borrador listo para publicar." / "Tomaste la hilera N, con M productos." |
    | Movimiento aplicado | "«X» en la hilera N, lugar k." / "«X» en una hilera nueva, la N." / "«X» vuelve a borradores." / "La hilera ahora es la N." |
    | Sobre el tacho | "Soltá para descartar el movimiento." |
    | Soltar | Repite el último movimiento aplicado. |
    | Escape o tacho | "Se descartó el movimiento: todo volvió a como estaba." |

  - Motivo: F12-D8 anunciaba la posición global. Con hileras, lo que el integrante controla es la
    hilera y el lugar.
- **F13-D11. `pnpm gen:api` y el despliegue.**
  - El 2026-09-28, `src/api/openapi.json` difería del backend solo en `iniciaHilera` (en `Producto` y
    `ProductoPublico`), en `cortes` (en el body y la respuesta del `PUT`) y en dos descripciones. Se
    genera al empezar.
  - La API de producción todavía no trae `iniciaHilera` (`GET /api/productos`, 2026-09-28), así que el
    front se despliega después de la fase 10 del backend.
  - Las pruebas locales usan el backend de `http://localhost:3001` (AGENTS.md).

Glosario: "Hilera" y "Corte de hilera" ya están en `../elcauquen-backend/CONTEXT.md`, que es el glosario
del front (PRD §3). La fase no agrega términos.

**Construir:**

- Correr `pnpm gen:api`.
- `hileras()` con F13-D7, con sus tests. Las reglas de F13-D5 (mover un producto, una hilera, a una
  hilera nueva y a borradores) y la de `rebasar` (F13-D8), con sus tests, en `orden.ts`.
- La vista del orden (F13-D2, F13-D3, F13-D6 y F13-D10) en `OrdenCatalogo.tsx`, `Productos.tsx` y
  `admin.css`.
- El guardado con cortes y la publicación (F13-D4 y F13-D9).
- El catálogo público con los cortes.
- Al terminar, borrar el prototipo de `main` y dejarlo en la rama `prototipo/orden-catalogo`, con el veredicto (variante E) en su commit.

**Cerrar cuando:**

- En `pnpm test`, los tests de `hileras()` con cortes, tope de cuatro, borradores y productos con
  diseños mezclados pasan; typecheck, lint y build también.
- En un teléfono real, el integrante arrastra productos y hileras enteras, empieza una hilera nueva,
  descarta con el tacho, y publica un borrador soltándolo en una hilera y guardando.
- Las hileras de la vista coinciden con los carruseles del catálogo público, cortes incluidos.
- Con lector de pantalla y teclado se toma, mueve, suelta y cancela, con anuncios en español.
- El `409` conserva el orden y los cortes del usuario, como en F8-D4.

## Implementado

- `pnpm gen:api`: `iniciaHilera` en `Producto` y `ProductoPublico`, y `cortes` en el `PUT` del orden.
- `src/catalogo/presentacion.ts` (F13-D1, F13-D7): `hileras(productos, iniciaHilera, seVe?)` y
  `PRODUCTOS_POR_HILERA` exportado; se borró `tieneDisenos`. `index.astro` pasa
  `(p) => p.iniciaHilera`. Tests en `presentacion.test.ts`.
- `src/admin/orden.ts`: el tipo `Armado` (`orden`, `cortes`, `aPublicar`), `filas()`,
  `moverProducto()` (antes de un producto, fin de una hilera, hilera nueva, borradores),
  `moverHilera()`, `listaDeCortes()`, `hayCambios()` y `rebasar()` con F13-D5 y F13-D8. Quedó
  `tieneDisenoProcesado` para el chip "D"; se borraron `estaPublicado`, `posiciones` y
  `textoPosicion`. Tests en `orden.test.ts`.
- `OrdenCatalogo.tsx` (F13-D2, F13-D3, F13-D6, F13-D10): hileras con número arrastrable, lugares
  vacíos que reciben productos, zona de hilera nueva, sección de borradores (listos y no listos con
  "Editar"), tacho y los anuncios.
- `Productos.tsx` (F13-D4, F13-D8, F13-D9): el estado `Orden` guarda `Armado`, la barra fija con
  "Descartar" y "Guardar orden"/"Guardar y publicar", el `PUT` con `cortes` y los `publicar` de a uno.
  Se borraron "Antes", "Después", `moverTarjeta` y el efecto de `foco`.
- `admin.css`: la sección `.orden__*` nueva y su bloque mobile; se borraron la grilla de F12-D7, la
  manija y `.orden__acciones`. `.aviso` usa `white-space: pre-line` (una línea por producto que no se
  publicó). `IconoAgarre` salió de `iconos.tsx`.
- `scripts/api-fixture/productos.ts`: los productos con diseños llegan con `iniciaHilera: true`.
- El prototipo salió de `main`; está en la rama local `prototipo/orden-catalogo` (commit con el
  veredicto, variante E).

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Los movimientos operan sobre la secuencia de los que se ven y se vuelcan a la lista completa llenando los lugares de los visibles | Así un borrador que no se ve queda en su índice y con su marca (F13-D5) sin reglas aparte. |
| Soltar antes de un producto con corte le pasa el corte al que llega, aunque ese corte lo acabe de heredar | Soltar el primero de una hilera sobre el segundo la deja como estaba, en vez de pasarlo a la hilera anterior. |
| Un producto con corte empieza hilera por definición: la regla "empezaba la hilera" se chequea con `cortes.has` | Si empieza por el tope de cuatro, el que llega queda quinto y el tope ya lo corta. |
| Ids de dnd-kit: el id del producto; `hilera:<primero>`, `vacio:<primero>:<k>` y `zona:*` | La hilera se identifica por su primer producto, que cambia solo al moverla. |
| Los movimientos se anuncian en el `role="status"` de la isla al aplicarse; el plugin anuncia tomar, el tacho, soltar (repite el último) y descartar | Con la espera de 450 ms, el `dragover` del plugin llega antes de que se aplique el movimiento. |
| La hilera se anuncia "con 1 producto" / "con N productos" | F13-D10 escribía "M productos"; con una sola, el plural sonaba mal. |
| La barra de guardar aparece solo con cambios (o guardando), fija abajo; el tacho va abajo a la derecha, encima de ella | Es la barra del prototipo E; centrado y más arriba, el tacho tapaba "Soltá acá para empezar una hilera nueva". |
| Mientras se arrastra y 600 ms después de soltar, un salto de scroll de más de 150px se deshace | Al pasar un producto a otra hilera, React lo vuelve a montar y dnd-kit lleva a la vista el elemento desmontado, que manda la página arriba. |
| Al soltar con teclado, el foco vuelve al producto o al número de hilera movido (`data-orden-id`) | Al pasar a otra hilera, React lo vuelve a montar y el foco que restaura dnd-kit se perdía; las flechas movían la página. |
| ~~Una hilera que mezcla productos con y sin diseños muestra un aviso debajo (y lo suma a la etiqueta de su número)~~ Retirado por la [tarjeta simplificada](#ajuste-posterior-tarjeta-simplificada-en-mobile) | En el catálogo, las tarjetas sin diseños tomaban otra proporción y la hilera se veía despareja. |
| Tras publicar se pone el orden guardado como cargado antes de `cargar()` | Así la recarga no rebasa y los que fallaron vuelven a "Borradores" (F13-D9). |
| En desktop los lugares miden 160px y la vista, como máximo, 4 lugares de ancho | F13-D6 pidió tarjetas más grandes pasando los 560px. |
| `container-type` salió de `.panel__contenido` | Solo lo usaba la grilla de F12-D7. |

## Validaciones ejecutadas

- `pnpm test` (107), `pnpm lint`, `pnpm typecheck` (0 errores, 16 hints ya existentes) y `pnpm build`
  pasan. No se tocaron dependencias.
- Backend local con la migración `0008_cortes_de_hilera` (se aplicó con `pnpm db:migrate`; faltaba) y
  la sesión del editor de prueba, en Chrome con la extensión:
  - teclado: Espacio toma («Tomaste «Cazuelas artesanales», hilera 1, lugar 1.»), la flecha mueve sin
    espera («… en la hilera 1, lugar 4.»), Escape restaura todo y anuncia "Se descartó el movimiento:
    todo volvió a como estaba.";
  - `PointerEvent` de mouse: soltar en "hilera nueva" aplica tras la espera («… en una hilera nueva, la
    3.»); arrastrar el número de la hilera 3 a la 1 («La hilera ahora es la 1.»);
  - "Guardar orden" mandó los cortes: `GET /api/productos` dio `|Portavelas, |Cazuelas, Tabla, Cuenco,
    Juego, |Florero, Posavasos` y el catálogo público local armó las mismas tres hileras que la vista;
  - un publicado pasado a borrador aparece en "Listos para publicar"; soltado en un lugar vacío queda
    "Nuevo" y la barra dice "Orden sin guardar · 1 para publicar" / "Guardar y publicar";
  - con la versión subida por otro `PUT`, el `409` muestra el aviso de F8-D4 y conserva orden, cortes y
    el borrador a publicar; al volver a guardar: "Orden guardado y 1 publicado…" y la sección de
    borradores desaparece;
  - a 390px (iframe), cuatro lugares de 70px por hilera y sin desborde horizontal.
- Los datos quedaron en la base local (orden y cortes cambiados; nada en producción ni en R2).

## Desvíos

- El aviso de hileras mezcladas no se vio en local: ningún producto local tiene diseños procesados, y
  subirlos va al R2 de producción. Después se retiró (ver el ajuste posterior).
- La falla de un `publicar` (F13-D9) no se probó en vivo: un borrador listo no da `422` sin cambiar su
  galería en el medio. Queda en las verificaciones del usuario.
- El texto "con M productos" de F13-D10 usa singular con una hilera de un producto.

## Ajuste posterior: tarjeta simplificada en mobile

Salió de explorar la home mobile con tres prototipos descartables (`src/pages/prototipos/`, sin versionar);
el usuario tomó solo la tarjeta de la dirección A y dejó el resto de la estética como estaba.

- **Tarjeta:** hasta 560px muestra foto, nombre, precio y un chip «+ Ver más» (o «+ N diseños») debajo de
  la foto, con la píldora de las medidas; la lupa y su velo no se muestran, para no tapar la foto. La
  descripción, las medidas, los diseños y el WhatsApp se ocultan con CSS. Desktop no cambia.
- **Mismo tamaño siempre:** todas las tarjetas miden `min(64vw, 280px)` (`--ancho-tarjeta`), también en
  una hilera de un producto, con `min-width: 0` para que el contenido no las ensanche. Las flechas van a
  la mitad de la foto.
- **Detalle en el Visor:** en mobile se toca la tarjeta entera (el botón de la foto sigue siendo el foco
  de teclado) y el Visor muestra, debajo de la tira, una copia del `.card__body` de esa tarjeta. El
  panel se desplaza con la foto cuadrada y la cabecera fija; el bloque de diseños se oculta (la tira ya
  los muestra), las medidas parten línea y el WhatsApp queda fijo abajo.
- **Admin:** con tarjetas del mismo tamaño, mezclar productos con y sin diseños ya no desparejaba la
  hilera; se quitó el aviso de mezcla y su texto en la etiqueta del número. El chip "D" queda.
- **Validaciones:** `astro check` (0 errores), Biome y `pnpm test` (107) pasan. El usuario revisó la
  home a mano en el teléfono.

## Verificaciones del usuario

Dependen de desplegar la fase 10 del backend y después este front (F13-D11).

1. En el teléfono real, en `admin.*` → Productos → Orden del catálogo: mantener apretado un producto y
   llevarlo a otra hilera; arrastrar el número de una hilera a otro lugar; soltar un producto en "Soltá
   acá para empezar una hilera nueva"; tomar uno, llevarlo al tacho y confirmar que todo vuelve. Con la
   página desplazada, pasar un producto a otra hilera no la manda arriba.
2. Pasar un producto de prueba a borrador (o crear uno con imagen), soltarlo en una hilera, "Guardar y
   publicar", y comprobar que se publica. Después borrarlo o devolverlo como estaba.
3. Abrir el catálogo público en el teléfono y comparar los carruseles con las hileras de la vista.
4. Con lector de pantalla (TalkBack o VoiceOver) y teclado en desktop: tomar, mover con flechas,
   soltar y cancelar con Escape; los anuncios salen en español.
5. Opcional, falla de publicación: con un borrador listo soltado en una hilera, en otra pestaña quitarle
   todas las imágenes, y guardar en la primera: debe decir "Se guardó el orden, pero no se
   pudo publicar «X»: … Quedó en borradores."
