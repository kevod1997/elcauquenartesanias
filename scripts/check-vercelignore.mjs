// Falla si .vercelignore excluye archivos que el build necesita (public/, src/ y la configuración).
// `astro build` y `astro preview` no leen .vercelignore: sin este chequeo, el error aparece recién en
// el deploy de Vercel, que interpreta .vercelignore con la sintaxis de .gitignore.
import { execFileSync } from 'node:child_process'

const necesarios = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'public', 'src'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .concat(['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'astro.config.ts', 'tsconfig.json', 'vercel.json'])

let excluidos = ''
try {
  excluidos = execFileSync('git', ['-c', 'core.excludesFile=.vercelignore', 'check-ignore', '--no-index', '--stdin'], {
    input: necesarios.join('\n'),
    encoding: 'utf8',
  })
} catch (error) {
  // check-ignore sale con 1 cuando ningún archivo queda excluido.
  if (error.status !== 1) throw error
}

if (excluidos.trim()) {
  console.error(`.vercelignore excluye archivos que el deploy necesita:\n${excluidos}`)
  process.exit(1)
}
console.log(`.vercelignore: ${necesarios.length} archivos del build incluidos.`)
