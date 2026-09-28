// Mapeo de `ProductoPublico` a lo que muestra el catálogo público (F3-D4, docs/frontend-por-fases/fases/fase-3.md).
import type { components } from '../api'

export type ProductoPublico = components['schemas']['ProductoPublico']
type MedidaPublica = components['schemas']['MedidaPublica']
type ImagenPublica = components['schemas']['ImagenPublica']
type Precio = components['schemas']['Precio']

const miles = new Intl.NumberFormat('es-AR')
const conCentavos = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** `$5.000`, o `$5.000,50` si hay centavos. `style: 'currency'` daría `$ 5.000`, distinto del sitio viejo. */
export function formatearPrecio({ amount }: Precio): string {
  return `$${(amount % 100 === 0 ? miles : conCentavos).format(amount / 100)}`
}

/** `Diámetro 13 cm`: tipo, valor y unidad, omitiendo los `null`. */
export function textoMedida({ tipo, valor, unidad }: MedidaPublica): string {
  return [tipo, valor, unidad].filter((parte) => parte !== null && parte !== '').join(' ')
}

export interface ImagenVisor {
  url160: string
  /** La que abre el visor mientras carga `url1600`: la que ya mostró la tarjeta. */
  previa: string
  url1600: string
  etiqueta: string
}

export interface Diseno {
  /** Posición en la galería, para abrir el visor en esa imagen. */
  indice: number
  url160: string
  etiqueta: string
}

/** Diseños de la galería, con su posición y su etiqueta (`nombreDiseno` o "Diseño N"). */
export function disenos(galeria: ImagenPublica[]): Diseno[] {
  const resultado: Diseno[] = []
  galeria.forEach((imagen, indice) => {
    if (!imagen.esDiseno) return
    resultado.push({
      indice,
      url160: imagen.url160,
      etiqueta: imagen.nombreDiseno ?? `Diseño ${resultado.length + 1}`,
    })
  })
  return resultado
}

/** Toda la galería en su orden, como la recorre el visor. */
export function imagenesVisor({ nombre, galeria }: ProductoPublico): ImagenVisor[] {
  const etiquetas = new Map(disenos(galeria).map((d) => [d.indice, d.etiqueta]))
  return galeria.map((imagen, i) => ({
    url160: imagen.url160,
    previa: imagen.esDiseno ? imagen.url160 : imagen.url640,
    url1600: imagen.url1600,
    etiqueta: etiquetas.get(i) ?? `${i === 0 ? 'Ficha' : 'Foto'} · ${nombre}`,
  }))
}

export const PRODUCTOS_POR_HILERA = 4

/**
 * Hileras del carrusel mobile, con los índices en el orden global (F13-D1, F13-D7): se corta en cada producto
 * que se ve y empieza una hilera (`iniciaHilera`), y cada cuatro que se ven. Uno que no se ve (un borrador, en
 * el admin) queda en la hilera que se está llenando sin contar para las cuatro, y su marca se ignora. El
 * catálogo público pasa `(p) => p.iniciaHilera` y ningún `seVe`. En desktop las hileras no cuentan: la grilla
 * ordena por índice.
 */
export function hileras<T>(
  productos: readonly T[],
  iniciaHilera: (producto: T) => boolean,
  seVe: (producto: T) => boolean = () => true,
): number[][] {
  const resultado: number[][] = []
  let actual: number[] = []
  let visibles = 0
  productos.forEach((producto, i) => {
    if (seVe(producto)) {
      if (visibles === PRODUCTOS_POR_HILERA || (visibles > 0 && iniciaHilera(producto))) {
        resultado.push(actual)
        actual = []
        visibles = 0
      }
      visibles++
    }
    actual.push(i)
  })
  if (actual.length) resultado.push(actual)
  return resultado
}
