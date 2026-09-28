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
