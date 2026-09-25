# Fase 10 — Limpieza y cierre

## Definición

**Construir:** pasar el catálogo de `/catalogo-nuevo` a `/`, sin `noindex`, y borrar el sitio viejo de `public/` (D4): `index.html`, `main.js` y `styles.css`. `public/assets/` queda, porque lo usan las fuentes y el logo de `src/catalogo/` y las imágenes de `pnpm api:fixture`; quitar el prototipo sin uso; revisar `vercel.json` y `.vercelignore`; documentar la operación. Corregir también los textos que el catálogo copió del sitio viejo, que al salir del `noindex` pasan a indexarse: "Piezas unicas" en el hero y en la `description`, y "hechas a mano en Hechas a mano" (y el espacio doble) en la `description`. Cambiar "Ø" por "Diámetro" en los tipos de medida del fixture (`scripts/api-fixture/productos.ts`, incluidos "Ø interior" y "Ø exterior") y en el ejemplo del comentario de `src/catalogo/presentacion.ts`, para que coincidan con el tipo "Diámetro" del admin.

**Hacer (usuario):** confirmar que el catálogo en producción ya está cargado antes del push del cambio de `/`.

**Cerrar cuando:** no quedan restos del prototipo, del sitio viejo ni documentación duplicada, y la raíz y `www` sirven el catálogo nuevo con datos de la API.

## Implementado

- `src/pages/catalogo-nuevo.astro` pasó con `git mv` a `src/pages/index.astro`, sin `noindex`.
  Textos corregidos: el hero dice "Piezas únicas en madera · Hechas a mano" y la `description`,
  "Piezas únicas en madera hechas a mano: cazuelas, bowls, ensaladeras, mates de caldén, morteros y
  más.".
- Borrados del sitio viejo: `public/index.html`, `main.js` y `styles.css`, y los originales
  `assets/*.jpeg` y `assets/logo.jpg`. Borrados del prototipo: `admin/` (`index.html`, `admin.js`,
  `admin.css`) y su handoff. Borrados de documentación: `docs/elcauquen-stack.md` (repetía el PRD y
  decía Tailwind, que el proyecto no usa) y `docs/research/frontend-primitives.md` (investigación
  sobre el sitio vanilla; lo que se adoptó está en `src/catalogo/`). Todo sigue en el historial
  (`git show c0bc407:<ruta>`).
- `.vercelignore`: sin `/assets/` ni `/admin/`, que ya no existen.
- Fixture: "Ø", "Ø interior" y "Ø exterior" pasan a "Diámetro", "Diámetro interior" y "Diámetro
  exterior"; también el ejemplo de `textoMedida` en `presentacion.ts`. Los comentarios que citaban
  `public/main.js`, `admin/admin.js` o `/catalogo-nuevo` hablan ahora del sitio viejo o del
  prototipo retirado.
- `README.md` nuevo con la operación: dominios, deploy, publicación con ISR, integrantes, contrato y
  variables. Remite al PRD y a `package.json` en lugar de repetirlos.
- PRD: §1 (el prototipo, en el historial), D1, D4 (fase 10 hecha, `.jpeg` borrados). `AGENTS.md`:
  un solo `astro dev` por proyecto.

## Decisiones técnicas

| Decisión | Motivo |
| --- | --- |
| Borrar los `.jpeg`/`.jpg` originales de `assets/` | El sitio viejo los usaba como fuente de sus `.webp`; nada del código los lee y los productos reales viven en R2. `public/assets/` queda (fuentes, logo y las imágenes del fixture). |
| Borrar `docs/elcauquen-stack.md` y `docs/research/frontend-primitives.md`, y cubrir la operación en `README.md` | El stack ya está en D1–D5 del PRD; la investigación describía archivos que se borran. Un solo lugar por tema. |
| `vercel.json` sin cambios, y sin redirect de `/catalogo-nuevo` a `/` | Ninguna regla menciona el sitio viejo; el redirect del host del admin ya excluye `assets/` y `_astro/`. `/catalogo-nuevo` tenía `noindex` y no se difundió: un `404` alcanza. |
| El comentario del fixture habla de "catálogo del sitio viejo" | El archivo `public/main.js` ya no existe; el catálogo sigue siendo el de F3-D6. |

## Validaciones ejecutadas

- `pnpm lint` (Biome, `.vercelignore` con 113 archivos del build incluidos, tipos al día),
  `pnpm typecheck` (0 errores) y `pnpm test` (84 tests) pasan.
- `pnpm build`: `.vercel/output/static` tiene solo `_astro/`, `admin/` y `assets/`, sin `index.html`;
  `config.json` manda `^(/)$` a `/_isr` y ninguna ruta a `/catalogo-nuevo`.
- `astro dev` contra el backend local (`localhost:3001`, con un producto publicado e imágenes de
  R2): `/` responde con el producto, sin `noindex`, con los dos textos corregidos; `/catalogo-nuevo`
  da `404`.
- `pnpm api:fixture`: `GET /api/productos` devuelve `"tipo":"Diámetro"`.
- `grep` sin resultados de `Ø` en `src/` y `scripts/`, y sin referencias a los archivos borrados
  fuera de los registros de fases anteriores.
- Producción antes del push: `www` responde `308` a la raíz; `/` sirve el sitio viejo y
  `GET https://api.elcauquenartesanias.com.ar/api/productos` devuelve `{"productos":[]}`.

## Desvíos

- La definición no nombraba los `.jpeg` de `assets/` ni los dos documentos borrados; se borraron por
  "no quedan restos del sitio viejo ni documentación duplicada" (ver Decisiones).

## Verificaciones del usuario

1. Cargar y publicar el catálogo en `https://admin.elcauquenartesanias.com.ar/admin/productos` y
   confirmar que `https://api.elcauquenartesanias.com.ar/api/productos` ya no devuelve
   `{"productos":[]}` (Hacer del usuario). Si necesitás las fotos originales, recuperalas con
   `git checkout c0bc407 -- assets/` y no las commitees.
2. Hacer push a `main` y esperar el deploy de Vercel.
3. Abrir `https://elcauquenartesanias.com.ar/`: se ve el catálogo con los productos publicados, el hero
   dice "Piezas únicas en madera · Hechas a mano" y el código fuente no tiene `noindex`.
4. Abrir `https://www.elcauquenartesanias.com.ar/`: termina en la raíz con el mismo catálogo.
5. `https://elcauquenartesanias.com.ar/catalogo-nuevo` da `404`, y
   `https://admin.elcauquenartesanias.com.ar/` sigue llevando a `/admin`.
