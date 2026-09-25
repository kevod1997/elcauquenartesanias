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
| 5. Categorías y tipos de medida | ⏳ Pendiente (preparada 2026-09-25) | [fase-5.md](./fase-5.md) |
| 6. Productos con medidas | ⏳ Pendiente | |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** implementar la fase 5 con el prompt 6.2 del PRD. Leé la fase 5 del PRD (F5-D1 a
F5-D7, que fijan el patrón de listado, formularios, confirmación y avisos del admin) y
[fase-4.md](./fase-4.md) (layout, `sesion.ts` con `exigirSesion` y `redirigirSiNoAutenticado`,
`mensajes.ts`, `Restablecer.tsx` como base de formulario); para la API, [fase-2.md](./fase-2.md).
Los estilos a portar están en `admin/admin.css` del prototipo.

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

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 6

- Crear una categoría o un tipo de medida desde el formulario de producto, como el prototipo, y
  enlazar a `/admin/categorias` y `/admin/tipos-de-medida` (F5-D1). Reusar el patrón F5-D2 a F5-D5.

### Fase 7

- Probar la subida de imágenes desde el browser: primer uso real del CORS de R2 con `ADMIN_ORIGIN`.

### Fase 9

- Mostrar "Integrantes" en la barra solo al `owner`, con el `rol` que el layout deja en
  `data-rol` de `#barra` (F4-D3). El editor activa su cuenta en `/admin/restablecer?token=…` (F4-D4).

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
- Corregir los textos del sitio actual que `/catalogo-nuevo` copia tal cual: "Piezas unicas"
  (sin tilde) en el hero y la `description`, y "hechas a mano en Hechas a mano" en la `description`.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
