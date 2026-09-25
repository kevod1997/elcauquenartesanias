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
| 9. Integrantes | 🔎 Implementada | [fase-9.md](./fase-9.md) |
| 10. Limpieza y cierre | ⏳ Pendiente | |

"🔎 Implementada" es una fase con el código commiteado a la que le quedan verificaciones del
usuario; cuenta como dependencia cumplida.

**Siguiente:** cerrar la fase 9 con las [verificaciones del usuario](./fase-9.md#verificaciones-del-usuario):
la vista del editor en local y, tras el push, el alta de un editor real en `admin.*` con el email que
da el usuario. Después, la fase 10 según [fase-10.md](./fase-10.md), que espera el cierre de la 9.

## Decisiones para el usuario

Lo que un agente no pudo decidir sin cambiar el producto, el contrato o el alcance. Al decidir
una, se borra de acá.

## Verificaciones del usuario

Pruebas que el agente no puede ejecutar (visuales, en producción o tras un push). Los pasos exactos
están en la sección "Verificaciones del usuario" de cada `fase-N.md`. Al confirmarlas todas, se
borra esa sección y su línea de acá, y la fase pasa a "✅ Cerrada".

- Fase 9: la vista del editor en local y el alta de un editor real en `admin.*` tras el push.

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
- Corregir los textos del sitio actual que `/catalogo-nuevo` copia tal cual: "Piezas unicas"
  (sin tilde) en el hero y la `description`, y "hechas a mano en Hechas a mano" en la `description`.
- Mostrar "Diámetro" en lugar de "Ø" en las medidas del sitio actual (`public/main.js`) y del fixture
  (`scripts/api-fixture/productos.ts`); en el admin el tipo se llama "Diámetro".
- En el formulario de producto, tras "Nueva categoría" con un nombre repetido, el grupo queda abierto
  con "Ya existe una categoría con ese nombre." aun después de crear el producto; y el error de precio
  ("El precio tiene que ser mayor a 0.") sigue visible después de corregir el valor, hasta enviar.
- Página por producto con `GET /api/productos/:id` y filtro por categoría con `GET /api/categorias`
  en el catálogo público: fuera de la fase 3 por decisión del usuario (F3-D1).
