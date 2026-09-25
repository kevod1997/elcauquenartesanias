// Mapeo de `ProductoPublico` a lo que muestra el catálogo público (F3-D4 del PRD del front).
import type { components } from '../api'

export type ProductoPublico = components['schemas']['ProductoPublico']
type MedidaPublica = components['schemas']['MedidaPublica']
type ImagenPublica = components['schemas']['ImagenPublica']
type Precio = components['schemas']['Precio']

const miles = new Intl.NumberFormat('es-AR')
const conCentavos = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** `$5.000`, o `$5.000,50` si hay centavos. `style: 'currency'` daría `$ 5.000`, distinto del sitio actual. */
export function formatearPrecio({ amount }: Precio): string {
  return `$${(amount % 100 === 0 ? miles : conCentavos).format(amount / 100)}`
}

/** `Ø 13 cm`: tipo, valor y unidad, omitiendo los `null`. */
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

const PRODUCTOS_POR_HILERA = 4

/**
 * Hileras del carrusel mobile, con los índices en el orden de la API. Un producto con diseños va solo en su
 * hilera, después de la hilera que se está llenando; el resto va de a cuatro. Con el catálogo actual da las
 * hileras fijas de `public/main.js`: [0-3], [4, 5, 7, 8], [6] y [9, 10]. En desktop las hileras no cuentan:
 * la grilla ordena por índice.
 */
export function hileras(productos: ProductoPublico[]): number[][] {
  const resultado: number[][] = []
  let actual: number[] = []
  let solos: number[][] = []
  productos.forEach((producto, i) => {
    if (producto.galeria.some((imagen) => imagen.esDiseno)) {
      solos.push([i])
      return
    }
    actual.push(i)
    if (actual.length === PRODUCTOS_POR_HILERA) {
      resultado.push(actual, ...solos)
      actual = []
      solos = []
    }
  })
  if (actual.length) resultado.push(actual)
  resultado.push(...solos)
  return resultado
}
