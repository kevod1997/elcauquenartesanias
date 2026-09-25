# Fase 5 — Categorías y tipos de medida

## Definición

Decisiones cerradas en la preparación (2026-09-25), todas técnicas y sin cambios de producto ni de
contrato. Fuentes: §Categorías y §Tipos de medida de `contrato-api-borrador.md`; las rutas
`/admin/categorias*` y `/admin/tipos-medida*` y los componentes `Categoria` y `TipoMedida` de
`openapi.json`; los mensajes de `elcauquen-backend/src/catalogo/{categorias,tipos-medida}.ts`; el
prototipo (`admin/index.html`, `admin/admin.js`: modal "Categorías y medidas", `confirmar()` y
`mostrarToast()`); el [`<dialog>` de MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog),
el algoritmo [close the dialog](https://html.spec.whatwg.org/multipage/interactive-elements.html#close-the-dialog)
del HTML Standard y las [live regions de MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions).

Las F5-D2 a F5-D6 son el **patrón del admin**: las fases 6 a 9 lo reusan y documentan solo sus
desvíos.

**F5-D1. Una página por recurso: `/admin/categorias` y `/admin/tipos-de-medida`.** Cada una es
protegida, prerenderizada y con una sola isla (D1). La barra del layout suma un `<nav>` con
"Categorías" y "Tipos de medida"; el enlace de la página actual lleva `aria-current="page"`
(comparando `Astro.url.pathname` sin la barra final). La fase 6 suma "Productos" y la 9,
"Integrantes" (F4-D3). La UI dice "tipo de medida", nunca "medidas" a secas: en el glosario, una
medida es el valor de un producto. Motivo:

- El prototipo junta los dos en un modal con pestañas porque es una sola página. Con rutas, cada
  recurso tiene su URL (para `?volver=` de F4-D3 y para enlazarlo desde el formulario de producto
  de la fase 6, como el "Gestionar categorías" del prototipo) y su isla queda chica.
- Las rutas siguen a la API (`/admin/categorias`, `/admin/tipos-medida`).

Crear una categoría o un tipo desde el formulario de producto queda para la fase 6.

**F5-D2. Listado.** Cada página: título, formulario de alta arriba y la lista (`<ul>`) debajo.

- El orden es el de la API (por nombre, sin distinguir mayúsculas); el front no reordena.
- Cada fila muestra el nombre (y la unidad del tipo, o "sin unidad: texto libre") y los botones
  "Editar" y "Borrar", con nombre accesible que incluye el ítem (`aria-label="Editar Mates"`).
- "Editar" cambia la fila por el formulario de edición, con "Guardar" y "Cancelar"; Escape cancela.
  Una sola fila en edición a la vez. Se guarda solo con "Guardar" o Enter, no al perder el foco
  como el prototipo: un error de la API tiene que quedar en el campo.
- Tras crear, editar o borrar, se vuelve a pedir el listado con `GET`, sin insertar a mano: el
  orden lo define la collation del servidor, y así aparecen los cambios de otro integrante. La lista
  anterior queda visible mientras recarga.
- Vacía: "Todavía no hay categorías." (o "tipos de medida"). Primera carga: "Cargando…" después de
  `exigirSesion()`.
- Los errores de cargar o borrar se muestran en un `aviso--error` con `role="alert"` sobre la lista.

**F5-D3. Formularios y errores.** Sobre la base de la fase 4 (`Restablecer.tsx`):

- `<form noValidate onSubmit>`. El cliente valida lo que exige el esquema de `openapi.json`, con
  los valores recortados: `nombre` de 1 a 40 caracteres, `unidad` hasta 10 (vacía se manda `null`).
  Los inputs llevan `maxLength` 40 y 10 (el prototipo usa 30 y 8; manda el contrato).
- El nombre repetido no se compara en el cliente contra la lista: lo decide el `409`, que cubre las
  altas simultáneas y la regla de mayúsculas del servidor.
- Error de campo: el formulario mapea código a campo (`NOMBRE_EN_USO` → `nombre`). El texto va en un
  `campo__error` ligado con `aria-describedby`, el input queda con `aria-invalid` y recibe el foco.
  El texto es el de `mensajeDeError`, que para estos códigos da el `mensaje` de la API ("Ya existe
  una categoría con ese nombre.").
- Error sin campo (`SIN_CONEXION`, `SOLICITUD_INVALIDA` inesperado, `ERROR_INTERNO`, `503`,
  `RESPUESTA_INESPERADA`): `aviso--error` con `role="alert"` sobre el botón, hasta el próximo envío.
  Lo tipeado se conserva.
- `401` en cualquier llamada: `redirigirSiNoAutenticado(error)` primero (F4-D3).
- `404` (`CATEGORIA_NO_ENCONTRADA`, `TIPO_MEDIDA_NO_ENCONTRADO`) al editar o borrar: otro integrante
  lo borró. Se recarga el listado y se muestra el mensaje de la API en el aviso de la lista.
- Mientras envía, el botón queda deshabilitado con "Guardando…" (o "Creando…"): evita la doble alta.
- `PATCH` de un tipo manda `nombre` y `unidad` juntos; `unidad` vacía la quita (`null`).
- El alta de un tipo trae `cm` en la unidad, como el prototipo, con la ayuda "Dejala vacía para un
  valor de texto libre (ej. Talla única)".

El campo (label, input, ayuda y error) es un componente compartido de `src/admin/`; el nombre lo
elige la implementación.

**F5-D4. Confirmación de borrado con `<dialog>` y `showModal()`,** en un componente compartido
que devuelve si se confirmó, como `confirmar()` del prototipo. Sus estilos (`.confirmar`,
`.btn--peligro-solido`) y los del toast (`.toast`) se portan de `admin/admin.css` a
`src/admin/admin.css`.

- Textos: "¿Borrar la categoría «X»?" con "Los productos que la usan quedan sin categoría.", y
  "¿Borrar el tipo de medida «X»?" con "Las medidas de ese tipo quedan en sus productos, sin tipo."
  Botones "Cancelar" y "Borrar" (`btn--peligro-solido`), "Cancelar" primero en el DOM.
- `showModal()` enfoca el primer control (MDN), así que el foco inicial cae en "Cancelar" sin
  `autoFocus` (Biome marca `a11y/noAutofocus`). Escape dispara `cancel` y cuenta como cancelar.
- Al cerrar un modal, el navegador devuelve el foco al elemento que lo abrió (HTML Standard). Tras
  un borrado exitoso esa fila ya no existe, así que el foco va al título de la sección
  (`tabIndex={-1}`).
- El diálogo solo confirma: el `DELETE` corre después, y su error va al aviso de la lista (F5-D2).

**F5-D5. Avisos de éxito en un toast del layout, y "Cerrar sesión" sin `alert`.**

- `Admin.astro` incluye en el markup inicial una región vacía `role="status"` con
  `aria-live="polite"` y la clase `.toast` del prototipo. MDN: una live region tiene que existir
  antes de cambiar su contenido para que se anuncie.
- Un módulo `src/admin/avisos.ts` con DOM directo (sin React) expone `avisar(texto, tipo)`, que usan
  el script del layout y las islas. `ok` se oculta a los 4 s; `error` queda hasta el próximo aviso o
  hasta que se toca su botón "Cerrar".
- Éxitos: "Categoría creada.", "Categoría renombrada.", "Categoría borrada."; "Tipo de medida
  creado.", "…editado.", "…borrado.".
- Los errores de un formulario van en el formulario (F5-D3), no en el toast, que desaparece.
- "Cerrar sesión" fallido llama a `avisar(mensajeDeError(error), 'error')` en lugar de `alert`.

**F5-D6. Estado con `useState` y `useEffect` sobre `pedir(apiAdmin…)`, sin librería de datos.**
Se descartan TanStack Query, SWR y `useActionState`. Son pocas llamadas y la lista se recarga
entera tras cada cambio, igual que las islas de la fase 4. Los tipos salen de
`components['schemas']` (`Categoria`, `TipoMedida`) y los cuerpos, de `paths`.

**F5-D7. Validación.** Sin tests nuevos: la traducción de errores ya tiene los suyos y esta fase no
agrega lógica de estado que no se vea (§3). Contra el backend local, logueado como owner (una
sesión con cookie, como en la fase 4), comprobar con llamadas a la API:

- alta, y alta con otra grafía del mismo nombre → `409 NOMBRE_EN_USO`;
- renombrar a otra grafía del propio nombre → `200`, y al nombre de otra → `409`;
- un tipo con `unidad: ""` queda con `null`, y `PATCH` con `unidad: null` la quita;
- `PATCH` y `DELETE` de un id inexistente → `404`;
- borrar, y borrar al terminar todo lo creado.

Además, `astro dev` sirve las dos páginas con `noindex` y la isla. Lo visual (error en el campo con
foco, diálogo, toast, teclado, `aria-current`) y el CRUD en producción van a las verificaciones del
usuario.

**Construir:** `/admin/categorias` y `/admin/tipos-de-medida` con sus islas (F5-D1, F5-D2); los
componentes compartidos de campo y confirmación (F5-D3, F5-D4); `src/admin/avisos.ts` y el toast
del layout, que reemplaza el `alert` de "Cerrar sesión" (F5-D5); el `<nav>` de la barra (F5-D1).

**Cerrar cuando:** se crea, edita y borra en producción, y el error de nombre repetido se muestra en el campo.

## Implementado

- Páginas `src/pages/admin/{categorias,tipos-de-medida}.astro`, con las islas `Categorias.tsx` y
  `TiposDeMedida.tsx` (alta, lista, edición en la fila, borrado con confirmación).
- Patrón del admin que reusan las fases 6 a 9:
  - `src/admin/Campo.tsx`: label, input, ayuda y error, con `aria-describedby`, `aria-invalid` y `ref`.
  - `src/admin/confirmar.ts`: `confirmar({ titulo, detalle, accion? })` → `Promise<boolean>`.
  - `src/admin/avisos.ts`: `avisar(texto, 'ok' | 'error')` sobre el `#toast` del layout.
  - `src/admin/recursos.ts`: límites del esquema, `validarNombre`, `esNombreEnUso`, `esNoEncontrado`
    y `enfocarEditar` (foco al "Editar" de la fila al salir de la edición).
- `Admin.astro`: `<nav>` con `aria-current` (lista `secciones`, donde las fases 6 y 9 suman su
  enlace), región `#toast` y "Cerrar sesión" con `avisar` en lugar de `alert`.
- `admin.css`: navegación, `btn--peligro`, `btn--peligro-solido`, `btn--chico`, listado (`.seccion`,
  `.alta`, `.lista*`), `.confirmar` y `.toast` (con `.toast--error` y `.toast__cerrar`).

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| `confirmar` y `avisar` con DOM directo, fuera de React | Los usa también el script del layout; un `<dialog>` creado al llamar y borrado al cerrar no necesita estado en la isla. |
| Una isla por recurso, con código parecido, en lugar de un componente genérico | Tipos de medida suma `unidad`; un genérico parametrizado costaba más que la repetición. Lo común está en `recursos.ts` y `Campo.tsx`. |
| `ref` como prop en `Campo` (React 19), sin `forwardRef` | Para enfocar el input con error (F5-D3). |
| El formulario de edición enfoca su nombre al abrirse con `useEffect`, sin `autoFocus` | Biome `a11y/noAutofocus`. |
| La unidad mayor a 10 no se valida aparte | El `maxLength` del input no deja escribirla. |
| El `.toast` visible recibe `pointer-events: auto` | El prototipo lo tenía en `none`; el aviso de error necesita su botón "Cerrar". |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; hints de `FormEvent` deprecado, como en la fase 4),
  `pnpm test` (23, sin tests nuevos por F5-D7) y `pnpm build` pasan. El HTML generado de
  `/admin/categorias` trae `noindex`, la isla, el `#toast` y `aria-current="page"` en su enlace.
- Contra el backend local (owner, cookie de `sign-in/email`, `Origin: http://localhost:4321`), con curl:
  - alta con espacios → `201` recortado; `FASE5 MATES` → `409 NOMBRE_EN_USO` ("Ya existe una categoría con ese nombre.");
  - renombrar a `fase5 mates` → `200`; a `fase5 OTRA` (otra existente) → `409`;
  - tipo con `unidad: ""` → `null`; `PATCH` con `unidad: null` quita `cm`; alta de tipo repetido → `409`;
  - `PATCH` y `DELETE` de `no-existe` → `404` `CATEGORIA_NO_ENCONTRADA` / `TIPO_MEDIDA_NO_ENCONTRADO`;
  - borrado de todo lo creado → `204`; los dos listados quedaron vacíos.
- `astro dev`: `/admin/categorias` y `/admin/tipos-de-medida` responden `200` con `noindex`, la isla
  y `aria-current` en el enlace propio.
- En `admin.*` (2026-09-25), el usuario dio la fase por verificada con lo que se probó en las fases 6
  y 7: alta y borrado de tipos de medida y de una categoría, con su diálogo (foco en "Cancelar",
  aviso de que los productos quedan sin categoría) y su toast "Categoría borrada.", más el error
  "Ya existe una categoría con ese nombre." (probado desde el formulario de producto). Renombrar, la
  unidad vacía, Escape y la red cortada no se probaron en producción.

## Desvíos

- Un nombre con tilde mandado por curl desde Git Bash llegó mal codificado ("Di�metro"): es la
  codificación del argumento de la shell de Windows, no del front ni de la API.
