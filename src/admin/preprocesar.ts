import { medidasEscaladas, TAMANO_MAXIMO, TIPOS_ACEPTADOS, type TipoContenido } from './galeria'

// Preprocesamiento en el navegador (F7-D2): el archivo elegido se decodifica, se escala a 2560 px como
// máximo y se recodifica siempre a JPEG 0,85 sobre fondo blanco. Recodificar descarta el EXIF (incluido el
// GPS); `createImageBitmap` ya aplica la orientación. Usa el DOM, así que no tiene tests.

const CALIDAD = 0.85

/** Error de preparación, con el texto para la UI. Se muestra antes de pedir `upload-url`. */
export class ErrorPreparacion extends Error {
  override readonly name = 'ErrorPreparacion'
}

const noSeLee = (archivo: File) =>
  new ErrorPreparacion(`No se pudo leer «${archivo.name}». Elegí una imagen JPG, PNG o WebP.`)

export interface Preparado {
  blob: Blob
  contentType: TipoContenido
}

/** El archivo listo para subir. Si el navegador no exporta JPEG, `toBlob` devuelve PNG: se manda su `type`. */
export async function preprocesar(archivo: File): Promise<Preparado> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(archivo)
  } catch {
    throw noSeLee(archivo)
  }
  let blob: Blob | null
  try {
    const { ancho, alto } = medidasEscaladas(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto
    const contexto = canvas.getContext('2d')
    if (!contexto) throw noSeLee(archivo)
    // JPEG no tiene alfa: sin el fondo blanco, un PNG transparente saldría negro.
    contexto.fillStyle = '#fff'
    contexto.fillRect(0, 0, ancho, alto)
    contexto.imageSmoothingQuality = 'high'
    contexto.drawImage(bitmap, 0, 0, ancho, alto)
    blob = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', CALIDAD))
  } finally {
    bitmap.close()
  }
  const contentType = TIPOS_ACEPTADOS.find((tipo) => tipo === blob?.type)
  if (!blob || !contentType) throw noSeLee(archivo)
  if (blob.size > TAMANO_MAXIMO) throw new ErrorPreparacion(`«${archivo.name}» es demasiado grande.`)
  return { blob, contentType }
}
