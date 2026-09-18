# Handoff: frontend Next.js del catálogo El Cauquén

**Fecha:** 2026-09-17
**Próxima sesión:** abrir el repo frontend
`C:\Users\Kevin\OneDrive\Escritorio\Cosas\Dev\elcauquen` y planear la migración del
sitio estático a Next.js (catálogo público + admin en la misma app). No hay
implementación autorizada por este documento.

El grilling de backend terminó. Este handoff trae lo que el frontend necesita de
esas decisiones. El Apéndice A es el handoff anterior: sirve de contexto de producto
y arquitectura, y la sección "Qué cambió respecto del Apéndice A" manda sobre él.

## Fuentes de verdad (leer, no copiar)

En el repo backend `C:\Users\Kevin\OneDrive\Escritorio\Cosas\Dev\elcauquen-backend`:

- `CONTEXT.md`: glosario del catálogo (Producto, Borrador, Publicado, Precio, Orden
  de exhibición, Categoría, Sin categoría, Imagen de producto, Imagen principal,
  Diseño, Visitante). Nombrar componentes, rutas y textos con estos términos.
- `docs/adr/0012-los-derivatives-del-catalogo-viven-en-un-bucket-publico.md`: por qué
  las imágenes se sirven desde un bucket público de R2.
- `docs/research/frontend-catalogo-y-admin-separado-2026-09-16.md`: por qué Next.
- `.scratch/catalogo/spec.md`: spec del backend. Su sección "Contrato HTTP" manda
  sobre el borrador de contrato de abajo, y sus reglas del dominio sobre cualquier
  resumen de este archivo.

## Qué cambió respecto del Apéndice A

- **Los Diseños tienen imagen.** El handoff anterior decía que las variantes no
  tienen imágenes; `main.js` muestra lo contrario (los 4 flejes del Mate). Un
  **Diseño** es una imagen de producto con nombre opcional, sin precio ni stock,
  que cuenta dentro del máximo de 6. Nunca es la Imagen principal.
- **Imagen principal elegible:** es la imagen en primera posición. El admin la elige
  ("Marcar como principal" o arrastrando), lo que reordena la galería. Un Diseño
  no puede estar primero.
- **Sin importación por script:** los 11 productos se cargan a mano desde el admin
  nuevo, usando los JPEG originales de `assets/`. Esa carga es la prueba de
  aceptación antes del corte.
- **Revalidación decidida:** siguiendo la doc de Next, el catálogo se cachea con
  `cacheTag('catalog')` + `cacheLife('max')`. El backend, mediante un job con
  reintentos, llama a un route handler de Next (`POST /api/revalidate`,
  `Authorization: Bearer <REVALIDATE_SECRET>`) que ejecuta
  `revalidateTag('catalog', 'max')`. Una sola etiqueta: hay una sola página.
- **Sin wizard de despliegue:** DNS, Vercel, Railway, R2 y secretos se configuran a
  mano con instrucciones que dará el agente. El DNS de
  `elcauquenartesanias.com.ar` hoy está en Vercel y se mueve a Cloudflare, porque el
  dominio de medios `media.elcauquenartesanias.com.ar` lo exige.
- **Primer owner:** ya existe `owner:create` en el backend; solo es un paso manual.

## Decisiones que el frontend debe respetar

### Catálogo público

- Se mantienen la página única, el modal/visor y el CTA de WhatsApp por producto.
- Next lee `GET /v1/catalog` **server-to-server** (sin CORS). El navegador del
  visitante nunca llama a la API.
- Precio: `{ amount, currency }` con `amount` entero en unidades menores (centavos)
  y `currency` `"ARS"`. Se formatea en el front con `Intl.NumberFormat('es-AR', …)`;
  el `"$5.000"` actual es solo presentación.
- Cada imagen trae URLs de 3 derivatives WebP: `160` (miniaturas/diseños), `640`
  (grilla) y `1600` (visor). Son las mismas tres escalas que usa `main.js` hoy.
  Viven en `media.elcauquenartesanias.com.ar`; no pasar por `next/image` con
  optimización de Vercel, porque ya vienen optimizadas.
- `alt` opcional por imagen; si falta, usar el nombre del producto (o el del Diseño).
- Categorías: el endpoint devuelve `category: { id, name } | null` por producto y
  `categories` con solo las que tienen productos publicados. El primer lanzamiento
  no muestra UI de categorías; si no hay categorías, el catálogo es igual al actual.

### Borrador de contrato (provisional hasta la spec)

