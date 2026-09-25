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
| 10. Limpieza y cierre | 🔎 Implementada (2026-09-25) | [fase-10.md](./fase-10.md) |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** que el usuario confirme las verificaciones de la fase 10 (cargar el catálogo en
producción antes del push); con eso se cierra el plan. Después, cualquier trabajo sale de "Mejoras
opcionales": leé este archivo, el [PRD](../PRD.md) y el `fase-N.md` de la fase que toque la mejora.

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push). Los pasos exactos
están en la sección "Verificaciones del usuario" de cada `fase-N.md`. Al confirmarlas todas, se
borra esa sección y su línea de acá, y la fase pasa a "✅ Cerrada".

- Fase 10: cargar el catálogo en producción, push, y ver el catálogo nuevo en la raíz y en `www`
  ([pasos](./fase-10.md#verificaciones-del-usuario)).

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
- Glosario del backend (`CONTEXT.md`, sección Acceso): sumar **Desactivado**, "integrante que ya no
  puede iniciar sesión ni recibir correos de contraseña; no se reactiva y conserva su email"
  (_Evitar_: dado de baja, borrado, inactivo). El contrato dice que el correo "activa" a un editor
  recién creado, que ya tiene `activo: true`; conviene "define su contraseña" (F9-D4).
- Reactivar un editor desactivado y saber si un editor ya definió su contraseña, para mostrarlo en
  `/admin/integrantes` (requiere cambio en el backend; hoy F9-D3 muestra solo activo o desactivado).
- En el formulario de producto, tras "Nueva categoría" con un nombre repetido, el grupo queda abierto
  con "Ya existe una categoría con ese nombre." aun después de crear el producto; y el error de precio
  ("El precio tiene que ser mayor a 0.") sigue visible después de corregir el valor, hasta enviar.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
