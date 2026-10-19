import { describe, expect, it } from 'vitest'
import {
  cambiosPara,
  centavosAPesos,
  FORMULARIO_VACIO,
  formularioDe,
  leerFormulario,
  type Producto,
  pesosACentavos,
} from './productos'

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
    ['', formato],
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

describe('precio opcional', () => {
  const producto = (precio: Producto['precio']): Producto => ({
    id: 'p1',
    nombre: 'Mate',
    precio,
    categoriaId: null,
    descripcion: null,
    medidas: [],
    galeria: [],
    estado: 'borrador',
    iniciaHilera: false,
    creadoEn: '2026-10-19T00:00:00.000Z',
    actualizadoEn: '2026-10-19T00:00:00.000Z',
  })
  const conPrecio = producto({ amount: 1500000, currency: 'ARS' })
  const sinPrecio = producto(null)

  it('el precio vacío arma el cuerpo con precio null', () => {
    expect(leerFormulario({ ...FORMULARIO_VACIO, nombre: 'Mate' })).toMatchObject({ cuerpo: { precio: null } })
    expect(leerFormulario({ ...FORMULARIO_VACIO, nombre: 'Mate', precio: '  ' })).toMatchObject({
      cuerpo: { precio: null },
    })
  })

  it('un precio escrito sigue validándose', () => {
    expect(leerFormulario({ ...FORMULARIO_VACIO, nombre: 'Mate', precio: '0' })).toEqual({
      errores: { precio: 'El precio tiene que ser mayor a 0.' },
    })
    expect(leerFormulario({ ...FORMULARIO_VACIO, nombre: 'Mate', precio: '150,50' })).toMatchObject({
      cuerpo: { precio: { amount: 15050, currency: 'ARS' } },
    })
  })

  it('un producto sin precio carga el campo vacío', () => {
    expect(formularioDe(sinPrecio).precio).toBe('')
    expect(formularioDe(conPrecio).precio).toBe('15000')
  })

  it('cambiosPara manda precio null al vaciarlo y un monto al ponerlo', () => {
    const vacio = { ...formularioDe(conPrecio), precio: '' }
    const cuerpoVacio = leerFormulario(vacio)
    const cuerpoNuevo = leerFormulario({ ...formularioDe(sinPrecio), precio: '200' })

    expect('cuerpo' in cuerpoVacio && cambiosPara(cuerpoVacio.cuerpo, conPrecio)).toEqual({ precio: null })
    expect('cuerpo' in cuerpoNuevo && cambiosPara(cuerpoNuevo.cuerpo, sinPrecio)).toEqual({
      precio: { amount: 20000, currency: 'ARS' },
    })
  })

  it('cambiosPara no manda el precio si sigue sin precio o no cambió', () => {
    const sin = leerFormulario(formularioDe(sinPrecio))
    const con = leerFormulario(formularioDe(conPrecio))

    expect('cuerpo' in sin && cambiosPara(sin.cuerpo, sinPrecio)).toEqual({})
    expect('cuerpo' in con && cambiosPara(con.cuerpo, conPrecio)).toEqual({})
  })
})
