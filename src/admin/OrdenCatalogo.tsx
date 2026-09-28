import { Accessibility, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/dom'
import { DragDropProvider, useDroppable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { PRODUCTOS_POR_HILERA } from '../catalogo/presentacion'
import { esValida, motivoParaNoPublicar } from './galeria'
import { IconoFoto } from './iconos'
import { type Armado, type Destino, filas, moverHilera, moverProducto, tieneDisenoProcesado } from './orden'
import type { Producto } from './productos'

// Vista "Orden del catálogo" de `/admin/productos` (F13-D2, F13-D3, F13-D6, F13-D10): una hilera por renglón,
// como el carrusel mobile del catálogo público, y los borradores aparte. Todo se mueve arrastrando (`@dnd-kit`):
// un producto, el número de una hilera o un borrador listo para publicar. El estado (`Armado`) es de la isla
// `Productos.tsx`; acá se arma cada movimiento y se anuncia.

interface Props {
  /** Todos los productos, por id. */
  porId: ReadonlyMap<string, Producto>
  armado: Armado
  guardando: boolean
  onCambiar: (armado: Armado) => void
  onAnunciar: (texto: string) => void
}

/** Cuánto se queda el dedo sobre un destino antes de que las hileras se reacomoden (F13-D2). */
const ESPERA = 450

// Ids de dnd-kit: los productos van con su id; las hileras, los lugares vacíos y las zonas, con prefijo.
const HILERA = 'hilera:'
const VACIO = 'vacio:'
const NUEVA = 'zona:nueva'
const BORRADORES = 'zona:borradores'
const TACHO = 'zona:tacho'

const INSTRUCCIONES =
  'Para tomar un producto o una hilera, apretá Espacio o Enter. Con las flechas lo llevás a otro lugar; Espacio o Enter lo sueltan y Escape descarta el movimiento.'
const DESCARTADO = 'Se descartó el movimiento: todo volvió a como estaba.'

/** Cuánto puede saltar el scroll de una vez mientras se arrastra; más es un salto de dnd-kit y se deshace. */
const SALTO = 150
/** Cuánto sigue cuidado el scroll después de soltar, mientras dura la animación de soltar. */
const CUIDADO_AL_SOLTAR = 600

/** `1 producto`, `3 productos`. */
const productos = (n: number) => `${n} ${n === 1 ? 'producto' : 'productos'}`

/** Hilera y lugar (desde 1) de un id en las hileras de la vista. */
function ubicar(hileras: string[][], id: string): { hilera: number; lugar: number } | null {
  for (const [k, fila] of hileras.entries()) {
    const i = fila.indexOf(id)
    if (i >= 0) return { hilera: k + 1, lugar: i + 1 }
  }
  return null
}

/** Lo que se anuncia al tomar un producto o una hilera (F13-D10). */
function textoTomar(armado: Armado, porId: ReadonlyMap<string, Producto>, id: string): string {
  const hileras = filas(armado, (x) => porId.get(x)?.estado === 'publicado')
  if (id.startsWith(HILERA)) {
    const k = hileras.findIndex((f) => f[0] === id.slice(HILERA.length))
    return `Tomaste la hilera ${k + 1}, con ${productos(hileras[k]?.length ?? 0)}.`
  }
  const nombre = porId.get(id)?.nombre ?? ''
  const lugar = ubicar(hileras, id)
  return lugar
    ? `Tomaste «${nombre}», hilera ${lugar.hilera}, lugar ${lugar.lugar}.`
    : `Tomaste «${nombre}», borrador listo para publicar.`
}

export default function OrdenCatalogo({ porId, armado, guardando, onCambiar, onAnunciar }: Props) {
  const [activo, setActivo] = useState<string | null>(null)
  const [encima, setEncima] = useState<string | null>(null)
  // Lo que leen los eventos de dnd-kit y el plugin de accesibilidad, que se crean una vez.
  const actual = useRef({ armado, porId })
  actual.current = { armado, porId }
  const alTomar = useRef(armado)
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  // El destino ya aplicado: sin esto, soltar sobre él lo movería otra vez.
  const aplicado = useRef<string | null>(null)
  const ultimoAnuncio = useRef<string | undefined>(undefined)
  // Mientras se arrastra y al soltar: al pasar un producto a otra hilera, React lo vuelve a montar y dnd-kit
  // lleva a la vista el elemento que quedó fuera del documento, que mide 0 y manda la página arriba.
  const cuidarScroll = useRef(false)
  const finCuidado = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Al soltar con teclado: el que se movió vuelve a tener el foco. Si pasó a otra hilera, React lo volvió a
  // montar y el foco que restaura dnd-kit cae en el elemento viejo; sin esto, las flechas mueven la página.
  const enfocar = useRef<string | null>(null)
  useEffect(() => {
    const id = enfocar.current
    if (id === null) return
    enfocar.current = null
    const temporizador = setTimeout(() =>
      document.querySelector<HTMLElement>(`[data-orden-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }),
    )
    return () => clearTimeout(temporizador)
  })

  useEffect(() => {
    let y = window.scrollY
    const alDesplazar = () => {
      if (cuidarScroll.current && Math.abs(window.scrollY - y) > SALTO) window.scrollTo(window.scrollX, y)
      else y = window.scrollY
    }
    window.addEventListener('scroll', alDesplazar, { passive: true })
    return () => {
      window.removeEventListener('scroll', alDesplazar)
      clearTimeout(finCuidado.current)
    }
  }, [])

  const publicado = (id: string) => actual.current.porId.get(id)?.estado === 'publicado'
  const nombre = (id: string) => actual.current.porId.get(id)?.nombre ?? ''

  const accesibilidad = useMemo(
    () =>
      Accessibility.configure({
        screenReaderInstructions: { draggable: INSTRUCCIONES },
        announcements: {
          dragstart: ({ operation: { source } }: DragStartEvent) =>
            source ? textoTomar(actual.current.armado, actual.current.porId, String(source.id)) : undefined,
          // Los movimientos se anuncian al aplicarse, con la espera o sin ella: acá solo el tacho.
          dragover: ({ operation: { target } }: DragOverEvent) =>
            target?.id === TACHO ? 'Soltá para descartar el movimiento.' : undefined,
          dragend: ({ operation: { target }, canceled }: DragEndEvent) =>
            canceled || target?.id === TACHO ? DESCARTADO : ultimoAnuncio.current,
        },
      }),
    [],
  )

  /** Aplica soltar `origen` sobre `destino` en el armado de este momento y lo anuncia (F13-D5, F13-D10). */
  const mover = (origen: string, destino: string) => {
    if (origen === destino || aplicado.current === destino) return
    const antes = actual.current.armado
    const hileras = filas(antes, publicado)
    let nuevo: Armado
    let texto: (despues: string[][]) => string

    if (origen.startsWith(HILERA)) {
      if (!destino.startsWith(HILERA)) return
      const desde = hileras.findIndex((f) => f[0] === origen.slice(HILERA.length))
      const hasta = hileras.findIndex((f) => f[0] === destino.slice(HILERA.length))
      if (desde < 0 || hasta < 0) return
      const primero = origen.slice(HILERA.length)
      nuevo = moverHilera(antes, publicado, desde, hasta)
      texto = (despues) => `La hilera ahora es la ${despues.findIndex((f) => f[0] === primero) + 1}.`
    } else {
      let lugar: Destino
      if (destino === NUEVA) lugar = { hileraNueva: true }
      else if (destino === BORRADORES) lugar = { borradores: true }
      else if (destino.startsWith(VACIO)) {
        const k = hileras.findIndex((f) => f[0] === destino.slice(VACIO.length).split(':')[0])
        if (k < 0) return
        lugar = { finDeHilera: k }
      } else if (ubicar(hileras, destino)) lugar = { antesDe: destino }
      // Sobre otro borrador listo: vuelve a borradores.
      else lugar = { borradores: true }
      nuevo = moverProducto(antes, publicado, origen, lugar)
      texto = (despues) => {
        const donde = ubicar(despues, origen)
        if (!donde) return `«${nombre(origen)}» vuelve a borradores.`
        if ('hileraNueva' in lugar) return `«${nombre(origen)}» en una hilera nueva, la ${donde.hilera}.`
        return `«${nombre(origen)}» en la hilera ${donde.hilera}, lugar ${donde.lugar}.`
      }
    }
    if (nuevo === antes) return
    aplicado.current = destino
    actual.current = { ...actual.current, armado: nuevo }
    onCambiar(nuevo)
    ultimoAnuncio.current = texto(filas(nuevo, publicado))
    onAnunciar(ultimoAnuncio.current)
  }

  const descartar = () => {
    clearTimeout(espera.current)
    actual.current = { ...actual.current, armado: alTomar.current }
    onCambiar(alTomar.current)
  }

  const hileras = filas(armado, publicado)
  const borradores = armado.orden.flatMap((id) => {
    const producto = porId.get(id)
    return producto && producto.estado === 'borrador' && !armado.aPublicar.has(id) ? [producto] : []
  })
  const listos = borradores.filter((p) => motivoParaNoPublicar(p.galeria) === null)
  const noListos = borradores.filter((p) => motivoParaNoPublicar(p.galeria) !== null)
  const hayBorradores = armado.orden.some((id) => porId.get(id)?.estado === 'borrador')
  const arrastrando = activo !== null

  return (
    <DragDropProvider
      plugins={(defaults) => [...defaults, accesibilidad]}
      onDragStart={({ operation: { source } }) => {
        alTomar.current = actual.current.armado
        aplicado.current = null
        ultimoAnuncio.current = undefined
        clearTimeout(finCuidado.current)
        cuidarScroll.current = true
        setActivo(source ? String(source.id) : null)
        navigator.vibrate?.(12)
      }}
      onDragOver={(evento) => {
        // Las hileras las arma `mover`: dnd-kit no reordena por su cuenta.
        evento.preventDefault()
        const { source, target, activatorEvent } = evento.operation
        clearTimeout(espera.current)
        aplicado.current = null
        setEncima(target ? String(target.id) : null)
        if (!source || !target || source.id === target.id) return
        const origen = String(source.id)
        const destino = String(target.id)
        if (destino === TACHO) return
        // Con teclado se aplica enseguida; con el dedo, cuando se queda sobre el destino (F13-D2, F13-D10).
        if (activatorEvent instanceof KeyboardEvent) mover(origen, destino)
        else espera.current = setTimeout(() => mover(origen, destino), ESPERA)
      }}
      onDragEnd={({ operation: { source, target, activatorEvent }, canceled }) => {
        clearTimeout(espera.current)
        if (source && activatorEvent instanceof KeyboardEvent) enfocar.current = String(source.id)
        if (canceled || target?.id === TACHO) descartar()
        else if (source && target) mover(String(source.id), String(target.id))
        setActivo(null)
        setEncima(null)
        finCuidado.current = setTimeout(() => {
          cuidarScroll.current = false
        }, CUIDADO_AL_SOLTAR)
      }}
    >
      <div className={`orden${arrastrando ? ' is-arrastrando' : ''}`}>
        <p className="orden__ayuda">
          Mantené apretado y arrastrá un producto para cambiarlo de lugar, o el número de una hilera para moverla
          entera.
        </p>

        <ol className="orden__hileras" aria-label="Hileras del catálogo">
          {hileras.map((ids, k) => (
            <Hilera
              key={ids[0]}
              ids={ids}
              indice={k}
              porId={porId}
              aPublicar={armado.aPublicar}
              activo={activo}
              encima={encima}
              guardando={guardando}
            />
          ))}
        </ol>
        <ZonaNueva disabled={guardando} />

        {hayBorradores && (
          <ZonaBorradores disabled={guardando}>
            <h2 className="orden__subtitulo" id="tituloBorradores">
              Borradores
            </h2>
            <p className="orden__nota">No se ven en el catálogo.</p>
            <h3 className="orden__grupo">Listos para publicar</h3>
            {listos.length > 0 ? (
              <>
                <p className="orden__nota">Arrastralos a una hilera: se publican al guardar.</p>
                <ol className="orden__listos">
                  {listos.map((producto, i) => (
                    <Casilla
                      key={producto.id}
                      producto={producto}
                      indice={i}
                      etiqueta={`«${producto.nombre}», borrador listo para publicar`}
                      encima={encima}
                      guardando={guardando}
                    />
                  ))}
                </ol>
              </>
            ) : (
              <p className="orden__nota">Ninguno.</p>
            )}
            {noListos.length > 0 && (
              <>
                <h3 className="orden__grupo">Todavía no se pueden publicar</h3>
                <ul className="orden__nolistos">
                  {noListos.map((producto) => (
                    <li key={producto.id}>
                      <Foto producto={producto} chica />
                      <span className="orden__motivo">
                        <strong>{producto.nombre}</strong>
                        <br />
                        {motivoParaNoPublicar(producto.galeria)?.texto}
                      </span>
                      <a
                        className="btn btn--secundario btn--chico"
                        href={`/admin/productos/editar?id=${encodeURIComponent(producto.id)}`}
                      >
                        Editar<span className="visualmente-oculto"> «{producto.nombre}»</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </ZonaBorradores>
        )}
      </div>
      {arrastrando && <Tacho />}
    </DragDropProvider>
  )
}

interface PropsHilera {
  ids: string[]
  indice: number
  porId: ReadonlyMap<string, Producto>
  aPublicar: ReadonlySet<string>
  activo: string | null
  encima: string | null
  guardando: boolean
}

function Hilera({ ids, indice, porId, aPublicar, activo, encima, guardando }: PropsHilera) {
  const id = `${HILERA}${ids[0]}`
  const { ref, handleRef, isDragSource } = useSortable({
    id,
    index: indice,
    group: 'hileras',
    type: 'hilera',
    accept: 'hilera',
    disabled: guardando,
  })
  const numero = indice + 1
  const clases = [
    'orden__hilera',
    isDragSource && 'is-arrastrada',
    activo !== null && ids.includes(activo) && 'is-origen',
    activo?.startsWith(HILERA) && encima === id && !isDragSource && 'is-apuntada',
  ]
  return (
    <li ref={ref} className={clases.filter(Boolean).join(' ')}>
      <button
        type="button"
        ref={handleRef}
        data-orden-id={id}
        className="orden__numero"
        aria-label={`Hilera ${numero}, con ${productos(ids.length)}: arrastrala para moverla entera`}
        aria-roledescription="arrastrable"
        disabled={guardando}
      >
        {numero}
      </button>
      <ol className="orden__lugares">
        {ids.map((x, lugar) => {
          const producto = porId.get(x)
          if (!producto) return null
          const partes = [`«${producto.nombre}», hilera ${numero}, lugar ${lugar + 1}`]
          if (tieneDisenoProcesado(producto)) partes.push('con diseños')
          if (aPublicar.has(x)) partes.push('nuevo: se publica al guardar')
          return (
            <Casilla
              key={x}
              producto={producto}
              indice={indice * PRODUCTOS_POR_HILERA + lugar}
              etiqueta={partes.join(', ')}
              nuevo={aPublicar.has(x)}
              encima={encima}
              guardando={guardando}
            />
          )
        })}
        {Array.from({ length: Math.max(0, PRODUCTOS_POR_HILERA - ids.length) }, (_, k) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: los lugares vacíos no tienen estado; se distinguen por su lugar.
          <Vacio key={`${VACIO}${ids[0]}:${k}`} id={`${VACIO}${ids[0]}:${k}`} disabled={guardando} />
        ))}
      </ol>
    </li>
  )
}

interface PropsCasilla {
  producto: Producto
  indice: number
  etiqueta: string
  nuevo?: boolean
  encima: string | null
  guardando: boolean
}

function Casilla({ producto, indice, etiqueta, nuevo = false, encima, guardando }: PropsCasilla) {
  const { ref, isDragSource } = useSortable({
    id: producto.id,
    index: indice,
    group: 'productos',
    type: 'producto',
    accept: 'producto',
    disabled: guardando,
  })
  const borrador = producto.estado === 'borrador'
  const clases = [
    'orden__casilla',
    borrador && 'is-borrador',
    isDragSource && 'is-arrastrada',
    encima === producto.id && !isDragSource && 'is-apuntada',
  ]
  return (
    <li
      ref={ref}
      data-orden-id={producto.id}
      tabIndex={guardando ? -1 : 0}
      aria-roledescription="arrastrable"
      aria-label={etiqueta}
      aria-disabled={guardando || undefined}
      className={clases.filter(Boolean).join(' ')}
    >
      <Foto producto={producto} />
      {tieneDisenoProcesado(producto) && (
        <span className="orden__chip-d" title="Tiene diseños" aria-hidden="true">
          D
        </span>
      )}
      {nuevo && (
        <span className="orden__nuevo" aria-hidden="true">
          Nuevo
        </span>
      )}
      <span className="orden__nombre" aria-hidden="true">
        {producto.nombre}
      </span>
    </li>
  )
}

/** La imagen principal si es válida; si no, el ícono de foto (F7-D10). `chica` es la miniatura de 40 px. */
function Foto({ producto, chica = false }: { producto: Producto; chica?: boolean }) {
  const principal = producto.galeria[0]
  if (!principal?.url160 || !principal.url640 || !esValida(principal))
    return (
      <span className="orden__sin-foto">
        <IconoFoto />
      </span>
    )
  return (
    <img
      src={principal.url160}
      srcSet={`${principal.url160} 160w, ${principal.url640} 640w`}
      sizes={chica ? '40px' : '(max-width: 560px) 22vw, 160px'}
      width={chica ? 40 : 160}
      height={chica ? 40 : 160}
      loading="lazy"
      draggable={false}
      alt=""
    />
  )
}

function Vacio({ id, disabled }: { id: string; disabled: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id, accept: 'producto', disabled })
  return <li ref={ref} className={`orden__vacio${isDropTarget ? ' is-encima' : ''}`} aria-hidden="true" />
}

function ZonaNueva({ disabled }: { disabled: boolean }) {
  const { ref, isDropTarget } = useDroppable({ id: NUEVA, accept: 'producto', disabled })
  return (
    <div ref={ref} className={`orden__nueva${isDropTarget ? ' is-encima' : ''}`}>
      <span aria-hidden="true">＋</span> Soltá acá para empezar una hilera nueva
    </div>
  )
}

function ZonaBorradores({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  const { ref, isDropTarget } = useDroppable({ id: BORRADORES, accept: 'producto', disabled })
  return (
    <section
      ref={ref}
      className={`orden__borradores${isDropTarget ? ' is-encima' : ''}`}
      aria-labelledby="tituloBorradores"
    >
      {children}
    </section>
  )
}

/** El tacho: aparece al tomar algo; soltar ahí descarta el movimiento (F13-D2). */
function Tacho() {
  const { ref, isDropTarget } = useDroppable({ id: TACHO, accept: ['producto', 'hilera'] })
  return (
    <div ref={ref} className={`orden__tacho${isDropTarget ? ' is-encima' : ''}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3.5 5.5h13M8 5.5V3.5h4v2M5 5.5l.8 11h8.4l.8-11M8.5 8.5v5M11.5 8.5v5" />
      </svg>
      <span>{isDropTarget ? 'Soltá para descartar' : 'Descartar movimiento'}</span>
    </div>
  )
}
