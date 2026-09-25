// API local con el catálogo actual (F3-D6, docs/frontend-por-fases/fases/fase-3.md), para probar /catalogo-nuevo sin el backend.
//   pnpm api:fixture            GET /api/productos con los productos de productos.ts
//   pnpm api:fixture --vacio    { productos: [] }
//   pnpm api:fixture --error    500 con la forma de error del contrato
// Sirve también los .webp de public/assets/ a los que apuntan las URLs de la galería. Puerto: PORT o 4400.
// Después: PUBLIC_API_URL=http://localhost:4400 pnpm dev y compará /catalogo-nuevo con /index.html (el sitio viejo;
// en dev, / da 404).
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { productos } from './productos.ts'

const puerto = Number(process.env.PORT ?? 4400)
const origen = `http://localhost:${puerto}`
const assets = new URL('../../public/assets/', import.meta.url)
const modo = process.argv.includes('--vacio') ? 'vacio' : process.argv.includes('--error') ? 'error' : 'catalogo'

const json = (res, status, cuerpo) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  })
  res.end(JSON.stringify(cuerpo))
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', origen)
  console.log(req.method, pathname)

  if (req.method === 'GET' && pathname === '/api/productos') {
    if (modo === 'error') {
      return json(res, 500, { error: { codigo: 'ERROR_INTERNO', mensaje: 'Fixture en modo --error.' } })
    }
    return json(res, 200, { productos: modo === 'vacio' ? [] : productos(origen) })
  }

  const webp = /^\/assets\/([\w-]+\.webp)$/.exec(pathname)
  if (req.method === 'GET' && webp) {
    try {
      const archivo = await readFile(new URL(webp[1], assets))
      res.writeHead(200, { 'Content-Type': 'image/webp' })
      return res.end(archivo)
    } catch {
      // Cae al 404.
    }
  }

  json(res, 404, { error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: `Sin fixture para ${pathname}.` } })
}).listen(puerto, () => console.log(`API de prueba (${modo}) en ${origen}/api/productos`))
