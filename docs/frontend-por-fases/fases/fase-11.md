# Fase 11 — Mejoras opcionales del front

## Definición

Reúne las "Mejoras opcionales (sin fase)" de [README.md](./README.md) que se resuelven sin cambiar el
backend. Las decisiones F11-Dk se toman en la preparación (6.1 de [prompts](../prompts.md)).

**Construir:**

- **Páginas de error propias:** 404 y 500 con la estética del catálogo (`src/catalogo/catalogo.css`),
  para el sitio público y el host del admin. Hoy responden las de Astro/Vercel. La 500 respeta F3-D3:
  si la API falla, Vercel sigue sirviendo la versión cacheada de `/`.
- **Formulario de producto:** tras "Nueva categoría" con un nombre repetido, el grupo queda abierto
  con "Ya existe una categoría con ese nombre." aun después de crear el producto; y el error de precio
  ("El precio tiene que ser mayor a 0.") sigue visible después de corregir el valor, hasta enviar.
  Los dos mensajes se limpian cuando dejan de aplicar.

**Cerrar cuando:** en producción, una ruta inexistente de la raíz y de `admin.*` responde `404` con la
página propia; la 500 propia se ve en local con `pnpm api:fixture --error`; y los dos mensajes del
formulario de producto desaparecen al dejar de aplicar.
