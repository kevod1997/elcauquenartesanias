import { describe, expect, it } from 'vitest'
import { crearCliente, ErrorApi, pedir } from './cliente'

const clienteQueResponde = (respuesta: () => Response | Promise<Response>) =>
  crearCliente({ baseUrl: 'https://api.test', credentials: 'include', fetch: async () => respuesta() })

const errorDe = async (promesa: Promise<unknown>) => {
  const error = await promesa.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ErrorApi)
  return error as ErrorApi
}

describe('pedir', () => {
  it('devuelve data en un 2xx', async () => {
    const api = clienteQueResponde(() => Response.json({ categorias: [{ id: 'c1', nombre: 'Velas' }] }))
    await expect(pedir(api.GET('/api/categorias'))).resolves.toEqual({ categorias: [{ id: 'c1', nombre: 'Velas' }] })
  })

  it.each([
    [401, 'NO_AUTENTICADO', 'Iniciá sesión para continuar.'],
    [403, 'SIN_PERMISO', 'No tenés permiso.'],
    [409, 'ORDEN_DESACTUALIZADO', 'Otro integrante cambió el orden.'],
    [422, 'SIN_IMAGEN_PRINCIPAL', 'Falta la imagen principal.'],
    [503, 'ALMACENAMIENTO_NO_CONFIGURADO', 'Almacenamiento sin configurar.'],
  ])('traduce la forma de error del contrato (%i %s)', async (status, codigo, mensaje) => {
    const api = clienteQueResponde(() => Response.json({ error: { codigo, mensaje } }, { status }))
    const error = await errorDe(pedir(api.GET('/admin/sesion')))
    expect(error).toMatchObject({ status, codigo, message: mensaje })
  })

  it('marca como RESPUESTA_INESPERADA un error que no es JSON', async () => {
    const api = clienteQueResponde(() => new Response('<html>Bad Gateway</html>', { status: 502 }))
    expect(await errorDe(pedir(api.GET('/api/categorias')))).toMatchObject({
      status: 502,
      codigo: 'RESPUESTA_INESPERADA',
    })
  })

  it('marca como RESPUESTA_INESPERADA un JSON con otra forma (la de Better Auth)', async () => {
    const api = clienteQueResponde(() =>
      Response.json({ message: 'Invalid token', code: 'INVALID_TOKEN' }, { status: 400 }),
    )
    expect(await errorDe(pedir(api.GET('/api/categorias')))).toMatchObject({
      status: 400,
      codigo: 'RESPUESTA_INESPERADA',
    })
  })

  it('marca como RESPUESTA_INESPERADA un error sin cuerpo', async () => {
    const api = clienteQueResponde(() => new Response(null, { status: 500 }))
    expect(await errorDe(pedir(api.GET('/api/categorias')))).toMatchObject({
      status: 500,
      codigo: 'RESPUESTA_INESPERADA',
    })
  })

  it('traduce una falla de fetch a SIN_CONEXION con la causa', async () => {
    const causa = new TypeError('Failed to fetch')
    const api = clienteQueResponde(() => Promise.reject(causa))
    const error = await errorDe(pedir(api.GET('/api/categorias')))
    expect(error).toMatchObject({ status: 0, codigo: 'SIN_CONEXION', cause: causa })
  })

  it('manda las credenciales configuradas', async () => {
    let credenciales: RequestCredentials | undefined
    const api = crearCliente({
      baseUrl: 'https://api.test',
      credentials: 'include',
      fetch: async (request) => {
        credenciales = (request as Request).credentials
        return Response.json({ categorias: [] })
      },
    })
    await pedir(api.GET('/api/categorias'))
    expect(credenciales).toBe('include')
  })
})