```text
GET  /v1/catalog                          público; productos publicados en orden + categories
GET  /v1/admin/products                   todos, sin paginación, en orden; filtros en el front
POST /v1/admin/products                   crea (nombre y precio obligatorios; nace Borrador)
PATCH/DELETE /v1/admin/products/{id}      editar; borrado definitivo (con confirmación en UI)
POST /v1/admin/products/{id}/images/uploads   firma subida directa a R2 contra ese producto
POST /v1/admin/media/{id}/confirm         confirma la subida; el worker procesa
PUT  /v1/admin/products/{id}/images/order lista completa; define la Imagen principal
PUT  /v1/admin/catalog/order              lista completa de ids; 409 si el conjunto cambió
POST /v1/admin/products/{id}/publish | /unpublish
CRUD /v1/admin/categories                 nombre único sin distinguir mayúsculas; 409 si duplica
```

Los nombres exactos de rutas los fija la spec; los comportamientos de arriba ya están
decididos.

### Admin (`admin.elcauquenartesanias.com.ar`)

- Login contra `api.elcauquenartesanias.com.ar` con `credentials: 'include'`. La
  cookie es host-only de `api`, y todo el admin exige sesión salvo el login.
- **Flujo "Publicar" en un clic, orquestado por el front:** al pulsar Publicar, el
  front crea el producto (queda como Borrador), pide firma por cada foto, hace `PUT`
  directo a R2, confirma, espera a que el procesamiento termine (polling del asset)
  y recién ahí publica. Muestra progreso ("Subiendo fotos… 2 de 3", "Preparando
  imágenes…"). Si se corta o falla, el producto queda en Borrador con el aviso "No
  se terminó de publicar" y la acción Reintentar. Nada se publica solo.
- Botones: **Publicar** y **Guardar sin publicar**. En el listado: **Quitar del
  catálogo** (vuelve a Borrador) y **Borrar** (definitivo, con confirmación).
- **Fotos para alguien no técnico:** antes de pedir la firma, el navegador acepta
  cualquier foto, la reduce a un máximo de 2560 px de lado mayor y la re-codifica a
  JPEG de alta calidad. Esto resuelve también el HEIC de iPhone, porque Safari lo
  decodifica. Si el navegador no puede leer el archivo, el mensaje es "Esta foto no
  se pudo usar, probá con otra". El backend acepta solo JPEG/PNG/WebP hasta 10 MB y
  el worker corrige la rotación y quita metadatos (incluido el GPS).
- Editar un producto publicado se aplica al instante. Una foto nueva no aparece en
  el catálogo hasta estar procesada.
- Foto con procesamiento fallido definitivo: aviso en el admin con **Quitar** o
  **Reintentar**; Reintentar es solo para owner.
- Un producto publicado siempre conserva una Imagen principal procesada: borrar la
  última imagen que no es Diseño responde `409`, y primero hay que pasarlo a Borrador.
- Categoría: se asigna con un selector (siempre presente, por accesibilidad y móvil)
  o arrastrando el producto sobre una categoría o sobre "Sin categoría". Asignar no
  cambia el orden de exhibición.
- Orden de exhibición: global e incluye borradores. Se ordena arrastrando y se
  confirma con **Guardar orden** o **Descartar cambios**. Si responde `409`, se
  recarga la lista.
- Owner y Editor operan todo el catálogo; la gestión de usuarios no tiene UI.

## Preguntas abiertas para la sesión de frontend

1. Ruteo por hostname en un solo proyecto Vercel (`middleware`/`proxy` según la
   versión de Next): confirmarlo con la doc versionada.
2. Cómo se ve y se opera la galería con Diseños (bloque "Diseños" separado del resto,
   elección de Imagen principal, límite de 6), y el drag and drop de orden y de
   categoría. Si no se decide en papel, prototipar.
3. Estructura de la migración en el mismo repo: convivencia del sitio estático
   actual con el Next nuevo hasta el corte, y previews de Vercel.
4. Cliente del contrato: generarlo del OpenAPI del backend (`print-openapi`) o
   escribirlo a mano.

## Camino sugerido (según `/ask-matt`)

1. **Backend primero, en esta misma sesión si sigue abierta:** `/to-spec` y luego
   `/to-tickets` en `.scratch/catalogo/`, sin compactar entre grilling, spec y
   tickets. El contrato definitivo sale de ahí.
2. **Frontend, sesión nueva en `elcauquen`** con este archivo como contexto:
   `/grill-with-docs` (el repo es un directorio de trabajo, así que conviene la
   versión que deja `CONTEXT.md`/ADRs), resolviendo las preguntas abiertas de arriba.
3. Si la galería o el drag and drop no se resuelven hablando: `/handoff` hacia un
   directorio de prototipo → `/prototype` → `/handoff` de vuelta a la sesión de
   frontend.
4. `/to-spec` → `/to-tickets` del frontend, con bloqueos explícitos sobre los tickets
   de backend que exponen cada endpoint.
5. `/implement` por ticket, con `/clear` entre tickets.
6. Despliegue y corte: instrucciones manuales del agente (DNS a Cloudflare, dominio
   raíz y `admin` en Vercel, `api` en Railway, buckets R2 privado y público, secretos
   `REVALIDATE_SECRET`, `TRUSTED_ORIGINS`, `API_ORIGIN`). Nunca escribir valores de
   secretos en archivos.

## Suggested skills

- `/grill-with-docs`: primer paso en el repo frontend.
- `/prototype`: solo para la galería, los Diseños o el drag and drop.
- `/handoff`: para ir y volver del prototipo o llevar hallazgos al backend.
- `/to-spec` y `/to-tickets`: después del grilling de frontend.
- `/implement` (con `/tdd`): por ticket.
- `/ask-matt`: si hay dudas sobre qué flujo sigue.

---

## Apéndice A: handoff original del 2026-09-17

Contexto de producto y arquitectura previo al grilling de backend. Donde contradiga
lo de arriba, manda lo de arriba.

## Handoff: catálogo El Cauquén — backend + frontend

**Fecha:** 2026-09-17  
**Propósito de la próxima sesión:** iniciar un `grill-with-docs` fresco en el
backend para convertir estas decisiones en documentación de dominio, un contrato
API y luego una spec. También debe poder abrirse una sesión fresca en el
frontend para planear la migración a Next.js. No hay implementación autorizada
por este handoff: primero documentar, diseñar y especificar.

### Repositorios y fuentes

- Backend (repositorio de decisiones de dominio):
  `C:\\Users\\Kevin\\OneDrive\\Escritorio\\Cosas\\Dev\\elcauquen-backend`
- Frontend actual (solo evidencia; hoy está separado):
  `C:\\Users\\Kevin\\OneDrive\\Escritorio\\Cosas\\Dev\\elcauquen`
- Investigación ya realizada sobre Astro / Next / Vite:
  `docs/research/frontend-catalogo-y-admin-separado-2026-09-16.md`

Leer primero las instrucciones del repo backend, especialmente los punteros en
`AGENTS.md`, antes de modificar documentación. No duplicar la investigación
existente: referenciar la nota anterior cuando haga falta.

### Objetivo de producto acordado

El producto es un **catálogo de artesanías**, no un e-commerce:

- No hay carrito, checkout, pagos, pedidos ni stock transaccional.
- El visitante ve productos y contacta al dueño por WhatsApp.
- El dueño administra el catálogo, productos, fotos, categorías y orden.
- El backend es la única fuente de verdad de reglas, permisos, datos y medios.

### Estado factual del frontend actual

La inspección fue de solo lectura. El frontend no es aún una aplicación de
framework:

- Sitio estático de raíz: `index.html`, `styles.css` y `main.js`; no existen
  `package.json`, scripts de build, rutas de framework, API, login ni admin.
- Es una sola página. Los productos se muestran en una grilla y el detalle se
  abre en un modal `<dialog>`, no en una URL propia.
- `main.js` contiene directamente teléfono de WhatsApp, Instagram, orden móvil
  y los datos de 11 productos. Los campos observados son `nombre`, `precio`
  (texto), `placa`, `desc`, `medidas`, fotos y, en algunos casos, `variantes`
  descriptivas.
- Las imágenes locales tienen variantes WebP; hay fuentes JPEG/JPG y `.vercelignore`
  evita desplegar las fuentes. Hoy no hay cargas ni gestión de imágenes.
- Los CTAs construyen una URL `wa.me` preguntando por la disponibilidad según
  el nombre del producto.
- El repo ya tiene `vercel.json`, pero solo para un sitio estático y cabeceras
  de caché. No hay configuración de dominio o subdominio en código.

Consecuencia: no se debe intentar conservar una arquitectura de aplicación que
no existe. La migración debe preservar el diseño/experiencia pública actual y
reemplazar los datos hardcodeados por el contrato API.

### Arquitectura acordada

Una sola aplicación frontend, no una app administrativa separada:

```text
elcauquenartesanias.com.ar        -> catálogo público, Next.js, Vercel
admin.elcauquenartesanias.com.ar  -> admin, misma aplicación y proyecto Vercel
api.elcauquenartesanias.com.ar    -> API backend, Railway
Cloudflare R2                     -> originales privados y derivados de imagen
```

- El dominio canónico público es `elcauquenartesanias.com.ar`; no se usará
  `www` como canónico.
- Vercel alojará un único proyecto/deployment Next.js con el dominio público y
  el subdominio `admin`. El ruteo por hostname separará ambas experiencias.
- El backend se mantiene separado en Railway, bajo `api`; Next no debe duplicar
  reglas de negocio, autorización, uploads ni una API paralela.
- El frontend nuevo será **Next.js con TypeScript**. Next se eligió por la
  voluntad de una sola app React con sitio público y panel. Astro + SPA y Vite
  se descartaron para este alcance; ver la investigación referida arriba.

### Hechos relevantes del backend

Confirmar contra el código/ADRs en la próxima sesión; este resumen evita otra
exploración a ciegas:

- Better Auth ya expone login email/contraseña, logout y sesión administrativa.
  No hay signup público. Existen roles `owner` y `editor`, aunque el primer
  lanzamiento tendrá una única cuenta `owner`.
- La sesión actual usa cookie `HttpOnly`, `Secure`, `SameSite=Lax` y host-only.
  El admin debe iniciar sesión contra `api.elcauquenartesanias.com.ar` con
  `credentials: 'include'`; no ampliar la cookie a todos los subdominios.
- Producción deberá establecer `API_ORIGIN=https://api.elcauquenartesanias.com.ar`
  y permitir exactamente `https://admin.elcauquenartesanias.com.ar` en
  `TRUSTED_ORIGINS`. Añadir el origen público solo si el navegador público llama
  a la API directamente. Las lecturas server-to-server de Next no son CORS.
- El módulo de media existente ya permite firma de subida directa, PUT temporal
  a R2, confirmación, procesamiento por worker y derivados; el original no se
  expone. Está pendiente conectar ese módulo al dominio Product/Category.
- El almacenamiento R2 se acordó para las imágenes. El frontend no debe enviar
  imágenes grandes a Vercel/Railway como proxy.
- El catálogo requerirá invalidación selectiva desde el backend hacia Next, con
  un webhook autenticado, cuando cambie un producto, categoría o imagen pública.

Consultar, entre otros, `docs/adr/0005*`, `docs/adr/0010*`, `docs/adr/0011*`,
`docs/deployment.md`, `docs/operations.md`, `src/auth/`, `src/media/` y los
tests correspondientes. Los nombres/ubicaciones exactos mandan sobre este
resumen.

### Decisiones de dominio y UX confirmadas

#### Catálogo público, primer lanzamiento

- Conservar la página única y el modal de detalle actuales; **no** crear páginas
  individuales ni URLs públicas de producto todavía.
- Conservar el CTA de WhatsApp por producto.
- El precio es único, obligatorio y público.
- Variantes son descriptivas; no tienen precio, imágenes ni stock propios.
- Cuando no haya categorías asignadas, el catálogo se comporta exactamente como
  ahora.
- En el futuro, si existen categorías con productos publicados, el frontend
  puede mostrarlas y agrupar/filtrar. Las categorías vacías no deben aparecer al
  público. La API debe hacer posible esa evolución, sin obligar a diseñar esa UI
  ahora.

#### Producto y categorías

- Producto inicial: nombre, precio con moneda bien modelada (el frontend actual
  contiene precio textual; no copiar esa representación como fuente de verdad),
  descripción, medidas, variantes descriptivas, hasta seis imágenes, orden
  global de exhibición, categoría opcional y estado.
- Estados de producto: solamente `draft` y `published`.
- Catálogo público: solo productos `published`.
- No habrá `archived`: el admin puede eliminar productos permanentemente.
- Las categorías son opcionales y simples: nombre único, crear, editar y borrar.
  No requieren imagen, descripción ni orden propio inicialmente.
- Al borrar una categoría, sus productos quedan sin categoría.

#### Medios y borrado

- Cada imagen pertenece exclusivamente a un producto (no medios compartidos).
- Publicar exige al menos una imagen procesada.
- Máximo seis imágenes por producto.
- El borrado definitivo de un producto exige confirmación de UI y debe borrar la
  fila, sus asociaciones, derivados públicos y original privado para no dejar
  archivos huérfanos/costos. Definir el mecanismo fiable y sus fallos/reintentos
  en la spec; no asumir que un delete SQL basta.

#### Administrador, primer lanzamiento

- Sin registro público. La primera cuenta `owner` se crea con un procedimiento
  operativo privado.
- Todo `admin.elcauquenartesanias.com.ar` exige sesión, salvo el login.
- Alcance de pantallas: login; listado de productos con filtros; crear/editar
  producto; galería de imágenes; orden; y CRUD de categorías. No dashboard,
  métricas, gestión UI de usuarios ni configuración visual.
- El admin puede asignar una categoría por selector normal y también por drag and
  drop de un producto sobre una categoría o `Sin categoría`. El selector no debe
  desaparecer: es necesario para accesibilidad y móvil.
- Esa asignación no debe cambiar el orden público.
- El orden público es global. En una pantalla/lista de orden, el admin hace drag
  and drop y luego pulsa **Guardar orden** o **Descartar cambios**. El backend
  recibe y aplica una actualización atómica, no una escritura por movimiento.

### Migración y despliegue acordados

- Desarrollar el Next nuevo en el mismo repositorio frontend actual y usar
  previews de Vercel.
- El sitio estático vigente sigue funcionando hasta validar el nuevo catálogo y
  admin; el corte se hace al final.
- Realizar una importación controlada de los 11 productos y fotos actuales, en
  vez de recrearlos manualmente. Debe ser idempotente o ejecutable de forma
  segura para pruebas, y debe respetar el flujo de procesamiento de media.
- Configurar el dominio raíz y `admin` en el mismo proyecto Vercel; configurar
  `api` para Railway. Es trabajo externo/operativo y requerirá la intervención
  del dueño cuando se llegue al despliegue.

### Preguntas que no deben inventarse durante la nueva sesión

Estas no están resueltas; el `grill-with-docs` debe tratarlas como decisiones
explícitas o registrar por qué se difieren:

1. ¿Cómo será el contrato público de categorías cuando se habilite su UI:
   categorías derivadas de productos o endpoint explícito, y qué identificador
   estable necesita? No agregar slug/rutas públicas sin una necesidad real.
2. ¿Cómo se modelan importe y moneda siguiendo las convenciones existentes del
   backend? Los strings como `$5.000` del frontend actual no son modelo de
   persistencia.
3. ¿Qué campos de dirección/alt text/orden de las imágenes se necesitan y cómo
   se expone una derivative pública al catálogo sin filtrar originales privados?
4. ¿Cómo se garantiza el borrado de objetos R2 si la eliminación de DB u objetos
   falla a mitad de camino? Diseñar compensación, job o reintento en la spec.
5. ¿Qué endpoint autenticado y secreto usarán el backend y Next para revalidar
   listado/modal público tras cada cambio?
6. ¿Cómo se implementará el procedimiento privado de alta del primer `owner`?
   Debe documentarse, pero no habilitar registro público.
7. ¿Cómo se preservan el orden y los datos del frontend actual en la importación,
   incluidos los assets que solo tengan WebP disponible?

### Secuencia recomendada para la próxima sesión

1. Abrir una sesión nueva en el backend y comenzar con `/grill-with-docs`.
   Aportar este archivo y la nota de investigación como contexto, no como spec
   inmutable.
2. Leer los documentos exigidos por `AGENTS.md` y confirmar los hechos del
   backend con código y tests.
3. Resolver las preguntas abiertas; actualizar `CONTEXT.md` y ADRs solo cuando
   la decisión sea estable.
4. Producir una spec que declare contratos, seguridad/cors, invariantes de media,
   revalidación e importación.
5. Convertir la spec en tickets bloqueantes con `/to-tickets`; no implementar
   antes de tener los bordes de API y media claros.
6. Para la UI administrativa, si el flujo de drag-and-drop o gestión de galería
   no se puede decidir en papel, usar `/handoff` hacia un directorio de
   prototipo y ejecutar `/prototype`; volver con el hallazgo a la spec.
7. Cuando toque configurar DNS, Railway, Vercel, R2 y secretos, usar `/wizard`:
   son pasos de consola/cuenta que requieren al dueño. Nunca incluir claves o
   contraseñas en este archivo.

### Suggested skills

- `/grill-with-docs` — siguiente paso principal, en el backend, para validar y
  registrar las decisiones con contexto de repositorio.
- `/domain-modeling` — durante el grill para fijar vocabulario de Product,
  Category, Media y publicación, y crear ADRs solo si corresponde.
- `/to-spec` — después de que las preguntas abiertas estén resueltas.
- `/to-tickets` — luego de la spec, para separar migración, API/media, frontend
  y operaciones por dependencias.
- `/prototype` — solo si la interacción de admin (orden/galería/asignación a
  categoría) necesita probarse visualmente.
- `/tdd` — al implementar cada ticket.
- `/wizard` — para la configuración humana de DNS, Vercel, Railway, R2 y secretos.
- `/handoff` — para transportar hallazgos entre el repo backend, el frontend o
  un prototipo, sin depender del contexto de chat.

