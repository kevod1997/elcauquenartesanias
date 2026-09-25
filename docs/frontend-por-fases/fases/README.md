# Avance por fases

Estado de las fases del [PRD](../PRD.md). Cada fase cerrada tiene su registro con las decisiones
tomadas (y su porqué) y las validaciones ejecutadas.

| Fase | Estado | Registro |
| --- | --- | --- |
| 0. Preparación externa | ✅ Cerrada (2026-09-24) | Pasos del usuario, sin registro de código. |
| 1. Decisiones y esquema | ✅ Cerrada (2026-09-25) | [fase-1.md](./fase-1.md) |
| 2. Capa de API tipada | ✅ Cerrada (2026-09-25) | [fase-2.md](./fase-2.md) |
| 3. Sitio público | ✅ Cerrada (2026-09-25) | [fase-3.md](./fase-3.md) |
| 4. Login y sesión | ⏳ Pendiente | |
| 5. Categorías y tipos de medida | ⏳ Pendiente | |
| 6. Productos con medidas | ⏳ Pendiente | |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** fase 4 (login y sesión), que deja abierto el tipado de `/api/auth/*` (D3). Para usar la API, leé los
tipos y las decisiones de [fase-2.md](./fase-2.md). Las fases 4 a 9 pueden correr sin supervisión
con el loop de [§6.4 del PRD](../PRD.md#64-loop-sin-supervisión).

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push), agrupadas por
fase, con los pasos exactos. Al confirmar todas las de una fase, se borra su grupo y la fase pasa
a "✅ Cerrada".

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 7

- Probar la subida de imágenes desde el browser: primer uso real del CORS de R2 con `ADMIN_ORIGIN`.

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
- Corregir los textos del sitio actual que `/catalogo-nuevo` copia tal cual: "Piezas unicas"
  (sin tilde) en el hero y la `description`, y "hechas a mano en Hechas a mano" en la `description`.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
