import {
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { apiAdmin, ErrorApi, pedir } from '../api'
import { avisar } from './avisos'
import { confirmar } from './confirmar'
import {
  avanzarSubida,
  comoReintentar,
  conImagenNueva,
  cupoLibre,
  type Estado,
  type EventoSubida,
  enProceso,
  esUltimaValida,
  IMAGENES_MAXIMAS,
  type Imagen,
  imagenPendiente,
  intervaloConsulta,
  mover,
  revisarOrden,
  type Subida,
  subidaNueva,
  TIPOS_ACEPTADOS,
  type TipoContenido,
} from './galeria'
import { IconoDerecha, IconoEstrella, IconoFoto, IconoIzquierda } from './iconos'
import { mensajeDeError } from './mensajes'
import { ErrorPreparacion, preprocesar } from './preprocesar'
import { redirigirSiNoAutenticado } from './sesion'

// Galería de `/admin/productos/editar` (F7-D1 a F7-D8). Cada acción llama a la API en el momento; la galería
// vive en el producto de `EditarProducto`, y acá, por `imagenId`, lo que solo existe en esta página: el
// archivo preparado, su vista previa y la subida a R2 (F7-D11). Las subidas corren de a una, en una cola.

const NOMBRE_DISENO_MAXIMO = 60

/** Lo local de una imagen creada con `upload-url` en esta página. `subida` es `null` tras `confirmar`. */
interface Archivo {
  blob: Blob
  contentType: TipoContenido
  uploadUrl: string
  vista: string
  subida: Subida | null
}

interface Props {
  productoId: string
  estado: Estado
  galeria: Imagen[]
  /** Cambia la galería del producto cargado; recibe una función porque llega de pedidos asíncronos. */
  alCambiar: (cambio: (galeria: Imagen[]) => Imagen[]) => void
  /** Vuelve a leer la galería y el estado del producto (`GET /admin/productos`). No lanza. */
  recargar: () => Promise<void>
}

const codigoDe = (e: unknown) => (e instanceof ErrorApi ? e.codigo : null)

export default function Galeria({ productoId, estado, galeria, alCambiar, recargar }: Props) {
  const [archivos, setArchivos] = useState<Record<string, Archivo>>({})
  const [preparando, setPreparando] = useState(false)
  const [reservados, setReservados] = useState(0)
  const [ocupadas, setOcupadas] = useState(0)
  const [aviso, setAviso] = useState<string | null>(null)
  const [anuncio, setAnuncio] = useState('')
  const [oculta, setOculta] = useState(() => document.hidden)
  const selector = useRef<HTMLInputElement>(null)
  // Copias síncronas para los flujos asíncronos, que no ven el estado de un render posterior.
  const archivosRef = useRef(archivos)
  const galeriaRef = useRef(galeria)
  galeriaRef.current = galeria
  const reservadosRef = useRef(0)
  const xhrs = useRef(new Map<string, XMLHttpRequest>())
  const cola = useRef(Promise.resolve())
  const montada = useRef(true)

  const ruta = { path: { id: productoId } }
  const rutaImagen = (imagenId: string) => ({ path: { id: productoId, imagenId } })

  // ---------- Estado local por imagen ----------

  const ponerArchivos = useCallback((cambio: (actuales: Record<string, Archivo>) => Record<string, Archivo>) => {
    archivosRef.current = cambio(archivosRef.current)
    setArchivos(archivosRef.current)
  }, [])

  const avanzar = (id: string, evento: EventoSubida) =>
    ponerArchivos((actuales) => {
      const archivo = actuales[id]
      if (!archivo?.subida) return actuales
      return { ...actuales, [id]: { ...archivo, subida: avanzarSubida(archivo.subida, evento) } }
    })

  const ponerSubida = (id: string, subida: Subida | null) =>
    ponerArchivos((actuales) => {
      const archivo = actuales[id]
      return archivo ? { ...actuales, [id]: { ...archivo, subida } } : actuales
    })

  /** Suelta lo local de la imagen: la vista previa se revoca al procesarse o al quitarla. */
  const olvidar = useCallback(
    (id: string) =>
      ponerArchivos((actuales) => {
        const archivo = actuales[id]
        if (!archivo) return actuales
        URL.revokeObjectURL(archivo.vista)
        const { [id]: _, ...resto } = actuales
        return resto
      }),
    [ponerArchivos],
  )

  const reemplazar = useCallback(
    (imagen: Imagen) => alCambiar((actual) => actual.map((i) => (i.id === imagen.id ? imagen : i))),
    [alCambiar],
  )

  const reservar = (cantidad: number) => {
    reservadosRef.current += cantidad
    setReservados(reservadosRef.current)
  }

  const operar = async (tarea: () => Promise<void>) => {
    setOcupadas((n) => n + 1)
    try {
      await tarea()
    } finally {
      setOcupadas((n) => n - 1)
    }
  }

  const encolar = (tarea: () => Promise<void>) => {
    cola.current = cola.current.then(tarea).catch(() => {})
  }

  // Al desmontar se cortan las subidas y se revocan las vistas previas.
  useEffect(() => {
    montada.current = true
    return () => {
      montada.current = false
      for (const xhr of xhrs.current.values()) xhr.abort()
      for (const archivo of Object.values(archivosRef.current)) URL.revokeObjectURL(archivo.vista)
    }
  }, [])

  // ---------- Subida (F7-D3) ----------

  /** `PUT` directo a R2 con progreso; `fetch` no expone el de subida. Sin credenciales. */
  const ponerEnR2 = (id: string, archivo: Archivo) =>
    new Promise<boolean>((resolver) => {
      const xhr = new XMLHttpRequest()
      xhrs.current.set(id, xhr)
      xhr.open('PUT', archivo.uploadUrl)
      xhr.setRequestHeader('Content-Type', archivo.contentType)
      xhr.upload.onprogress = (evento) => {
        if (evento.lengthComputable) avanzar(id, { tipo: 'progreso', porcentaje: (evento.loaded / evento.total) * 100 })
      }
      xhr.onload = () => resolver(xhr.status >= 200 && xhr.status < 300)
      xhr.onerror = () => resolver(false)
      xhr.onabort = () => resolver(false)
      xhr.onloadend = () => xhrs.current.delete(id)
      xhr.send(archivo.blob)
    })

  /** `PUT` y `confirmar` de una imagen ya creada. Una falla deja la tarjeta con "Reintentar". */
  const subir = async (id: string) => {
    const archivo = archivosRef.current[id]
    if (!archivo?.subida) return
    ponerSubida(id, subidaNueva(archivo.subida.expiraEn))
    const subida = await ponerEnR2(id, archivo)
    if (!montada.current) return
    if (!subida) {
      avanzar(id, { tipo: 'fallo' })
      return
    }
    avanzar(id, { tipo: 'subida' })
    try {
      const { imagen } = await pedir(
        apiAdmin.POST('/admin/productos/{id}/imagenes/{imagenId}/confirmar', { params: rutaImagen(id) }),
      )
      ponerSubida(id, null)
      reemplazar(imagen)
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      if (codigoDe(e) === 'IMAGEN_NO_ENCONTRADA') {
        olvidar(id)
        await recargar()
        return
      }
      avanzar(id, { tipo: 'fallo' })
      if (codigoDe(e) !== 'SUBIDA_INCOMPLETA') setAviso(mensajeDeError(e))
    }
  }

  /** `upload-url` y la imagen nueva en la galería. Devuelve su id, o `null` si hay que cortar la secuencia. */
  const pedirSubida = async (blob: Blob, contentType: TipoContenido): Promise<string | null> => {
    let imagenId: string | null = null
    await operar(async () => {
      try {
        const autorizada = await pedir(
          apiAdmin.POST('/admin/productos/{id}/imagenes/upload-url', {
            params: ruta,
            body: { contentType, tamanoBytes: blob.size },
          }),
        )
        const archivo: Archivo = {
          blob,
          contentType,
          uploadUrl: autorizada.uploadUrl,
          vista: URL.createObjectURL(blob),
          subida: subidaNueva(autorizada.expiraEn),
        }
        ponerArchivos((actuales) => ({ ...actuales, [autorizada.imagenId]: archivo }))
        alCambiar((actual) => conImagenNueva(actual, imagenPendiente(autorizada.imagenId)))
        imagenId = autorizada.imagenId
      } catch (e) {
        if (redirigirSiNoAutenticado(e)) return
        // `GALERIA_COMPLETA` (otro integrante llenó el cupo) y el resto cortan los archivos que faltan.
        if (codigoDe(e) === 'GALERIA_COMPLETA' || codigoDe(e) === 'PRODUCTO_NO_ENCONTRADO') await recargar()
        setAviso(mensajeDeError(e))
      }
    })
    return imagenId
  }

  const subirArchivos = async (lista: File[]) => {
    const errores: string[] = []
    for (const [i, archivo] of lista.entries()) {
      if (!montada.current) return
      setPreparando(true)
      let preparado: Awaited<ReturnType<typeof preprocesar>>
      try {
        preparado = await preprocesar(archivo)
      } catch (e) {
        reservar(-1)
        errores.push(e instanceof ErrorPreparacion ? e.message : `No se pudo leer «${archivo.name}».`)
        setAviso(errores.join(' '))
        continue
      }
      const id = await pedirSubida(preparado.blob, preparado.contentType)
      setPreparando(false)
      reservar(-1)
      if (id === null) {
        reservar(-(lista.length - i - 1))
        return
      }
      await subir(id)
    }
    setPreparando(false)
  }

  const elegir = (evento: ChangeEvent<HTMLInputElement>) => {
    const elegidos = Array.from(evento.target.files ?? [])
    evento.target.value = ''
    if (elegidos.length === 0) return
    const libres = cupoLibre(galeriaRef.current, reservadosRef.current)
    if (elegidos.length > libres)
      avisar(
        libres === 1
          ? 'Entraba 1 imagen más: se agregó la primera.'
          : `Entraban ${libres} imágenes más: se agregaron las primeras ${libres}.`,
      )
    const lista = elegidos.slice(0, libres)
    if (lista.length === 0) return
    setAviso(null)
    reservar(lista.length)
    encolar(() => subirArchivos(lista))
  }

  const reintentarSubida = (id: string) =>
    encolar(async () => {
      const archivo = archivosRef.current[id]
      if (archivo?.subida?.fase !== 'fallida') return
      setAviso(null)
      if (comoReintentar(archivo.subida, Date.now()) === 'repetir') {
        await subir(id)
        return
      }
      // La URL venció: se quita la imagen y se empieza de nuevo desde `upload-url` con el mismo archivo.
      try {
        await pedir(apiAdmin.DELETE('/admin/productos/{id}/imagenes/{imagenId}', { params: rutaImagen(id) }))
      } catch (e) {
        if (redirigirSiNoAutenticado(e)) return
        if (codigoDe(e) !== 'IMAGEN_NO_ENCONTRADA') {
          setAviso(mensajeDeError(e))
          return
        }
      }
      olvidar(id)
      alCambiar((actual) => actual.filter((i) => i.id !== id))
      const nuevo = await pedirSubida(archivo.blob, archivo.contentType)
      if (nuevo !== null) await subir(nuevo)
    })

  // Aviso al salir mientras una imagen se prepara, se sube o se confirma (F6-D3, F7-D3).
  const subiendo =
    preparando || reservados > 0 || Object.values(archivos).some((a) => a.subida && a.subida.fase !== 'fallida')
  useEffect(() => {
    if (!subiendo) return
    const avisarSalida = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = true
    }
    addEventListener('beforeunload', avisarSalida)
    return () => removeEventListener('beforeunload', avisarSalida)
  }, [subiendo])

  // ---------- Consulta de etapa (F7-D4) ----------

  useEffect(() => {
    const cambiar = () => setOculta(document.hidden)
    document.addEventListener('visibilitychange', cambiar)
    return () => document.removeEventListener('visibilitychange', cambiar)
  }, [])

  const consultas = useRef(new Map<string, { desde: number; proxima: number }>())
  const enVuelo = useRef(Promise.resolve())
  const pendientes = galeria
    .filter(enProceso)
    .map((i) => i.id)
    .join(' ')

  // Se reinicia solo si cambian las imágenes en proceso o la visibilidad; los callbacks son estables.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reiniciar con cada render repetiría consultas.
  useEffect(() => {
    if (oculta || pendientes === '') return
    let cortada = false
    let temporizador: ReturnType<typeof setTimeout> | undefined
    const ids = pendientes.split(' ')

    const consultar = async (id: string) => {
      const datos = consultas.current.get(id)
      try {
        const { imagen } = await pedir(
          apiAdmin.GET('/admin/productos/{id}/imagenes/{imagenId}', { params: rutaImagen(id) }),
        )
        if (datos) datos.proxima = Date.now() + intervaloConsulta(Date.now() - datos.desde)
        if (enProceso(imagen)) {
          reemplazar(imagen)
          return
        }
        consultas.current.delete(id)
        const n = galeriaRef.current.findIndex((i) => i.id === id) + 1
        setAnuncio(imagen.etapa === 'procesada' ? `Imagen ${n} procesada.` : `Imagen ${n} fallida.`)
        if (imagen.etapa === 'procesada') olvidar(id)
        reemplazar(imagen)
      } catch (e) {
        if (datos) datos.proxima = Date.now() + intervaloConsulta(Date.now() - datos.desde)
        if (redirigirSiNoAutenticado(e)) {
          cortada = true
          return
        }
        if (codigoDe(e) === 'IMAGEN_NO_ENCONTRADA') {
          consultas.current.delete(id)
          await recargar()
        }
        // Otro error (red, `503`): se vuelve a consultar en el próximo turno.
      }
    }

    const ciclo = async () => {
      // Sin pedidos simultáneos: si quedó uno del efecto anterior, se lo espera.
      await enVuelo.current
      if (cortada) return
      const ahora = Date.now()
      for (const id of ids)
        if (!consultas.current.has(id))
          consultas.current.set(id, { desde: ahora, proxima: ahora + intervaloConsulta(0) })
      const [id, datos] = ids
        .map((id) => [id, consultas.current.get(id)] as const)
        .reduce((a, b) => ((b[1]?.proxima ?? 0) < (a[1]?.proxima ?? 0) ? b : a))
      temporizador = setTimeout(
        () => {
          if (cortada) return
          enVuelo.current = consultar(id)
          void enVuelo.current.then(() => {
            if (!cortada) void ciclo()
          })
        },
        Math.max(0, (datos?.proxima ?? ahora) - ahora),
      )
    }

    void ciclo()
    return () => {
      cortada = true
      clearTimeout(temporizador)
    }
  }, [pendientes, oculta])

  // ---------- Orden, diseño, quitar y reintentar (F7-D5 a F7-D8) ----------

  const ordenar = (orden: Imagen[]) => {
    const motivo = revisarOrden(orden, estado)
    if (motivo) {
      avisar(motivo, 'error')
      return
    }
    setAviso(null)
    void operar(async () => {
      try {
        const { galeria } = await pedir(
          apiAdmin.PUT('/admin/productos/{id}/imagenes/orden', {
            params: ruta,
            body: { orden: orden.map((i) => i.id) },
          }),
        )
        alCambiar(() => galeria)
      } catch (e) {
        if (redirigirSiNoAutenticado(e)) return
        const codigo = codigoDe(e)
        if (codigo === 'ORDEN_GALERIA_INVALIDO') {
          await recargar()
          avisar('La galería cambió mientras la ordenabas. Revisá el orden y volvé a intentar.', 'error')
        } else if (codigo === 'DISENO_EN_PRINCIPAL' || codigo === 'SIN_IMAGEN_PRINCIPAL') {
          await recargar()
          avisar(mensajeDeError(e), 'error')
        } else {
          if (codigo === 'PRODUCTO_NO_ENCONTRADO') await recargar()
          setAviso(mensajeDeError(e))
        }
      }
    })
  }

  const cambiarDiseno = (imagen: Imagen, i: number, esDiseno: boolean) => {
    if (esDiseno && i === 0) {
      avisar('La imagen principal no puede ser un diseño. Hacé principal otra imagen primero.', 'error')
      return
    }
    setAviso(null)
    void operar(async () => {
      try {
        await pedir(
          apiAdmin.PATCH('/admin/productos/{id}/imagenes/{imagenId}', {
            params: rutaImagen(imagen.id),
            body: { esDiseno },
          }),
        )
      } catch (e) {
        if (redirigirSiNoAutenticado(e)) return
        if (codigoDe(e) === 'DISENO_EN_PRINCIPAL') avisar(mensajeDeError(e), 'error')
        else setAviso(mensajeDeError(e))
      }
      // Desmarcar cuando todas son diseños la pasa a la posición 0: se recarga en cualquier caso.
      await recargar()
    })
  }

  const quitar = async (imagen: Imagen) => {
    if (esUltimaValida(galeria, imagen.id, estado)) {
      setAviso('Es la última imagen válida de un producto publicado: volvé a borrador para quitarla.')
      return
    }
    const confirmado = await confirmar({
      titulo: '¿Quitar esta imagen?',
      detalle: 'Se borra de la galería. No se puede deshacer.',
      accion: 'Quitar',
    })
    if (!confirmado) return
    setAviso(null)
    xhrs.current.get(imagen.id)?.abort()
    await operar(async () => {
      try {
        await pedir(apiAdmin.DELETE('/admin/productos/{id}/imagenes/{imagenId}', { params: rutaImagen(imagen.id) }))
        olvidar(imagen.id)
        avisar('Imagen quitada.')
      } catch (e) {
        if (redirigirSiNoAutenticado(e)) return
        if (codigoDe(e) === 'IMAGEN_NO_ENCONTRADA') olvidar(imagen.id)
        else setAviso(mensajeDeError(e))
      }
      // El backend puede reordenar al quitar.
      await recargar()
    })
  }

  const reintentarProceso = async (imagen: Imagen) => {
    setAviso(null)
    try {
      const { imagen: encolada } = await pedir(
        apiAdmin.POST('/admin/productos/{id}/imagenes/{imagenId}/reintentar', { params: rutaImagen(imagen.id) }),
      )
      reemplazar(encolada)
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      if (codigoDe(e) === 'IMAGEN_NO_ENCONTRADA') await recargar()
      else setAviso(mensajeDeError(e))
    }
  }

  // ---------- Vista ----------

  const libres = cupoLibre(galeria, reservados)
  const bloqueada = ocupadas > 0

  return (
    <section className="galeria-seccion" aria-labelledby="tituloGaleria">
      <div className="galeria__cabecera">
        <h2 className="galeria__titulo" id="tituloGaleria">
          Galería ({galeria.length}/{IMAGENES_MAXIMAS})
        </h2>
        <button
          type="button"
          className="btn btn--secundario btn--chico"
          onClick={() => selector.current?.click()}
          disabled={libres === 0}
          aria-describedby={libres === 0 ? 'galeriaCompleta' : undefined}
        >
          Agregar imágenes
        </button>
        <input
          ref={selector}
          type="file"
          multiple
          accept={TIPOS_ACEPTADOS.join(',')}
          onChange={elegir}
          hidden
          tabIndex={-1}
        />
      </div>
      {libres === 0 && (
        <p className="campo__ayuda" id="galeriaCompleta">
          La galería está completa ({IMAGENES_MAXIMAS} de {IMAGENES_MAXIMAS}).
        </p>
      )}
      {aviso && (
        <p className="aviso aviso--error" role="alert">
          {aviso}
        </p>
      )}
      {galeria.length === 0 && !preparando ? (
        <p className="lista__vacia">Todavía no hay imágenes.</p>
      ) : (
        <ul className="galeria">
          {galeria.map((imagen, i) => (
            <Tarjeta
              key={imagen.id}
              imagen={imagen}
              posicion={i}
              total={galeria.length}
              archivo={archivos[imagen.id]}
              bloqueada={bloqueada}
              alMover={(paso) => ordenar(mover(galeria, i, paso))}
              alHacerPrincipal={() => ordenar(mover(galeria, i, -i))}
              alCambiarDiseno={(valor) => cambiarDiseno(imagen, i, valor)}
              alReemplazar={reemplazar}
              alQuitar={() => quitar(imagen)}
              alReintentarSubida={() => reintentarSubida(imagen.id)}
              alReintentarProceso={() => reintentarProceso(imagen)}
              productoId={productoId}
            />
          ))}
          {preparando && (
            <li className="foto">
              <div className="foto__marco">
                <IconoFoto />
              </div>
              <div className="foto__controles">
                <Etapa texto="Preparando…" etiqueta="Preparando imagen" />
              </div>
            </li>
          )}
        </ul>
      )}
      <p className="visualmente-oculto" role="status">
        {anuncio}
      </p>
    </section>
  )
}

