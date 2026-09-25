import createClient, { type Client } from 'openapi-fetch'
import type { components, paths } from './schema'

export type CodigoError = components['schemas']['Error']['error']['codigo']

/**
 * Códigos propios del front, fuera del contrato: `SIN_CONEXION` cuando `fetch` falla (red, CORS, abort) y
 * `RESPUESTA_INESPERADA` cuando la respuesta de error no tiene la forma `{ error: { codigo, mensaje } }`.
 */
export type CodigoErrorCliente = CodigoError | CodigoErrorAuth | 'SIN_CONEXION' | 'RESPUESTA_INESPERADA'

/**
 * Códigos de `/api/auth/*` (Better Auth, fuera de `openapi.json`) que traduce `./auth`, más el propio
 * `DEMASIADOS_INTENTOS` para su `429` sin `code` (F4-D2).
 */
export type CodigoErrorAuth =
  | 'INVALID_EMAIL_OR_PASSWORD'
  | 'INVALID_EMAIL'
  | 'INTEGRANTE_DESACTIVADO'
  | 'INVALID_TOKEN'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_TOO_LONG'
  | 'DEMASIADOS_INTENTOS'

/** Error traducido de la API. `status` es 0 si no hubo respuesta. */
export class ErrorApi extends Error {
  override readonly name = 'ErrorApi'

  readonly status: number
  readonly codigo: CodigoErrorCliente

  constructor(status: number, codigo: CodigoErrorCliente, mensaje: string, options?: ErrorOptions) {
    super(mensaje, options)
    this.status = status
    this.codigo = codigo
  }
}

export type ClienteApi = Client<paths>

export interface OpcionesCliente {
  baseUrl: string
  /** `include` en el admin, para mandar la cookie de sesión de `api.*`; el sitio público va sin credenciales. */
  credentials: RequestCredentials
  fetch?: typeof globalThis.fetch
}

export function crearCliente({ baseUrl, credentials, fetch }: OpcionesCliente): ClienteApi {
  return createClient<paths>({ baseUrl, credentials, ...(fetch && { fetch }) })
}

const esErrorDelContrato = (cuerpo: unknown): cuerpo is components['schemas']['Error'] => {
  const error = (cuerpo as { error?: unknown } | null)?.error as { codigo?: unknown; mensaje?: unknown } | undefined
  return typeof error?.codigo === 'string' && typeof error.mensaje === 'string'
}

/** Traduce un error ya recibido (cuerpo y status de la respuesta) a `ErrorApi`. */
export function traducirError(status: number, cuerpo: unknown): ErrorApi {
  if (esErrorDelContrato(cuerpo)) {
    return new ErrorApi(status, cuerpo.error.codigo, cuerpo.error.mensaje)
  }
  return new ErrorApi(status, 'RESPUESTA_INESPERADA', `La API respondió ${status} con un formato inesperado.`)
}

/**
 * Espera un pedido de `openapi-fetch` y devuelve `data`, o lanza `ErrorApi`.
 *
 * ```ts
 * const { categorias } = await pedir(api.GET('/api/categorias'))
 * ```
 */
export async function pedir<T>(pedido: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  let resultado: Awaited<typeof pedido>
  try {
    resultado = await pedido
  } catch (causa) {
    throw new ErrorApi(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Revisá tu conexión.', { cause: causa })
  }
  if (!resultado.response.ok) throw traducirError(resultado.response.status, resultado.error)
  return resultado.data as T
}
