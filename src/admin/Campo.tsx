import {
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from 'react'
import { IconoOjo } from './iconos'

// Campo de formulario del admin (F5-D3): label, control, ayuda y error. Con `error`, el control queda con
// `aria-invalid` y descrito por el texto del error (y la ayuda, si hay). `Campo` arma un `<input>`;
// `CampoSelect` y `CampoTexto`, un `<select>` y un `<textarea>` con el mismo cableado (F6-D3), y
// `CampoContrasena`, un `type="password"` con botón para mostrarla (F11-D6).

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

interface PropsContrasena extends Comunes, Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  /** Nombre fijo del botón, que no cambia con el estado (patrón Button de la APG), ej. "Mostrar contraseña". */
  mostrar: string
}

export function CampoContrasena({ id, etiqueta, ayuda, error, mostrar, ...input }: PropsContrasena) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Al enviar, vuelve a `password` en el DOM antes del `onSubmit` de la isla (React lo escucha en la raíz): un
  // gestor de contraseñas que mire el `type` encuentra un campo de contraseña.
  useEffect(() => {
    const campo = inputRef.current
    const formulario = campo?.form
    if (!campo || !formulario) return
    const ocultar = () => {
      campo.type = 'password'
      setVisible(false)
    }
    formulario.addEventListener('submit', ocultar)
    return () => formulario.removeEventListener('submit', ocultar)
  }, [])

  return armar({ id, etiqueta, ayuda, error }, (aria) => (
    <div className="campo__contrasena">
      <input
        ref={inputRef}
        {...input}
        {...aria}
        type={visible ? 'text' : 'password'}
        {...(visible && { autoCapitalize: 'off', autoCorrect: 'off', spellCheck: false })}
      />
      <button
        type="button"
        className="campo__revelar"
        aria-pressed={visible}
        aria-label={mostrar}
        title={mostrar}
        onClick={() => setVisible((v) => !v)}
      >
        <IconoOjo tachado={visible} />
      </button>
    </div>
  ))
}
