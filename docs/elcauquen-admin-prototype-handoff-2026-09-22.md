# Handoff: prototipo de panel admin — El Cauquén

**Fecha:** 2026-09-22
**Próxima sesión:** abrir este repo (`elcauquen`, catálogo público estático) y construir
el prototipo de panel admin descripto abajo. Esta sesión fue solo de grilling
(alineación de alcance); no se escribió código todavía.

## Objetivo

Construir un prototipo rápido y descartable del panel admin en HTML/JS/CSS plano,
siguiendo las reglas de negocio de `docs/Logica Negocio El Cauquen.md`, para poder
clickear el flujo completo (alta de producto, fotos, categorías, orden, publicar)
y así **congelar el contrato de API** antes de modelar el backend. No es la versión
final del admin: es un medio para descubrir qué pide y qué devuelve cada pantalla.

La home pública (`index.html`, `main.js`, `styles.css`) queda **fuera de alcance**
de este trabajo — no se toca ni se reorganiza.

## Fuente de verdad de negocio

`docs/Logica Negocio El Cauquen.md` — leerlo primero. Resume: naturaleza del
catálogo (sin carrito/checkout), entidades (Producto, Categoría, Imágenes/Galería/
Diseños), orden de exhibición, flujo de publicación y carga de medios, roles/acceso.
No hay otras fuentes a consultar (en particular, **no** revisar el repo
`elcauquen-backend`: quedó fuera de alcance por pedido explícito del usuario).

## Decisiones ya cerradas (no volver a grillar esto)

1. **Alcance del prototipo:** panel admin completo, no el sitio público. Cubre
   TODO de una vez: Productos (Borrador/Publicado), galería con Imagen principal
   y Diseños, Categorías, orden global de exhibición, flujo "Publicar en 1 clic".
2. **Ubicación:** carpeta nueva `/admin` en la raíz del repo (`admin/index.html` o
   `admin/admin.html`, `admin/admin.js`, `admin/admin.css` — a definir el nombre
   exacto al implementar), separada del catálogo público. El admin no lee ni
   escribe sobre los datos reales de `main.js`/`index.html`; usa sus propios datos
   de prueba, completamente aislado.
3. **Stack:** igual que el resto del repo — HTML/CSS/JS plano, sin build step, sin
   framework, sin TypeScript. Mismo estilo que `main.js` hoy (IIFE, sin
   dependencias externas).
4. **Pantallas:** una sola vista — listado de productos (con su orden global) +
   modal de alta/edición de producto. Las categorías se gestionan inline dentro de
   ese mismo modal (ej. un desplegable + opción "nueva categoría"), sin sección o
   pestaña propia.
5. **Reordenamiento** (galería de fotos y orden global de productos): botones
   simples (mover arriba/abajo, marcar como principal), **no** drag&drop real. La
   lógica de negocio importa más que la interacción de arrastre para este
   prototipo.
6. **Carga de imágenes:** simulada. `<input type="file">` → preview local
   instantánea con `URL.createObjectURL` → se trata como si ya estuviera
   "procesada". Nada de autorización de subida, R2, ni espera de derivados WebP
   reales.
7. **Persistencia:** `localStorage`, para que los datos sobrevivan entre recargas
   mientras se prueba el flujo. No es una simulación de backend multi-usuario (no
   hace falta simular el conflicto 409 de orden concurrente).
8. **Autenticación:** ninguna. Se entra directo al panel.
9. **Entregable paralelo:** a medida que se arma cada pantalla, ir anotando el
   contrato de API implícito (endpoints, forma de request/response) en un archivo
   nuevo, por ejemplo `docs/contrato-api-borrador.md`. Ese archivo es el objetivo
   final del ejercicio — el código del prototipo es el medio para descubrirlo.
10. **Docs viejos:** `docs/elcauquen-catalog-backend-frontend-handoff-2026-09-17.md`
    y `docs/elcauquen-frontend-handoff-2026-09-17.md` fueron borrados a propósito
    (reemplazados por `docs/Logica Negocio El Cauquen.md`, que es el resumen
    vigente). Esos handoffs viejos describían una migración a Next.js con backend
    separado en Railway — esa arquitectura **no** es parte de este trabajo; no
    resucitarla sin que el usuario lo pida explícitamente.

## Reglas de negocio clave a respetar en el prototipo

(Resumen rápido — la fuente completa es `docs/Logica Negocio El Cauquen.md`.)

- Producto: nombre y precio obligatorios; descripción, medidas, categoría y
  galería (hasta 6 fotos) son complementarios. Precio como entero en centavos +
  moneda fija `"ARS"` (ej. `$5.000` → `amount: 500000, currency: "ARS"`).
- Estados: solo Borrador y Publicado. No hay archivado; borrado definitivo con
  confirmación.
- Para publicar: al menos una imagen procesada que no sea de tipo Diseño.
- Imagen principal = posición 0 de la galería, obligatoria, nunca puede ser un
  Diseño. Diseños cuentan dentro del cupo de 6 y pueden tener nombre opcional.
- Categorías: opcionales, planas, nombre único sin distinguir mayúsculas. Al
  eliminar una categoría, sus productos pasan a "Sin categoría" (no se borran).
  Categorías vacías nunca se muestran al público (esto es una regla del catálogo
  público, no del admin, pero conviene tenerla en mente para el modelo de datos).
- Orden de exhibición: global, incluye borradores en el panel, se guarda con un
  botón explícito ("Guardar orden") que envía la lista completa de IDs.
- Flujo "Publicar en 1 clic": crear como Borrador → (en la versión real: pedir
  autorización de subida, subir a R2, esperar procesamiento) → si todo sale bien,
  pasa a Publicado. Si algo falla a mitad de camino, el producto queda a salvo
  como Borrador con opción de reintentar — nada se publica a medias. En el
  prototipo, los pasos de subida/procesamiento están simulados (ver punto 6 de
  decisiones), pero el comportamiento observable (Borrador si falta algo,
  Publicado solo si se cumple la condición de imagen principal) debe respetarse.

## Qué hacer al arrancar la próxima sesión

1. Leer este handoff completo y `docs/Logica Negocio El Cauquen.md`.
2. Crear la carpeta `/admin` con el HTML/CSS/JS del prototipo, siguiendo las
   decisiones de arriba.
3. Ir creando/actualizando `docs/contrato-api-borrador.md` en paralelo, con los
   endpoints y shapes que van apareciendo a medida que se define cada pantalla.
4. No es necesario volver a preguntar nada de lo ya decidido en este documento;
   si surge una ambigüedad nueva no cubierta acá, sí preguntar antes de asumir.
