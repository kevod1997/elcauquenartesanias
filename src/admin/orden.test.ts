import { describe, expect, it } from 'vitest'
import { type Armado, filas, hayCambios, listaDeCortes, moverHilera, moverProducto, rebasar } from './orden'

/** Un armado desde texto: `|` delante marca el corte, minúscula es un borrador y `+` delante, uno a publicar. */
const armado = (texto: string): Armado => {
  const tokens = texto.split(' ')
  const id = (t: string) => t.replace(/[|+]/g, '')
  return {
    orden: tokens.map(id),
    cortes: new Set(tokens.filter((t) => t.includes('|')).map(id)),
    aPublicar: new Set(tokens.filter((t) => t.includes('+')).map(id)),
  }
}

const publicado = (id: string) => id !== id.toLowerCase()

/** Las hileras de la vista, una por texto. */
const vista = (a: Armado) => filas(a, publicado).map((f) => f.join(' '))

describe('moverProducto', () => {
  it('soltar sobre un producto lo pone antes de él', () => {
    const a = moverProducto(armado('A B C |D E'), publicado, 'E', { antesDe: 'B' })
    expect(vista(a)).toEqual(['A E B C', 'D'])
  })

  it('si el destino empezaba la hilera, el que llega toma su corte', () => {
    const a = moverProducto(armado('A B C |D E'), publicado, 'A', { antesDe: 'D' })
    expect(vista(a)).toEqual(['B C', 'A D E'])
    expect(listaDeCortes(a)).toEqual(['A'])
  })

  it('si sale el primero de una hilera, el corte pasa al que le sigue', () => {
    const a = moverProducto(armado('A B |C D |E'), publicado, 'C', { antesDe: 'A' })
    expect(vista(a)).toEqual(['C A B', 'D', 'E'])
  })

  it('si la hilera queda vacía, el corte desaparece', () => {
    const a = moverProducto(armado('A B |C |D'), publicado, 'C', { antesDe: 'A' })
    expect(vista(a)).toEqual(['C A B', 'D'])
    expect(listaDeCortes(a)).toEqual(['D'])
  })

  it('soltar sobre el que le sigue en su hilera la deja como estaba', () => {
    const a = moverProducto(armado('A |B C'), publicado, 'B', { antesDe: 'C' })
    expect(vista(a)).toEqual(['A', 'B C'])
  })

  it('una hilera de más de cuatro corre el sobrante a la siguiente, hasta el próximo corte', () => {
    const a = moverProducto(armado('A B C D E F G H |I J'), publicado, 'J', { antesDe: 'A' })
    expect(vista(a)).toEqual(['J A B C', 'D E F G', 'H', 'I'])
  })

  it('en un lugar vacío va al final de esa hilera, antes del corte de la que sigue', () => {
    const a = moverProducto(armado('A B |C D E'), publicado, 'E', { finDeHilera: 0 })
    expect(vista(a)).toEqual(['A B E', 'C D'])
  })

  it('en una hilera nueva va al final con corte', () => {
    const a = moverProducto(armado('A B C'), publicado, 'A', { hileraNueva: true })
    expect(vista(a)).toEqual(['B C', 'A'])
  })

  it('un borrador soltado en una hilera queda para publicar, y vuelve si se lo lleva a borradores', () => {
    const inicial = armado('A x B')
    const a = moverProducto(inicial, publicado, 'x', { antesDe: 'A' })
    expect(vista(a)).toEqual(['x A B'])
    expect([...a.aPublicar]).toEqual(['x'])
    const b = moverProducto(a, publicado, 'x', { borradores: true })
    expect(vista(b)).toEqual(['A B'])
    expect(b.aPublicar.size).toBe(0)
  })

  it('un borrador que no se ve queda en su lugar y conserva su corte', () => {
    const a = moverProducto(armado('A |x B C'), publicado, 'C', { antesDe: 'A' })
    expect(a.orden).toEqual(['C', 'x', 'A', 'B'])
    expect(listaDeCortes(a)).toEqual(['x'])
  })

  it('un publicado, o un borrador que no se iba a publicar, no cambia al soltarlo en borradores', () => {
    const inicial = armado('A b')
    expect(moverProducto(inicial, publicado, 'A', { borradores: true })).toBe(inicial)
    expect(moverProducto(inicial, publicado, 'b', { borradores: true })).toBe(inicial)
  })
})

describe('moverHilera', () => {
  it('bajando, el bloque queda después de la hilera de destino, y todas quedan como se veían', () => {
    const a = moverHilera(armado('A B |C D |E F'), publicado, 0, 1)
    expect(vista(a)).toEqual(['C D', 'A B', 'E F'])
  })

  it('subiendo, queda antes, aunque la de destino no tuviera corte', () => {
    const a = moverHilera(armado('A B C D E F G H |I'), publicado, 2, 0)
    expect(vista(a)).toEqual(['I', 'A B C D', 'E F G H'])
  })

  it('las hileras cortadas por el tope siguen igual', () => {
    const a = moverHilera(armado('A B C D E F G H I'), publicado, 0, 2)
    expect(vista(a)).toEqual(['E F G H', 'I', 'A B C D'])
  })
})

describe('hayCambios', () => {
  it('es falso sin cambios y verdadero con otro orden, otros cortes o un borrador a publicar', () => {
    expect(hayCambios(armado('A |B'), armado('A |B'))).toBe(false)
    expect(hayCambios(armado('B |A'), armado('A |B'))).toBe(true)
    expect(hayCambios(armado('A B'), armado('A |B'))).toBe(true)
    expect(hayCambios(armado('A +b'), armado('A b'))).toBe(true)
  })
})

describe('rebasar', () => {
  const anterior = armado('A B C D')
  const delUsuario = armado('D |C B +a A')

  it('conserva el orden y los cortes del usuario si otro reordenó', () => {
    const r = rebasar(delUsuario, anterior, armado('B |A D C'), publicado)
    expect(r.orden).toEqual(['D', 'C', 'B', 'A'])
    expect(listaDeCortes(r)).toEqual(['C'])
  })

  it('quita lo borrado y pone al final lo nuevo, con su corte', () => {
    const r = rebasar(delUsuario, anterior, armado('A B D E |F'), publicado)
    expect(r.orden).toEqual(['D', 'B', 'A', 'E', 'F'])
    expect(listaDeCortes(r)).toEqual(['F'])
  })

  it('saca de los a publicar lo que se borró', () => {
    const conA = armado('D |C B +x A')
    expect(rebasar(conA, anterior, armado('A B C D'), publicado).aPublicar.size).toBe(0)
  })

  it('saca de los a publicar lo que otro integrante ya publicó', () => {
    const conX = armado('A +x B')
    expect(rebasar(conX, armado('A x B'), armado('A x B'), (id) => id !== 'y').aPublicar.size).toBe(0)
  })

  it('sin cambios del usuario, toma el orden y los cortes de la API', () => {
    const api = armado('B |A D C E')
    expect(rebasar(anterior, anterior, api, publicado)).toBe(api)
  })
})
