# Fase 12 — Admin mobile y orden del catálogo con arrastre

## Definición

Pedido del usuario (2026-09-25): el admin tiene que ser cómodo en el teléfono, y el integrante tiene
que entender cómo se ve la home al ordenar, cosa que el número de posición de F8-D2 no le muestra.
No cambia el backend: el orden se sigue guardando con `PUT /admin/productos/orden` (F8-D3). Las
decisiones F12-Dk se toman en la preparación (6.1 de [prompts](../prompts.md)).

Acordado con el usuario:

- **Mobile:** el checklist de la skill
  [mobile-native](https://github.com/emilkowalski/skills/blob/main/skills/mobile-native/SKILL.md)
  en todo el admin: hover detrás de `@media (hover: hover) and (pointer: fine)` y feedback en
  `:active`, inputs de 16px o más, `dvh`, `viewport-fit=cover` con safe areas, `touch-action:
  manipulation`, sin tap highlight y `theme-color`. Nunca `user-scalable=no` ni sniffing de user agent.
- **Navbar:** Productos · Categorías · Medidas · Integrantes (solo `owner`, F9-D1). "Medidas" es la
  etiqueta corta de la barra; la página sigue titulándose "Tipos de medida". En desktop va arriba; en
  mobile, como pestañas abajo con ícono y etiqueta, y el nombre del integrante y "Cerrar sesión" pasan a
  una cabecera fina arriba, con la marca.
- **Listas en mobile:** las filas de Productos, Categorías, Tipos de medida e Integrantes pasan a
  tarjetas apiladas, con acciones de tamaño táctil.
- **Productos con dos pestañas**, en la misma isla para que el orden sin guardar no se pierda al
  cambiar: "Lista" y "Orden del catálogo".
  - **Lista:** gestionar (Nuevo producto, Editar, Borrar, estado). Pierde "Subir", "Bajar" y "Guardar
    orden"; sigue en el orden global, sin número de posición o con el número atenuado.
  - **Orden del catálogo:** una grilla que se arrastra y muestra cómo queda la home. En desktop usa la
    misma grilla que el catálogo público (mismo ancho mínimo de tarjeta), así las columnas coinciden. En
    mobile, 2 columnas con scroll vertical y separadores de hilera según `hileras()`
    (`src/catalogo/presentacion.ts`), con el producto que tiene diseños solo en su hilera.
  - **Texto explicativo** arriba de la grilla, para que el integrante entienda la relación con la
    home: qué posiciones se ven primero, que en el teléfono se ve por hileras y que los borradores no
    se ven.
  - **Tarjeta:** imagen principal, nombre, número de posición, "Borrador · no se ve" para los
    borradores (atenuados y arrastrables), la manija de arrastre y los botones "Antes" y "Después" como
    alternativa con teclado y toque. Sin precio ni categoría.
  - **Guardar:** se mantienen el botón "Guardar orden", el conflicto `409` (F8-D4), el rebase ante
    recargas y el aviso al salir (F8-D5). Soltar una tarjeta no guarda.
- **Librería:** `@dnd-kit/react` (0.5 al 2026-09-25, la línea mantenida). En la preparación se valida
  con un prototipo chico (touch, teclado, scroll automático y anuncios para el lector de pantalla). Si
  falla, se usa `@dnd-kit/core` + `@dnd-kit/sortable` (10, estable, sin cambios desde 2024).

Para decidir en la preparación: si la pestaña activa va en la URL (`?vista=orden`), para que una
recarga no vuelva a la Lista (recomendado).

**Construir:** el checklist mobile en `admin.css` y `Admin.astro`; la navbar nueva; las listas como
tarjetas en mobile; las pestañas de Productos y la vista "Orden del catálogo" con arrastre, texto
explicativo y botones "Antes" y "Después"; las reglas nuevas (separadores de hilera, movimientos) en
módulos puros con tests, como `orden.ts`.

**Cerrar cuando:** en un teléfono real, el integrante navega con las pestañas de abajo, el contenido
respeta las safe areas, los inputs no hacen zoom y las acciones de las listas se tocan sin errores; en
"Orden del catálogo" arrastra con el dedo, con el mouse y con el teclado, los botones "Antes" y
"Después" mueven la tarjeta, los separadores de hilera coinciden con el carrusel de la home, y
"Guardar orden" guarda y maneja el `409` como en la fase 8.
