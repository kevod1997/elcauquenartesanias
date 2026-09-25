import { type CodigoErrorAuth, ErrorApi } from './cliente'

// `/api/auth/*` es de Better Auth y queda fuera de `openapi.json`: las formas salen del contrato
// (`contrato-api-borrador.md`, §Sesión y §Contraseña) y se tipan acá (F4-D2).

const CODIGOS_AUTH: ReadonlySet<string> = new Set<CodigoErrorAuth>([
  'INVALID_EMAIL_OR_PASSWORD',
  'INVALID_EMAIL',
  'INTEGRANTE_DESACTIVADO',
  'INVALID_TOKEN',
  'PASSWORD_TOO_SHORT',
  'PASSWORD_TOO_LONG',
])

/** Traduce un error de Better Auth (`{ message, code }`, o `{ message }` en el `429`) a `ErrorApi`. */
export function traducirErrorAuth(status: number, cuerpo: unknown): ErrorApi {
  const { code, message } = (cuerpo ?? {}) as { code?: unknown; message?: unknown }
  const mensaje = typeof message === 'string' ? message : `La API respondió ${status}.`
  if (status === 429) return new ErrorApi(429, 'DEMASIADOS_INTENTOS', mensaje)
  if (typeof code === 'string' && CODIGOS_AUTH.has(code)) {
    return new ErrorApi(status, code as CodigoErrorAuth, mensaje)
  }
  return new ErrorApi(status, 'RESPUESTA_INESPERADA', `La API respondió ${status} con un formato inesperado.`)
}

export interface OpcionesAuth {
  baseUrl: string
  fetch?: typeof globalThis.fetch
}

export interface ClienteAuth {
  /** Deja la cookie de sesión; el integrante se lee después con `GET /admin/sesion`. */
  iniciarSesion(datos: { email: string; password: string }): Promise<void>
  cerrarSesion(): Promise<void>
  /** Responde igual exista o no el email. */
  pedirEnlace(datos: { email: string }): Promise<void>
  /** Define la contraseña y cierra todas las sesiones del integrante. */
  definirContrasena(datos: { newPassword: string; token: string }): Promise<void>
}

export function crearAuth({ baseUrl, fetch = globalThis.fetch }: OpcionesAuth): ClienteAuth {
  const post = async (ruta: string, cuerpo: object): Promise<void> => {
    let respuesta: Response
    try {
      respuesta = await fetch(`${baseUrl}/api/auth/${ruta}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo),
      })
    } catch (causa) {
      throw new ErrorApi(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Revisá tu conexión.', {
        cause: causa,
      })
    }
    if (respuesta.ok) return
    const error: unknown = await respuesta.json().catch(() => null)
    throw traducirErrorAuth(respuesta.status, error)
  }

  return {
    iniciarSesion: (datos) => post('sign-in/email', datos),
    cerrarSesion: () => post('sign-out', {}),
    pedirEnlace: (datos) => post('request-password-reset', datos),
    definirContrasena: (datos) => post('reset-password', datos),
  }
}
