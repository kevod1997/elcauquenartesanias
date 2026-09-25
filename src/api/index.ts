import { PUBLIC_API_URL } from 'astro:env/client'
import { crearAuth } from './auth'
import { crearCliente } from './cliente'

export { type CodigoError, type CodigoErrorAuth, type CodigoErrorCliente, ErrorApi, pedir } from './cliente'
export type { components } from './schema'

/** Catálogo público (`/api/*`): sin cookies. */
export const apiPublica = crearCliente({ baseUrl: PUBLIC_API_URL, credentials: 'omit' })

/** Admin (`/admin/*`): manda la cookie de sesión de Better Auth. */
export const apiAdmin = crearCliente({ baseUrl: PUBLIC_API_URL, credentials: 'include' })

/** `/api/auth/*` de Better Auth (F4-D2): también con la cookie. */
export const auth = crearAuth({ baseUrl: PUBLIC_API_URL })
