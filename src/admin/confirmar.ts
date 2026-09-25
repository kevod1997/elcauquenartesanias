// Confirmación de borrado (F5-D4), como `confirmar()` del prototipo: un `<dialog>` con `showModal()`
// que resuelve si se confirmó. `showModal()` enfoca "Cancelar", el primer control; Escape dispara
// `cancel` y cuenta como cancelar. Al cerrar, el navegador devuelve el foco a quien lo abrió.

interface Confirmacion {
  titulo: string
  detalle: string
  /** Texto del botón que confirma. */
  accion?: string
}

export function confirmar({ titulo, detalle, accion = 'Borrar' }: Confirmacion): Promise<boolean> {
  const dialogo = document.createElement('dialog')
  dialogo.className = 'confirmar'
  dialogo.setAttribute('aria-labelledby', 'confirmarTitulo')
  dialogo.setAttribute('aria-describedby', 'confirmarDetalle')

  const h2 = document.createElement('h2')
  h2.className = 'confirmar__titulo'
  h2.id = 'confirmarTitulo'
  h2.textContent = titulo
  const p = document.createElement('p')
  p.className = 'confirmar__detalle'
  p.id = 'confirmarDetalle'
  p.textContent = detalle

  const cancelar = document.createElement('button')
  cancelar.type = 'button'
  cancelar.className = 'btn btn--secundario'
  cancelar.textContent = 'Cancelar'
  const aceptar = document.createElement('button')
  aceptar.type = 'button'
  aceptar.className = 'btn btn--peligro-solido'
  aceptar.textContent = accion
  const acciones = document.createElement('div')
  acciones.className = 'confirmar__acciones'
  acciones.append(cancelar, aceptar)

  dialogo.append(h2, p, acciones)
  document.body.append(dialogo)

  return new Promise((resolver) => {
    cancelar.addEventListener('click', () => dialogo.close('cancelar'))
    aceptar.addEventListener('click', () => dialogo.close('borrar'))
    // Escape cierra con `returnValue` vacío: cuenta como cancelar.
    dialogo.addEventListener('close', () => {
      resolver(dialogo.returnValue === 'borrar')
      dialogo.remove()
    })
    dialogo.showModal()
  })
}
