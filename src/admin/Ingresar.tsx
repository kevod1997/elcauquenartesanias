import { type FormEvent, useEffect, useState } from 'react'
import { auth } from '../api'
import { mensajeDeError } from './mensajes'
import { destinoSeguro, obtenerSesion } from './sesion'

// `/admin/ingresar` (F4-D4). Si ya hay sesión, va directo al destino de `?volver=`.

const destino = () => destinoSeguro(new URLSearchParams(location.search).get('volver'))

export default function Ingresar() {
  const [comprobando, setComprobando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerSesion().then(
      (integrante) => {
        if (integrante) location.replace(destino())
        else setComprobando(false)
      },
      () => setComprobando(false),
    )
  }, [])

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      await auth.iniciarSesion({ email: String(datos.get('email')), password: String(datos.get('password')) })
      // Recarga completa: la sesión memorizada se vuelve a pedir en el destino (F4-D3).
      location.assign(destino())
    } catch (e) {
      setError(mensajeDeError(e))
      setEnviando(false)
    }
  }

  if (comprobando) return <p className="cargando">Cargando…</p>

  return (
    <section className="acceso" aria-labelledby="tituloIngresar">
      <p className="acceso__marca">El Cauquén · Panel</p>
      <h1 className="acceso__titulo" id="tituloIngresar">
        Iniciá sesión
      </h1>
      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {error && (
          <p className="aviso aviso--error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn--primario" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="acceso__pie">
        <a href="/admin/restablecer">¿Olvidaste tu contraseña?</a>
      </p>
    </section>
  )
}
