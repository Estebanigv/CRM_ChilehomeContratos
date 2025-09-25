/**
 * Limpia el nombre del vendedor eliminando contenido entre paréntesis
 * Ejemplo: "Juan Pérez (Supervisor)" -> "Juan Pérez"
 */
export function cleanVendorName(nombre: string | undefined): string {
  if (!nombre) return ''

  // Eliminar contenido entre paréntesis y espacios extra
  return nombre
    .replace(/\s*\([^)]*\)\s*/g, '') // Elimina contenido entre paréntesis
    .trim() // Elimina espacios al inicio y final
    .replace(/\s+/g, ' ') // Reemplaza múltiples espacios por uno solo
}

/**
 * Formatea el nombre del vendedor para mostrar
 */
export function formatVendorName(nombre: string | undefined): string {
  const cleanName = cleanVendorName(nombre)

  if (!cleanName) return 'Sin asignar'

  // Capitalizar primera letra de cada palabra
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}