import { createClient } from '@/lib/supabase/server'
import { User as AppUser } from '@/types'
import { NextRequest } from 'next/server'

export interface AuthResult {
  user: AppUser | null
  error?: string
  status?: number
}

export async function authenticateRequest(request?: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return {
        user: null,
        error: 'Error de autenticación',
        status: 401
      }
    }

    if (!authUser) {
      return {
        user: null,
        error: 'No autorizado',
        status: 401
      }
    }

    // Obtener perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !userProfile) {
      return {
        user: null,
        error: 'Usuario no encontrado',
        status: 404
      }
    }

    return {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        nombre: userProfile.nombre,
        created_at: userProfile.created_at,
        can_edit_after_validation: userProfile.can_edit_after_validation
      }
    }
  } catch (error) {
    console.error('Error in authenticateRequest:', error)
    return {
      user: null,
      error: 'Error interno del servidor',
      status: 500
    }
  }
}

export function checkUserRole(
  user: AppUser,
  requiredRoles: Array<'developer' | 'admin' | 'ejecutivo' | 'supervisor' | 'transportista'>
): boolean {
  return requiredRoles.includes(user.role)
}

export async function requireAuth(
  request?: NextRequest,
  requiredRoles?: Array<'developer' | 'admin' | 'ejecutivo' | 'supervisor' | 'transportista'>
): Promise<AuthResult> {
  const authResult = await authenticateRequest(request)

  if (!authResult.user) {
    return authResult
  }

  if (requiredRoles && !checkUserRole(authResult.user, requiredRoles)) {
    return {
      user: null,
      error: 'Permisos insuficientes',
      status: 403
    }
  }

  return authResult
}