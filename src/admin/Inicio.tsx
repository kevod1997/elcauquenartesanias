import { useEffect, useState } from 'react'
import { mensajeDeError } from './mensajes'
import { exigirSesion, type IntegranteDeSesion } from './sesion'

// `/admin` (F4-D4): página protegida mínima. Las secciones llegan en las fases 5 a 9.

export default function Inicio() {
  const [integrante, setIntegrante] = useState<IntegranteDeSesion | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    exigirSesion().then(setIntegrante, (e: unknown) => setError(mensajeDeError(e)))
  }, [])

  if (error) {
    return (
      <p className="aviso aviso--error" role="alert">
        {error}
      </p>
    )
  }
  if (!integrante) return <p className="cargando">Cargando…</p>

  return (
    <section aria-labelledby="tituloInicio">
      <h1 className="acceso__titulo" id="tituloInicio">
        Hola, {integrante.nombre}
      </h1>
      <p>
        Iniciaste sesión como {integrante.email} ({integrante.rol}).
      </p>
    </section>
  )
}
