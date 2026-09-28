// Reglas puras del orden global y sus hileras en `/admin/productos` (F8-D4, F8-D5, F13-D5, F13-D7, F13-D8),
// separadas de la isla `Productos.tsx`. Trabajan con ids: la isla dice qué producto se ve.
import { hileras } from '../catalogo/presentacion'
import type { Producto } from './productos'

/** Tiene un diseño que la galería pública muestra, que trae solo las procesadas: lleva el chip "D" (F13-D2). */
export const tieneDisenoProcesado = (producto: Producto): boolean =>
  producto.galeria.some((imagen) => imagen.esDiseno && imagen.etapa === 'procesada')

/**
 * El orden sin guardar: la lista completa de ids, los que empiezan hilera (`cortes`) y los borradores soltados
 * en una hilera, que se publican al guardar (`aPublicar`). Los cortes de un borrador que no se ve se conservan.
 */
export interface Armado {
  orden: readonly string[]
  cortes: ReadonlySet<string>
  aPublicar: ReadonlySet<string>
}

/** Qué ids están publicados. En la vista del orden se ve lo publicado y lo que se va a publicar (F13-D7). */
type Publicados = (id: string) => boolean

const seVeEn = (armado: Armado, publicado: Publicados) => (id: string) => publicado(id) || armado.aPublicar.has(id)

/** Las hileras de la vista: solo los ids que se ven, cortados como el catálogo público (F13-D7). */
export function filas(armado: Armado, publicado: Publicados): string[][] {
  const seVe = seVeEn(armado, publicado)
  return hileras(armado.orden, (id) => armado.cortes.has(id), seVe)
    .map((indices) => indices.flatMap((i) => armado.orden[i] ?? []).filter(seVe))
    .filter((fila) => fila.length > 0)
}

/** Dónde se suelta: antes de un producto, al final de una hilera (un lugar vacío) o en una hilera nueva. */
export type Destino = { antesDe: string } | { finDeHilera: number } | { hileraNueva: true } | { borradores: true }

/**
 * Lleva los ids que se ven a la lista completa: los que no se ven quedan en su índice, y los demás ocupan los
 * lugares restantes en el orden de `visibles` (F13-D5).
 */
function volcar(orden: readonly string[], visibles: readonly string[], seVe: (id: string) => boolean): string[] {
  const resultado = [...orden]
  let k = 0
  orden.forEach((id, i) => {
    if (seVe(id)) resultado[i] = visibles[k++] as string
  })
  return resultado
}

/** Saca `id` de las hileras: si empezaba una con corte, el corte pasa al que le sigue en ella (F13-D5). */
function quitar(filasActuales: string[][], cortes: Set<string>, id: string): string[] {
  const fila = filasActuales.find((f) => f.includes(id))
  if (fila && fila[0] === id && cortes.has(id) && fila[1] !== undefined) cortes.add(fila[1])
  cortes.delete(id)
  return filasActuales.flat().filter((x) => x !== id)
}

/**
 * Mueve un producto (publicado, a publicar o un borrador listo) a `destino`, con las reglas del corte de F13-D5.
 * Un borrador que se suelta en una hilera pasa a `aPublicar`; soltado en `borradores`, sale.
 */
export function moverProducto(armado: Armado, publicado: Publicados, id: string, destino: Destino): Armado {
  const antes = filas(armado, publicado)
  const cortes = new Set(armado.cortes)
  const aPublicar = new Set(armado.aPublicar)
  const visibles = quitar(antes, cortes, id)

  if ('borradores' in destino) {
    if (!aPublicar.has(id)) return armado
    aPublicar.delete(id)
  } else {
    if (!publicado(id)) aPublicar.add(id)
    if ('antesDe' in destino) {
      // Un producto con corte empieza su hilera; el corte puede ser el que acaba de heredar de `id`.
      if (cortes.has(destino.antesDe)) {
        cortes.delete(destino.antesDe)
        cortes.add(id)
      }
      const i = visibles.indexOf(destino.antesDe)
      visibles.splice(i < 0 ? visibles.length : i, 0, id)
    } else if ('finDeHilera' in destino) {
      // Después del último que queda en esa hilera, sin contar al que se mueve.
      const fila = (antes[destino.finDeHilera] ?? []).filter((x) => x !== id)
      const ultimo = fila[fila.length - 1]
      const i = ultimo === undefined ? -1 : visibles.indexOf(ultimo)
      if (i < 0) {
        // La hilera tenía solo al que se mueve: vuelve a su lugar, con su corte.
        return armado
      }
      visibles.splice(i + 1, 0, id)
    } else {
      visibles.push(id)
      cortes.add(id)
    }
  }

  const seVe = (x: string) => publicado(x) || aPublicar.has(x)
  return { orden: volcar(armado.orden, visibles, seVe), cortes, aPublicar }
}

