// Avisos de éxito o error en el toast del layout (F5-D5). DOM directo, sin React: lo usan el script de
// `Admin.astro` y las islas. La región `#toast` ya está en el markup inicial para que se anuncie.

const DURACION_OK = 4000

let temporizador: ReturnType<typeof setTimeout> | undefined

/** Muestra `texto`: `ok` se oculta solo a los 4 s; `error` queda hasta el próximo aviso o su "Cerrar". */
export function avisar(texto: string, tipo: 'ok' | 'error' = 'ok'): void {
  const toast = document.getElementById('toast')
  if (!toast) return
  clearTimeout(temporizador)
  const mensaje = document.createElement('span')
  mensaje.textContent = texto
  toast.replaceChildren(mensaje)
  toast.classList.toggle('toast--error', tipo === 'error')
  toast.classList.add('is-visible')
  if (tipo === 'ok') {
    temporizador = setTimeout(ocultar, DURACION_OK)
    return
  }
  const cerrar = document.createElement('button')
  cerrar.type = 'button'
  cerrar.className = 'toast__cerrar'
  cerrar.textContent = 'Cerrar'
  cerrar.addEventListener('click', ocultar)
  toast.append(cerrar)
}

function ocultar(): void {
  const toast = document.getElementById('toast')
  toast?.classList.remove('is-visible')
  toast?.replaceChildren()
}
