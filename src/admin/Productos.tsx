import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, ErrorApi, pedir } from '../api'
import { formatearPrecio } from '../catalogo/presentacion'
import { avisar } from './avisos'
import { confirmar } from './confirmar'
import { esValida, type Imagen } from './galeria'
import { IconoFoto } from './iconos'
import { mensajeDeError } from './mensajes'
import OrdenCatalogo from './OrdenCatalogo'
import { type Armado, hayCambios, listaDeCortes, rebasar } from './orden'
import type { Producto } from './productos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/productos` (F6-D1, F6-D2, F12-D6): dos pestañas. "Lista" muestra el orden guardado con "Nuevo
// producto", "Editar" y "Borrar"; "Orden del catálogo" arma el orden sin guardar, con sus cortes de hilera y
// los borradores a publicar, y lo guarda con "Guardar orden" o "Guardar y publicar" (F8-D1 a F8-D5, F13-D4,
// F13-D9): toda recarga lo rebasa sobre la lista nueva, así no se pierde ante un `409` (F13-D8).

type Categoria = components['schemas']['Categoria']

/** El orden cargado (`cargado`, `version`) y el que el usuario armó y todavía no guardó. */
interface Orden {
  cargado: Armado
  version: number
  sinGuardar: Armado
}

/** El orden guardado, con los cortes que trae cada producto (`iniciaHilera`) o el `PUT`. */
const armadoGuardado = (orden: string[], cortes: Iterable<string>): Armado => ({
  orden,
  cortes: new Set(cortes),
  aPublicar: new Set(),
})

type Vista = 'lista' | 'orden'
const VISTAS: Vista[] = ['lista', 'orden']

/** La pestaña de la URL: `?vista=orden`, o la "Lista" con cualquier otro valor (F12-D6). */
const vistaDeUrl = (): Vista => (new URLSearchParams(location.search).get('vista') === 'orden' ? 'orden' : 'lista')

const codigoDe = (e: unknown) => (e instanceof ErrorApi ? e.codigo : null)

