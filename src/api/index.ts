import { PUBLIC_API_URL } from 'astro:env/client'
import { crearCliente } from './cliente'

export { type CodigoError, type CodigoErrorCliente, ErrorApi, pedir } from './cliente'
export type { components } from './schema'

/** Catálogo público (`/api/*`): sin cookies. */
export const apiPublica = crearCliente({ baseUrl: PUBLIC_API_URL, credentials: 'omit' })

/** Admin (`/admin/*`): manda la cookie de sesión de Better Auth. */
export const apiAdmin = crearCliente({ baseUrl: PUBLIC_API_URL, credentials: 'include' })
