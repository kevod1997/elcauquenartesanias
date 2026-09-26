import { Accessibility, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/dom'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { Fragment, useMemo, useRef } from 'react'
import { hileras } from '../catalogo/presentacion'
import { esValida, mover } from './galeria'
import { IconoAgarre, IconoFoto } from './iconos'
import { estaPublicado, posiciones, textoPosicion, tieneDisenoProcesado } from './orden'
import type { Producto } from './productos'

// Vista "Orden del catálogo" de `/admin/productos` (F12-D6 a F12-D8): el orden sin guardar en la grilla del
// catálogo público, que se arrastra con `@dnd-kit` o se mueve con "Antes" y "Después". El estado (`Orden`) es
// de la isla `Productos.tsx`; acá solo se muestra y se avisa cada movimiento.

interface Props {
  /** Los productos en el orden sin guardar. */
  productos: Producto[]
  guardando: boolean
  onMover: (i: number, paso: -1 | 1) => void
  onSoltar: (desde: number, hasta: number) => void
}

const INSTRUCCIONES =
  'Para tomar el producto, apretá Espacio o Enter. Con las flechas lo llevás a otro lugar; Espacio o Enter lo sueltan y Escape cancela.'

/** El anuncio del producto que estaba en `desde`, llevado a `hasta` (F12-D8). */
function anuncio(productos: Producto[], desde: number, hasta: number): string | undefined {
  const lista = mover(productos, desde, hasta - desde)
  const producto = lista[hasta]
  if (!producto) return undefined
  return textoPosicion(
    producto.nombre,
    posiciones(lista, estaPublicado)[hasta] ?? null,
    lista.filter(estaPublicado).length,
  )
}

export default function OrdenCatalogo({ productos, guardando, onMover, onSoltar }: Props) {
  // El plugin de accesibilidad toma los anuncios al crearse: leen los productos de este render por la ref.
  const actuales = useRef(productos)
  actuales.current = productos

  // Configura el `Accessibility` del preset: con el mismo plugin dos veces, el registro se queda con estas opciones.
  const accesibilidad = useMemo(
    () =>
      Accessibility.configure({
        screenReaderInstructions: { draggable: INSTRUCCIONES },
        announcements: {
          dragstart: ({ operation: { source } }: DragStartEvent) => {
            if (!isSortable(source)) return undefined
            const texto = anuncio(actuales.current, source.initialIndex, source.initialIndex)
            return texto && `Tomaste ${texto}`
          },
          // En `dragover`, `source.index` todavía es el anterior: la posición nueva es la del `target`.
          dragover: ({ operation: { source, target } }: DragOverEvent) => {
            if (!isSortable(source) || !isSortable(target) || source.id === target.id) return undefined
            return anuncio(actuales.current, source.initialIndex, target.index)
          },
          dragend: ({ operation: { source }, canceled }: DragEndEvent) => {
            if (!isSortable(source)) return undefined
            const nombre = actuales.current[source.initialIndex]?.nombre ?? ''
            if (canceled) return `Se canceló. «${nombre}» volvió a su lugar.`
            return anuncio(actuales.current, source.initialIndex, source.index)
          },
        },
      }),
    [],
  )

  const numeros = posiciones(productos, estaPublicado)
  let hilera = 0

  return (
    <DragDropProvider
      plugins={(defaults) => [...defaults, accesibilidad]}
      onDragEnd={({ operation: { source }, canceled }) => {
        if (canceled || !isSortable(source) || source.index === source.initialIndex) return
        onSoltar(source.initialIndex, source.index)
      }}
    >
      <ol className="orden__grilla">
        {hileras(productos, tieneDisenoProcesado, estaPublicado).map((indices) => {
          const seVe = indices.some((i) => productos[i] && estaPublicado(productos[i]))
          return (
            <Fragment key={productos[indices[0] ?? 0]?.id}>
              <li className="orden__hilera" aria-hidden="true">
                {seVe ? `Hilera ${++hilera}` : 'No se ven'}
              </li>
              {indices.map((i) => {
                const producto = productos[i]
                return (
                  producto && (
                    <Tarjeta
                      key={producto.id}
                      producto={producto}
                      indice={i}
                      numero={numeros[i] ?? null}
                      ultimo={i === productos.length - 1}
                      guardando={guardando}
                      onMover={onMover}
                    />
                  )
                )
              })}
            </Fragment>
          )
        })}
      </ol>
    </DragDropProvider>
  )
}

interface PropsTarjeta {
  producto: Producto
  indice: number
  /** Posición en el catálogo público, o `null` si es un borrador (F12-D6). */
  numero: number | null
  ultimo: boolean
  guardando: boolean
  onMover: (i: number, paso: -1 | 1) => void
}

function Tarjeta({ producto, indice, numero, ultimo, guardando, onMover }: PropsTarjeta) {
  const { ref, handleRef, isDragSource } = useSortable({ id: producto.id, index: indice, disabled: guardando })
  const { nombre, id } = producto
  const principal = producto.galeria[0]
  const clases = ['orden__tarjeta', numero === null && 'orden__tarjeta--borrador', isDragSource && 'is-arrastrada']

  return (
    <li className={clases.filter(Boolean).join(' ')} ref={ref}>
      <div className="orden__foto">
        {principal?.url160 && principal.url640 && esValida(principal) ? (
          <img
            src={principal.url640}
            srcSet={`${principal.url160} 160w, ${principal.url640} 640w`}
            sizes="(max-width: 560px) 45vw, 360px"
            width={640}
            height={640}
            loading="lazy"
            alt=""
          />
        ) : (
          <IconoFoto />
        )}
        <button
          type="button"
          className="orden__manija"
          ref={handleRef}
          aria-label={`Mover «${nombre}»`}
          aria-roledescription="arrastrable"
          disabled={guardando}
        >
          <IconoAgarre />
        </button>
      </div>
      <div className="orden__cuerpo">
        {numero === null ? (
          <span className="orden__borrador">Borrador · no se ve</span>
        ) : (
          <span className="orden__numero">{String(numero).padStart(2, '0')}</span>
        )}
        <span className="orden__nombre">{nombre}</span>
      </div>
      <div className="orden__mover">
        <button
          type="button"
          className="btn btn--secundario btn--chico"
          data-mover="-1"
          data-id={id}
          onClick={() => onMover(indice, -1)}
          disabled={guardando || indice === 0}
        >
          Antes<span className="visualmente-oculto"> «{nombre}»</span>
        </button>
        <button
          type="button"
          className="btn btn--secundario btn--chico"
          data-mover="1"
          data-id={id}
          onClick={() => onMover(indice, 1)}
          disabled={guardando || ultimo}
        >
          Después<span className="visualmente-oculto"> «{nombre}»</span>
        </button>
      </div>
    </li>
  )
}
