import { ErrorApi } from '../api'

// Reglas compartidas de los listados del admin (F5-D2, F5-D3), para categorías y tipos de medida.

/** Límites del esquema de `openapi.json` (`nombre` de 1 a 40, `unidad` hasta 10). */
export const NOMBRE_MAXIMO = 40
export const UNIDAD_MAXIMA = 10

/** Error del `nombre` ya recortado, o `null` si cumple el esquema. El repetido lo decide el `409`. */
export function validarNombre(nombre: string): string | null {
  if (nombre.length === 0) return 'Escribí un nombre.'
  if (nombre.length > NOMBRE_MAXIMO) return `Puede tener hasta ${NOMBRE_MAXIMO} caracteres.`
  return null
}

/** `NOMBRE_EN_USO` va al campo `nombre` (F5-D3). */
export function esNombreEnUso(error: unknown): boolean {
  return error instanceof ErrorApi && error.codigo === 'NOMBRE_EN_USO'
}

/** `404` al editar o borrar: otro integrante lo borró. */
export function esNoEncontrado(error: unknown): boolean {
  return error instanceof ErrorApi && error.status === 404
}

/** Devuelve el foco al "Editar" de la fila al salir de su edición, cuando la fila vuelve a dibujarse. */
export function enfocarEditar(id: string): void {
  requestAnimationFrame(() => {
    document.querySelector<HTMLButtonElement>(`[data-editar="${CSS.escape(id)}"]`)?.focus()
  })
}
