# El Cauquén — frontend

Sitio público y admin de El Cauquén Artesanías, en Astro, sobre la API de `../elcauquen-backend`.
Las decisiones de stack y topología (D1–D5) están en el [PRD](./docs/frontend-por-fases/PRD.md#4-decisiones-globales);
los comandos, en `package.json`.

## Operación

| Qué | Dónde |
| --- | --- |
| Catálogo público | `https://elcauquenartesanias.com.ar/`; `www` redirige a la raíz (308, configurado en el dominio de Vercel). |
| Admin | `https://admin.elcauquenartesanias.com.ar/admin`; los otros hosts redirigen `/admin/*` ahí (`vercel.json`, F4-D1). |
| API | `https://api.elcauquenartesanias.com.ar` (Railway, repo `elcauquen-backend`). |
| Imágenes | `https://img.elcauquenartesanias.com.ar` (bucket R2); el admin sube directo con URL firmada. |

- **Deploy:** cada push a `main` despliega el único proyecto de Vercel (D4). Los previews
  `*.vercel.app` muestran el catálogo, pero en el admin no se puede iniciar sesión (D2).
- **Publicar en el catálogo:** un editor crea el producto en el admin, sube su galería y lo publica.
  `/` es SSR con ISR (D5, F3-D2) y se regenera a los 60 s: un cambio aparece en el sitio en el
  primer pedido después de ese minuto. Si la API falla, Vercel sigue sirviendo la última versión
  (F3-D3).
- **Integrantes:** el `owner` da de alta y desactiva editores en `/admin/integrantes`; el editor
  recibe un correo para definir su contraseña (fase 9).
- **Contrato de la API:** cuando cambia `openapi.json` del backend, `pnpm lint` falla hasta correr
  `pnpm gen:api` (D3).
- **Variables de entorno:** solo `PUBLIC_API_URL`, documentada en `.env.example`; sin ella se usa la
  API de producción.
- **Probar sin backend:** `pnpm api:fixture` sirve un catálogo de prueba; los modos están al
  principio de `scripts/api-fixture/servidor.mjs`.

Para trabajar en el repo con agentes: [`AGENTS.md`](./AGENTS.md).
