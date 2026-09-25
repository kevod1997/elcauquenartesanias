// Regenera los tipos de la API desde el openapi.json del backend (D3 del PRD).
//   pnpm gen:api          copia ../elcauquen-backend/docs/openapi.json a src/api/ y regenera src/api/schema.d.ts
//   pnpm gen:api --check  falla si schema.d.ts no coincide con la copia versionada, o si la copia no coincide
//                         con el backend (este último chequeo se omite si el repo del backend no está al lado)
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import openapiTS, { astToString } from 'openapi-typescript'

const origen = new URL('../../elcauquen-backend/docs/openapi.json', import.meta.url)
const copia = new URL('../src/api/openapi.json', import.meta.url)
const tipos = new URL('../src/api/schema.d.ts', import.meta.url)
const encabezado = '// Generado por `pnpm gen:api` desde src/api/openapi.json. No editar a mano.\n\n'

const generar = async (json) => encabezado + astToString(await openapiTS(json))
const normalizar = (texto) => texto.replace(/\r\n/g, '\n')

if (process.argv.includes('--check')) {
  const errores = []
  const versionada = normalizar(readFileSync(copia, 'utf8'))
  if (existsSync(origen) && normalizar(readFileSync(origen, 'utf8')) !== versionada) {
    errores.push('src/api/openapi.json difiere del backend.')
  }
  if ((await generar(versionada)) !== normalizar(readFileSync(tipos, 'utf8'))) {
    errores.push('src/api/schema.d.ts no coincide con src/api/openapi.json.')
  }
  if (errores.length) {
    console.error(`${errores.join('\n')}\nCorré \`pnpm gen:api\`.`)
    process.exit(1)
  }
  console.log('Tipos de la API al día.')
} else {
  const json = normalizar(readFileSync(origen, 'utf8'))
  writeFileSync(copia, json)
  writeFileSync(tipos, await generar(json))
  console.log('src/api/openapi.json y src/api/schema.d.ts regenerados.')
}
