# Avance por fases

Estado de las fases del [PRD](../PRD.md). Cada `fase-N.md` tiene la definición de la fase
(decisiones FN-Dk, construir, cerrar cuando) y, una vez implementada, su registro con las
decisiones técnicas y las validaciones ejecutadas.

| Fase | Estado | Registro |
| --- | --- | --- |
| 0. Preparación externa | ✅ Cerrada (2026-09-24) | Pasos del usuario, sin registro de código. |
| 1. Decisiones y esquema | ✅ Cerrada (2026-09-25) | [fase-1.md](./fase-1.md) |
| 2. Capa de API tipada | ✅ Cerrada (2026-09-25) | [fase-2.md](./fase-2.md) |
| 3. Sitio público | ✅ Cerrada (2026-09-25) | [fase-3.md](./fase-3.md) |
| 4. Login y sesión | ✅ Cerrada (2026-09-25) | [fase-4.md](./fase-4.md) |
| 5. Categorías y tipos de medida | ✅ Cerrada (2026-09-25) | [fase-5.md](./fase-5.md) |
| 6. Productos con medidas | ✅ Cerrada (2026-09-25) | [fase-6.md](./fase-6.md) |
| 7. Galería e imágenes | ✅ Cerrada (2026-09-25) | [fase-7.md](./fase-7.md) |
| 8. Orden | ✅ Cerrada (2026-09-25) | [fase-8.md](./fase-8.md) |
| 9. Integrantes | ✅ Cerrada (2026-09-25) | [fase-9.md](./fase-9.md) |
| 10. Limpieza y cierre | ✅ Cerrada (2026-09-25) | [fase-10.md](./fase-10.md) |
| 11. Mejoras opcionales del front | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** preparar la fase 11 (mejoras opcionales del front) con el prompt 6.1 de
[prompts.md](../prompts.md) y después implementarla con 6.2; leé [fase-11.md](./fase-11.md), el
[PRD](../PRD.md) y, para cada mejora, el registro de la fase que la originó (3 para el catálogo, 6
para el formulario de producto). Depende de la 10, cerrada.

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

- ¿Entran en la fase 11 la página por producto (`GET /api/productos/:id`) y el filtro por categoría
  (`GET /api/categorias`) del catálogo público? Quedaron fuera de la fase 3 por F3-D1; hasta decidir,
  siguen en "Mejoras opcionales".

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push). Los pasos exactos
están en la sección "Verificaciones del usuario" de cada `fase-N.md`. Al confirmarlas todas, se
borra esa sección y su línea de acá, y la fase pasa a "✅ Cerrada".

Ninguna.

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 11

- Páginas 404 y 500 propias, y los dos mensajes del formulario de producto que no se limpian
  ([fase-11.md](./fase-11.md)).

### Mejoras opcionales (sin fase)

Requieren cambios en el backend, fuera del alcance del front (PRD §2):

- Ancho y alto de cada derivado en la galería pública.
- Glosario del backend (`CONTEXT.md`, sección Acceso): sumar **Desactivado**, "integrante que ya no
  puede iniciar sesión ni recibir correos de contraseña; no se reactiva y conserva su email"
  (_Evitar_: dado de baja, borrado, inactivo). El contrato dice que el correo "activa" a un editor
  recién creado, que ya tiene `activo: true`; conviene "define su contraseña" (F9-D4).
- Reactivar un editor desactivado y saber si un editor ya definió su contraseña, para mostrarlo en
  `/admin/integrantes` (hoy F9-D3 muestra solo activo o desactivado).

Solo front, pendientes de decisión del usuario (ver "Decisiones para el usuario"):

- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
