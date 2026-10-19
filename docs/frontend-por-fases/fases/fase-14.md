# Fase 14 — Precio opcional

## Definición

Pedido del usuario (2026-10-19): sacar los precios de la landing. El backend vuelve el precio opcional
(fase 11 de `../elcauquen-backend`: `precio` es `null` en `Producto` y `ProductoPublico`) y el front lo
maneja en el catálogo y en el admin.

**Decisiones del usuario (2026-10-19):**

- **F14-D1. Precio opcional por producto, sin interruptor global.** Un producto sin precio no muestra
  importe en la landing. Un front viejo se rompe con `precio: null`, así que hasta que este front esté desplegado
  no se le quita el precio a ningún producto. La migración sola es segura: no cambia ningún precio.
- **F14-D2. Catálogo.** La tarjeta omite el precio, sin «Consultar» ni guiones. La nota «Precios por
  unidad · Consultá disponibilidad» muestra «Precios por unidad» solo si algún producto publicado tiene
  precio.
- **F14-D3. Admin.** El campo se llama «Precio (opcional)»; vacío es sin precio y se envía `null`, y
  vaciar el de un producto lo borra. `0` y los formatos inválidos siguen dando error. La lista muestra
  «Sin precio» en tenue.
- **F14-D4. Los precios existentes no se tocan:** el integrante los quita desde el admin, producto por
  producto.

## Implementación

- `pnpm gen:api` con el OpenAPI de la fase 11 del backend.
- `Tarjeta.astro` y `index.astro` (la nota, con `hayPrecios`); `Productos.tsx` y `admin.css`
  (`.lista__precio--vacio`).
- `src/admin/productos.ts`: `pesosACentavos` ya no maneja el texto vacío; `leerFormulario` lo trata
  como `null`, `formularioDe` carga `''` y `cambiosPara` manda `precio: null` solo si había uno.
- El fixture (`scripts/api-fixture/productos.ts`) deja «Cuencos o bowls» sin precio.

## Validaciones

`astro check` (0 errores), Biome y `pnpm test` (112) pasan. Con el fixture, la landing muestra «Cuencos
o bowls» sin precio y la nota conserva «Precios por unidad». Con el backend local y la sesión del
editor de prueba, el admin creó un producto sin precio, le puso 1500 y se lo quitó (la API devolvió
`null`); el producto de prueba se borró. La lista con «Sin precio» no se miró a mano.

## Verificaciones del usuario

Dependen de desplegar la fase 11 del backend y este front.

1. Quitar el precio de los productos que no lo deban mostrar (admin → Editar → vaciar «Precio») y
   comprobar que la landing los muestra sin importe.
2. Con ningún producto con precio, la nota debe decir solo «Consultá disponibilidad».
