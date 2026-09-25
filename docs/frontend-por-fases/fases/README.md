# Avance por fases

Estado de las fases del [PRD](../PRD.md). Cada fase cerrada tiene su registro con las decisiones
tomadas (y su porqué) y las validaciones ejecutadas.

| Fase | Estado | Registro |
| --- | --- | --- |
| 0. Preparación externa | ✅ Cerrada (2026-09-24) | Pasos del usuario, sin registro de código. |
| 1. Decisiones y esquema | ✅ Cerrada (2026-09-25) | [fase-1.md](./fase-1.md) |
| 2. Capa de API tipada | ✅ Cerrada (2026-09-25) | [fase-2.md](./fase-2.md) |
| 3. Sitio público | ✅ Cerrada (2026-09-25) | [fase-3.md](./fase-3.md) |
| 4. Login y sesión | 🔎 Implementada (2026-09-25) | [fase-4.md](./fase-4.md) |
| 5. Categorías y tipos de medida | 🔎 Implementada (2026-09-25) | [fase-5.md](./fase-5.md) |
| 6. Productos con medidas | 🔎 Implementada (2026-09-25) | [fase-6.md](./fase-6.md) |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** preparar la fase 7 (galería) o la 8 (orden) con el prompt 6.1 del PRD; las dos
dependen solo de la 6. Leé [fase-6.md](./fase-6.md): `EditarProducto.tsx` es el formulario donde van la
galería, publicar y volver a borrador, y `Productos.tsx` el listado donde van la foto principal y el
reordenamiento. Para el patrón del admin, [fase-5.md](./fase-5.md); para la API, [fase-2.md](./fase-2.md).

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push), agrupadas por
fase, con los pasos exactos. Al confirmar todas las de una fase, se borra su grupo y la fase pasa
a "✅ Cerrada".

### Fase 4

Después del push a `main` y del paso "Hacer (usuario)" de la fase 4 (dominio `admin.*` en Vercel,
CNAME "DNS only" en Cloudflare, `ADMIN_ORIGIN` y `RESET_PASSWORD_URL` en Railway):

1. Redirects (F4-D1): `https://admin.elcauquenartesanias.com.ar/` lleva a `/admin`;
   `/restablecer?token=abc` lleva a `/admin/restablecer?token=abc`;
   `https://elcauquenartesanias.com.ar/admin/ingresar` lleva a `admin.*/admin/ingresar`; `/` y
   `/catalogo-nuevo` del dominio principal siguen igual. Si ninguno redirige, Vercel no tomó los
   `redirects` de `vercel.json` (ver desvíos de [fase-4.md](./fase-4.md)).
2. Guard: en una ventana privada, `admin.*/admin` redirige a `/admin/ingresar?volver=%2Fadmin`.
3. Login: con las credenciales del owner real, entra y vuelve a `/admin` con su nombre en la barra.
   Una contraseña mala muestra "El email o la contraseña no son correctos." sobre el botón.
4. Con sesión, abrir `/admin/ingresar` lleva directo a `/admin`.
5. "Cerrar sesión" lleva a `/admin/ingresar`, y `/admin` vuelve a pedir login.
6. Reset: en `/admin/restablecer`, pedir el enlace con el email del owner; llega el mail, el enlace
   abre `admin.*/admin/restablecer?token=…`. Probar dos contraseñas distintas (error debajo del
   segundo campo, con foco) y después una válida; el aviso de éxito enlaza al login y la contraseña
   nueva funciona. Volver a abrir el mismo enlace y enviar: muestra "El enlace venció o ya se usó".
7. Teclado: con Tab se recorren los campos y botones con el foco visible.

### Fase 5

Después del push a `main` (y con la fase 4 desplegada), logueado en `admin.*/admin`:

1. La barra muestra "Categorías" y "Tipos de medida"; el de la página actual queda marcado.
2. En `/admin/categorias`, crear "Prueba F5": aparece en la lista y un toast dice "Categoría creada.".
3. Crear "PRUEBA f5": el error "Ya existe una categoría con ese nombre." queda debajo del campo, con
   borde rojo y el foco en el campo; lo tipeado se conserva.
4. "Editar" en "Prueba F5": la fila pasa a formulario con el foco en el nombre. Escape cancela y el
   foco vuelve a "Editar". Renombrar a "Prueba F5 bis" con Enter: toast "Categoría renombrada.".
5. "Borrar": el diálogo pregunta "¿Borrar la categoría «Prueba F5 bis»?" con el foco en "Cancelar";
   Escape cancela. Otra vez "Borrar" → "Borrar": desaparece, toast "Categoría borrada.", foco en el título.
6. En `/admin/tipos-de-medida`, repetir 2 a 5 con un tipo: el alta trae `cm`; con la unidad vacía,
   la fila dice "sin unidad: texto libre"; editar vaciando la unidad la quita.
7. Con Tab se recorren nav, campos y botones con el foco visible.
8. Opcional: con la red cortada (DevTools, Offline), "Cerrar sesión" muestra el error en un toast
   rojo con "Cerrar", sin `alert`.

### Fase 6

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

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 7

- Probar la subida de imágenes desde el browser: primer uso real del CORS de R2 con `ADMIN_ORIGIN`.
- La galería, publicar y volver a borrador van en el formulario `/admin/productos/editar?id=`
  (F6-D1), y la foto principal en las filas de `/admin/productos` (F6-D2). Un producto nuevo tiene
  id recién después de "Crear producto".

### Fase 8

- El listado de `/admin/productos` (F6-D2) ya muestra el orden global; reordenar se suma ahí.

### Fase 9

- Mostrar "Integrantes" en la barra solo al `owner`, con el `rol` que el layout deja en
  `data-rol` de `#barra` (F4-D3). El editor activa su cuenta en `/admin/restablecer?token=…` (F4-D4).

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
- Corregir los textos del sitio actual que `/catalogo-nuevo` copia tal cual: "Piezas unicas"
  (sin tilde) en el hero y la `description`, y "hechas a mano en Hechas a mano" en la `description`.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
