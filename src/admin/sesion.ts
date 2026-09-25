import { apiAdmin, type components, ErrorApi, pedir } from '../api'

// Sesión del admin (F4-D3). El script del layout y la isla de la página importan este módulo, que el
// bundle comparte: `GET /admin/sesion` se pide una sola vez por página.

export type IntegranteDeSesion = components['schemas']['IntegranteDeSesion']

let sesion: Promise<IntegranteDeSesion | null> | undefined

/** El integrante de la sesión, o `null` si la API responde `401`. Otros errores se propagan. */
export function obtenerSesion(): Promise<IntegranteDeSesion | null> {
  sesion ??= pedir(apiAdmin.GET('/admin/sesion')).then(
    ({ integrante }) => integrante,
    (error: unknown) => {
      if (error instanceof ErrorApi && error.status === 401) return null
      throw error
    },
  )
  return sesion
}

/** Destino de `?volver=`: solo rutas del admin, para no abrir un redirect a otro sitio. Si no, Productos (F11-D5). */
export function destinoSeguro(volver: string | null): string {
  return volver?.startsWith('/admin/') && !volver.startsWith('//') ? volver : '/admin/productos'
}

/** Va al login y vuelve a la página actual después de iniciar sesión. */
export function irAlLogin(): void {
  const volver = location.pathname + location.search
  location.replace(`/admin/ingresar?volver=${encodeURIComponent(volver)}`)
}

/** Para las páginas protegidas: redirige al login sin sesión, y en ese caso no resuelve nunca. */
export async function exigirSesion(): Promise<IntegranteDeSesion> {
  const integrante = await obtenerSesion()
  if (integrante) return integrante
  irAlLogin()
  return new Promise(() => {})
}

/**
 * Redirige al login si `error` es un `401` (la sesión venció a mitad de la edición, §3). Devuelve si lo
 * hizo, para que la pantalla no muestre el error.
 */
export function redirigirSiNoAutenticado(error: unknown): boolean {
  if (!(error instanceof ErrorApi && error.status === 401)) return false
  irAlLogin()
  return true
}
