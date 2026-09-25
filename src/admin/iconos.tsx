// Íconos SVG del prototipo (`admin/admin.js`), decorativos: el botón que los lleva tiene su `aria-label`.

export const IconoFoto = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2.5" y="4" width="15" height="12" rx="1.5" />
    <circle cx="7" cy="9" r="1.5" />
    <path d="M17.5 13l-4-3.5-3 2.5-2.5-2L2.5 14" />
  </svg>
)

const Trazo = ({ d }: { d: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
)

export const IconoIzquierda = () => <Trazo d="M8.5 2.5L4 7l4.5 4.5" />
export const IconoDerecha = () => <Trazo d="M5.5 2.5L10 7l-4.5 4.5" />

export const IconoEstrella = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1.2l1.98 4.3 4.72.55-3.5 3.24.94 4.71L8 11.7l-4.14 2.3.94-4.71-3.5-3.24 4.72-.55L8 1.2z" />
  </svg>
)
