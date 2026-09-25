# Avance por fases

Estado de las fases del [PRD](../PRD.md). Cada fase cerrada tiene su registro con las decisiones
tomadas (y su porqué) y las validaciones ejecutadas.

| Fase | Estado | Registro |
| --- | --- | --- |
| 0. Preparación externa | ✅ Cerrada (2026-09-24) | Pasos del usuario, sin registro de código. |
| 1. Decisiones y esquema | ✅ Cerrada (2026-09-25) | [fase-1.md](./fase-1.md) |
| 2. Capa de API tipada | ⏳ Pendiente | |
| 3. Sitio público | ⏳ Pendiente | |
| 4. Login y sesión | ⏳ Pendiente | |
| 5. Categorías y tipos de medida | ⏳ Pendiente | |
| 6. Productos con medidas | ⏳ Pendiente | |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

**Siguiente:** implementar la fase 2 (prompt 6.2). Leer su definición en el PRD y D3 de la fase 1;
no tiene decisiones abiertas.

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 7

- Probar la subida de imágenes desde el browser: primer uso real del CORS de R2 con `ADMIN_ORIGIN`.

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
