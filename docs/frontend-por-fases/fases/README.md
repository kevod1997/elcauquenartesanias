# Avance por fases

Estado de las fases del [PRD](../PRD.md). Cada fase cerrada tiene su registro con las decisiones
tomadas (y su porqué) y las validaciones ejecutadas.

| Fase | Estado | Registro |
| --- | --- | --- |
| 0. Preparación externa | ✅ Cerrada (2026-09-24) | Pasos del usuario, sin registro de código. |
| 1. Decisiones y esquema | ✅ Cerrada (2026-09-25) | [fase-1.md](./fase-1.md) |
| 2. Capa de API tipada | ✅ Cerrada (2026-09-25) | [fase-2.md](./fase-2.md) |
| 3. Sitio público | 🟡 Implementada, falta verificar en producción | [fase-3.md](./fase-3.md) |
| 4. Login y sesión | ⏳ Pendiente | |
| 5. Categorías y tipos de medida | ⏳ Pendiente | |
| 6. Productos con medidas | ⏳ Pendiente | |
| 7. Galería e imágenes | ⏳ Pendiente | |
| 8. Orden | ⏳ Pendiente | |
| 9. Integrantes | ⏳ Pendiente | |
| 10. Limpieza y cierre | ⏳ Pendiente | |

**Siguiente:** cerrar la fase 3 con la verificación en producción (abajo) y seguir con la fase 4
(login y sesión), que deja abierto el tipado de `/api/auth/*` (D3). Para usar la API, leé los
tipos y las decisiones de [fase-2.md](./fase-2.md).

## Pendientes abiertos

Agrupados por la fase que los resuelve. Al resolver uno, se borra de acá.

### Fase 3

Verificación en producción, a cargo del usuario después del push a `main`:

1. Esperar el deploy de producción en Vercel y abrir `https://elcauquenartesanias.com.ar/catalogo-nuevo`:
   tiene que responder 200, con el aviso de catálogo vacío (o con los productos publicados), y
   `/` tiene que seguir sirviendo el sitio viejo.
2. Correr `curl -sI https://elcauquenartesanias.com.ar/catalogo-nuevo` dos veces seguidas: la
   segunda tiene que traer `x-vercel-cache: HIT`. Pasados 60 s, un pedido trae
   `STALE` y el siguiente vuelve a `HIT`.

### Fase 7

- Probar la subida de imágenes desde el browser: primer uso real del CORS de R2 con `ADMIN_ORIGIN`.

### Mejoras opcionales (sin fase)

- Ancho y alto de cada derivado en la galería pública (requiere cambio en el backend).
- Corregir los textos del sitio actual que `/catalogo-nuevo` copia tal cual: "Piezas unicas"
  (sin tilde) en el hero y la `description`, y "hechas a mano en Hechas a mano" en la `description`.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
