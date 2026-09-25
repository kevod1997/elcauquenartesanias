// El catálogo del sitio viejo (retirado en la fase 10) en forma `ProductoPublico` (F3-D6). Lo sirve servidor.mjs.
import type { components } from '../../src/api/schema'

type ProductoPublico = components['schemas']['ProductoPublico']
type ImagenPublica = components['schemas']['ImagenPublica']
type MedidaPublica = components['schemas']['MedidaPublica']

/** Los tres derivados de un .webp de public/assets/, servidos por `origen`. */
const imagen = (origen: string, base: string, nombreDiseno?: string): ImagenPublica => ({
  url160: `${origen}/assets/${base}-160.webp`,
  url640: `${origen}/assets/${base}-640.webp`,
  url1600: `${origen}/assets/${base}.webp`,
  esDiseno: nombreDiseno !== undefined,
  nombreDiseno: nombreDiseno ?? null,
})

const medida = (tipo: string | null, valor: string, unidad: string | null = null): MedidaPublica => ({
  tipo,
  valor,
  unidad,
})

export const productos = (origen: string): ProductoPublico[] => {
  const producto = (
    id: string,
    nombre: string,
    pesos: number,
    descripcion: string,
    medidas: MedidaPublica[],
    galeria: string[],
    disenos: [string, string][] = [],
  ): ProductoPublico => ({
    id,
    nombre,
    precio: { amount: pesos * 100, currency: 'ARS' },
    categoriaId: null,
    descripcion,
    medidas,
    galeria: [
      ...galeria.map((base) => imagen(origen, base)),
      ...disenos.map(([base, nombre]) => imagen(origen, base, nombre)),
    ],
  })

  return [
    producto(
      'p-cazuelas',
      'Cazuelas artesanales',
      5000,
      'Madera maciza de guayubira con terminación de alta calidad. Ideales para aceitunas, frutos secos, salsas y condimentos.',
      [medida('Diámetro', '13', 'cm'), medida('Alto', '4', 'cm')],
      ['cazuelas-placa'],
    ),
    producto(
      'p-cuencos',
      'Cuencos o bowls',
      7000,
      'Torneados a mano, pequeños y versátiles. Vetas y tonos irrepetibles en cada pieza.',
      [medida('Diámetro', '12', 'cm'), medida('Alto', '7', 'cm')],
      ['cuencos-placa'],
    ),
    producto(
      'p-bowls',
      'Bowls de guayubira',
      12000,
      'Acabado natural que realza las vetas. Para ensaladas, frutas, picadas, panes y postres.',
      [medida('Diámetro', '23', 'cm'), medida('Alto', '4', 'cm')],
      ['bowls-placa'],
    ),
    producto(
      'p-ensaladeras',
      'Ensaladeras',
      13000,
      'Belleza natural y diseño atemporal para la mesa. Acabado suave, ideales para uso diario.',
      [medida('Diámetro', '22,5', 'cm'), medida('Alto', '4', 'cm')],
      ['ensaladeras-placa'],
    ),
    producto(
      'p-concavos',
      'Platos cóncavos',
      8000,
      'Hechos para compartir: quesos, fiambres, aceitunas y snacks. Resistentes y fáciles de mantener.',
      [medida('Diámetro', '19', 'cm'), medida('Alto', '4 y 3,5', 'cm')],
      ['concavos-placa'],
    ),
    producto(
      'p-asado',
      'Plato para asado',
      9000,
      'Con borde interior que evita derrames y realza la presentación. Para asados, picadas y parrilladas.',
      [medida('Diámetro', '23', 'cm'), medida('Alto', '2', 'cm')],
      ['asado-placa'],
    ),
    producto(
      'p-mate',
      'Mate de caldén',
      15000,
      'Madera de caldén, reconocida por su dureza y belleza natural, con fleje de alpaca grabado. Cuatro Diseños para elegir.',
      [medida('Diámetro interior', '5', 'cm'), medida('Prof.', '6', 'cm')],
      ['mate-placa'],
      [
        ['mate-floral', 'Fleje floral'],
        ['mate-pampa', 'Fleje pampa'],
        ['mate-greca', 'Fleje greca'],
        ['mate-aves', 'Fleje aves'],
      ],
    ),
    producto(
      'p-mortero',
      'Mortero de palo santo',
      14000,
      'Tallado a mano en palo santo, apreciado por su dureza y su aroma. Para especias, semillas y hierbas.',
      [medida('Diámetro exterior', '10,5', 'cm'), medida('Alto', '12', 'cm')],
      ['mortero-placa'],
    ),
    producto(
      'p-pinchos',
      'Pinchos para picadas',
      6000,
      'Juego con base torneada y dos modelos de pincho. Un detalle práctico para tapas y aperitivos.',
      [medida('Alto base', '7,5', 'cm'), medida('Largo', '9', 'cm')],
      ['pinchos-placa'],
    ),
    producto(
      'p-sahumerio',
      'Porta sahumerios',
      4000,
      'Torneado en madera maciza, con orificio central para sostener el sahumerio de manera práctica y segura. Ideal para acompañar momentos de relajación o como objeto decorativo.',
      [medida('Diámetro', '18', 'cm')],
      ['porta-sahumerio-placa', 'porta-sahumerio'],
    ),
    producto(
      'p-velas',
      'Bases de madera con vela',
      4200,
      'Bases torneadas en madera maciza con vela tealight incluida, lista para usar. Versátiles y elegantes para mesas, living o dormitorio.',
      [medida(null, 'Varios modelos')],
      ['velas-placa', 'velas'],
    ),
  ]
}
