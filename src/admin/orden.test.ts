import { describe, expect, it } from 'vitest'
import { hayCambios, posiciones, rebasar } from './orden'

describe('posiciones', () => {
  it('numera los que se ven desde 1 y deja en null a los borradores', () => {
    const publicados = new Set(['a', 'c', 'd'])
    expect(posiciones(['x', 'a', 'b', 'c', 'd', 'y'], (id) => publicados.has(id))).toEqual([null, 1, null, 2, 3, null])
  })
})

describe('rebasar', () => {
  const anterior = ['a', 'b', 'c', 'd']
  const delUsuario = ['d', 'c', 'b', 'a']

  it('quita un producto que otro integrante borró', () => {
    expect(rebasar(delUsuario, anterior, ['a', 'c', 'd'])).toEqual(['d', 'c', 'a'])
  })

  it('pone al final un producto nuevo, en el orden de la API', () => {
    expect(rebasar(delUsuario, anterior, ['a', 'b', 'c', 'd', 'e', 'f'])).toEqual(['d', 'c', 'b', 'a', 'e', 'f'])
  })

  it('conserva el orden del usuario si otro reordenó', () => {
    expect(rebasar(delUsuario, anterior, ['b', 'a', 'd', 'c'])).toEqual(delUsuario)
  })

  it('sin cambios del usuario, toma el orden de la API', () => {
    expect(rebasar(anterior, anterior, ['b', 'a', 'd', 'c', 'e'])).toEqual(['b', 'a', 'd', 'c', 'e'])
  })
})

describe('hayCambios', () => {
  it('es falso con listas iguales', () => {
    expect(hayCambios(['a', 'b'], ['a', 'b'])).toBe(false)
  })

  it('es verdadero con otro orden o con otro largo', () => {
    expect(hayCambios(['a', 'b'], ['b', 'a'])).toBe(true)
    expect(hayCambios(['a', 'b'], ['a', 'b', 'c'])).toBe(true)
  })
})
