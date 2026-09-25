# Avance por fases

Estado de las fases del [PRD](../PRD.md). Cada fase cerrada tiene su registro con las decisiones
tomadas (y su porqué) y las validaciones ejecutadas.

| Fase | Estado | Registro |
| --- | --- | --- |
| 0. Preparación externa | ✅ Cerrada (2026-09-24) | Pasos del usuario, sin registro de código. |
| 1. Decisiones y esquema | 🟡 Implementada; falta confirmar el deploy | [fase-1.md](./fase-1.md) |
| 2. Capa de API tipada | ⏳ Pendiente | |
| 3. Sitio público | ⏳ Pendiente | |
| 4. Login y sesión | ⏳ Pendiente | |
| 5. Categorías y tipos de medida | ⏳ Pendiente | |
| 6. Productos con medidas | ⏳ Pendiente | |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

**Siguiente:** cerrar la fase 1 con los pasos del usuario de abajo. Después, la fase 2 (prompt 6.2):
leer su definición en el PRD, D3 de la fase 1 y `AGENTS.md`; la fase 2 no tiene decisiones abiertas.

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 1 (usuario, en este orden)

- Borrar `docs/research/hono-better-auth-postgres.md` (copia del backend).
- Confirmar en incógnito o con recarga forzada que se ven fotos, logo, fuentes y favicon; producción
  ya responde 200 en todo `public/assets/`.

### Fase 7

- Probar la subida de imágenes desde el browser: primer uso real del CORS de R2 con `ADMIN_ORIGIN`.

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
