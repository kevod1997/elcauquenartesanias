import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import { defineConfig, envField } from 'astro/config'

// Las páginas se prerenderizan salvo las que declaren `export const prerender = false`
// (el catálogo público), que el adapter sirve con ISR. Ver D1, D2, D5 (PRD) y F3-D2 (fases/fase-3.md).
export default defineConfig({
  site: 'https://elcauquenartesanias.com.ar',
  integrations: [react()],
  adapter: vercel({ isr: { expiration: 60 } }),
  // Productos es el inicio del admin (F11-D5). 302 como los de vercel.json: un 301 queda en la caché del navegador.
  redirects: { '/admin': { status: 302, destination: '/admin/productos' } },
  env: {
    schema: {
      PUBLIC_API_URL: envField.string({
        context: 'client',
        access: 'public',
        url: true,
        default: 'https://api.elcauquenartesanias.com.ar',
      }),
    },
  },
})