export default function Productos() {
  const [productos, setProductos] = useState<Producto[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [orden, setOrden] = useState<Orden | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const [vista, setVista] = useState<Vista>(vistaDeUrl)
  const titulo = useRef<HTMLHeadingElement>(null)
  // La recarga rebasa el orden de ese momento, no el de cuando empezó el pedido.
  const ordenRef = useRef(orden)
  ordenRef.current = orden

  /** Pide el listado y rebasa el orden sin guardar (F8-D5); devuelve el orden nuevo, o `null` si falló. */
  const cargar = useCallback(async (): Promise<Orden | null> => {
    try {
      const [{ productos, orden, ordenVersion }, { categorias }] = await Promise.all([
        pedir(apiAdmin.GET('/admin/productos')),
        pedir(apiAdmin.GET('/admin/categorias')),
      ])
      const previo = ordenRef.current
      const cargado = armadoGuardado(
        orden,
        productos.filter((p) => p.iniciaHilera).map((p) => p.id),
      )
      const publicados = new Set(productos.filter((p) => p.estado === 'publicado').map((p) => p.id))
      const nuevo: Orden = {
        cargado,
        version: ordenVersion,
        sinGuardar: previo ? rebasar(previo.sinGuardar, previo.cargado, cargado, (id) => publicados.has(id)) : cargado,
      }
      setProductos(productos)
      setCategorias(categorias)
      ordenRef.current = nuevo
      setOrden(nuevo)
      return nuevo
    } catch (e) {
      if (!redirigirSiNoAutenticado(e)) setErrorLista(mensajeDeError(e))
      return null
    }
  }, [])

  useEffect(() => {
    exigirSesion().then(cargar, (e: unknown) => setErrorLista(mensajeDeError(e)))
  }, [cargar])

  const cambios = orden !== null && hayCambios(orden.sinGuardar, orden.cargado)

  // Aviso al salir con el orden sin guardar (F8-D5, como F6-D3).
  useEffect(() => {
    if (!cambios) return
    const avisarSalida = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = true
    }
    addEventListener('beforeunload', avisarSalida)
    return () => removeEventListener('beforeunload', avisarSalida)
  }, [cambios])

  const porId = new Map((productos ?? []).map((p) => [p.id, p]))
  const enOrden = (ids: readonly string[]) => ids.flatMap((id) => porId.get(id) ?? [])

  const descartar = () => setOrden((actual) => actual && { ...actual, sinGuardar: actual.cargado })

  const guardar = async () => {
    if (!orden) return
    const { sinGuardar, version } = orden
    setErrorLista(null)
    setGuardando(true)
    try {
      const guardado = await pedir(
        apiAdmin.PUT('/admin/productos/orden', {
          body: { orden: [...sinGuardar.orden], cortes: listaDeCortes(sinGuardar), ordenVersion: version },
        }),
      )
      const cargado = armadoGuardado(guardado.orden, guardado.cortes)
      const nuevo = { cargado, version: guardado.ordenVersion, sinGuardar: cargado }
      ordenRef.current = nuevo
      setOrden(nuevo)
      const aPublicar = sinGuardar.orden.filter((id) => sinGuardar.aPublicar.has(id))
      if (aPublicar.length === 0) {
        avisar('Orden guardado. El catálogo se actualiza en hasta un minuto.')
        return
      }
      // F13-D9: de a uno; un error sigue con el resto, salvo el `401`, que redirige.
      const fallas: string[] = []
      for (const id of aPublicar) {
        try {
          await pedir(apiAdmin.POST('/admin/productos/{id}/publicar', { params: { path: { id } } }))
        } catch (e) {
          if (redirigirSiNoAutenticado(e)) return
          const motivo = mensajeDeError(e).replace(/\.$/, '')
          fallas.push(
            `Se guardó el orden, pero no se pudo publicar «${porId.get(id)?.nombre ?? id}»: ${motivo}. Quedó en borradores.`,
          )
        }
      }
      await cargar()
      if (fallas.length > 0) setErrorLista(fallas.join('\n'))
      else {
        const n = aPublicar.length
        avisar(
          `Orden guardado y ${n} ${n === 1 ? 'publicado' : 'publicados'}. El catálogo se actualiza en hasta un minuto.`,
        )
      }
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      const codigo = codigoDe(e)
      if (codigo === 'ORDEN_DESACTUALIZADO' || codigo === 'ORDEN_INVALIDO') {
        // F8-D4: se recarga, se conserva el orden del usuario y no se reenvía solo.
        const nuevo = await cargar()
        if (nuevo === null) return
        if (codigo === 'ORDEN_INVALIDO') setErrorLista(mensajeDeError(e))
        else if (hayCambios(nuevo.sinGuardar, nuevo.cargado))
          setErrorLista(
            'Otro integrante cambió los productos mientras ordenabas. Conservamos tu orden: los nuevos quedaron al final y los borrados se quitaron. Revisalo y volvé a guardar.',
          )
        else setErrorLista('Otro integrante cambió los productos; tu orden ya coincide con el guardado.')
      } else setErrorLista(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (producto: Producto) => {
    const publicado = producto.estado === 'publicado' ? ' Deja de verse en el catálogo.' : ''
    const confirmado = await confirmar({
      titulo: `¿Borrar el producto «${producto.nombre}»?`,
      detalle: `Se borran también sus medidas y su galería. No se puede deshacer.${publicado}`,
    })
    if (!confirmado) return
    setErrorLista(null)
    try {
      await pedir(apiAdmin.DELETE('/admin/productos/{id}', { params: { path: { id: producto.id } } }))
      avisar('Producto borrado.')
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      setErrorLista(mensajeDeError(e))
    }
    await cargar()
    titulo.current?.focus()
  }

  // Pestañas con activación automática y `tabindex` rotativo (patrón Tabs de la APG, F12-D6).
  const elegirVista = (nueva: Vista) => {
    setVista(nueva)
    const url = new URL(location.href)
    if (nueva === 'orden') url.searchParams.set('vista', 'orden')
    else url.searchParams.delete('vista')
    history.replaceState(history.state, '', url)
  }

  const teclaPestana = (evento: KeyboardEvent<HTMLButtonElement>) => {
    const i = VISTAS.indexOf(vista)
    const destino = {
      ArrowLeft: VISTAS[(i - 1 + VISTAS.length) % VISTAS.length],
      ArrowRight: VISTAS[(i + 1) % VISTAS.length],
      Home: VISTAS[0],
      End: VISTAS[VISTAS.length - 1],
    }[evento.key]
    if (!destino) return
    evento.preventDefault()
    elegirVista(destino)
    document.getElementById(`pestana-${destino}`)?.focus()
  }

  const nombreCategoria = (id: string | null) => categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'

  const guardados = enOrden(orden?.cargado.orden ?? [])

  let lista: ReactNode
  let grilla: ReactNode
  if (productos === null) lista = grilla = !errorLista && <p className="cargando">Cargando…</p>
  else if (guardados.length === 0) lista = grilla = <p className="lista__vacia">Todavía no hay productos.</p>
  else {
    lista = (
      <ol className="lista">
        {guardados.map((producto) => (
          <li className="lista__fila" key={producto.id}>
            <Miniatura imagen={producto.galeria[0]} />
            <span className="lista__nombre">
              {producto.nombre}
              <span className="lista__detalle">{nombreCategoria(producto.categoriaId)}</span>
            </span>
            <span className="lista__datos">
              <span className="lista__precio">{formatearPrecio(producto.precio)}</span>
              <span className={`estado estado--${producto.estado}`}>
                {producto.estado === 'publicado' ? 'Publicado' : 'Borrador'}
              </span>
            </span>
            <span className="lista__acciones">
              <a
                className="btn btn--secundario btn--chico"
                href={`/admin/productos/editar?id=${encodeURIComponent(producto.id)}`}
                aria-label={`Editar ${producto.nombre}`}
              >
                Editar
              </a>
              <button
                type="button"
                className="btn btn--peligro btn--chico"
                aria-label={`Borrar ${producto.nombre}`}
                onClick={() => borrar(producto)}
                disabled={guardando}
              >
                Borrar
              </button>
            </span>
          </li>
        ))}
      </ol>
    )
    grilla = orden && (
      <OrdenCatalogo
        porId={porId}
        armado={orden.sinGuardar}
        guardando={guardando}
        onCambiar={(sinGuardar) => setOrden((actual) => actual && { ...actual, sinGuardar })}
        onAnunciar={setAnuncio}
      />
    )
  }

  const pestana = (v: Vista, texto: ReactNode) => (
    <button
      type="button"
      role="tab"
      className="pestanas__pestana"
      id={`pestana-${v}`}
      aria-selected={vista === v}
      aria-controls={`panel-${v}`}
      tabIndex={vista === v ? 0 : -1}
      onClick={() => elegirVista(v)}
      onKeyDown={teclaPestana}
    >
      {texto}
    </button>
  )

  return (
    <section className="seccion" aria-labelledby="tituloProductos">
      <h1 className="seccion__titulo" id="tituloProductos" ref={titulo} tabIndex={-1}>
        Productos
      </h1>
      <div className="pestanas" role="tablist" aria-label="Vistas de los productos">
        {pestana('lista', 'Lista')}
        {pestana(
          'orden',
          <>
            Orden del catálogo
            {cambios && (
              <>
                <span className="pestanas__punto" aria-hidden="true" />
                <span className="visualmente-oculto"> (sin guardar)</span>
              </>
            )}
          </>,
        )}
      </div>
      {errorLista && (
        <p className="aviso aviso--error" role="alert">
          {errorLista}
        </p>
      )}
      <div
        className="pestanas__panel"
        role="tabpanel"
        id="panel-lista"
        aria-labelledby="pestana-lista"
        hidden={vista !== 'lista'}
      >
        <div className="seccion__cabecera">
          <a className="btn btn--primario" href="/admin/productos/editar">
            Nuevo producto
          </a>
        </div>
        {lista}
      </div>
      <div
        className="pestanas__panel"
        role="tabpanel"
        id="panel-orden"
        aria-labelledby="pestana-orden"
        hidden={vista !== 'orden'}
      >
        <details className="orden__explicacion">
          <summary>Cómo se ordena el catálogo</summary>
          <p>
            El catálogo público muestra los productos publicados en este orden. En el teléfono se ven por hileras que se
            deslizan de costado, como las de acá; en la computadora, en una grilla que sigue el mismo orden.
          </p>
          <p>
            Una hilera termina al llegar a cuatro productos o donde vos la cortás: soltá un producto en «Soltá acá para
            empezar una hilera nueva», o antes del primero de otra hilera. Los cambios se ven en el catálogo en hasta un
            minuto después de guardar.
          </p>
        </details>
        {grilla}
      </div>
      {orden && (cambios || guardando) && vista === 'orden' && (
        <div className="orden__barra">
          <span id="ordenPendiente">
            {orden.sinGuardar.aPublicar.size > 0
              ? `Orden sin guardar · ${orden.sinGuardar.aPublicar.size} para publicar`
              : 'Orden sin guardar'}
          </span>
          <button type="button" className="btn btn--chico orden__descartar" onClick={descartar} disabled={guardando}>
            Descartar
          </button>
          <button
            type="button"
            className="btn btn--primario btn--chico"
            onClick={guardar}
            disabled={guardando}
            aria-describedby="ordenPendiente"
          >
            {guardando ? 'Guardando…' : orden.sinGuardar.aPublicar.size > 0 ? 'Guardar y publicar' : 'Guardar orden'}
          </button>
        </div>
      )}
      <p className="visualmente-oculto" role="status">
        {anuncio}
      </p>
    </section>
  )
}

/** Imagen principal de 48 px si es válida; si no, el ícono de foto (F7-D10). El nombre ya está en la fila. */
function Miniatura({ imagen }: { imagen: Imagen | undefined }) {
  return (
    <span className="lista__foto">
      {imagen?.url160 && esValida(imagen) ? <img src={imagen.url160} width={48} height={48} alt="" /> : <IconoFoto />}
    </span>
  )
}