/** Texto de la etapa con su barra: con `progreso`, determinada; sin él, indeterminada (F7-D5). */
function Etapa({ texto, etiqueta, progreso }: { texto: string; etiqueta: string; progreso?: number }) {
  return (
    <div className="foto__etapa">
      <span>{texto}</span>
      {progreso === undefined ? (
        <progress aria-label={etiqueta} />
      ) : (
        <progress aria-label={etiqueta} value={progreso} max={100} />
      )}
    </div>
  )
}

interface PropsTarjeta {
  productoId: string
  imagen: Imagen
  posicion: number
  total: number
  archivo: Archivo | undefined
  bloqueada: boolean
  alMover: (paso: number) => void
  alHacerPrincipal: () => void
  alCambiarDiseno: (esDiseno: boolean) => void
  alReemplazar: (imagen: Imagen) => void
  alQuitar: () => void
  alReintentarSubida: () => void
  alReintentarProceso: () => void
}

function Tarjeta(props: PropsTarjeta) {
  const { imagen, posicion, total, archivo, bloqueada } = props
  const n = posicion + 1
  const id = useId()
  const [nombre, setNombre] = useState(imagen.nombreDiseno ?? '')
  const [errorNombre, setErrorNombre] = useState<string | null>(null)
  const [reintentando, setReintentando] = useState(false)

  useEffect(() => setNombre(imagen.nombreDiseno ?? ''), [imagen.nombreDiseno])

  const principal = posicion === 0 && !imagen.esDiseno
  const subida = archivo?.subida ?? null
  const sinTerminar = imagen.etapa === 'pendiente_subida' && !archivo
  const soloQuitar = sinTerminar || subida?.fase === 'fallida'

  const guardarNombre = async () => {
    const limpio = nombre.trim()
    if (limpio === (imagen.nombreDiseno ?? '')) return
    try {
      const { imagen: editada } = await pedir(
        apiAdmin.PATCH('/admin/productos/{id}/imagenes/{imagenId}', {
          params: { path: { id: props.productoId, imagenId: imagen.id } },
          body: { nombreDiseno: limpio || null },
        }),
      )
      setErrorNombre(null)
      props.alReemplazar(editada)
      avisar('Nombre del diseño guardado.')
    } catch (e) {
      if (redirigirSiNoAutenticado(e)) return
      setErrorNombre(mensajeDeError(e))
    }
  }

  const teclaNombre = (evento: KeyboardEvent<HTMLInputElement>) => {
    if (evento.key !== 'Enter') return
    evento.preventDefault()
    evento.currentTarget.blur()
  }

  const reintentar = async (accion: () => void | Promise<void>) => {
    setReintentando(true)
    await accion()
    setReintentando(false)
  }

  let marco: ReactNode = <IconoFoto />
  if (imagen.etapa === 'procesada' && imagen.url160)
    marco = (
      <img
        src={imagen.url160}
        srcSet={imagen.url640 ? `${imagen.url160} 160w, ${imagen.url640} 640w` : undefined}
        sizes="160px"
        alt={`Imagen ${n} de la galería`}
      />
    )
  else if (archivo) marco = <img src={archivo.vista} alt={`Imagen ${n} de la galería`} />

  let etapa: ReactNode = null
  if (subida?.fase === 'subiendo')
    etapa = (
      <Etapa texto={`Subiendo… ${subida.progreso} %`} etiqueta={`Subiendo imagen ${n}`} progreso={subida.progreso} />
    )
  else if (subida?.fase === 'confirmando')
    etapa = <Etapa texto="Subiendo… 100 %" etiqueta={`Subiendo imagen ${n}`} progreso={100} />
  else if (subida?.fase === 'fallida')
    etapa = (
      <div className="foto__etapa foto__etapa--error">
        <span>No se pudo subir.</span>
        <button type="button" className="btn btn--secundario btn--chico" onClick={props.alReintentarSubida}>
          Reintentar
        </button>
      </div>
    )
  else if (sinTerminar)
    etapa = (
      <div className="foto__etapa foto__etapa--error">
        <span>Subida sin terminar: quitala y volvé a agregarla.</span>
      </div>
    )
  else if (imagen.etapa === 'pendiente_subida') etapa = <Etapa texto="Subiendo…" etiqueta={`Subiendo imagen ${n}`} />
  else if (imagen.etapa === 'pendiente_procesamiento')
    etapa = <Etapa texto="Pendiente de procesamiento" etiqueta={`Procesamiento de la imagen ${n}`} />
  else if (imagen.etapa === 'procesando')
    etapa = <Etapa texto="Procesando…" etiqueta={`Procesamiento de la imagen ${n}`} />
  else if (imagen.etapa === 'fallida')
    etapa = (
      <div className="foto__etapa foto__etapa--error">
        <span>{imagen.error ?? 'No se pudo procesar.'}</span>
        <button
          type="button"
          className="btn btn--secundario btn--chico"
          onClick={() => reintentar(props.alReintentarProceso)}
          disabled={reintentando}
        >
          {reintentando ? 'Reintentando…' : 'Reintentar'}
        </button>
      </div>
    )

  return (
    <li className="foto">
      <div className="foto__marco">
        {marco}
        {principal && <span className="foto__badge">Principal</span>}
        {imagen.esDiseno && (
          <span className="foto__badge">{imagen.nombreDiseno ? `Diseño: ${imagen.nombreDiseno}` : 'Diseño'}</span>
        )}
      </div>
      <div className="foto__controles">
        {etapa}
        {!soloQuitar && (
          <>
            <div className="foto__fila">
              <button
                type="button"
                className="btn--icono"
                aria-label={`Mover antes la imagen ${n}`}
                onClick={() => props.alMover(-1)}
                disabled={bloqueada || posicion === 0}
              >
                <IconoIzquierda />
              </button>
              <button
                type="button"
                className="btn--icono"
                aria-label={`Mover después la imagen ${n}`}
                onClick={() => props.alMover(1)}
                disabled={bloqueada || posicion === total - 1}
              >
                <IconoDerecha />
              </button>
              {!principal && !imagen.esDiseno && (
                <button
                  type="button"
                  className="btn--icono"
                  aria-label={`Hacer principal la imagen ${n}`}
                  title="Hacer principal"
                  onClick={props.alHacerPrincipal}
                  disabled={bloqueada}
                >
                  <IconoEstrella />
                </button>
              )}
            </div>
            <label className="foto__diseno">
              <input
                type="checkbox"
                checked={imagen.esDiseno}
                onChange={(e) => props.alCambiarDiseno(e.target.checked)}
                disabled={bloqueada}
              />
              Es un diseño
            </label>
            {imagen.esDiseno && (
              <div className="campo foto__nombre">
                <label htmlFor={`${id}nombre`}>Nombre del diseño</label>
                <input
                  id={`${id}nombre`}
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  onBlur={guardarNombre}
                  onKeyDown={teclaNombre}
                  maxLength={NOMBRE_DISENO_MAXIMO}
                  autoComplete="off"
                  placeholder="Opcional"
                  aria-invalid={errorNombre ? true : undefined}
                  aria-describedby={errorNombre ? `${id}error` : undefined}
                />
                {errorNombre && (
                  <p className="campo__error" id={`${id}error`}>
                    {errorNombre}
                  </p>
                )}
              </div>
            )}
          </>
        )}
        <button
          type="button"
          className="btn btn--peligro btn--chico"
          aria-label={`Quitar la imagen ${n}`}
          onClick={props.alQuitar}
          disabled={bloqueada}
        >
          Quitar
        </button>
      </div>
    </li>
  )
}
