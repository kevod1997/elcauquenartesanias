// Reglas puras del orden global en `/admin/productos` (F8-D4, F8-D5), separadas de la isla `Productos.tsx`.

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
