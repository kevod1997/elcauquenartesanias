# Fase 6 — Productos con medidas

## Definición

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Reusan el patrón del admin (F5-D2 a F5-D5) y registran solo sus desvíos. Fuentes:
§Producto, §Medida y §Productos de `contrato-api-borrador.md`; las rutas `/admin/productos*` y los
componentes `Producto`, `Medida` y `Precio` de `openapi.json` (no hay `GET /admin/productos/{id}`);
`precioSchema` (`z.int().positive()`) de `elcauquen-backend/src/admin/productos.ts` y los mensajes de
`src/catalogo/productos.ts`; el prototipo (`admin/index.html` y `admin/admin.js`: `#modalProducto`,
`renderSelectCategoria`, `renderSelectTipoMedida`, `agregarMedida`); el
[`<form>` del HTML Standard](https://html.spec.whatwg.org/multipage/forms.html#the-form-element)
(sin formularios anidados) y el [`beforeunload` de MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).

**F6-D1. Dos páginas: `/admin/productos` (listado) y `/admin/productos/editar` (formulario).**
Protegidas, prerenderizadas y con una isla cada una (D1). El formulario sin query es el alta;
con `?id=<id>` edita ese producto. La barra suma "Productos" primero en `secciones`, marcado con
`aria-current` también en `/admin/productos/editar` (comparación por prefijo; hoy es exacta).
`/admin` sigue siendo el inicio de F4-D4. Motivo:

- La fase 7 suma la galería al mismo formulario: necesita espacio y un producto con id (la
  `upload-url` es por producto). Un modal como el del prototipo no alcanza.
- La URL recargable sirve para `?volver=` (F4-D3 guarda `pathname + search`).
- No existe `GET /admin/productos/{id}`: el formulario busca el producto en `GET /admin/productos`.
  Si no está, muestra el mensaje de `PRODUCTO_NO_ENCONTRADO` ("No existe ese producto.") y un
  enlace "Volver a productos", sin formulario.
- Tras crear, `history.replaceState` pasa a `?id=<nuevo>` y el formulario sigue abierto en modo
  edición (toast "Producto creado."). Guardar una edición también se queda (toast "Producto
  guardado."). El formulario tiene arriba un enlace "Volver a productos".

**F6-D2. Listado.** Como F5-D2, con estos desvíos:

- El orden es el global de la API (`productos` de `GET /admin/productos`); reordenar es la fase 8.
- Arriba, un enlace "Nuevo producto" (clase `btn btn--primario`) a `/admin/productos/editar`; no hay
  alta en la página.
- Cada fila: nombre; nombre de la categoría o "Sin categoría"; precio con `formatearPrecio` de
  `src/catalogo/presentacion.ts` (su parámetro pasa a `components['schemas']['Precio']`); estado con
  la píldora `.estado--borrador` / `.estado--publicado` del prototipo ("Borrador" / "Publicado");
  "Editar" (enlace a `editar?id=`) y "Borrar", con el nombre en `aria-label`. La foto principal es
  de la fase 7.
- Carga `GET /admin/productos` y `GET /admin/categorias` en paralelo. Vacío: "Todavía no hay
  productos."
- Borrar: "¿Borrar el producto «X»?" con "Se borran también sus medidas y su galería. No se puede
  deshacer."; si está publicado, además "Deja de verse en el catálogo.". Toast "Producto borrado.".

**F6-D3. Formulario del producto.** `<form noValidate>` con el patrón de F5-D3 (error de campo con
foco, aviso general sobre el botón, `401` primero). El `Campo` de `src/admin/` hoy solo arma
`<input>`: la implementación le suma `<select>` y `<textarea>` con el mismo cableado de label, ayuda
y error. Carga en paralelo productos, categorías y tipos de medida.

- `nombre`: 1 a 80 caracteres recortados (`maxLength` 80).
- `precio`: ver F6-D4.
- `categoriaId`: `<select>` con "Sin categoría" (`null`) y las categorías en el orden de la API; al
  lado, "Nueva categoría" y el enlace "Gestionar categorías" (F6-D6).
- `descripcion`: `<textarea>` hasta 400 (`maxLength`); recortada y vacía se manda `null`.
- `medidas`: ver F6-D5.
- Botón "Crear producto" / "Guardar cambios", con "Creando…" / "Guardando…" mientras envía.
- `PATCH` manda solo los campos que cambiaron respecto del producto cargado (`medidas` cuenta como
  cambio si difiere la lista de pares tipo y valor, en orden). Sin cambios no llama a la API y avisa
  "No hay cambios para guardar." en el toast. Motivo: la API "solo cambia lo enviado", así no se
  pisa lo que otro integrante editó en otro campo, y `PATCH` exige al menos un campo. Tras guardar,
  el producto de la respuesta pasa a ser el cargado.
- Errores de la API por código:
  - `CATEGORIA_INEXISTENTE` (`422`): al campo categoría; se recargan las categorías y el select pasa
    a "Sin categoría".
  - `TIPO_MEDIDA_INEXISTENTE` (`422`): al bloque de medidas; se recargan los tipos y las medidas
    cuyo tipo ya no está quedan sin tipo (`tipoMedidaId: null`), como hace el backend al borrar un
    tipo. El texto suma "Revisá las medidas y volvé a guardar."; no se reenvía solo.
  - `PRODUCTO_NO_ENCONTRADO` (`404`): como la carga sin producto de F6-D1.
  - `SOLICITUD_INVALIDA` (`400`) y el resto: aviso general con el `mensaje` de la API. La validación
    del cliente cubre el esquema, así que un `400` indica un caso no previsto.
- Cambios sin guardar: mientras el formulario difiere del cargado, un listener de `beforeunload`
  con `preventDefault()` y `returnValue = true` avisa al salir; se quita al guardar o al volver a
  coincidir (MDN recomienda escucharlo solo con cambios pendientes). Cubre "Volver a productos",
  los enlaces de gestión de F6-D6 y cerrar la pestaña.
- Un producto publicado se edita igual: estas rutas no cambian `estado` y ningún campo del
  formulario puede dejarlo sin imagen principal. El formulario muestra su estado; publicar y volver
  a borrador son de la fase 7.

**F6-D4. Precio en pesos, con centavos opcionales.** Input de texto con `inputMode="decimal"` y el
prefijo "$" del prototipo (`.campo__precio`). Acepta dígitos con, opcionalmente, `,` o `.` y 1 o 2
decimales (`15000`, `15000,5`, `15000,50`), y se convierte a centavos operando sobre el texto, sin
multiplicar un `number` por 100 (`19,99 * 100` da `1998.9999…`). Al editar se muestra
`amount / 100` con coma si hay centavos. Errores: vacío → "Escribí el precio."; formato inválido,
incluido un separador seguido de tres dígitos (`1.500`) → "Escribí el precio en pesos, sin puntos
de miles (ej. 15000 o 15000,50)."; cero → "El precio tiene que ser mayor a 0."; más de
`Number.MAX_SAFE_INTEGER` centavos → "El precio es demasiado alto.". Motivo:

- El prototipo usa `type="number"` en pesos enteros; el contrato y `formatearPrecio` admiten
  centavos, así que un producto con centavos se editaría sin perderlos.
- `type="number"` acepta `e` y `-`, y su separador decimal depende del navegador; en es-AR `1.500`
  es ambiguo, por eso se rechaza en vez de adivinar.
- La conversión va en funciones puras (`pesos → centavos` y `centavos → pesos`) con tests: un error
  de redondeo no se ve a simple vista (§3).

**F6-D5. Medidas.** Bloque con la lista de medidas y una fila para agregar, como el prototipo:

- Cada medida se muestra "Diámetro: 13 cm" (tipo, valor y unidad) con "Quitar" (`aria-label`
  "Quitar medida Diámetro: 13 cm"). Una medida sin tipo muestra su valor y "(sin tipo)": se
  conserva y se puede quitar, pero no se crea desde el formulario.
- Fila de alta: `<select>` "Tipo de medida" con todos los tipos ("Nombre (unidad)"), el campo
  "Valor" y "Agregar" (`type="button"`; Enter en el valor agrega y no envía el formulario). Si el
  tipo elegido ya tiene medida, precarga su valor y el botón dice "Actualizar": reemplaza en su
  lugar. Tras agregar, el select pasa al siguiente tipo sin medida. Así nunca se repite un tipo
  (el `400` no puede ocurrir).
- `valor`: 1 a 30 caracteres recortados. Con unidad, el tipo exige un número (`^\d+([.,]\d+)?$`,
  "Escribí un número, ej. 13 o 13,5."); sin unidad es texto libre. Se guarda tal como se escribió:
  el catálogo público lo muestra así (`textoMedida`). El error va al campo "Valor".
- Hasta 20: con 20, "Agregar" queda deshabilitado con la ayuda "Hasta 20 medidas.".
- Sin tipos: "Todavía no hay tipos de medida." en lugar de la fila, con "Nuevo tipo de medida".
- Las medidas se mandan en el orden de la lista; la API las devuelve igual.

**F6-D6. Crear categoría y tipo de medida desde el formulario.** Botones "Nueva categoría" (junto
al select de categoría) y "Nuevo tipo de medida" (junto a la fila de alta de medidas), cada uno con
un enlace "Gestionar categorías" / "Gestionar tipos de medida" a su página (F5-D1), en la misma
pestaña (el aviso de F6-D3 protege lo no guardado).

- El botón despliega debajo un grupo con el campo "Nombre" (y "Unidad", con `cm` por defecto, en el
  tipo), "Crear" y "Cancelar". Es un `<div role="group">`, no un `<form>`: el HTML Standard no
  permite formularios anidados. Enter en sus campos crea (con `preventDefault`, sin enviar el
  producto); Escape y "Cancelar" lo cierran y devuelven el foco al botón que lo abrió.
- Valida y maneja errores como F5-D3 (`validarNombre`, `esNombreEnUso` de `recursos.ts`;
  `NOMBRE_EN_USO` en su campo).
- Al crear: recarga la lista con `GET`, deja elegida la nueva (en el select de categoría o en el de
  tipo de medida, con el foco en "Valor"), cierra el grupo y avisa "Categoría creada." / "Tipo de
  medida creado.".
- Motivo del botón en lugar de la opción "+ Crear categoría nueva…" del prototipo: el select queda
  como una lista de valores; con la opción, el prototipo tiene que revertir el valor elegido, y con
  el select cerrado las flechas del teclado cambian el valor y disparan `change`, que abriría el
  grupo al recorrer las opciones.

**F6-D7. Estado y código.** Como F5-D6: `useState` y `useEffect` sobre `pedir(apiAdmin…)`, tipos
de `components['schemas']` y cuerpos de `paths`. Las reglas puras (precio, validación de medidas,
cambios para el `PATCH`) van en un módulo de `src/admin/` separado de las islas. La división en
componentes la elige la implementación.

**F6-D8. Validación.** Tests de la conversión de precio (F6-D4), incluidos `19,99` → `1999`, `0,5` →
`50`, `1.500` y `-1` rechazados, y la ida y vuelta de `centavos → pesos`. Contra el backend local,
logueado como owner (F5-D7), con curl:

- alta con categoría y medidas (con y sin tipo) → `201`, `estado: "borrador"`, medidas en orden;
- dos medidas con el mismo `tipoMedidaId` → `400`; `categoriaId` y `tipoMedidaId` inexistentes →
  `422` `CATEGORIA_INEXISTENTE` / `TIPO_MEDIDA_INEXISTENTE`; `precio.amount` 0 o decimal → `400`;
- `PATCH` con solo `precio` no cambia el resto; `PATCH` de `medidas` reemplaza la lista; `PATCH {}`
  → `400`; `PATCH` y `DELETE` de un id inexistente → `404`;
- borrar un tipo usado deja la medida con `tipoMedidaId: null` y el mismo `valor`;
- borrar todo lo creado al terminar.

Además, `astro dev` sirve las dos páginas con `noindex`, la isla y `aria-current` en "Productos".
Lo visual (errores en su campo, foco, alta rápida, medidas, aviso de salida) y el CRUD en
producción van a las verificaciones del usuario.

**Construir:** `/admin/productos` y `/admin/productos/editar` con sus islas (F6-D1 a F6-D3); el precio
y las medidas (F6-D4, F6-D5); el alta rápida de categoría y tipo (F6-D6); "Productos" en la barra
(F6-D1); las variantes `<select>` y `<textarea>` de `Campo` (F6-D3).

**Cerrar cuando:** se crea, edita y borra un producto en producción y los `400`/`422` se muestran de forma legible.

## Implementado

- Páginas `src/pages/admin/productos.astro` y `src/pages/admin/productos/editar.astro`, con las islas
  `src/admin/Productos.tsx` (listado) y `src/admin/EditarProducto.tsx` (formulario, bloque `Medidas` y
  `AltaRapida` de categoría y tipo de medida).
- `src/admin/productos.ts`: reglas puras (precio, validación y edición de medidas, estado del
  formulario, `cambiosPara` del `PATCH`); `productos.test.ts` cubre el precio (F6-D8).
- `Campo.tsx` suma `CampoSelect` (con `junto` para controles al lado del select), `CampoTexto` y la
  prop `prefijo` (el "$" del precio) de `Campo`.
- `Admin.astro`: "Productos" primero en `secciones`; `aria-current` por prefijo.
- `src/api/index.ts` exporta `paths` para tipar los cuerpos; `formatearPrecio` recibe `Precio`.
- `admin.css`: `.seccion__cabecera`, `.seccion__volver`, `.lista__datos`, `.estado--*`, `select` y
  `textarea`, `.campo__precio`, `.chips`/`.chip`, `.medidas__nueva`, `.rapida*`.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Formulario controlado (estado `Formulario` con el texto tal como se escribe), no `FormData` como F5 | El aviso de `beforeunload` y el `PATCH` parcial comparan contra el producto cargado en cada cambio. |
| Precio convertido con `BigInt` sobre el texto | Evita el redondeo de `number` y permite comparar contra `MAX_SAFE_INTEGER` sin perder precisión. |
| El alta rápida es un `<fieldset>` con `<legend>`, no un `<div role="group">` | Biome `a11y/useSemanticElements`; un `fieldset` no es un formulario, así que F6-D6 se cumple igual. |
| Chips de medidas con índice en la `key` (con `biome-ignore`) | Las medidas sin guardar no tienen id y el chip no guarda estado. |
| Tras `TIPO_MEDIDA_INEXISTENTE` el foco va al select "Tipo de medida"; tras `CATEGORIA_INEXISTENTE`, al de categoría | Son los controles para corregir; el error del bloque va en `#medidasError`, que describe el `fieldset`. |
| `hayCambios` compara los textos recortados, incluido el precio como texto | Un precio inválido a medio escribir también cuenta como cambio sin guardar. |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; hints de `FormEvent` deprecado ya existentes), `pnpm test`
  (53, 30 nuevos de precio) y `pnpm build` pasan.
- Contra el backend local (owner, `Origin: http://localhost:4321`), con curl, todos los casos de F6-D8:
  - alta con categoría y medidas (con tipo con unidad, sin unidad y sin tipo) → `201`, `borrador`,
    medidas en orden y `13,5` guardado tal cual;
  - tipo repetido → `400`; categoría y tipo inexistentes → `422` `CATEGORIA_INEXISTENTE` ("La categoría
    elegida no existe.") / `TIPO_MEDIDA_INEXISTENTE` ("Un tipo de medida elegido no existe."); `amount`
    0 y 1.5 → `400`;
  - `PATCH` de solo `precio` conserva el resto; `PATCH` de `medidas` reemplaza la lista; `PATCH {}` →
    `400`; `PATCH` y `DELETE` de `no-existe` → `404` ("No existe ese producto.");
  - borrar un tipo usado deja la medida con `tipoMedidaId: null` y el mismo `valor`;
  - todo lo creado se borró; productos, tipos y categorías quedaron vacíos.
- `astro dev`: `/admin/productos` y `/admin/productos/editar` responden `200` con `noindex`, su isla y
  `aria-current` en "Productos"; `/admin/categorias` sigue marcando solo "Categorías".

## Desvíos

- Las islas no se probaron en el navegador (errores en su campo, foco, alta rápida, medidas, aviso de
  salida): ver las verificaciones del usuario.
- Si la sesión vence con cambios sin guardar, la redirección al login dispara también el aviso de
  `beforeunload`; se dejó así porque avisa que se pierden los cambios.

## Verificaciones del usuario

Después del push a `main` (con las fases 4 y 5 desplegadas), logueado en `admin.*/admin`:

1. La barra muestra "Productos" primero; queda marcado en `/admin/productos` y en `/admin/productos/editar`.
2. `/admin/productos` vacío dice "Todavía no hay productos."; "Nuevo producto" abre el formulario.
3. "Crear producto" vacío: "Escribí un nombre." en el nombre con foco. Con nombre, probar precios `1.500`
   (error de formato), `0` ("mayor a 0") y `19,99`.
4. "Nueva categoría" abre el grupo con foco en "Nombre"; Escape lo cierra y devuelve el foco al botón.
   Crear "Prueba F6" con Enter: toast "Categoría creada.", queda elegida y el producto no se envía.
   Repetir el nombre: "Ya existe una categoría con ese nombre." en su campo.
5. "Nuevo tipo de medida": crear "Alto F6" (unidad `cm`); queda elegido con el foco en "Valor". Escribir
   `abc` + Enter: "Escribí un número, ej. 13 o 13,5."; `13,5` + Enter agrega el chip "Alto F6: 13,5 cm"
   sin enviar el formulario. Elegir de nuevo "Alto F6": precarga `13,5` y el botón dice "Actualizar".
6. "Crear producto": toast "Producto creado.", la URL pasa a `?id=…`, el título es el nombre y el estado
   "Borrador". "Guardar cambios" sin tocar nada: toast "No hay cambios para guardar.".
7. Cambiar el precio y tratar de cerrar la pestaña: el navegador avisa. Guardar: toast "Producto
   guardado." y ya no avisa. Recargar: el precio se muestra con coma (`19,99`).
8. En otra pestaña, borrar "Alto F6" en tipos de medida; volver y quitar/agregar algo para guardar con esa
   medida: si el tipo ya no está, el chip dice "13,5 (sin tipo)". Idem categoría: borrar "Prueba F6" y
   guardar con ella elegida → el error va al select, que pasa a "Sin categoría".
9. En el listado, la fila muestra nombre, categoría, precio `$19,99` y "Borrador"; "Borrar" pregunta
   "¿Borrar el producto «…»?" con el detalle de medidas y galería; al confirmar, toast "Producto borrado.".
10. `/admin/productos/editar?id=no-existe` muestra "No existe ese producto." y "Volver a productos".
11. Con Tab se recorren todos los campos, chips y botones con el foco visible.
12. Borrar lo creado para la prueba (producto, categoría y tipo).
