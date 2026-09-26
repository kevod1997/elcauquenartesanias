// Reglas puras del orden global en `/admin/productos` (F8-D4, F8-D5, F12-D2, F12-D6), separadas de la isla
// `Productos.tsx`.
import type { Producto } from './productos'

/** Se ve en el catálogo público (F12-D2). */
export const estaPublicado = (producto: Producto): boolean => producto.estado === 'publicado'

/** Tiene un diseño que la galería pública muestra, que trae solo las procesadas (F12-D2). */
export const tieneDisenoProcesado = (producto: Producto): boolean =>
  producto.galeria.some((imagen) => imagen.esDiseno && imagen.etapa === 'procesada')

/** La posición de cada producto en el catálogo público, desde 1, o `null` si no se ve (F12-D6). */
export function posiciones<T>(productos: readonly T[], seVe: (producto: T) => boolean): (number | null)[] {
  let n = 0
  return productos.map((producto) => (seVe(producto) ? ++n : null))
}

/** Lo que se anuncia de un producto en un lugar del orden sin guardar (F12-D8). */
export function textoPosicion(nombre: string, posicion: number | null, total: number): string {
  return posicion === null
    ? `«${nombre}», borrador: no se ve en el catálogo.`
    : `«${nombre}», posición ${posicion} de ${total} en el catálogo.`
}

/** Si dos listas de ids difieren en contenido u orden. */
export function hayCambios(a: readonly string[], b: readonly string[]): boolean {
  return a.length !== b.length || a.some((id, i) => id !== b[i])
}

/**
 * El orden sin guardar llevado a la lista recargada: los que siguen quedan en el orden del usuario, los
 * borrados se quitan y los nuevos van al final en el orden de la API. Sin cambios respecto de `anterior`
 * (el orden cargado antes de recargar), no hay trabajo que conservar y gana el de la API.
 */
export function rebasar(
  sinGuardar: readonly string[],
  anterior: readonly string[],
  nuevo: readonly string[],
): string[] {
  if (!hayCambios(sinGuardar, anterior)) return [...nuevo]
  const existen = new Set(nuevo)
  const conservados = sinGuardar.filter((id) => existen.has(id))
  const vistos = new Set(conservados)
  return [...conservados, ...nuevo.filter((id) => !vistos.has(id))]
}
