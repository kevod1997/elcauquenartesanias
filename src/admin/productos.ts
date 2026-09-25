import type { components, paths } from '../api'

// Reglas puras del formulario de producto (F6-D3 a F6-D5, F6-D7), separadas de las islas.

export type Producto = components['schemas']['Producto']
export type TipoMedida = components['schemas']['TipoMedida']
type CuerpoAlta = paths['/admin/productos']['post']['requestBody']['content']['application/json']
export type CuerpoCambios = paths['/admin/productos/{id}']['patch']['requestBody']['content']['application/json']
export type MedidaFormulario = NonNullable<CuerpoAlta['medidas']>[number] & { tipoMedidaId: string | null }

/** Límites del esquema de `openapi.json`. */
export const NOMBRE_PRODUCTO_MAXIMO = 80
export const DESCRIPCION_MAXIMA = 400
export const VALOR_MAXIMO = 30
export const MEDIDAS_MAXIMAS = 20

// ---------- Precio (F6-D4) ----------

const PRECIO = /^(\d+)(?:[.,](\d{1,2}))?$/

/**
 * Pesos escritos (`15000`, `15000,5`, `19.99`) a centavos, operando sobre el texto: `19,99 * 100` en
 * `number` da `1998.9999…`. Un separador con tres dígitos (`1.500`) se rechaza en vez de adivinar.
 */
export function pesosACentavos(texto: string): { centavos: number } | { error: string } {
  const limpio = texto.trim()
  if (limpio === '') return { error: 'Escribí el precio.' }
  const partes = PRECIO.exec(limpio)
  if (!partes) return { error: 'Escribí el precio en pesos, sin puntos de miles (ej. 15000 o 15000,50).' }
  const centavos = BigInt(partes[1] ?? '0') * 100n + BigInt((partes[2] ?? '').padEnd(2, '0'))
  if (centavos === 0n) return { error: 'El precio tiene que ser mayor a 0.' }
  if (centavos > BigInt(Number.MAX_SAFE_INTEGER)) return { error: 'El precio es demasiado alto.' }
  return { centavos: Number(centavos) }
}

/** Centavos al texto del input: `15000`, o `15000,50` si hay centavos. */
export function centavosAPesos(centavos: number): string {
  const texto = String(centavos).padStart(3, '0')
  const pesos = texto.slice(0, -2)
  const resto = texto.slice(-2)
  return resto === '00' ? pesos : `${pesos},${resto}`
}

// ---------- Medidas (F6-D5) ----------

const NUMERO = /^\d+([.,]\d+)?$/

/** Error del `valor` ya recortado para ese tipo, o `null`. Con unidad exige un número. */
export function validarValor(valor: string, tipo: TipoMedida): string | null {
  if (valor.length === 0) return 'Escribí el valor.'
  if (valor.length > VALOR_MAXIMO) return `Puede tener hasta ${VALOR_MAXIMO} caracteres.`
  if (tipo.unidad !== null && !NUMERO.test(valor)) return 'Escribí un número, ej. 13 o 13,5.'
  return null
}

/** "Diámetro: 13 cm", o "13 (sin tipo)" si el tipo se borró o no está en la lista. */
export function textoMedidaAdmin(medida: MedidaFormulario, tipos: TipoMedida[]): string {
  const tipo = tipos.find((t) => t.id === medida.tipoMedidaId)
  if (!tipo) return `${medida.valor} (sin tipo)`
  return `${tipo.nombre}: ${medida.valor}${tipo.unidad ? ` ${tipo.unidad}` : ''}`
}

/** Agrega la medida o reemplaza en su lugar la de ese tipo: nunca se repite un tipo. */
export function ponerMedida(medidas: MedidaFormulario[], nueva: MedidaFormulario): MedidaFormulario[] {
  const i = medidas.findIndex((m) => m.tipoMedidaId !== null && m.tipoMedidaId === nueva.tipoMedidaId)
  if (i === -1) return [...medidas, nueva]
  return medidas.map((m, j) => (j === i ? nueva : m))
}

/** Primer tipo sin medida después de `actual` (dando la vuelta), o `actual` si todos tienen. */
export function siguienteTipoLibre(tipos: TipoMedida[], medidas: MedidaFormulario[], actual: string): string {
  const usados = new Set(medidas.map((m) => m.tipoMedidaId))
  const desde = tipos.findIndex((t) => t.id === actual)
  for (let paso = 1; paso <= tipos.length; paso++) {
    const tipo = tipos[(desde + paso) % tipos.length]
    if (tipo && !usados.has(tipo.id)) return tipo.id
  }
  return actual
}

