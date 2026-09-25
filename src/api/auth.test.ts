import { describe, expect, it } from 'vitest'
import { crearAuth } from './auth'
import { ErrorApi } from './cliente'

const authQueResponde = (respuesta: () => Response | Promise<Response>) =>
  crearAuth({ baseUrl: 'https://api.test', fetch: async () => respuesta() })

const errorDe = async (promesa: Promise<unknown>) => {
  const error = await promesa.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ErrorApi)
  return error as ErrorApi
}

describe('crearAuth', () => {
  it('manda el cuerpo con la cookie y resuelve en un 200', async () => {
    let pedido: Request | undefined
    const auth = crearAuth({
      baseUrl: 'https://api.test',
      fetch: async (url, init) => {
        pedido = new Request(url, init)
        return Response.json({ redirect: false, token: 't' })
      },
    })
    await expect(auth.iniciarSesion({ email: 'a@b.c', password: '12345678' })).resolves.toBeUndefined()
    expect(pedido?.url).toBe('https://api.test/api/auth/sign-in/email')
    expect(pedido?.credentials).toBe('include')
    expect(await pedido?.json()).toEqual({ email: 'a@b.c', password: '12345678' })
  })

  it.each([
    [401, 'INVALID_EMAIL_OR_PASSWORD'],
    [400, 'INVALID_EMAIL'],
    [403, 'INTEGRANTE_DESACTIVADO'],
    [400, 'INVALID_TOKEN'],
    [400, 'PASSWORD_TOO_SHORT'],
    [400, 'PASSWORD_TOO_LONG'],
  ])('traduce %i %s de Better Auth', async (status, code) => {
    const auth = authQueResponde(() => Response.json({ message: 'en inglés', code }, { status }))
    expect(await errorDe(auth.definirContrasena({ newPassword: 'x', token: 't' }))).toMatchObject({
      status,
      codigo: code,
      message: 'en inglés',
    })
  })

  it('traduce el 429 sin code a DEMASIADOS_INTENTOS', async () => {
    const auth = authQueResponde(() => Response.json({ message: 'Too many requests.' }, { status: 429 }))
    expect(await errorDe(auth.iniciarSesion({ email: 'a@b.c', password: 'x' }))).toMatchObject({
      status: 429,
      codigo: 'DEMASIADOS_INTENTOS',
    })
  })

  it.each([
    ['otro code', () => Response.json({ message: 'x', code: 'USER_NOT_FOUND' }, { status: 400 })],
    ['la forma del contrato', () => Response.json({ error: { codigo: 'X', mensaje: 'x' } }, { status: 400 })],
    ['un 502 HTML', () => new Response('<html>Bad Gateway</html>', { status: 502 })],
  ])('marca como RESPUESTA_INESPERADA %s', async (_, respuesta) => {
    const auth = authQueResponde(respuesta)
    expect((await errorDe(auth.pedirEnlace({ email: 'a@b.c' }))).codigo).toBe('RESPUESTA_INESPERADA')
  })

  it('traduce una falla de fetch a SIN_CONEXION con la causa', async () => {
    const causa = new TypeError('Failed to fetch')
    const auth = authQueResponde(() => Promise.reject(causa))
    expect(await errorDe(auth.cerrarSesion())).toMatchObject({ status: 0, codigo: 'SIN_CONEXION', cause: causa })
  })
})
