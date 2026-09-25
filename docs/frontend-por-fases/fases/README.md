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
| 6. Productos con medidas | ⏳ Pendiente (preparada 2026-09-25) | [fase-6.md](./fase-6.md) |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** implementar la fase 6 con el prompt 6.2 del PRD. Leé la fase 6 del PRD (F6-D1 a
F6-D8) y [fase-5.md](./fase-5.md), que lista el patrón del admin a reusar (`Campo.tsx`,
`confirmar.ts`, `avisos.ts`, `recursos.ts`, la lista `secciones` de `Admin.astro`);
`Categorias.tsx` es el ejemplo completo de listado y formulario. Los estilos del formulario de
producto (`.campo__precio`, `.estado--*`, `.chip`) están en `admin/admin.css` del prototipo. Para
la API, [fase-2.md](./fase-2.md).

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
