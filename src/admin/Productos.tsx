import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, ErrorApi, pedir } from '../api'
import { formatearPrecio } from '../catalogo/presentacion'
import { avisar } from './avisos'
import { confirmar } from './confirmar'
import { esValida, type Imagen, mover } from './galeria'
import { IconoAbajo, IconoArriba, IconoFoto } from './iconos'
import { mensajeDeError } from './mensajes'
import { hayCambios, rebasar } from './orden'
import type { Producto } from './productos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/productos` (F6-D1, F6-D2): el listado en el orden global de la API, con "Nuevo producto" arriba
// y "Editar" como enlace al formulario. Suma el orden sin guardar con "Subir", "Bajar" y "Guardar orden"
// (F8-D1 a F8-D5): toda recarga lo rebasa sobre la lista nueva, así no se pierde ante un `409`.

type Categoria = components['schemas']['Categoria']

/** El orden cargado (`cargado`, `version`) y el que el usuario armó y todavía no guardó. */
interface Orden {
  cargado: string[]
  version: number
  sinGuardar: string[]
}

const codigoDe = (e: unknown) => (e instanceof ErrorApi ? e.codigo : null)

export default function Productos() {
  const [productos, setProductos] = useState<Producto[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [orden, setOrden] = useState<Orden | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const [foco, setFoco] = useState<{ id: string; paso: -1 | 1 } | null>(null)
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
      const nuevo: Orden = {
        cargado: orden,
        version: ordenVersion,
        sinGuardar: previo ? rebasar(previo.sinGuardar, previo.cargado, orden) : orden,
      }
      setProductos(productos)
      setCategorias(categorias)
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

  // React mueve la fila con `insertBefore` y el botón pierde el foco: se lo devuelve (F8-D2).
  useEffect(() => {
    if (!foco) return
    const boton = (paso: -1 | 1) =>
      document.querySelector<HTMLButtonElement>(`[data-mover="${paso}"][data-id="${CSS.escape(foco.id)}"]`)
    const mismo = boton(foco.paso)
    ;(mismo && !mismo.disabled ? mismo : boton(foco.paso === -1 ? 1 : -1))?.focus()
    setFoco(null)
  }, [foco])

  const porId = new Map((productos ?? []).map((p) => [p.id, p]))

  const moverFila = (i: number, paso: -1 | 1) => {
    if (!orden) return
    const sinGuardar = mover(orden.sinGuardar, i, paso)
    const id = sinGuardar[i + paso]
    if (id === undefined) return
    setOrden({ ...orden, sinGuardar })
    setAnuncio(`«${porId.get(id)?.nombre ?? ''}», posición ${i + paso + 1} de ${sinGuardar.length}.`)
    setFoco({ id, paso })
  }

  const guardar = async () => {
    if (!orden) return
    setErrorLista(null)
    setGuardando(true)
    try {
      const guardado = await pedir(
        apiAdmin.PUT('/admin/productos/orden', { body: { orden: orden.sinGuardar, ordenVersion: orden.version } }),
      )
      setOrden({ cargado: guardado.orden, version: guardado.ordenVersion, sinGuardar: guardado.orden })
      avisar('Orden guardado. El catálogo se actualiza en hasta un minuto.')
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

  const nombreCategoria = (id: string | null) => categorias.find((c) => c.id === id)?.nombre ?? 'Sin categoría'

  const filas = (orden?.sinGuardar ?? []).flatMap((id) => porId.get(id) ?? [])

  let lista: ReactNode
  if (productos === null) lista = !errorLista && <p className="cargando">Cargando…</p>
  else if (filas.length === 0) lista = <p className="lista__vacia">Todavía no hay productos.</p>
  else
    lista = (
      <ol className="lista">
        {filas.map((producto, i) => (
          <li className="lista__fila" key={producto.id}>
            <span className="lista__orden" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
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
              <button
                type="button"
                className="btn--icono"
                aria-label={`Subir «${producto.nombre}»`}
                data-mover="-1"
                data-id={producto.id}
                onClick={() => moverFila(i, -1)}
                disabled={guardando || i === 0}
              >
                <IconoArriba />
              </button>
              <button
                type="button"
                className="btn--icono"
                aria-label={`Bajar «${producto.nombre}»`}
                data-mover="1"
                data-id={producto.id}
                onClick={() => moverFila(i, 1)}
                disabled={guardando || i === filas.length - 1}
              >
                <IconoAbajo />
              </button>
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

  return (
    <section className="seccion" aria-labelledby="tituloProductos">
      <div className="seccion__cabecera">
        <h1 className="seccion__titulo" id="tituloProductos" ref={titulo} tabIndex={-1}>
          Productos
        </h1>
        <div className="orden__acciones">
          {cambios && (
            <span className="orden__pendiente" id="ordenPendiente">
              Hay cambios en el orden sin guardar.
            </span>
          )}
          <button
            type="button"
            className="btn btn--secundario"
            onClick={guardar}
            disabled={!cambios || guardando}
            aria-describedby={cambios ? 'ordenPendiente' : undefined}
          >
            {guardando ? 'Guardando…' : 'Guardar orden'}
          </button>
          <a className="btn btn--primario" href="/admin/productos/editar">
            Nuevo producto
          </a>
        </div>
      </div>
      {errorLista && (
        <p className="aviso aviso--error" role="alert">
          {errorLista}
        </p>
      )}
      {lista}
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
