import type { InputHTMLAttributes, Ref } from 'react'

// Campo de formulario del admin (F5-D3): label, input, ayuda y error. Con `error`, el input queda con
// `aria-invalid` y descrito por el texto del error (y la ayuda, si hay).

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  ref?: Ref<HTMLInputElement>
  etiqueta: string
  ayuda?: string
  error?: string | null
}

export default function Campo({ id, etiqueta, ayuda, error, ...input }: Props) {
  const idAyuda = `${id}Ayuda`
  const idError = `${id}Error`
  const describe = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input type="text" {...input} id={id} aria-describedby={describe} aria-invalid={error ? true : undefined} />
      {ayuda && (
        <p className="campo__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      )}
      {error && (
        <p className="campo__error" id={idError}>
          {error}
        </p>
      )}
    </div>
  )
}
