import { describe, expect, it } from 'vitest'
import { hileras } from './presentacion'

/**
 * Un producto por letra: `|` delante marca el corte (`iniciaHilera`), minúscula es un borrador que no se ve y
 * `*` al final, un producto con diseños.
 */
const productos = (texto: string) =>
  texto.split(' ').map((token) => {
    const nombre = token.replace('|', '')
    return { nombre, iniciaHilera: token.startsWith('|'), seVe: nombre[0] !== nombre[0]?.toLowerCase() }
  })

/** Las hileras del catálogo público: todos se ven, como en `GET /api/productos`. */
const delCatalogo = (texto: string) => {
  const lista = productos(texto)
  return hileras(lista, (p) => p.iniciaHilera).map((hilera) => hilera.map((i) => lista[i]?.nombre).join(' '))
}

/** Las hileras del admin, con los borradores que no se ven. */
const delAdmin = (texto: string) => {
  const lista = productos(texto)
  return hileras(
    lista,
    (p) => p.iniciaHilera,
    (p) => p.seVe,
  ).map((hilera) => hilera.map((i) => lista[i]?.nombre).join(' '))
}

describe('hileras', () => {
  it('agrupa de a cuatro sin cortes', () => {
    expect(delCatalogo('A B C D E F G H I')).toEqual(['A B C D', 'E F G H', 'I'])
  })

  it('corta en cada producto con corte', () => {
    expect(delCatalogo('A B |C D |E')).toEqual(['A B', 'C D', 'E'])
  })

  it('el tope de cuatro sigue contando desde el último corte', () => {
    expect(delCatalogo('A |B C D E F G')).toEqual(['A', 'B C D E', 'F G'])
  })

  it('un corte justo después de una hilera completa no deja una vacía', () => {
    expect(delCatalogo('A B C D |E F')).toEqual(['A B C D', 'E F'])
  })

  it('un corte en el primero no deja una hilera vacía', () => {
    expect(delCatalogo('|A B')).toEqual(['A B'])
  })

  it('los productos con diseños comparten la hilera con los demás', () => {
    expect(delCatalogo('A D* B E* C')).toEqual(['A D* B E*', 'C'])
    expect(delCatalogo('A |D* |B')).toEqual(['A', 'D*', 'B'])
  })

  it('un borrador no cuenta para las cuatro y queda en la hilera que se está llenando', () => {
    expect(delAdmin('A x B C D E')).toEqual(['A x B C D', 'E'])
  })

  it('se ignora el corte de un borrador', () => {
    expect(delAdmin('A B |x C D E')).toEqual(['A B x C D', 'E'])
  })

  it('sin los borradores, da las hileras del catálogo público', () => {
    const admin = 'x A |y B C |D* z E F |G H I J K w'
    const publicas = delAdmin(admin)
      .map((hilera) => hilera.split(' ').filter((n) => n[0] !== n[0]?.toLowerCase()))
      .filter((hilera) => hilera.length > 0)
      .map((hilera) => hilera.join(' '))
    // El listado público trae solo los publicados, con su marca.
    expect(publicas).toEqual(delCatalogo('A B C |D* E F |G H I J K'))
  })
})
