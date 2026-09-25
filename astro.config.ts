import react from '@astrojs/react'
import vercel from '@astrojs/vercel'
import { defineConfig, envField } from 'astro/config'

// Las páginas se prerenderizan salvo las que declaren `export const prerender = false`
// (el catálogo público con ISR, desde la fase 3). Ver D1, D2 y D5 del PRD del front.
export default defineConfig({
  site: 'https://elcauquenartesanias.com.ar',
  integrations: [react()],
  adapter: vercel(),
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
