import type { components, paths } from '../api'

// Reglas puras de la galería del producto (F7-D2 a F7-D9, F7-D11), separadas de la isla `Galeria.tsx`.

export type Imagen = components['schemas']['ImagenGaleria']
export type Estado = components['schemas']['Producto']['estado']
export type TipoContenido =
  paths['/admin/productos/{id}/imagenes/upload-url']['post']['requestBody']['content']['application/json']['contentType']

/** Límites del contrato: seis imágenes por producto y `tamanoBytes` de `upload-url`. */
export const IMAGENES_MAXIMAS = 6
export const TAMANO_MAXIMO = 10_485_760
/** Los `contentType` que acepta `upload-url`; también son el `accept` del selector. */
export const TIPOS_ACEPTADOS: readonly TipoContenido[] = ['image/jpeg', 'image/png', 'image/webp']
/** Lado mayor del archivo que se sube, ya preprocesado (F7-D2). */
export const LADO_MAXIMO = 2560

// ---------- Preprocesamiento (F7-D2) ----------

/** Medidas escaladas sin agrandar para que el lado mayor quede en `LADO_MAXIMO` como máximo. */
export function medidasEscaladas(ancho: number, alto: number): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto)
  if (mayor <= LADO_MAXIMO) return { ancho, alto }
  const escala = LADO_MAXIMO / mayor
  return { ancho: Math.max(1, Math.round(ancho * escala)), alto: Math.max(1, Math.round(alto * escala)) }
}

// ---------- Cupo y posición (F7-D3) ----------

/** Lugares libres; `reservados` son los archivos elegidos que todavía no pidieron `upload-url`. */
export function cupoLibre(galeria: Imagen[], reservados = 0): number {
  return Math.max(0, IMAGENES_MAXIMAS - galeria.length - reservados)
}

/** Posición de una imagen nueva, como la ubica el contrato: al final, o en 0 si todas son diseños. */
export function posicionNueva(galeria: Imagen[]): number {
  return galeria.every((imagen) => imagen.esDiseno) ? 0 : galeria.length
}

/** La imagen que crea `upload-url`, mientras no llega la de `confirmar`. */
export const imagenPendiente = (id: string): Imagen => ({
  id,
  etapa: 'pendiente_subida',
  procesada: false,
  url: null,
  url160: null,
  url640: null,
  url1600: null,
  esDiseno: false,
  nombreDiseno: null,
  error: null,
})

/** La galería con la imagen nueva en `posicionNueva`; sin cambios si ya estaba (una recarga la trajo). */
export function conImagenNueva(galeria: Imagen[], imagen: Imagen): Imagen[] {
  if (galeria.some((i) => i.id === imagen.id)) return galeria
  const nueva = [...galeria]
  nueva.splice(posicionNueva(galeria), 0, imagen)
  return nueva
}

/** Una «imagen válida» es una procesada que no es diseño. */
export const esValida = (imagen: Imagen | undefined): boolean =>
  imagen !== undefined && imagen.etapa === 'procesada' && !imagen.esDiseno

// ---------- Orden (F7-D6) ----------

/** La lista con el elemento `i` movido `paso` lugares (−1 antes, +1 después); también la usa el orden global (F8-D2). */
export function mover<T>(lista: T[], i: number, paso: number): T[] {
  const j = i + paso
  if (i < 0 || j < 0 || i >= lista.length || j >= lista.length) return lista
  const nueva = [...lista]
  const [imagen] = nueva.splice(i, 1)
  if (imagen !== undefined) nueva.splice(j, 0, imagen)
  return nueva
}

/** Motivo por el que la API rechazaría el orden nuevo, o `null` si vale. */
export function revisarOrden(orden: Imagen[], estado: Estado): string | null {
  if (orden[0]?.esDiseno && orden.some((imagen) => !imagen.esDiseno))
    return 'La imagen principal no puede ser un diseño.'
  if (estado === 'publicado' && !esValida(orden[0]))
    return 'En un producto publicado, la principal tiene que ser una imagen procesada que no sea un diseño.'
  return null
}

