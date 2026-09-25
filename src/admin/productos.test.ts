import { describe, expect, it } from 'vitest'
import { centavosAPesos, pesosACentavos } from './productos'

describe('pesosACentavos', () => {
  it.each([
    ['15000', 1500000],
    ['15000,5', 1500050],
    ['15000,50', 1500050],
    ['19,99', 1999],
    ['19.99', 1999],
    ['0,5', 50],
    [' 7 ', 700],
    ['0,01', 1],
  ])('%s → %i centavos', (texto, centavos) => {
    expect(pesosACentavos(texto)).toEqual({ centavos })
  })

  const formato = 'Escribí el precio en pesos, sin puntos de miles (ej. 15000 o 15000,50).'
  it.each([
    ['', 'Escribí el precio.'],
    ['1.500', formato],
    ['-1', formato],
    ['1e3', formato],
    ['15,', formato],
    ['1,999', formato],
    ['0', 'El precio tiene que ser mayor a 0.'],
    ['0,00', 'El precio tiene que ser mayor a 0.'],
    ['90071992547409,92', 'El precio es demasiado alto.'],
  ])('rechaza %j', (texto, error) => {
    expect(pesosACentavos(texto)).toEqual({ error })
  })

  it('acepta hasta Number.MAX_SAFE_INTEGER centavos', () => {
    expect(pesosACentavos('90071992547409,91')).toEqual({ centavos: Number.MAX_SAFE_INTEGER })
  })
})

describe('centavosAPesos', () => {
  it.each([
    [1500000, '15000'],
    [1500050, '15000,50'],
    [1999, '19,99'],
    [50, '0,50'],
    [1, '0,01'],
    [100, '1'],
  ])('%i → %s', (centavos, texto) => {
    expect(centavosAPesos(centavos)).toBe(texto)
  })

  it.each([1, 50, 1999, 1500000, 1500050, Number.MAX_SAFE_INTEGER])('ida y vuelta de %i', (centavos) => {
    expect(pesosACentavos(centavosAPesos(centavos))).toEqual({ centavos })
  })
})