/** Las medidas cuyo tipo ya no existe quedan sin tipo, como hace el backend al borrar un tipo. */
export function sinTiposBorrados(medidas: MedidaFormulario[], tipos: TipoMedida[]): MedidaFormulario[] {
  const ids = new Set(tipos.map((t) => t.id))
  return medidas.map((m) => (m.tipoMedidaId !== null && !ids.has(m.tipoMedidaId) ? { ...m, tipoMedidaId: null } : m))
}

// ---------- Formulario y cambios para el PATCH (F6-D3) ----------

/** Estado del formulario, tal como se escribe. `categoriaId` vacío es "Sin categoría". */
export interface Formulario {
  nombre: string
  precio: string
  categoriaId: string
  descripcion: string
  medidas: MedidaFormulario[]
}

export const FORMULARIO_VACIO: Formulario = { nombre: '', precio: '', categoriaId: '', descripcion: '', medidas: [] }

export function formularioDe(producto: Producto): Formulario {
  return {
    nombre: producto.nombre,
    precio: centavosAPesos(producto.precio.amount),
    categoriaId: producto.categoriaId ?? '',
    descripcion: producto.descripcion ?? '',
    medidas: producto.medidas.map(({ tipoMedidaId, valor }) => ({ tipoMedidaId, valor })),
  }
}

const mismasMedidas = (a: MedidaFormulario[], b: MedidaFormulario[]) =>
  a.length === b.length && a.every((m, i) => m.tipoMedidaId === b[i]?.tipoMedidaId && m.valor === b[i]?.valor)

/** Si el formulario difiere del cargado, para el aviso de `beforeunload`. */
export function hayCambios(actual: Formulario, inicial: Formulario): boolean {
  return (
    actual.nombre.trim() !== inicial.nombre.trim() ||
    actual.precio.trim() !== inicial.precio.trim() ||
    actual.categoriaId !== inicial.categoriaId ||
    actual.descripcion.trim() !== inicial.descripcion.trim() ||
    !mismasMedidas(actual.medidas, inicial.medidas)
  )
}

/** Errores de campo del cliente; vacío si el formulario cumple el esquema. */
export type ErroresFormulario = Partial<Record<'nombre' | 'precio' | 'descripcion', string>>

/** Valida y arma el cuerpo completo (el del `POST`), o devuelve los errores por campo. */
export function leerFormulario(formulario: Formulario): { cuerpo: CuerpoAlta } | { errores: ErroresFormulario } {
  const errores: ErroresFormulario = {}
  const nombre = formulario.nombre.trim()
  if (nombre.length === 0) errores.nombre = 'Escribí un nombre.'
  else if (nombre.length > NOMBRE_PRODUCTO_MAXIMO)
    errores.nombre = `Puede tener hasta ${NOMBRE_PRODUCTO_MAXIMO} caracteres.`
  const precio = pesosACentavos(formulario.precio)
  if ('error' in precio) errores.precio = precio.error
  const descripcion = formulario.descripcion.trim()
  if (descripcion.length > DESCRIPCION_MAXIMA)
    errores.descripcion = `Puede tener hasta ${DESCRIPCION_MAXIMA} caracteres.`
  if (Object.keys(errores).length > 0 || 'error' in precio) return { errores }
  return {
    cuerpo: {
      nombre,
      precio: { amount: precio.centavos, currency: 'ARS' },
      categoriaId: formulario.categoriaId || null,
      descripcion: descripcion || null,
      medidas: formulario.medidas.map(({ tipoMedidaId, valor }) => ({ tipoMedidaId, valor })),
    },
  }
}

/** Solo los campos del cuerpo que cambiaron respecto del producto cargado: la API "solo cambia lo enviado". */
export function cambiosPara(cuerpo: CuerpoAlta, producto: Producto): CuerpoCambios {
  const cambios: CuerpoCambios = {}
  if (cuerpo.nombre !== producto.nombre) cambios.nombre = cuerpo.nombre
  if (cuerpo.precio.amount !== producto.precio.amount) cambios.precio = cuerpo.precio
  if ((cuerpo.categoriaId ?? null) !== producto.categoriaId) cambios.categoriaId = cuerpo.categoriaId ?? null
  if ((cuerpo.descripcion ?? null) !== producto.descripcion) cambios.descripcion = cuerpo.descripcion ?? null
  const medidas = (cuerpo.medidas ?? []).map((m) => ({ tipoMedidaId: m.tipoMedidaId ?? null, valor: m.valor }))
  if (!mismasMedidas(medidas, producto.medidas)) cambios.medidas = medidas
  return cambios
}
