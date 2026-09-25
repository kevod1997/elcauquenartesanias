# Fase 10 — Limpieza y cierre

## Definición

**Construir:** pasar el catálogo de `/catalogo-nuevo` a `/`, sin `noindex`, y borrar el sitio viejo de `public/` (D4): `index.html`, `main.js` y `styles.css`. `public/assets/` queda, porque lo usan las fuentes y el logo de `src/catalogo/` y las imágenes de `pnpm api:fixture`; quitar el prototipo sin uso; revisar `vercel.json` y `.vercelignore`; documentar la operación.

**Hacer (usuario):** confirmar que el catálogo en producción ya está cargado antes del push del cambio de `/`.

**Cerrar cuando:** no quedan restos del prototipo, del sitio viejo ni documentación duplicada, y la raíz y `www` sirven el catálogo nuevo con datos de la API.