/**
 * Mueve la hilera `desde` entera al lugar de la hilera `hasta`: bajando queda después de ella y subiendo, antes.
 * Llevan corte el primero del bloque, el que lo sigue en su lugar nuevo y el que lo seguía en el viejo (F13-D5).
 */
export function moverHilera(armado: Armado, publicado: Publicados, desde: number, hasta: number): Armado {
  const antes = filas(armado, publicado)
  const bloque = antes[desde]
  const destino = antes[hasta]
  if (!bloque?.[0] || !destino || desde === hasta) return armado
  const cortes = new Set(armado.cortes)
  const siguienteViejo = antes[desde + 1]?.[0]
  if (siguienteViejo !== undefined) cortes.add(siguienteViejo)
  const sin = antes.flat().filter((id) => !bloque.includes(id))
  const i = desde < hasta ? sin.indexOf(destino[destino.length - 1] as string) + 1 : sin.indexOf(destino[0] as string)
  const visibles = [...sin.slice(0, i), ...bloque, ...sin.slice(i)]
  cortes.add(bloque[0])
  const siguienteNuevo = visibles[i + bloque.length]
  if (siguienteNuevo !== undefined) cortes.add(siguienteNuevo)
  return { ...armado, orden: volcar(armado.orden, visibles, seVeEn(armado, publicado)), cortes }
}

/** Los cortes en el orden de `orden`, como los manda "Guardar" y los devuelve el `PUT` (F13-D5). */
export const listaDeCortes = (armado: Armado): string[] => armado.orden.filter((id) => armado.cortes.has(id))

/** Si dos listas de ids difieren en contenido u orden. */
function difieren(a: readonly string[], b: readonly string[]): boolean {
  return a.length !== b.length || a.some((id, i) => id !== b[i])
}

/** Si el orden sin guardar difiere del cargado: posiciones, cortes o borradores a publicar (F13-D8). */
export function hayCambios(sinGuardar: Armado, cargado: Armado): boolean {
  return (
    difieren(sinGuardar.orden, cargado.orden) ||
    difieren(listaDeCortes(sinGuardar), listaDeCortes(cargado)) ||
    sinGuardar.aPublicar.size > 0
  )
}

/**
 * El orden sin guardar llevado a la lista recargada (F8-D5, F13-D8): los que siguen quedan en el orden del
 * usuario con sus cortes, los borrados se quitan y los nuevos van al final en el orden de la API, con su
 * `iniciaHilera`. Sale de `aPublicar` lo que se borró u otro integrante ya publicó. Sin cambios respecto de
 * `anterior` (el cargado antes de recargar), no hay trabajo que conservar y gana el de la API.
 */
export function rebasar(sinGuardar: Armado, anterior: Armado, nuevo: Armado, publicado: Publicados): Armado {
  if (!hayCambios(sinGuardar, anterior)) return nuevo
  const existen = new Set(nuevo.orden)
  const conservados = sinGuardar.orden.filter((id) => existen.has(id))
  const vistos = new Set(conservados)
  const agregados = nuevo.orden.filter((id) => !vistos.has(id))
  return {
    orden: [...conservados, ...agregados],
    cortes: new Set([
      ...conservados.filter((id) => sinGuardar.cortes.has(id)),
      ...agregados.filter((id) => nuevo.cortes.has(id)),
    ]),
    aPublicar: new Set([...sinGuardar.aPublicar].filter((id) => existen.has(id) && !publicado(id))),
  }
}
