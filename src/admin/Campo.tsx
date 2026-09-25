import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Campo de formulario del admin (F5-D3): label, control, ayuda y error. Con `error`, el control queda con
// `aria-invalid` y descrito por el texto del error (y la ayuda, si hay). `Campo` arma un `<input>`;
// `CampoSelect` y `CampoTexto`, un `<select>` y un `<textarea>` con el mismo cableado (F6-D3).

interface Comunes {
  id: string
  etiqueta: string
  ayuda?: string | undefined
  error?: string | null | undefined
}

/** Atributos de accesibilidad del control y el envoltorio con label, ayuda y error. */
function armar({ id, etiqueta, ayuda, error }: Comunes, control: (aria: Aria) => ReactNode, extra?: ReactNode) {
  const idAyuda = `${id}Ayuda`
  const idError = `${id}Error`
  const describe = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {control({ id, 'aria-describedby': describe, 'aria-invalid': error ? true : undefined })}
      {extra}
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

interface Aria {
  id: string
  'aria-describedby': string | undefined
  'aria-invalid': true | undefined
}

interface Props extends Comunes, Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  ref?: Ref<HTMLInputElement>
  /** Texto fijo antes del input, como el "$" del precio (`.campo__precio`). */
  prefijo?: string
}

export default function Campo({ id, etiqueta, ayuda, error, prefijo, ...input }: Props) {
  return armar({ id, etiqueta, ayuda, error }, (aria) => {
    const control = <input type="text" {...input} {...aria} />
    if (!prefijo) return control
    return (
      <div className="campo__precio">
        <span aria-hidden="true">{prefijo}</span>
        {control}
      </div>
    )
  })
}

interface PropsSelect extends Comunes, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  ref?: Ref<HTMLSelectElement>
  /** Controles junto al select, dentro del campo (F6-D6). */
  junto?: ReactNode
}

export function CampoSelect({ id, etiqueta, ayuda, error, junto, children, ...select }: PropsSelect) {
  return armar(
    { id, etiqueta, ayuda, error },
    (aria) => (
      <select {...select} {...aria}>
        {children}
      </select>
    ),
    junto,
  )
}

interface PropsTexto extends Comunes, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  ref?: Ref<HTMLTextAreaElement>
}

export function CampoTexto({ id, etiqueta, ayuda, error, ...textarea }: PropsTexto) {
  return armar({ id, etiqueta, ayuda, error }, (aria) => <textarea {...textarea} {...aria} />)
}
