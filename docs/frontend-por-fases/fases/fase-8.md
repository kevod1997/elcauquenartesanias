# Fase 8 — Orden

## Definición

**Construir:** reordenamiento global con `ordenVersion`; ante `409 ORDEN_DESACTUALIZADO`, recargar y avisar sin perder el trabajo del usuario.

**Cerrar cuando:** reordenar se refleja en `/catalogo-nuevo` (D4) y un conflicto simulado con dos pestañas se resuelve sin error.
