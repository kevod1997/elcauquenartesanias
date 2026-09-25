# Fase 6 — Productos con medidas

**Estado:** implementada el 2026-09-25; quedan las verificaciones del usuario en producción
([README](./README.md#verificaciones-del-usuario)).
**Definición:** [PRD, fase 6](../PRD.md#fase-6--productos-con-medidas). Aplica F6-D1 a F6-D8,
sin repetirlas acá.

## Implementado

- Páginas `src/pages/admin/productos.astro` y `src/pages/admin/productos/editar.astro`, con las islas
  `src/admin/Productos.tsx` (listado) y `src/admin/EditarProducto.tsx` (formulario, bloque `Medidas` y
  `AltaRapida` de categoría y tipo de medida).
- `src/admin/productos.ts`: reglas puras (precio, validación y edición de medidas, estado del
  formulario, `cambiosPara` del `PATCH`); `productos.test.ts` cubre el precio (F6-D8).
- `Campo.tsx` suma `CampoSelect` (con `junto` para controles al lado del select), `CampoTexto` y la
  prop `prefijo` (el "$" del precio) de `Campo`.
- `Admin.astro`: "Productos" primero en `secciones`; `aria-current` por prefijo.
- `src/api/index.ts` exporta `paths` para tipar los cuerpos; `formatearPrecio` recibe `Precio`.
- `admin.css`: `.seccion__cabecera`, `.seccion__volver`, `.lista__datos`, `.estado--*`, `select` y
  `textarea`, `.campo__precio`, `.chips`/`.chip`, `.medidas__nueva`, `.rapida*`.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Formulario controlado (estado `Formulario` con el texto tal como se escribe), no `FormData` como F5 | El aviso de `beforeunload` y el `PATCH` parcial comparan contra el producto cargado en cada cambio. |
| Precio convertido con `BigInt` sobre el texto | Evita el redondeo de `number` y permite comparar contra `MAX_SAFE_INTEGER` sin perder precisión. |
| El alta rápida es un `<fieldset>` con `<legend>`, no un `<div role="group">` | Biome `a11y/useSemanticElements`; un `fieldset` no es un formulario, así que F6-D6 se cumple igual. |
| Chips de medidas con índice en la `key` (con `biome-ignore`) | Las medidas sin guardar no tienen id y el chip no guarda estado. |
| Tras `TIPO_MEDIDA_INEXISTENTE` el foco va al select "Tipo de medida"; tras `CATEGORIA_INEXISTENTE`, al de categoría | Son los controles para corregir; el error del bloque va en `#medidasError`, que describe el `fieldset`. |
| `hayCambios` compara los textos recortados, incluido el precio como texto | Un precio inválido a medio escribir también cuenta como cambio sin guardar. |

## Validaciones ejecutadas

- `pnpm lint`, `pnpm typecheck` (0 errores; hints de `FormEvent` deprecado ya existentes), `pnpm test`
  (53, 30 nuevos de precio) y `pnpm build` pasan.
- Contra el backend local (owner, `Origin: http://localhost:4321`), con curl, todos los casos de F6-D8:
  - alta con categoría y medidas (con tipo con unidad, sin unidad y sin tipo) → `201`, `borrador`,
    medidas en orden y `13,5` guardado tal cual;
  - tipo repetido → `400`; categoría y tipo inexistentes → `422` `CATEGORIA_INEXISTENTE` ("La categoría
    elegida no existe.") / `TIPO_MEDIDA_INEXISTENTE` ("Un tipo de medida elegido no existe."); `amount`
    0 y 1.5 → `400`;
  - `PATCH` de solo `precio` conserva el resto; `PATCH` de `medidas` reemplaza la lista; `PATCH {}` →
    `400`; `PATCH` y `DELETE` de `no-existe` → `404` ("No existe ese producto.");
  - borrar un tipo usado deja la medida con `tipoMedidaId: null` y el mismo `valor`;
  - todo lo creado se borró; productos, tipos y categorías quedaron vacíos.
- `astro dev`: `/admin/productos` y `/admin/productos/editar` responden `200` con `noindex`, su isla y
  `aria-current` en "Productos"; `/admin/categorias` sigue marcando solo "Categorías".

## Desvíos

- Las islas no se probaron en el navegador (errores en su campo, foco, alta rápida, medidas, aviso de
  salida): ver las verificaciones del usuario.
- Si la sesión vence con cambios sin guardar, la redirección al login dispara también el aviso de
  `beforeunload`; se dejó así porque avisa que se pierden los cambios.
