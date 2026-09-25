import { type FormEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, pedir } from '../api'
import { avisar } from './avisos'
import Campo from './Campo'
import { confirmar } from './confirmar'
import { mensajeDeError } from './mensajes'
import { enfocarEditar, esNombreEnUso, esNoEncontrado, NOMBRE_MAXIMO, UNIDAD_MAXIMA, validarNombre } from './recursos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/tipos-de-medida` (F5-D1, F5-D2): el mismo patrón que `Categorias.tsx`, con la `unidad`
// opcional. Sin unidad, el valor de la medida es texto libre.

type TipoMedida = components['schemas']['TipoMedida']

const AYUDA_UNIDAD = 'Dejala vacía para un valor de texto libre (ej. Talla única).'

/** Lee `nombre` y `unidad` recortados; la unidad vacía se manda `null` (F5-D3). */
function leer(formulario: HTMLFormElement): { nombre: string; unidad: string | null } {
  const datos = new FormData(formulario)
  const unidad = String(datos.get('unidad')).trim()
  return { nombre: String(datos.get('nombre')).trim(), unidad: unidad || null }
}

export default function TiposDeMedida() {
  const [tipos, setTipos] = useState<TipoMedida[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [editando, setEditando] = useState<string | null>(null)
  const titulo = useRef<HTMLHeadingElement>(null)

  const cargar = useCallback(async () => {
    try {
      const { tiposMedida } = await pedir(apiAdmin.GET('/admin/tipos-medida'))
      setTipos(tiposMedida)
    } catch (e) {
      if (!redirigirSiNoAutenticado(e)) setErrorLista(mensajeDeError(e))
    }
  }, [])

  useEffect(() => {
    exigirSesion().then(cargar, (e: unknown) => setErrorLista(mensajeDeError(e)))
  }, [cargar])

  // Otro integrante lo borró: se recarga y se explica sobre la lista (F5-D3).
  const noEncontrado = (e: unknown) => {
    setEditando(null)
    setErrorLista(mensajeDeError(e))
    void cargar()
  }

  const borrar = async (tipo: TipoMedida) => {
    const confirmado = await confirmar({
      titulo: `¿Borrar el tipo de medida «${tipo.nombre}»?`,
      detalle: 'Las medidas de ese tipo quedan en sus productos, sin tipo.',
    })
    if (!confirmado) return
    setErrorLista(null)
    try {
      await pedir(apiAdmin.DELETE('/admin/tipos-medida/{id}', { params: { path: { id: tipo.id } } }))
      avisar('Tipo de medida borrado.')
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      setErrorLista(mensajeDeError(e))
    }
    await cargar()
    // La fila ya no existe: el foco va al título de la sección (F5-D4).
    titulo.current?.focus()
  }

  let lista: ReactNode
  if (tipos === null) lista = !errorLista && <p className="cargando">Cargando…</p>
  else if (tipos.length === 0) lista = <p className="lista__vacia">Todavía no hay tipos de medida.</p>
  else
    lista = (
      <ul className="lista">
        {tipos.map((tipo) =>
          editando === tipo.id ? (
            <Edicion
              key={tipo.id}
              tipo={tipo}
              alTerminar={(guardado) => {
                setEditando(null)
                if (guardado) {
                  setErrorLista(null)
                  void cargar()
                }
                enfocarEditar(tipo.id)
              }}
              alNoEncontrar={noEncontrado}
            />
          ) : (
            <li className="lista__fila" key={tipo.id}>
              <span className="lista__nombre">
                {tipo.nombre}
                <span className="lista__detalle">{tipo.unidad ?? 'sin unidad: texto libre'}</span>
              </span>
              <span className="lista__acciones">
                <button
                  type="button"
                  className="btn btn--secundario btn--chico"
                  data-editar={tipo.id}
                  aria-label={`Editar ${tipo.nombre}`}
                  onClick={() => setEditando(tipo.id)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn btn--peligro btn--chico"
                  aria-label={`Borrar ${tipo.nombre}`}
                  onClick={() => borrar(tipo)}
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
    <section className="seccion" aria-labelledby="tituloTipos">
      <h1 className="seccion__titulo" id="tituloTipos" ref={titulo} tabIndex={-1}>
        Tipos de medida
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
    const body = leer(formulario)
    setError(null)
    const invalido = validarNombre(body.nombre)
    setErrorNombre(invalido)
    if (invalido) {
      nombreRef.current?.focus()
      return
    }
    setEnviando(true)
    try {
      await pedir(apiAdmin.POST('/admin/tipos-medida', { body }))
      formulario.reset()
      avisar('Tipo de medida creado.')
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
        etiqueta="Nuevo tipo de medida"
        maxLength={NOMBRE_MAXIMO}
        autoComplete="off"
        error={errorNombre}
      />
      <Campo
        id="altaUnidad"
        name="unidad"
        etiqueta="Unidad"
        defaultValue="cm"
        maxLength={UNIDAD_MAXIMA}
        autoComplete="off"
        ayuda={AYUDA_UNIDAD}
      />
      {error && (
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primario" disabled={enviando}>
        {enviando ? 'Creando…' : 'Crear tipo de medida'}
      </button>
    </form>
  )
}

interface PropsEdicion {
  tipo: TipoMedida
  alTerminar: (guardado: boolean) => void
  alNoEncontrar: (error: unknown) => void
}

function Edicion({ tipo, alTerminar, alNoEncontrar }: PropsEdicion) {
  const [enviando, setEnviando] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nombreRef.current?.focus()
  }, [])

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    // `nombre` y `unidad` van juntos; la unidad vacía la quita (F5-D3).
    const body = leer(evento.currentTarget)
    setError(null)
    const invalido = validarNombre(body.nombre)
    setErrorNombre(invalido)
    if (invalido) {
      nombreRef.current?.focus()
      return
    }
    setEnviando(true)
    try {
      await pedir(apiAdmin.PATCH('/admin/tipos-medida/{id}', { params: { path: { id: tipo.id } }, body }))
      avisar('Tipo de medida editado.')
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
          etiqueta={`Nombre de «${tipo.nombre}»`}
          defaultValue={tipo.nombre}
          maxLength={NOMBRE_MAXIMO}
          autoComplete="off"
          error={errorNombre}
        />
        <Campo
          id="edicionUnidad"
          name="unidad"
          etiqueta="Unidad"
          defaultValue={tipo.unidad ?? ''}
          maxLength={UNIDAD_MAXIMA}
          autoComplete="off"
          ayuda={AYUDA_UNIDAD}
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
