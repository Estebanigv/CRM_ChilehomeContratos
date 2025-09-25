// Configuración de roles para WhatsApp
export interface WhatsAppRole {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
}

export const whatsappRoles: WhatsAppRole[] = [
  {
    id: 'admin',
    nombre: 'Administrador',
    descripcion: 'Acceso completo al sistema',
    activo: true
  },
  {
    id: 'vendedor',
    nombre: 'Vendedor',
    descripcion: 'Acceso a ventas y clientes',
    activo: true
  },
  {
    id: 'supervisor',
    nombre: 'Supervisor',
    descripcion: 'Supervisión de equipos',
    activo: true
  }
]

export function getRoleByName(roleName: string): WhatsAppRole | undefined {
  return whatsappRoles.find(role =>
    role.nombre.toLowerCase() === roleName.toLowerCase()
  )
}

export function isRoleActive(roleId: string): boolean {
  const role = whatsappRoles.find(r => r.id === roleId)
  return role?.activo || false
}

// Funciones de notificación
export async function notificarGuillermoDiaz(mensaje: string): Promise<boolean> {
  console.log('Notificando a Guillermo Díaz:', mensaje)
  return true
}

export async function enviarMensajePrueba(telefono: string, mensaje: string): Promise<boolean> {
  console.log('Enviando mensaje de prueba a:', telefono, mensaje)
  return true
}

export async function notificarSupervisor(mensaje: string): Promise<boolean> {
  console.log('Notificando supervisor:', mensaje)
  return true
}

export async function notificarTransportista(mensaje: string): Promise<boolean> {
  console.log('Notificando transportista:', mensaje)
  return true
}