import { ErrorApi } from '../api'

// Better Auth responde en inglés: la UI muestra textos propios por código (F4-D2). Los errores con la
// forma del contrato ya traen su `mensaje` en español.
const MENSAJES: Partial<Record<ErrorApi['codigo'], string>> = {
  INVALID_EMAIL_OR_PASSWORD: 'El email o la contraseña no son correctos.',
  INVALID_EMAIL: 'Revisá el email: no tiene un formato válido.',
  INTEGRANTE_DESACTIVADO: 'Tu cuenta está desactivada. Pedile al owner que la revise.',
  INVALID_TOKEN: 'El enlace venció o ya se usó.',
  PASSWORD_TOO_SHORT: 'La contraseña tiene que tener al menos 8 caracteres.',
  PASSWORD_TOO_LONG: 'La contraseña puede tener hasta 128 caracteres.',
  DEMASIADOS_INTENTOS: 'Demasiados intentos. Esperá un momento y volvé a probar.',
  SIN_CONEXION: 'No se pudo conectar con el servidor. Revisá tu conexión.',
}

export function mensajeDeError(error: unknown): string {
  if (!(error instanceof ErrorApi)) return 'Algo salió mal. Volvé a intentarlo.'
  if (error.codigo === 'RESPUESTA_INESPERADA') return 'El servidor respondió algo inesperado. Volvé a intentarlo.'
  return MENSAJES[error.codigo] ?? error.message
}
