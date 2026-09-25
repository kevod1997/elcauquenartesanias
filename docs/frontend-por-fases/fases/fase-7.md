# Fase 7 — Galería e imágenes

## Definición

**Construir:** flujo `upload-url` → `PUT` a R2 → `confirmar` → consulta de etapa → `publicar`; cupo de seis, diseños, reordenamiento de la galería, reintento de fallidas y volver a borrador. Considerar `/prototype` para la UI de etapas.

**Cerrar cuando:** una imagen real se sube desde el browser, se procesa, se publica y se ve en `/catalogo-nuevo` (D4); el `PUT` a R2 pasa el CORS con el origen del admin.
