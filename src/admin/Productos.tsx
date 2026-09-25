import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, pedir } from '../api'
import { formatearPrecio } from '../catalogo/presentacion'
import { avisar } from './avisos'
import { confirmar } from './confirmar'
import { mensajeDeError } from './mensajes'
import type { Producto } from './productos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/productos` (F6-D1, F6-D2): el listado en el orden global de la API, con "Nuevo producto" arriba
// y "Editar" como enlace al formulario. Tras borrar se vuelve a pedir el listado.

type Categoria = components['schemas']['Categoria']

export default function Productos() {
  const [productos, setProductos] = useState<Producto[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  const cargar = useCallback(async () => {
    try {
      const [{ productos }, { categorias }] = await Promise.all([
        pedir(apiAdmin.GET('/admin/productos')),
        pedir(apiAdmin.GET('/admin/categorias')),
      ])
      setProductos(productos)
      setCategorias(categorias)
    } catch (e) {
      if (!redirigirSiNoAutenticado(e)) setErrorLista(mensajeDeError(e))
    }
  }, [])

  useEffect(() => {
    exigirSesion().then(cargar, (e: unknown) => setErrorLista(mensajeDeError(e)))
  }, [cargar])

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

  let lista: ReactNode
  if (productos === null) lista = !errorLista && <p className="cargando">Cargando…</p>
  else if (productos.length === 0) lista = <p className="lista__vacia">Todavía no hay productos.</p>
  else
    lista = (
      <ul className="lista">
        {productos.map((producto) => (
          <li className="lista__fila" key={producto.id}>
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
              >
                Borrar
              </button>
            </span>
          </li>
        ))}
      </ul>
    )

  return (
    <section className="seccion" aria-labelledby="tituloProductos">
      <div className="seccion__cabecera">
        <h1 className="seccion__titulo" id="tituloProductos" ref={titulo} tabIndex={-1}>
          Productos
        </h1>
        <a className="btn btn--primario" href="/admin/productos/editar">
          Nuevo producto
        </a>
      </div>
      {errorLista && (
        <p className="aviso aviso--error" role="alert">
          {errorLista}
        </p>
      )}
      {lista}
    </section>
  )
}
