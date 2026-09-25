import { describe, expect, it } from 'vitest'
import {
  avanzarSubida,
  comoReintentar,
  cupoLibre,
  esUltimaValida,
  type Imagen,
  intervaloConsulta,
  medidasEscaladas,
  motivoParaNoPublicar,
  mover,
  posicionNueva,
  revisarOrden,
  subidaNueva,
} from './galeria'

const imagen = (id: string, cambios: Partial<Imagen> = {}): Imagen => ({
  id,
  etapa: 'procesada',
  procesada: true,
  url: `https://img/${id}-640.webp`,
  url160: `https://img/${id}-160.webp`,
  url640: `https://img/${id}-640.webp`,
  url1600: `https://img/${id}-1600.webp`,
  esDiseno: false,
  nombreDiseno: null,
  error: null,
  ...cambios,
})

const diseno = (id: string) => imagen(id, { esDiseno: true })
const procesando = (id: string) =>
  imagen(id, { etapa: 'procesando', procesada: false, url: null, url160: null, url640: null, url1600: null })

describe('medidasEscaladas', () => {
  it.each([
    [3000, 4000, 1920, 2560],
    [4000, 3000, 2560, 1920],
    [800, 600, 800, 600],
    [2560, 2560, 2560, 2560],
    [5120, 10, 2560, 5],
  ])('%i×%i → %i×%i', (ancho, alto, anchoFinal, altoFinal) => {
    expect(medidasEscaladas(ancho, alto)).toEqual({ ancho: anchoFinal, alto: altoFinal })
  })
})

describe('cupo y posición nueva', () => {
  it('cuenta las imágenes y los archivos reservados', () => {
    expect(cupoLibre([])).toBe(6)
    expect(cupoLibre([imagen('a'), imagen('b')], 3)).toBe(1)
    expect(cupoLibre([imagen('a')], 9)).toBe(0)
  })

  it('va al final si alguna no es diseño', () => {
    expect(posicionNueva([imagen('a'), diseno('b')])).toBe(2)
    expect(posicionNueva([])).toBe(0)
  })

  it('va a la posición 0 si todas son diseños', () => {
    expect(posicionNueva([diseno('a'), diseno('b')])).toBe(0)
  })
})

describe('revisarOrden', () => {
  it('rechaza un diseño primero habiendo imágenes que no lo son', () => {
    expect(revisarOrden(mover([imagen('a'), diseno('b')], 1, -1), 'borrador')).toBe(
      'La imagen principal no puede ser un diseño.',
    )
  })

  it('acepta diseños primero si todas lo son', () => {
    expect(revisarOrden([diseno('a'), diseno('b')], 'borrador')).toBeNull()
  })

  it('en un publicado rechaza una principal sin procesar', () => {
    expect(revisarOrden([procesando('b'), imagen('a')], 'publicado')).toBe(
      'En un producto publicado, la principal tiene que ser una imagen procesada que no sea un diseño.',
    )
    expect(revisarOrden([procesando('b'), imagen('a')], 'borrador')).toBeNull()
  })

  it('mover no sale de las puntas', () => {
    const lista = [imagen('a'), imagen('b')]
    expect(mover(lista, 0, -1)).toBe(lista)
    expect(mover(lista, 1, 1)).toBe(lista)
    expect(mover(lista, 0, 1).map((i) => i.id)).toEqual(['b', 'a'])
  })
})

describe('motivoParaNoPublicar', () => {
  it.each<[string, Imagen[], string | null]>([
    ['sin imágenes', [], 'Para publicar, agregá una imagen que no sea un diseño.'],
    ['todas diseños', [diseno('a')], 'Para publicar, agregá una imagen que no sea un diseño.'],
    ['principal procesando', [procesando('a')], 'Se puede publicar cuando la imagen principal termine de procesarse.'],
    [
      'principal subiendo',
      [imagen('a', { etapa: 'pendiente_subida', procesada: false })],
      'Se puede publicar cuando la imagen principal termine de procesarse.',
    ],
    [
      'principal fallida',
      [imagen('a', { etapa: 'fallida', procesada: false, error: 'No es una imagen.' })],
      'La imagen principal falló: reintentala o hacé principal otra.',
    ],
    ['principal válida', [imagen('a'), procesando('b')], null],
  ])('%s', (_, galeria, texto) => {
    expect(motivoParaNoPublicar(galeria)?.texto ?? null).toBe(texto)
  })

  it('marca la espera solo mientras la principal se sube o procesa', () => {
    expect(motivoParaNoPublicar([procesando('a')])?.esperando).toBe(true)
    expect(motivoParaNoPublicar([])?.esperando).toBe(false)
  })
})

describe('esUltimaValida', () => {
  const galeria = [imagen('a'), procesando('b'), diseno('c')]

  it('en un publicado, la única válida es la última', () => {
    expect(esUltimaValida(galeria, 'a', 'publicado')).toBe(true)
    expect(esUltimaValida(galeria, 'b', 'publicado')).toBe(false)
  })

  it('con otra válida o en borrador se puede quitar', () => {
    expect(esUltimaValida([...galeria, imagen('d')], 'a', 'publicado')).toBe(false)
    expect(esUltimaValida(galeria, 'a', 'borrador')).toBe(false)
  })
})

describe('intervaloConsulta', () => {
  it('consulta cada 2 s y, a los 2 minutos sin terminar, cada 15 s', () => {
    expect(intervaloConsulta(0)).toBe(2000)
    expect(intervaloConsulta(119_999)).toBe(2000)
    expect(intervaloConsulta(120_000)).toBe(15_000)
  })
})

describe('subida', () => {
  const expiraEn = '2026-09-25T12:15:00.000Z'
  const antes = Date.parse('2026-09-25T12:10:00.000Z')
  const despues = Date.parse('2026-09-25T12:16:00.000Z')

  it('progresa, termina el PUT y pasa a confirmar', () => {
    let subida = subidaNueva(expiraEn)
    subida = avanzarSubida(subida, { tipo: 'progreso', porcentaje: 41.6 })
    expect(subida).toEqual({ fase: 'subiendo', progreso: 42, expiraEn })
    subida = avanzarSubida(subida, { tipo: 'subida' })
    expect(subida).toEqual({ fase: 'confirmando', expiraEn })
    expect(avanzarSubida(subida, { tipo: 'progreso', porcentaje: 10 })).toBe(subida)
  })

  it('falla en el PUT o en confirmar', () => {
    expect(avanzarSubida(subidaNueva(expiraEn), { tipo: 'fallo' }).fase).toBe('fallida')
    expect(avanzarSubida({ fase: 'confirmando', expiraEn }, { tipo: 'fallo' }).fase).toBe('fallida')
  })

  it('reintenta el PUT con la URL vigente y empieza de nuevo con expiraEn vencido', () => {
    const fallida = avanzarSubida(subidaNueva(expiraEn), { tipo: 'fallo' })
    expect(comoReintentar(fallida, antes)).toBe('repetir')
    expect(comoReintentar(fallida, despues)).toBe('de-nuevo')
  })
})
