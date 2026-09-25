import { type FormEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, pedir } from '../api'
import { avisar } from './avisos'
import Campo from './Campo'
import { confirmar } from './confirmar'
import { mensajeDeError } from './mensajes'
import { enfocarEditar, esNombreEnUso, esNoEncontrado, NOMBRE_MAXIMO, validarNombre } from './recursos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/categorias` (F5-D1, F5-D2): alta arriba, lista debajo, edición en la fila y borrado con
// confirmación. Tras cada cambio se vuelve a pedir el listado: el orden es el del servidor.

type Categoria = components['schemas']['Categoria']

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  const cargar = useCallback(async () => {
    try {
      const { categorias } = await pedir(apiAdmin.GET('/admin/categorias'))
      setCategorias(categorias)
    } catch (e) {
      if (!redirigirSiNoAutenticado(e)) setErrorLista(mensajeDeError(e))
    }
  }, [])

  useEffect(() => {
    exigirSesion().then(cargar, (e: unknown) => setErrorLista(mensajeDeError(e)))
  }, [cargar])

  // Otro integrante la borró: se recarga y se explica sobre la lista (F5-D3).
  const noEncontrada = (e: unknown) => {
    setEditando(null)
    setErrorLista(mensajeDeError(e))
    void cargar()
  }

  const borrar = async (categoria: Categoria) => {
    const confirmado = await confirmar({
      titulo: `¿Borrar la categoría «${categoria.nombre}»?`,
      detalle: 'Los productos que la usan quedan sin categoría.',
    })
    if (!confirmado) return
    setErrorLista(null)
    try {
      await pedir(apiAdmin.DELETE('/admin/categorias/{id}', { params: { path: { id: categoria.id } } }))
      avisar('Categoría borrada.')
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      setErrorLista(mensajeDeError(e))
    }
    await cargar()
    // La fila ya no existe: el foco va al título de la sección (F5-D4).
    titulo.current?.focus()
  }

  let lista: ReactNode
  if (categorias === null) lista = !errorLista && <p className="cargando">Cargando…</p>
  else if (categorias.length === 0) lista = <p className="lista__vacia">Todavía no hay categorías.</p>
  else
    lista = (
      <ul className="lista">
        {categorias.map((categoria) =>
          editando === categoria.id ? (
            <Edicion
              key={categoria.id}
              categoria={categoria}
              alTerminar={(guardada) => {
                setEditando(null)
                if (guardada) {
                  setErrorLista(null)
                  void cargar()
                }
                enfocarEditar(categoria.id)
              }}
              alNoEncontrar={noEncontrada}
            />
          ) : (
            <li className="lista__fila" key={categoria.id}>
              <span className="lista__nombre">{categoria.nombre}</span>
              <span className="lista__acciones">
                <button
                  type="button"
                  className="btn btn--secundario btn--chico"
                  data-editar={categoria.id}
                  aria-label={`Editar ${categoria.nombre}`}
                  onClick={() => setEditando(categoria.id)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn--peligro btn--chico"
                  aria-label={`Borrar ${categoria.nombre}`}
                  onClick={() => borrar(categoria)}
                >
                  Borrar
                </button>
              </span>
            </li>
          ),
        )}
      </ul>
    )

  return (
    <section className="seccion" aria-labelledby="tituloCategorias">
      <h1 className="seccion__titulo" id="tituloCategorias" ref={titulo} tabIndex={-1}>
        Categorías
      </h1>
      <Alta
        alCrear={() => {
          setErrorLista(null)
          void cargar()
        }}
      />
      {errorLista && (
        <p className="aviso aviso--error" role="alert">
          {errorLista}
        </p>
      )}
      {lista}
    </section>
  )
}

function Alta({ alCrear }: { alCrear: () => void }) {
  const [enviando, setEnviando] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const nombre = String(new FormData(formulario).get('nombre')).trim()
    setError(null)
    const invalido = validarNombre(nombre)
    setErrorNombre(invalido)
    if (invalido) {
      nombreRef.current?.focus()
      return
    }
    setEnviando(true)
    try {
      await pedir(apiAdmin.POST('/admin/categorias', { body: { nombre } }))
      formulario.reset()
      avisar('Categoría creada.')
      alCrear()
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      if (esNombreEnUso(e)) {
        setErrorNombre(mensajeDeError(e))
        nombreRef.current?.focus()
      } else setError(mensajeDeError(e))
    }
    setEnviando(false)
  }

  return (
    <form className="alta" onSubmit={enviar} noValidate>
      <Campo
        ref={nombreRef}
        id="altaNombre"
        name="nombre"
        etiqueta="Nueva categoría"
        maxLength={NOMBRE_MAXIMO}
        autoComplete="off"
        error={errorNombre}
      />
      {error && (
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primario" disabled={enviando}>
        {enviando ? 'Creando…' : 'Crear categoría'}
      </button>
    </form>
  )
}

interface PropsEdicion {
  categoria: Categoria
  alTerminar: (guardada: boolean) => void
  alNoEncontrar: (error: unknown) => void
}

function Edicion({ categoria, alTerminar, alNoEncontrar }: PropsEdicion) {
  const [enviando, setEnviando] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nombreRef.current?.focus()
  }, [])

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const nombre = String(new FormData(evento.currentTarget).get('nombre')).trim()
    setError(null)
    const invalido = validarNombre(nombre)
    setErrorNombre(invalido)
    if (invalido) {
      nombreRef.current?.focus()
      return
    }
    setEnviando(true)
    try {
      await pedir(
        apiAdmin.PATCH('/admin/categorias/{id}', { params: { path: { id: categoria.id } }, body: { nombre } }),
      )
      avisar('Categoría renombrada.')
      alTerminar(true)
      return
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      if (esNoEncontrado(e)) return alNoEncontrar(e)
      if (esNombreEnUso(e)) {
        setErrorNombre(mensajeDeError(e))
        nombreRef.current?.focus()
      } else setError(mensajeDeError(e))
    }
    setEnviando(false)
  }

  const teclado = (evento: KeyboardEvent<HTMLFormElement>) => {
    if (evento.key === 'Escape') alTerminar(false)
  }

  return (
    <li className="lista__fila lista__fila--edicion">
      <form className="edicion" onSubmit={enviar} onKeyDown={teclado} noValidate>
        <Campo
          ref={nombreRef}
          id="edicionNombre"
          name="nombre"
          etiqueta={`Nombre de «${categoria.nombre}»`}
          defaultValue={categoria.nombre}
          maxLength={NOMBRE_MAXIMO}
          autoComplete="off"
          error={errorNombre}
        />
        {error && (
          <p className="aviso aviso--error" role="alert">
            {error}
          </p>
        )}
        <span className="lista__acciones">
          <button type="submit" className="btn btn--primario btn--chico" disabled={enviando}>
            {enviando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="btn btn--secundario btn--chico" onClick={() => alTerminar(false)}>
            Cancelar
          </button>
        </span>
      </form>
    </li>
  )
}
