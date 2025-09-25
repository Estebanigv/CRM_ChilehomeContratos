'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import ChileHomeLoader from '@/components/ChileHomeLoader'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: Array<'developer' | 'admin' | 'ejecutivo' | 'supervisor' | 'transportista'>
  redirectTo?: string
  fallback?: React.ReactNode
}

export default function AuthGuard({
  children,
  requiredRoles = [],
  redirectTo = '/login',
  fallback
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Mostrar loader mientras carga
  if (loading) {
    return fallback || <ChileHomeLoader />
  }

  // Si no hay usuario, no mostrar nada (redirect en progreso)
  if (!user) {
    return null
  }

  // Verificar roles si se especificaron
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso Denegado
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            No tienes permisos suficientes para acceder a esta página.
          </p>
          <p className="text-xs text-gray-400">
            Tu rol: <span className="font-semibold">{user.role}</span><br />
            Roles requeridos: <span className="font-semibold">{requiredRoles.join(', ')}</span>
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}