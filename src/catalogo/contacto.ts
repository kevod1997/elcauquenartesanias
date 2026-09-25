const TELEFONO = '542284580320'
export const INSTAGRAM = '@elcauquen_artesanias/'

export const whatsapp = (texto: string) => `https://wa.me/${TELEFONO}?text=${encodeURIComponent(texto)}`

export const hrefInstagram = `https://instagram.com/${INSTAGRAM.replace('@', '')}`

export const hrefWhatsappGeneral = whatsapp('Hola! Vi la página de El Cauquén Artesanías y quería hacer una consulta.')

export const hrefWhatsappProducto = (nombre: string) =>
  whatsapp(`Hola! Vi ${nombre.toLowerCase()} y me interesa comprar. ¿Tenés disponibilidad?`)
