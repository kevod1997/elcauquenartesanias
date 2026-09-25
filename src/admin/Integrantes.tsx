import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, ErrorApi, pedir } from '../api'
import { avisar } from './avisos'
import Campo from './Campo'
import { confirmar } from './confirmar'
import { mensajeDeError } from './mensajes'
import { esNoEncontrado, validarNombre } from './recursos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/integrantes` (F9-D1 a F9-D5): solo el owner. Alta de editores arriba, lista debajo y
// desactivación con confirmación. Tras cada cambio se vuelve a pedir el listado: el orden es el del
// servidor (por nombre).

type Integrante = components['schemas']['Integrante']

/** Límite de `nombre` en el esquema del alta (F9-D4). */
const NOMBRE_INTEGRANTE_MAXIMO = 100
const EMAIL_INVALIDO = 'Revisá el email: no tiene un formato válido.'

/** `403` de cualquier llamada: la sesión es de un editor (F9-D2). */
function esSinPermiso(error: unknown): boolean {
  return error instanceof ErrorApi && error.codigo === 'SIN_PERMISO'
}

export default function Integrantes() {
  const [integrantes, setIntegrantes] = useState<Integrante[] | null>(null)
  const [errorLista, setErrorLista] = useState<string | null>(null)
  const [sinPermiso, setSinPermiso] = useState(false)
  const titulo = useRef<HTMLHeadingElement>(null)

  /** Maneja los errores que no son del formulario; devuelve si ya los resolvió (login o aviso de rol). */
  const resolverAcceso = useCallback((e: unknown) => {
    if (redirigirSiNoAutenticado(e)) return true
    if (esSinPermiso(e)) {
      setSinPermiso(true)
      return true
    }
    return false
  }, [])

  const cargar = useCallback(async () => {
    try {
      const { integrantes } = await pedir(apiAdmin.GET('/admin/integrantes'))
      setIntegrantes(integrantes)
    } catch (e) {
      if (!resolverAcceso(e)) setErrorLista(mensajeDeError(e))
    }
  }, [resolverAcceso])

  useEffect(() => {
    exigirSesion().then(
      // El editor no pide el listado: ya se sabe que daría `403` (F9-D2).
      (integrante) => (integrante.rol === 'owner' ? cargar() : setSinPermiso(true)),
      (e: unknown) => setErrorLista(mensajeDeError(e)),
    )
  }, [cargar])

  const desactivar = async (integrante: Integrante) => {
    const confirmado = await confirmar({
      titulo: `¿Desactivar a «${integrante.nombre}»?`,
      detalle:
        'Se cierran sus sesiones y no puede volver a entrar. No se puede reactivar, y su email no sirve para otra alta.',
      accion: 'Desactivar',
    })
    if (!confirmado) return
    setErrorLista(null)
    try {
      await pedir(apiAdmin.POST('/admin/integrantes/{id}/desactivar', { params: { path: { id: integrante.id } } }))
      avisar('Editor desactivado.')
    } catch (e) {
      if (resolverAcceso(e)) return
      // `404` (F5-D3), `422` y los demás van al aviso de la lista; la recarga muestra el estado real.
      setErrorLista(mensajeDeError(e))
      if (!esNoEncontrado(e)) return
    }
    await cargar()
    // La fila queda sin el botón que abrió el diálogo: el foco va al título de la sección (F9-D5).
    titulo.current?.focus()
  }

  const encabezado = (
    <h1 className="seccion__titulo" id="tituloIntegrantes" ref={titulo} tabIndex={-1}>
      Integrantes
    </h1>
  )

  if (sinPermiso)
    return (
      <section className="seccion" aria-labelledby="tituloIntegrantes">
        {encabezado}
        <p className="aviso aviso--error" role="alert">
          Solo el owner gestiona los integrantes. <a href="/admin">Volver al inicio</a>
        </p>
      </section>
    )

  let lista: ReactNode
  if (integrantes === null) lista = !errorLista && <p className="cargando">Cargando…</p>
  else
    lista = (
      <ul className="lista">
        {integrantes.map((integrante) => (
          <li className="lista__fila" key={integrante.id}>
            <span className="lista__nombre">
              {integrante.nombre}
              <span className="lista__detalle">{integrante.email}</span>
            </span>
            <span className="lista__datos">
              <span className="lista__rol">{integrante.rol}</span>
              {!integrante.activo && <span className="estado estado--desactivado">Desactivado</span>}
              {integrante.rol === 'editor' && integrante.activo && (
                <button
                  type="button"
                  className="btn btn--peligro btn--chico"
                  aria-label={`Desactivar «${integrante.nombre}»`}
                  onClick={() => desactivar(integrante)}
                >
                  Desactivar
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    )

  return (
    <section className="seccion" aria-labelledby="tituloIntegrantes">
      {encabezado}
      <Alta
        alCrear={() => {
          setErrorLista(null)
          void cargar()
        }}
        resolverAcceso={resolverAcceso}
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

interface PropsAlta {
  alCrear: () => void
  resolverAcceso: (error: unknown) => boolean
}

function Alta({ alCrear, resolverAcceso }: PropsAlta) {
  const [enviando, setEnviando] = useState(false)
  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [errorEmail, setErrorEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const nombreRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    const nombre = String(datos.get('nombre')).trim()
    const email = String(datos.get('email')).trim()
    setError(null)
    const nombreInvalido = validarNombre(nombre, NOMBRE_INTEGRANTE_MAXIMO)
    // Con `noValidate`, el navegador igual calcula `validity` del `type="email"` (F9-D4).
    const emailInvalido = !email ? 'Escribí un email.' : emailRef.current?.validity.typeMismatch ? EMAIL_INVALIDO : null
    setErrorNombre(nombreInvalido)
    setErrorEmail(emailInvalido)
    if (nombreInvalido || emailInvalido) {
      ;(nombreInvalido ? nombreRef : emailRef).current?.focus()
      return
    }
    setEnviando(true)
    try {
      await pedir(apiAdmin.POST('/admin/integrantes', { body: { nombre, email } }))
      formulario.reset()
      avisar('Editor agregado. Le llega un correo para definir su contraseña.')
      alCrear()
    } catch (e) {
      if (resolverAcceso(e)) return
      // Con el nombre ya validado, el `400` solo puede venir del email; su `mensaje` es el detalle de Zod.
      const campoEmail =
        e instanceof ErrorApi && e.codigo === 'SOLICITUD_INVALIDA'
          ? EMAIL_INVALIDO
          : e instanceof ErrorApi && e.codigo === 'EMAIL_EN_USO'
            ? mensajeDeError(e)
            : null
      if (campoEmail) {
        setErrorEmail(campoEmail)
        emailRef.current?.focus()
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
        etiqueta="Nombre"
        maxLength={NOMBRE_INTEGRANTE_MAXIMO}
        autoComplete="off"
        error={errorNombre}
      />
      <Campo
        ref={emailRef}
        id="altaEmail"
        name="email"
        type="email"
        etiqueta="Email"
        ayuda="Le llega un correo para definir su contraseña. El enlace vence en una hora."
        autoComplete="off"
        spellCheck={false}
        error={errorEmail}
      />
      {error && (
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--primario" disabled={enviando}>
        {enviando ? 'Agregando…' : 'Agregar editor'}
      </button>
    </form>
  )
}