// ---------- Publicar (F7-D9) y quitar (F7-D8) ----------

export interface MotivoNoPublicar {
  texto: string
  /** La principal se está subiendo o procesando: se muestra la barra indeterminada. */
  esperando: boolean
}

/** Por qué "Publicar" está deshabilitado, o `null` si `galeria[0]` es una imagen válida. */
export function motivoParaNoPublicar(galeria: Imagen[]): MotivoNoPublicar | null {
  const principal = galeria[0]
  if (!principal || principal.esDiseno)
    return { texto: 'Para publicar, agregá una imagen que no sea un diseño.', esperando: false }
  if (principal.etapa === 'fallida')
    return { texto: 'La imagen principal falló: reintentala o hacé principal otra.', esperando: false }
  if (principal.etapa !== 'procesada')
    return { texto: 'Se puede publicar cuando la imagen principal termine de procesarse.', esperando: true }
  return null
}

/** Si quitar esa imagen deja un publicado sin ninguna imagen válida (`409` `ULTIMA_IMAGEN_VALIDA`). */
export function esUltimaValida(galeria: Imagen[], imagenId: string, estado: Estado): boolean {
  if (estado !== 'publicado') return false
  const imagen = galeria.find((i) => i.id === imagenId)
  return esValida(imagen) && galeria.filter(esValida).length === 1
}

// ---------- Consulta de etapa (F7-D4) ----------

export const ESPERA_CORTA = 2000
export const ESPERA_LARGA = 15_000
const LIMITE_CORTO = 2 * 60_000

/** Etapas que se consultan hasta llegar a `procesada` o `fallida`. */
export const enProceso = (imagen: Imagen): boolean =>
  imagen.etapa === 'pendiente_procesamiento' || imagen.etapa === 'procesando'

/** Espera hasta la próxima consulta según cuánto lleva la imagen sin terminar. */
export function intervaloConsulta(msSinTerminar: number): number {
  return msSinTerminar < LIMITE_CORTO ? ESPERA_CORTA : ESPERA_LARGA
}

// ---------- Subida desde el navegador (F7-D3) ----------

/** Etapa de cliente de una imagen ya creada con `upload-url`: el `PUT` a R2 y el `confirmar`. */
export type Subida =
  | { fase: 'subiendo'; progreso: number; expiraEn: string }
  | { fase: 'confirmando'; expiraEn: string }
  | { fase: 'fallida'; expiraEn: string }

export type EventoSubida = { tipo: 'progreso'; porcentaje: number } | { tipo: 'subida' } | { tipo: 'fallo' }

export const subidaNueva = (expiraEn: string): Subida => ({ fase: 'subiendo', progreso: 0, expiraEn })

/** Transición de una subida. Un evento que no corresponde a la fase la deja igual. */
export function avanzarSubida(subida: Subida, evento: EventoSubida): Subida {
  const { expiraEn } = subida
  switch (evento.tipo) {
    case 'progreso':
      if (subida.fase !== 'subiendo') return subida
      return { fase: 'subiendo', progreso: Math.min(100, Math.max(0, Math.round(evento.porcentaje))), expiraEn }
    case 'subida':
      return subida.fase === 'subiendo' ? { fase: 'confirmando', expiraEn } : subida
    case 'fallo':
      return subida.fase === 'fallida' ? subida : { fase: 'fallida', expiraEn }
  }
}

/**
 * Cómo reintentar una subida fallida: con la URL vigente se repite el `PUT` con el mismo archivo; si
 * `expiraEn` pasó, se quita la imagen y se empieza de nuevo desde `upload-url`.
 */
export function comoReintentar(subida: Subida, ahora: number): 'repetir' | 'de-nuevo' {
  return Date.parse(subida.expiraEn) > ahora ? 'repetir' : 'de-nuevo'
}
