# Tech Stack — El Cauquén

## Frontend (`elcauquen`)
* **Framework:** Astro (TypeScript); React solo en las islas del admin
* **Estilos:** CSS nativo / Tailwind CSS
* **Cliente API:** `openapi-fetch` con tipos de `openapi-typescript` generados desde `openapi.json`
* **Despliegue:** Vercel (catálogo público con ISR)

Motivos: decisiones D1–D5 (§4) en `docs/frontend-por-fases/PRD.md`.

## Backend (`elcauquen-backend`)
* **Framework:** Hono (TypeScript)
* **Runtime:** Node.js / Bun
* **Base de Datos:** PostgreSQL
* **ORM:** Drizzle ORM
* **Validación:** Zod
* **Autenticación:** Better Auth
* **Despliegue:** Railway

## Almacenamiento & Multimedia
* **Storage:** Cloudflare R2
* **Procesamiento de imágenes:** Sharp
* **Derivados WebP:**
  * `160px` (miniaturas / Diseños)
  * `640px` (grilla)
  * `1600px` (visor modal)