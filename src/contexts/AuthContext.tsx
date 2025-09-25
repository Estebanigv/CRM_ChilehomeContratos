'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Role, Permission, PermissionManager, usePermissions } from '@/lib/permissions'

interface User {
  id: string
  email: string
  nombre?: string
  role?: Role
  empresa?: string
  telefono?: string
  created_at?: string
  last_login?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null

  // Funciones de autenticación
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>

  // Funciones de permisos
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  canPerformAction: (resource: string, action: string) => boolean
  getAccessLevel: () => number
  permissions: Permission[]

  // Utilidades
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // Hook de permisos basado en el usuario actual
  const permissionHelpers = usePermissions(user)

  // Cargar usuario al inicio
  useEffect(() => {
    checkUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        // Obtener datos adicionales del usuario
        const { data: profile, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error obteniendo perfil:', profileError)
        }

        const userData: User = {
          id: session.user.id,
          email: session.user.email!,
          nombre: profile?.nombre || session.user.user_metadata?.nombre,
          role: profile?.role || session.user.user_metadata?.role || 'viewer',
          empresa: profile?.empresa,
          telefono: profile?.telefono,
          created_at: profile?.created_at || session.user.created_at,
          last_login: new Date().toISOString()
        }

        setUser(userData)

        // Actualizar última conexión
        await supabase
          .from('usuarios')
          .update({ last_login: userData.last_login })
          .eq('id', userData.id)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Error verificando usuario:', err)
      setError('Error al verificar la sesión')
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      await checkUser()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // Crear perfil de usuario
      if (data.user) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            email: data.user.email,
            nombre: metadata?.nombre,
            role: metadata?.role || 'viewer',
            empresa: metadata?.empresa,
            telefono: metadata?.telefono,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error creando perfil:', profileError)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Error al enviar correo de recuperación')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)

      if (!user) throw new Error('No hay usuario autenticado')

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('usuarios')
        .update(data)
        .eq('id', user.id)

      if (updateError) throw updateError

      // Actualizar estado local
      setUser(prev => prev ? { ...prev, ...data } : null)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar perfil')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await checkUser()
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    hasPermission: permissionHelpers.hasPermission,
    hasAnyPermission: permissionHelpers.hasAnyPermission,
    hasAllPermissions: permissionHelpers.hasAllPermissions,
    canPerformAction: permissionHelpers.canPerformAction,
    getAccessLevel: permissionHelpers.getAccessLevel,
    permissions: permissionHelpers.permissions,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}

// HOC para proteger componentes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  permission?: Permission,
  fallback?: React.ReactNode
) {
  return function ProtectedComponent(props: P) {
    const { user, loading, hasPermission } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return <>{fallback || <div>No autorizado</div>}</>
    }

    if (permission && !hasPermission(permission)) {
      return <>{fallback || <div>Sin permisos suficientes</div>}</>
    }

    return <Component {...props} />
  }
}

// Componente para mostrar contenido basado en permisos
interface CanProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function Can({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  const hasAccess = permission
    ? hasPermission(permission)
    : requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}