// Sistema de permisos granular para ChileHome
import React from 'react'

export type Role = 'developer' | 'admin' | 'supervisor' | 'ejecutivo' | 'transportista' | 'viewer'

export type Permission =
  // Contratos
  | 'contracts.view'
  | 'contracts.create'
  | 'contracts.edit'
  | 'contracts.delete'
  | 'contracts.validate'
  | 'contracts.export'

  // Ventas
  | 'sales.view'
  | 'sales.create'
  | 'sales.edit'
  | 'sales.delete'
  | 'sales.export'

  // Dashboard
  | 'dashboard.view'
  | 'dashboard.stats'
  | 'dashboard.analytics'

  // Equipo
  | 'team.view'
  | 'team.manage'
  | 'team.stats'

  // Configuración
  | 'settings.view'
  | 'settings.edit'
  | 'settings.admin'

  // WhatsApp
  | 'whatsapp.send'
  | 'whatsapp.broadcast'
  | 'whatsapp.config'

  // Reportes
  | 'reports.view'
  | 'reports.generate'
  | 'reports.export'

  // Logística
  | 'logistics.view'
  | 'logistics.manage'
  | 'logistics.track'

  // Sistema
  | 'system.admin'
  | 'system.logs'
  | 'system.backup'

// Definición de permisos por rol
const rolePermissions: Record<Role, Permission[]> = {
  developer: [
    // Acceso total
    'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.validate', 'contracts.export',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.export',
    'dashboard.view', 'dashboard.stats', 'dashboard.analytics',
    'team.view', 'team.manage', 'team.stats',
    'settings.view', 'settings.edit', 'settings.admin',
    'whatsapp.send', 'whatsapp.broadcast', 'whatsapp.config',
    'reports.view', 'reports.generate', 'reports.export',
    'logistics.view', 'logistics.manage', 'logistics.track',
    'system.admin', 'system.logs', 'system.backup'
  ],

  admin: [
    // Casi todo excepto sistema
    'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.delete', 'contracts.validate', 'contracts.export',
    'sales.view', 'sales.create', 'sales.edit', 'sales.delete', 'sales.export',
    'dashboard.view', 'dashboard.stats', 'dashboard.analytics',
    'team.view', 'team.manage', 'team.stats',
    'settings.view', 'settings.edit', 'settings.admin',
    'whatsapp.send', 'whatsapp.broadcast', 'whatsapp.config',
    'reports.view', 'reports.generate', 'reports.export',
    'logistics.view', 'logistics.manage', 'logistics.track'
  ],

  supervisor: [
    // Gestión de contratos y equipo
    'contracts.view', 'contracts.create', 'contracts.edit', 'contracts.validate', 'contracts.export',
    'sales.view', 'sales.create', 'sales.edit', 'sales.export',
    'dashboard.view', 'dashboard.stats', 'dashboard.analytics',
    'team.view', 'team.stats',
    'settings.view',
    'whatsapp.send', 'whatsapp.broadcast',
    'reports.view', 'reports.generate', 'reports.export',
    'logistics.view', 'logistics.manage'
  ],

  ejecutivo: [
    // Operaciones básicas
    'contracts.view', 'contracts.create', 'contracts.edit',
    'sales.view', 'sales.create', 'sales.edit',
    'dashboard.view', 'dashboard.stats',
    'team.view',
    'whatsapp.send',
    'reports.view',
    'logistics.view'
  ],

  transportista: [
    // Solo logística y visualización
    'contracts.view',
    'sales.view',
    'dashboard.view',
    'logistics.view', 'logistics.track'
  ],

  viewer: [
    // Solo lectura
    'contracts.view',
    'sales.view',
    'dashboard.view',
    'team.view',
    'reports.view',
    'logistics.view'
  ]
}

// Funciones helper
export class PermissionManager {
  /**
   * Verifica si un rol tiene un permiso específico
   */
  static hasPermission(role: Role | undefined, permission: Permission): boolean {
    if (!role) return false
    return rolePermissions[role]?.includes(permission) || false
  }

  /**
   * Verifica si un rol tiene alguno de los permisos especificados
   */
  static hasAnyPermission(role: Role | undefined, permissions: Permission[]): boolean {
    if (!role) return false
    return permissions.some(permission => this.hasPermission(role, permission))
  }

  /**
   * Verifica si un rol tiene todos los permisos especificados
   */
  static hasAllPermissions(role: Role | undefined, permissions: Permission[]): boolean {
    if (!role) return false
    return permissions.every(permission => this.hasPermission(role, permission))
  }

  /**
   * Obtiene todos los permisos de un rol
   */
  static getPermissions(role: Role | undefined): Permission[] {
    if (!role) return []
    return rolePermissions[role] || []
  }

  /**
   * Verifica si un rol puede realizar una acción sobre un recurso
   */
  static canPerformAction(
    role: Role | undefined,
    resource: string,
    action: string
  ): boolean {
    const permission = `${resource}.${action}` as Permission
    return this.hasPermission(role, permission)
  }

  /**
   * Obtiene el nivel de acceso de un rol (0-100)
   */
  static getAccessLevel(role: Role | undefined): number {
    if (!role) return 0

    const levels: Record<Role, number> = {
      developer: 100,
      admin: 90,
      supervisor: 70,
      ejecutivo: 50,
      transportista: 30,
      viewer: 10
    }

    return levels[role] || 0
  }

  /**
   * Compara niveles de acceso entre roles
   */
  static hasHigherAccess(role1: Role | undefined, role2: Role | undefined): boolean {
    return this.getAccessLevel(role1) > this.getAccessLevel(role2)
  }

  /**
   * Verifica si un usuario puede editar a otro basado en roles
   */
  static canEditUser(editorRole: Role | undefined, targetRole: Role | undefined): boolean {
    // Developers pueden editar a cualquiera
    if (editorRole === 'developer') return true

    // Admins pueden editar a todos excepto developers
    if (editorRole === 'admin' && targetRole !== 'developer') return true

    // Supervisores pueden editar ejecutivos y transportistas
    if (editorRole === 'supervisor' &&
        (targetRole === 'ejecutivo' || targetRole === 'transportista' || targetRole === 'viewer')) {
      return true
    }

    return false
  }
}

// Hook para React
export function usePermissions(user: { role?: string } | null) {
  const role = user?.role as Role | undefined

  return {
    hasPermission: (permission: Permission) =>
      PermissionManager.hasPermission(role, permission),

    hasAnyPermission: (permissions: Permission[]) =>
      PermissionManager.hasAnyPermission(role, permissions),

    hasAllPermissions: (permissions: Permission[]) =>
      PermissionManager.hasAllPermissions(role, permissions),

    canPerformAction: (resource: string, action: string) =>
      PermissionManager.canPerformAction(role, resource, action),

    getAccessLevel: () =>
      PermissionManager.getAccessLevel(role),

    canEditUser: (targetRole: Role) =>
      PermissionManager.canEditUser(role, targetRole),

    permissions: PermissionManager.getPermissions(role),
    role
  }
}

// Componente de protección de rutas
export interface ProtectedRouteProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export const ProtectedComponent: React.FC<ProtectedRouteProps> = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}) => {
  const user = { role: 'admin' } // TODO: Obtener de contexto real
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions(user)

  const hasAccess = permission
    ? hasPermission(permission)
    : requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}