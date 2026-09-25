import { type FormEvent, type KeyboardEvent, type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { apiAdmin, type components, ErrorApi, pedir } from '../api'
import { avisar } from './avisos'
import Campo, { CampoSelect, CampoTexto } from './Campo'
import { mensajeDeError } from './mensajes'
import {
  cambiosPara,
  DESCRIPCION_MAXIMA,
  type ErroresFormulario,
  FORMULARIO_VACIO,
  type Formulario,
  formularioDe,
  hayCambios,
  leerFormulario,
  MEDIDAS_MAXIMAS,
  type MedidaFormulario,
  NOMBRE_PRODUCTO_MAXIMO,
  type Producto,
  ponerMedida,
  siguienteTipoLibre,
  sinTiposBorrados,
  type TipoMedida,
  textoMedidaAdmin,
  VALOR_MAXIMO,
  validarValor,
} from './productos'
import { esNombreEnUso, NOMBRE_MAXIMO, UNIDAD_MAXIMA, validarNombre } from './recursos'
import { exigirSesion, redirigirSiNoAutenticado } from './sesion'

// `/admin/productos/editar` (F6-D1, F6-D3): sin `?id=` es el alta; con `?id=` edita ese producto, que se
// busca en `GET /admin/productos` (no hay `GET /admin/productos/{id}`). Tras crear, la URL pasa a `?id=` y
// el formulario sigue abierto en modo edición. La fase 7 suma acá la galería, publicar y volver a borrador.

type Categoria = components['schemas']['Categoria']

const NO_ENCONTRADO = 'No existe ese producto.'

const codigoDe = (e: unknown) => (e instanceof ErrorApi ? e.codigo : null)

export default function EditarProducto() {
  const [id] = useState(() => new URLSearchParams(location.search).get('id'))
  const [cargando, setCargando] = useState(true)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [tipos, setTipos] = useState<TipoMedida[]>([])
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO)
  const [errores, setErrores] = useState<ErroresFormulario & { categoria?: string }>({})
  const [errorMedidas, setErrorMedidas] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const nombreRef = useRef<HTMLInputElement>(null)
  const precioRef = useRef<HTMLInputElement>(null)
  const categoriaRef = useRef<HTMLSelectElement>(null)
  const descripcionRef = useRef<HTMLTextAreaElement>(null)
  const tipoRef = useRef<HTMLSelectElement>(null)

  const inicial = producto ? formularioDe(producto) : FORMULARIO_VACIO
  const sinGuardar = !cargando && !noEncontrado && hayCambios(formulario, inicial)

  const cargarCategorias = useCallback(async () => {
    const { categorias } = await pedir(apiAdmin.GET('/admin/categorias'))
    setCategorias(categorias)
    return categorias
  }, [])

  const cargarTipos = useCallback(async () => {
    const { tiposMedida } = await pedir(apiAdmin.GET('/admin/tipos-medida'))
    setTipos(tiposMedida)
    return tiposMedida
  }, [])

  useEffect(() => {
    const cargar = async () => {
      try {
        await exigirSesion()
        const [{ productos }] = await Promise.all([
          pedir(apiAdmin.GET('/admin/productos')),
          cargarCategorias(),
          cargarTipos(),
        ])
        if (id !== null) {
          const encontrado = productos.find((p) => p.id === id)
          if (encontrado) {
            setProducto(encontrado)
            setFormulario(formularioDe(encontrado))
          } else setNoEncontrado(true)
        }
      } catch (e) {
        if (!redirigirSiNoAutenticado(e)) setError(mensajeDeError(e))
      }
      setCargando(false)
    }
    void cargar()
  }, [id, cargarCategorias, cargarTipos])

  // Aviso al salir con cambios sin guardar (F6-D3). MDN recomienda escucharlo solo mientras haya cambios.
  useEffect(() => {
    if (!sinGuardar) return
    const avisarSalida = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = true
    }
    addEventListener('beforeunload', avisarSalida)
    return () => removeEventListener('beforeunload', avisarSalida)
  }, [sinGuardar])

  const cambiar = <K extends keyof Formulario>(campo: K, valor: Formulario[K]) =>
    setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setError(null)
    setErrorMedidas(null)
    const leido = leerFormulario(formulario)
    if ('errores' in leido) {
      setErrores(leido.errores)
      const { nombre, precio } = leido.errores
      ;(nombre ? nombreRef : precio ? precioRef : descripcionRef).current?.focus()
      return
    }
    setErrores({})
    const cambios = producto && cambiosPara(leido.cuerpo, producto)
    if (cambios && Object.keys(cambios).length === 0) {
      avisar('No hay cambios para guardar.')
      return
    }
    setEnviando(true)
    try {
      const guardado = producto
        ? await pedir(
            apiAdmin.PATCH('/admin/productos/{id}', { params: { path: { id: producto.id } }, body: cambios ?? {} }),
          )
        : await pedir(apiAdmin.POST('/admin/productos', { body: leido.cuerpo }))
      if (!producto) history.replaceState(null, '', `?id=${encodeURIComponent(guardado.id)}`)
      setProducto(guardado)
      setFormulario(formularioDe(guardado))
      avisar(producto ? 'Producto guardado.' : 'Producto creado.')
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      await manejarError(e)
    }
    setEnviando(false)
  }

  const manejarError = async (e: unknown) => {
    const codigo = codigoDe(e)
    if (codigo === 'PRODUCTO_NO_ENCONTRADO') {
      setNoEncontrado(true)
      return
    }
    try {
      if (codigo === 'CATEGORIA_INEXISTENTE') {
        setErrores({ categoria: mensajeDeError(e) })
        await cargarCategorias()
        cambiar('categoriaId', '')
        categoriaRef.current?.focus()
        return
      }
      if (codigo === 'TIPO_MEDIDA_INEXISTENTE') {
        setErrorMedidas(`${mensajeDeError(e)} Revisá las medidas y volvé a guardar.`)
        const vigentes = await cargarTipos()
        setFormulario((actual) => ({ ...actual, medidas: sinTiposBorrados(actual.medidas, vigentes) }))
        tipoRef.current?.focus()
        return
      }
    } catch (recarga) {
      if (redirigirSiNoAutenticado(recarga)) return
      setError(mensajeDeError(recarga))
      return
    }
    setError(mensajeDeError(e))
  }

  const volver = (
    <a className="seccion__volver" href="/admin/productos">
      ← Volver a productos
    </a>
  )

  if (noEncontrado)
    return (
      <section className="seccion" aria-labelledby="tituloProducto">
        {volver}
        <h1 className="seccion__titulo" id="tituloProducto">
          Producto
        </h1>
        <p className="aviso aviso--error" role="alert">
          {NO_ENCONTRADO}
        </p>
      </section>
    )

  return (
    <section className="seccion" aria-labelledby="tituloProducto">
      {volver}
      <div className="seccion__cabecera">
        <h1 className="seccion__titulo" id="tituloProducto">
          {producto ? producto.nombre : 'Nuevo producto'}
        </h1>
        {producto && (
          <span className={`estado estado--${producto.estado}`}>
            {producto.estado === 'publicado' ? 'Publicado' : 'Borrador'}
          </span>
        )}
      </div>
      {cargando ? (
        !error && <p className="cargando">Cargando…</p>
      ) : (
        <form className="alta producto" onSubmit={enviar} noValidate>
          <Campo
            ref={nombreRef}
            id="productoNombre"
            etiqueta="Nombre"
            value={formulario.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
            maxLength={NOMBRE_PRODUCTO_MAXIMO}
            autoComplete="off"
            error={errores.nombre}
          />
          <Campo
            ref={precioRef}
            id="productoPrecio"
            etiqueta="Precio"
            prefijo="$"
            inputMode="decimal"
            value={formulario.precio}
            onChange={(e) => cambiar('precio', e.target.value)}
            autoComplete="off"
            ayuda="En pesos, con centavos opcionales (ej. 15000 o 15000,50)."
            error={errores.precio}
          />
          <CampoSelect
            ref={categoriaRef}
            id="productoCategoria"
            etiqueta="Categoría"
            value={formulario.categoriaId}
            onChange={(e) => cambiar('categoriaId', e.target.value)}
            error={errores.categoria}
            junto={
              <AltaRapida
                recurso="categoria"
                alCrear={async (nueva) => {
                  await cargarCategorias()
                  cambiar('categoriaId', nueva)
                  categoriaRef.current?.focus()
                }}
              />
            }
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </CampoSelect>
          <CampoTexto
            ref={descripcionRef}
            id="productoDescripcion"
            etiqueta="Descripción"
            value={formulario.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
            maxLength={DESCRIPCION_MAXIMA}
            rows={3}
            ayuda={`Opcional, hasta ${DESCRIPCION_MAXIMA} caracteres.`}
            error={errores.descripcion}
          />
          <Medidas
            medidas={formulario.medidas}
            tipos={tipos}
            error={errorMedidas}
            tipoRef={tipoRef}
            alCambiar={(medidas) => cambiar('medidas', medidas)}
            alCrearTipo={cargarTipos}
          />
          {error && (
            <p className="aviso aviso--error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn--primario" disabled={enviando}>
            {producto ? (enviando ? 'Guardando…' : 'Guardar cambios') : enviando ? 'Creando…' : 'Crear producto'}
          </button>
        </form>
      )}
      {cargando && error && (
        <p className="aviso aviso--error" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

interface PropsMedidas {
  medidas: MedidaFormulario[]
  tipos: TipoMedida[]
  error: string | null
  tipoRef: RefObject<HTMLSelectElement | null>
  alCambiar: (medidas: MedidaFormulario[]) => void
  /** Recarga los tipos tras el alta rápida (F6-D6). */
  alCrearTipo: () => Promise<TipoMedida[]>
}

/** Lista de medidas con "Quitar" y fila de alta (F6-D5). Nunca repite un tipo: el `400` no puede ocurrir. */
function Medidas({ medidas, tipos, error, tipoRef, alCambiar, alCrearTipo }: PropsMedidas) {
  const [tipoId, setTipoId] = useState('')
  const [valor, setValor] = useState('')
  const [errorValor, setErrorValor] = useState<string | null>(null)
  const valorRef = useRef<HTMLInputElement>(null)

  const tipo = tipos.find((t) => t.id === tipoId)
  const existente = medidas.find((m) => m.tipoMedidaId !== null && m.tipoMedidaId === tipoId)
  const lleno = !existente && medidas.length >= MEDIDAS_MAXIMAS

  // Si el tipo elegido no está (primera carga o se borró), se elige el primero sin medida.
  useEffect(() => {
    if (tipos.some((t) => t.id === tipoId)) return
    const libre = tipos.find((t) => !medidas.some((m) => m.tipoMedidaId === t.id)) ?? tipos[0]
    if (libre) setTipoId(libre.id)
  }, [tipos, tipoId, medidas])

  const elegir = (id: string) => {
    setTipoId(id)
    setErrorValor(null)
    // Si el tipo ya tiene medida, se precarga su valor para actualizarla.
    setValor(medidas.find((m) => m.tipoMedidaId === id)?.valor ?? '')
  }

  const agregar = () => {
    if (!tipo || lleno) return
    const limpio = valor.trim()
    const invalido = validarValor(limpio, tipo)
    setErrorValor(invalido)
    if (invalido) {
      valorRef.current?.focus()
      return
    }
    const nuevas = ponerMedida(medidas, { tipoMedidaId: tipo.id, valor: limpio })
    alCambiar(nuevas)
    const siguiente = siguienteTipoLibre(tipos, nuevas, tipo.id)
    setTipoId(siguiente)
    setValor(nuevas.find((m) => m.tipoMedidaId === siguiente)?.valor ?? '')
  }

  const teclaValor = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    agregar()
  }

  return (
    <fieldset className="campo medidas" aria-describedby={error ? 'medidasError' : undefined}>
      <legend>Medidas</legend>
      {medidas.length > 0 && (
        <ul className="chips">
          {medidas.map((medida, i) => {
            const texto = textoMedidaAdmin(medida, tipos)
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: las medidas sin guardar no tienen id y el chip no guarda estado.
              <li className="chip" key={`${medida.tipoMedidaId ?? 'sin-tipo'}-${i}`}>
                {texto}
                <button
                  type="button"
                  className="chip__quitar"
                  aria-label={`Quitar medida ${texto}`}
                  onClick={() => alCambiar(medidas.filter((_, j) => j !== i))}
                >
                  Quitar
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {tipos.length === 0 ? (
        <p className="campo__ayuda">Todavía no hay tipos de medida.</p>
      ) : (
        <div className="medidas__nueva">
          <CampoSelect
            ref={tipoRef}
            id="medidaTipo"
            etiqueta="Tipo de medida"
            value={tipoId}
            onChange={(e) => elegir(e.target.value)}
          >
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.unidad ? `${t.nombre} (${t.unidad})` : t.nombre}
              </option>
            ))}
          </CampoSelect>
          <Campo
            ref={valorRef}
            id="medidaValor"
            etiqueta="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={teclaValor}
            maxLength={VALOR_MAXIMO}
            inputMode={tipo?.unidad ? 'decimal' : undefined}
            autoComplete="off"
            ayuda={lleno ? `Hasta ${MEDIDAS_MAXIMAS} medidas.` : undefined}
            error={errorValor}
          />
          <button type="button" className="btn btn--secundario" onClick={agregar} disabled={lleno}>
            {existente ? 'Actualizar' : 'Agregar'}
          </button>
        </div>
      )}
      <AltaRapida
        recurso="tipo"
        alCrear={async (nuevo) => {
          await alCrearTipo()
          setTipoId(nuevo)
          setValor(medidas.find((m) => m.tipoMedidaId === nuevo)?.valor ?? '')
          setErrorValor(null)
          requestAnimationFrame(() => valorRef.current?.focus())
        }}
      />
      {error && (
        <p className="campo__error" id="medidasError" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  )
}

const RECURSOS = {
  categoria: {
    abrir: 'Nueva categoría',
    gestionar: 'Gestionar categorías',
    href: '/admin/categorias',
    creado: 'Categoría creada.',
  },
  tipo: {
    abrir: 'Nuevo tipo de medida',
    gestionar: 'Gestionar tipos de medida',
    href: '/admin/tipos-de-medida',
    creado: 'Tipo de medida creado.',
  },
} as const

interface PropsAltaRapida {
  recurso: keyof typeof RECURSOS
  /** Recibe el id creado; recarga la lista y deja elegido el nuevo. */
  alCrear: (id: string) => Promise<void>
}

/**
 * Alta rápida de categoría o tipo de medida desde el formulario (F6-D6). Es un `<div role="group">`, no un
 * `<form>`: el HTML Standard no permite formularios anidados. Enter en sus campos crea sin enviar el producto.
 */
function AltaRapida({ recurso, alCrear }: PropsAltaRapida) {
  const textos = RECURSOS[recurso]
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('cm')
  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)
  const nombreRef = useRef<HTMLInputElement>(null)
  const idBase = recurso === 'categoria' ? 'rapidaCategoria' : 'rapidaTipo'

  useEffect(() => {
    if (abierto) nombreRef.current?.focus()
  }, [abierto])

  const cerrar = () => {
    setAbierto(false)
    setNombre('')
    setUnidad('cm')
    setErrorNombre(null)
    setError(null)
    botonRef.current?.focus()
  }

  const crear = async () => {
    const limpio = nombre.trim()
    setError(null)
    const invalido = validarNombre(limpio)
    setErrorNombre(invalido)
    if (invalido) {
      nombreRef.current?.focus()
      return
    }
    setEnviando(true)
    try {
      const creado =
        recurso === 'categoria'
          ? await pedir(apiAdmin.POST('/admin/categorias', { body: { nombre: limpio } }))
          : await pedir(
              apiAdmin.POST('/admin/tipos-medida', { body: { nombre: limpio, unidad: unidad.trim() || null } }),
            )
      setAbierto(false)
      setNombre('')
      setUnidad('cm')
      avisar(textos.creado)
      await alCrear(creado.id)
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      if (esNombreEnUso(e)) {
        setErrorNombre(mensajeDeError(e))
        nombreRef.current?.focus()
      } else setError(mensajeDeError(e))
    }
    setEnviando(false)
  }

  const teclado = (evento: KeyboardEvent<HTMLFieldSetElement>) => {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      cerrar()
    } else if (evento.key === 'Enter' && evento.target instanceof HTMLInputElement) {
      evento.preventDefault()
      void crear()
    }
  }

  return (
    <div className="rapida">
      <div className="rapida__acciones">
        <button
          type="button"
          ref={botonRef}
          className="btn btn--secundario btn--chico"
          aria-expanded={abierto}
          onClick={() => (abierto ? cerrar() : setAbierto(true))}
        >
          {textos.abrir}
        </button>
        <a className="rapida__gestionar" href={textos.href}>
          {textos.gestionar}
        </a>
      </div>
      {abierto && (
        <fieldset className="rapida__grupo" onKeyDown={teclado}>
          <legend>{textos.abrir}</legend>
          <Campo
            ref={nombreRef}
            id={`${idBase}Nombre`}
            etiqueta="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={NOMBRE_MAXIMO}
            autoComplete="off"
            error={errorNombre}
          />
          {recurso === 'tipo' && (
            <Campo
              id={`${idBase}Unidad`}
              etiqueta="Unidad"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              maxLength={UNIDAD_MAXIMA}
              autoComplete="off"
              ayuda="Dejala vacía para un valor de texto libre (ej. Talla única)."
            />
          )}
          {error && (
            <p className="aviso aviso--error" role="alert">
              {error}
            </p>
          )}
          <span className="lista__acciones">
            <button type="button" className="btn btn--primario btn--chico" onClick={crear} disabled={enviando}>
              {enviando ? 'Creando…' : 'Crear'}
            </button>
            <button type="button" className="btn btn--secundario btn--chico" onClick={cerrar}>
              Cancelar
            </button>
          </span>
        </fieldset>
      )}
    </div>
  )
}
