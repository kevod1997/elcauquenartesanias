import { type FormEvent, type ReactNode, useState } from 'react'
import { auth, ErrorApi } from '../api'
import { mensajeDeError } from './mensajes'

// `/admin/restablecer` (F4-D4): sin `token` pide el enlace; con `token` (el del mail, también el de
// activación de un editor) define la contraseña nueva.

const MINIMO = 8
const MAXIMO = 128

export default function Restablecer() {
  const token = new URLSearchParams(location.search).get('token')
  return token ? <DefinirContrasena token={token} /> : <PedirEnlace />
}

function PedirEnlace() {
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const email = String(new FormData(evento.currentTarget).get('email'))
    setEnviando(true)
    setError(null)
    try {
      await auth.pedirEnlace({ email })
      setEnviado(true)
    } catch (e) {
      setError(mensajeDeError(e))
    }
    setEnviando(false)
  }

  return (
    <section className="acceso" aria-labelledby="tituloRestablecer">
      <p className="acceso__marca">El Cauquén · Panel</p>
      <h1 className="acceso__titulo" id="tituloRestablecer">
        Restablecer contraseña
      </h1>
      {enviado ? (
        // La API responde igual exista o no el email, así que el aviso tampoco lo revela.
        <p className="aviso aviso--ok" role="status">
          Si el email es de un integrante activo, te llega un enlace que vence en una hora.
        </p>
      ) : (
        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="username" required />
            <p className="campo__ayuda">Te mandamos un enlace para definir una contraseña nueva.</p>
          </div>
          {error && (
            <p className="aviso aviso--error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primario" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>
      )}
      <p className="acceso__pie">
        <a href="/admin/ingresar">Volver a iniciar sesión</a>
      </p>
    </section>
  )
}

function DefinirContrasena({ token }: { token: string }) {
  const [enviando, setEnviando] = useState(false)
  const [listo, setListo] = useState(false)
  const [tokenInvalido, setTokenInvalido] = useState(false)
  const [errorCampo, setErrorCampo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    const nueva = String(datos.get('nueva'))
    const repetida = String(datos.get('repetida'))
    setError(null)
    if (nueva.length < MINIMO || nueva.length > MAXIMO) {
      setErrorCampo(`Tiene que tener entre ${MINIMO} y ${MAXIMO} caracteres.`)
      document.getElementById('nueva')?.focus()
      return
    }
    if (nueva !== repetida) {
      setErrorCampo('Las dos contraseñas no coinciden.')
      document.getElementById('repetida')?.focus()
      return
    }
    setErrorCampo(null)
    setEnviando(true)
    try {
      await auth.definirContrasena({ newPassword: nueva, token })
      setListo(true)
    } catch (e) {
      if (e instanceof ErrorApi && e.codigo === 'INVALID_TOKEN') setTokenInvalido(true)
      else setError(mensajeDeError(e))
    }
    setEnviando(false)
  }

  let contenido: ReactNode
  if (listo) {
    contenido = (
      <>
        <p className="aviso aviso--ok" role="status">
          Listo: tu contraseña quedó definida y se cerraron tus otras sesiones.
        </p>
        <a className="btn btn--primario" href="/admin/ingresar">
          Iniciar sesión
        </a>
      </>
    )
  } else if (tokenInvalido) {
    contenido = (
      <>
        <p className="aviso aviso--error" role="alert">
          El enlace venció o ya se usó. Los enlaces sirven una sola vez y vencen en una hora.
        </p>
        <a className="btn btn--primario" href="/admin/restablecer">
          Pedir otro enlace
        </a>
      </>
    )
  } else {
    contenido = (
      <form onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor="nueva">Contraseña nueva</label>
          <input
            id="nueva"
            name="nueva"
            type="password"
            autoComplete="new-password"
            aria-describedby="ayudaNueva"
            aria-invalid={errorCampo ? true : undefined}
            required
          />
          <p className="campo__ayuda" id="ayudaNueva">
            Entre {MINIMO} y {MAXIMO} caracteres.
          </p>
        </div>
        <div className="campo">
          <label htmlFor="repetida">Repetí la contraseña</label>
          <input
            id="repetida"
            name="repetida"
            type="password"
            autoComplete="new-password"
            aria-describedby={errorCampo ? 'errorCampo' : undefined}
            aria-invalid={errorCampo ? true : undefined}
            required
          />
          {errorCampo && (
            <p className="campo__error" id="errorCampo" role="alert">
              {errorCampo}
            </p>
          )}
        </div>
        {error && (
          <p className="aviso aviso--error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primario" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    )
  }

  return (
    <section className="acceso" aria-labelledby="tituloDefinir">
      <p className="acceso__marca">El Cauquén · Panel</p>
      <h1 className="acceso__titulo" id="tituloDefinir">
        Definí tu contraseña
      </h1>
      {contenido}
    </section>
  )
}
