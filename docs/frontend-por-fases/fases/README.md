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
| 4. Login y sesión | 🔎 Implementada (2026-09-25) | [fase-4.md](./fase-4.md) |
| 5. Categorías y tipos de medida | 🔎 Implementada (2026-09-25) | [fase-5.md](./fase-5.md) |
| 6. Productos con medidas | 🔎 Implementada (2026-09-25) | [fase-6.md](./fase-6.md) |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** implementar la fase 7 con el prompt 6.2 de [prompts.md](../prompts.md): su definición
([fase-7.md](./fase-7.md), F7-D1 a F7-D12) ya está cerrada. Leé [fase-6.md](./fase-6.md) (formulario y
listado donde se suma la galería) y, para la API, [fase-2.md](./fase-2.md). La fase 8 (orden) sigue sin
preparar (prompt 6.1) y también depende solo de la 6.

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push). Los pasos exactos
están en la sección "Verificaciones del usuario" de cada `fase-N.md`. Al confirmarlas todas, se
borra esa sección y su línea de acá, y la fase pasa a "✅ Cerrada".

- [Fase 4](./fase-4.md#verificaciones-del-usuario)
- [Fase 5](./fase-5.md#verificaciones-del-usuario)
- [Fase 6](./fase-6.md#verificaciones-del-usuario)

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

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
