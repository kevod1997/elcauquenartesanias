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
| 12. Admin mobile y orden con arrastre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** implementar la fase 11 (mejoras opcionales del front) con el prompt 6.2 de
[prompts.md](../prompts.md), según F11-D1 a F11-D6 de [fase-11.md](./fase-11.md). Depende de la 10,
cerrada. Después, la fase 12 (depende de la 11).

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push). Los pasos exactos
están en la sección "Verificaciones del usuario" de cada `fase-N.md`. Al confirmarlas todas, se
borra esa sección y su línea de acá, y la fase pasa a "✅ Cerrada".

Ninguna.

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 12

- Admin mobile (checklist, navbar con pestañas abajo, listas como tarjetas) y el orden del catálogo
  en una grilla que se arrastra, con texto explicativo ([fase-12.md](./fase-12.md)).

### Mejoras opcionales (sin fase)

- Requieren cambios en el backend (fuera del alcance del front, PRD §2): ancho y alto de cada
  derivado, "Desactivado" y "define su contraseña" en el glosario, y reactivar un editor y saber si
  definió su contraseña. Se retoman desde
  [`../elcauquen-backend/docs/handoff-frontend-2026-09-25.md`](../../../../elcauquen-backend/docs/handoff-frontend-2026-09-25.md);
  al desplegarse, el front corre `pnpm gen:api` y las implementa en una fase nueva.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 (F3-D1) y de la fase 11, por decisión del usuario
  (2026-09-25).
