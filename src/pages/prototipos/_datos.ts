// PROTOTIPO: el catálogo del fixture con URLs relativas (sirve public/assets/ el propio astro dev) y sus hileras.
import { productos as delFixture } from '../../../scripts/api-fixture/productos'
import { hileras } from '../../catalogo/presentacion'

export const productos = delFixture('')

export const grupos = hileras(productos, (p) => p.iniciaHilera).map((indices) =>
  indices.flatMap((i) => (productos[i] ? [{ producto: productos[i], indice: i }] : [])),
)
