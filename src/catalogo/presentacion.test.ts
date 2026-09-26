import { describe, expect, it } from 'vitest'
import { estaPublicado, tieneDisenoProcesado } from '../admin/orden'
import type { Producto } from '../admin/productos'
import { hileras, type ProductoPublico, tieneDisenos } from './presentacion'

type Imagen = Producto['galeria'][number]

/** Un producto del catálogo público; con `*` al final del nombre, tiene un diseño. */
const publico = (nombre: string): ProductoPublico => ({
  id: nombre,
  nombre,
  precio: { amount: 100, currency: 'ARS' },
  categoriaId: null,
  descripcion: null,
  medidas: [],
  galeria: [false, nombre.endsWith('*')].map((esDiseno) => ({
    url: 'a.webp',
    url160: 'a.webp',
    url640: 'a.webp',
    url1600: 'a.webp',
    esDiseno,
    nombreDiseno: null,
  })),
})

const imagen = (esDiseno: boolean, etapa: Imagen['etapa'] = 'procesada'): Imagen => ({
  id: `${esDiseno}-${etapa}`,
  etapa,
  procesada: etapa === 'procesada',
  url: null,
  url160: null,
  url640: null,
  url1600: null,
  esDiseno,
  nombreDiseno: null,
  error: null,
})

/** Un producto del admin: `borrador` o `publicado`, con o sin un diseño en esa etapa. */
const admin = (nombre: string, estado: Producto['estado'], diseno?: Imagen['etapa']): Producto => ({
  id: nombre,
  nombre,
  precio: { amount: 100, currency: 'ARS' },
  categoriaId: null,
  descripcion: null,
  medidas: [],
  galeria: diseno ? [imagen(false), imagen(true, diseno)] : [imagen(false)],
  estado,
  creadoEn: '2026-09-25T00:00:00.000Z',
  actualizadoEn: '2026-09-25T00:00:00.000Z',
})

/** Las hileras del catálogo público, con nombres en vez de índices. */
const delCatalogo = (nombres: string[]) => {
  const productos = nombres.map(publico)
  return hileras(productos, tieneDisenos).map((hilera) => hilera.map((i) => productos[i]?.nombre))
}

const delAdmin = (productos: Producto[]) =>
  hileras(productos, tieneDisenoProcesado, estaPublicado).map((hilera) => hilera.map((i) => productos[i]?.nombre))

describe('hileras del catálogo público', () => {
  it('un producto con diseños cierra la hilera que se está llenando', () => {
    expect(delCatalogo(['A', 'B', 'D*', 'C', 'E', 'F'])).toEqual([['A', 'B'], ['D*'], ['C', 'E', 'F']])
  })

  it('un producto con diseños al principio y al final va solo', () => {
    expect(delCatalogo(['D*', 'A', 'B', 'E*'])).toEqual([['D*'], ['A', 'B'], ['E*']])
  })

  it('agrupa de a cuatro', () => {
    expect(delCatalogo(['A', 'B', 'C', 'E', 'F', 'G', 'H', 'I', 'J'])).toEqual([
      ['A', 'B', 'C', 'E'],
      ['F', 'G', 'H', 'I'],
      ['J'],
    ])
  })

  it('después de una hilera completa, un producto con diseños no deja una vacía', () => {
    expect(delCatalogo(['A', 'B', 'C', 'E', 'D*'])).toEqual([['A', 'B', 'C', 'E'], ['D*']])
  })
})

describe('hileras del admin', () => {
  it('un borrador no cuenta para las cuatro', () => {
    expect(
      delAdmin([
        admin('A', 'publicado'),
        admin('x', 'borrador'),
        admin('B', 'publicado'),
        admin('C', 'publicado'),
        admin('E', 'publicado'),
        admin('F', 'publicado'),
      ]),
    ).toEqual([['A', 'x', 'B', 'C', 'E'], ['F']])
  })

  it('los borradores de adelante quedan con el producto con diseños', () => {
    expect(
      delAdmin([admin('x', 'borrador'), admin('y', 'borrador', 'procesada'), admin('D', 'publicado', 'procesada')]),
    ).toEqual([['x', 'y', 'D']])
  })

  it('los borradores solos al final forman su propio grupo', () => {
    expect(delAdmin([admin('A', 'publicado', 'procesada'), admin('x', 'borrador'), admin('y', 'borrador')])).toEqual([
      ['A'],
      ['x', 'y'],
    ])
  })

  it('un diseño que no está procesado no cuenta', () => {
    expect(delAdmin([admin('A', 'publicado'), admin('B', 'publicado', 'procesando')])).toEqual([['A', 'B']])
  })

  it('sin los borradores, da las hileras del catálogo público', () => {
    const productos = [
      admin('x', 'borrador'),
      admin('A', 'publicado'),
      admin('B', 'publicado', 'fallida'),
      admin('y', 'borrador', 'procesada'),
      admin('D', 'publicado', 'procesada'),
      admin('C', 'publicado'),
      admin('z', 'borrador'),
      admin('E', 'publicado'),
      admin('F', 'publicado'),
      admin('G', 'publicado'),
      admin('H', 'publicado'),
      admin('w', 'borrador'),
      admin('K', 'publicado', 'procesada'),
      admin('v', 'borrador'),
    ]
    // Lo que el catálogo público recibe de esos: solo los publicados, con los diseños procesados.
    const publicados = productos.filter(estaPublicado).map((p) => (tieneDisenoProcesado(p) ? `${p.nombre}*` : p.nombre))
    const sinBorradores = delAdmin(productos)
      .map((hilera) => hilera.filter((nombre) => productos.find((p) => p.nombre === nombre)?.estado === 'publicado'))
      .filter((hilera) => hilera.length > 0)
    expect(sinBorradores).toEqual(delCatalogo(publicados).map((hilera) => hilera.map((n) => n?.replace('*', ''))))
  })
})
