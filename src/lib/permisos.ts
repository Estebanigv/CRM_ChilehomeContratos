import { User, Contrato } from '@/types'

export type Accion =
  | 'crear_contrato'
  | 'editar_contrato'
  | 'validar_contrato'
  | 'enviar_contrato'
  | 'eliminar_contrato'
  | 'ver_todos_contratos'
  | 'configurar_notificaciones'
  | 'gestionar_usuarios'
  | 'editar_post_validacion'

interface PermisosPorRol {
  [rol: string]: {
    acciones: Accion[]
    restricciones?: {
      [key in Accion]?: (usuario: User, recurso?: any) => boolean
    }
  }
}

const PERMISOS: PermisosPorRol = {
  developer: {
    acciones: [
      'crear_contrato',
      'editar_contrato',
      'validar_contrato',
      'enviar_contrato',
      'eliminar_contrato',
      'ver_todos_contratos',
      'configurar_notificaciones',
      'gestionar_usuarios',
      'editar_post_validacion',
      'acceso_total_sistema',
      'configurar_whatsapp',
      'gestionar_base_datos',
      'ver_logs_sistema',
      'configurar_reportes',
      'administrar_apis',
      'debug_sistema'
    ]
  },
  admin: {
    acciones: [
      'crear_contrato',
      'editar_contrato',
      'validar_contrato',
      'enviar_contrato',
      'eliminar_contrato',
      'ver_todos_contratos',
      'configurar_notificaciones',
      'gestionar_usuarios',
      'editar_post_validacion'
    ]
  },
  supervisor: {
    acciones: [
      'crear_contrato',
      'editar_contrato',
      'validar_contrato',
      'enviar_contrato',
      'ver_todos_contratos',
      'configurar_notificaciones',
      'editar_post_validacion'
    ]
  },
  ejecutivo: {
    acciones: [
      'crear_contrato',
      'editar_contrato',
      'enviar_contrato'
    ],
    restricciones: {
      editar_contrato: (usuario, contrato: Contrato) => {
        // Los ejecutivos NO pueden editar contratos en estado validación o validado
        if (contrato?.estado === 'validacion' || contrato?.estado === 'validado') {
          return false
        }
        // Solo pueden editar sus propios contratos
        return contrato?.ejecutivo_id === usuario.id
      },
      enviar_contrato: (usuario, contrato: Contrato) => {
        // Solo pueden enviar contratos validados
        return contrato?.estado === 'validado'
      }
    }
  },
  transportista: {
    acciones: [
      'ver_todos_contratos'
    ],
    restricciones: {
      ver_todos_contratos: (usuario, contrato: Contrato) => {
        // Solo pueden ver contratos validados o enviados
        return contrato?.estado === 'validado' || contrato?.estado === 'enviado'
      }
    }
  }
}

export function tienePermiso(
  usuario: User,
  accion: Accion,
  recurso?: any
): boolean {
  // ESTEBAN (DEVELOPER) - ACCESO TOTAL ABSOLUTO
  if (usuario.role === 'developer') {
    return true
  }

  // CASO ESPECIAL: Si es Esteban, tratarlo como developer
  if (usuario.nombre && usuario.nombre.toLowerCase() === 'esteban') {
    return true
  }

  const permisos = PERMISOS[usuario.role]

  if (!permisos) {
    return false
  }

  // Verificar si el rol tiene la acción permitida
  if (!permisos.acciones.includes(accion)) {
    return false
  }

  // Verificar restricciones específicas
  if (permisos.restricciones?.[accion]) {
    return permisos.restricciones[accion](usuario, recurso)
  }

  return true
}

export function puedeEditarContrato(usuario: User, contrato: Contrato): boolean {
  return tienePermiso(usuario, 'editar_contrato', contrato)
}

export function puedeValidarContrato(usuario: User): boolean {
  return tienePermiso(usuario, 'validar_contrato')
}

export function puedeConfigurarNotificaciones(usuario: User): boolean {
  return tienePermiso(usuario, 'configurar_notificaciones')
}

export function obtenerAccionesPermitidas(usuario: User): Accion[] {
  const permisos = PERMISOS[usuario.role]
  return permisos?.acciones || []
}

// Hook para validar permisos en componentes
export function usePermiso(usuario: User | null, accion: Accion, recurso?: any): boolean {
  if (!usuario) return false
  return tienePermiso(usuario, accion, recurso)
}

// Middleware para APIs
export async function verificarPermisoAPI(
  usuario: User,
  accion: Accion,
  recurso?: any
): Promise<{ permitido: boolean; mensaje?: string }> {
  const permitido = tienePermiso(usuario, accion, recurso)

  if (!permitido) {
    let mensaje = `No tienes permisos para realizar esta acción`

    // Mensajes específicos según el contexto
    if (accion === 'editar_contrato' && recurso?.estado === 'validacion') {
      mensaje = 'No puedes editar contratos en estado de validación'
    } else if (accion === 'editar_contrato' && recurso?.estado === 'validado') {
      mensaje = 'No puedes editar contratos ya validados'
    } else if (accion === 'editar_post_validacion') {
      mensaje = 'Solo supervisores y administradores pueden editar contratos validados'
    }

    return { permitido: false, mensaje }
  }

  return { permitido: true }
}

// Estados permitidos para transiciones
export const TRANSICIONES_ESTADO: Record<string, string[]> = {
  borrador: ['validacion', 'validado'],
  validacion: ['validado', 'borrador'],
  validado: ['enviado'],
  enviado: [] // Estado final
}

export function puedeTransicionarEstado(
  estadoActual: string,
  nuevoEstado: string,
  usuario: User
): boolean {
  // Verificar si la transición es válida
  const transicionesPermitidas = TRANSICIONES_ESTADO[estadoActual] || []
  if (!transicionesPermitidas.includes(nuevoEstado)) {
    return false
  }

  // Verificar permisos específicos para validación
  if (nuevoEstado === 'validado' || nuevoEstado === 'validacion') {
    return tienePermiso(usuario, 'validar_contrato')
  }

  return true
}