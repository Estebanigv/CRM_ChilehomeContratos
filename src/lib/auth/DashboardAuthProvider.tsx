'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { User as AppUser } from '@/types'
import ErrorBoundary from '@/components/ErrorBoundary'

interface DashboardAuthContextType {
  user: AppUser | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const DashboardAuthContext = createContext<DashboardAuthContextType | undefined>(undefined)

// Usuario específico para Dashboard
const DASHBOARD_USER: AppUser = {
  id: '49586172-1688-464f-82c7-0f36966a4e6c',
  email: 'esteban@chilehome.cl',
  role: 'developer',
  nombre: 'Esteban',
  created_at: new Date().toISOString(),
  can_edit_after_validation: true
}

export function DashboardAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshUser = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simular carga para Dashboard
      await new Promise(resolve => setTimeout(resolve, 300))

      setUser(DASHBOARD_USER)
    } catch (err) {
      setError('Error cargando datos del Dashboard')
      console.error('Dashboard Auth Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setUser(null)
      // Redirigir solo esta página
      window.location.href = '/login'
    } catch (err) {
      console.error('Dashboard SignOut Error:', err)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const value = {
    user,
    loading,
    error,
    signOut,
    refreshUser
  }

  return (
    <ErrorBoundary pageName="Dashboard Auth" fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error en Autenticación Dashboard</h2>
          <p className="text-gray-600">Las otras páginas siguen funcionando</p>
          <button
            onClick={() => window.location.href = '/dashboard-crm'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Ir al CRM
          </button>
        </div>
      </div>
    }>
      <DashboardAuthContext.Provider value={value}>
        {children}
      </DashboardAuthContext.Provider>
    </ErrorBoundary>
  )
}

export function useDashboardAuth() {
  const context = useContext(DashboardAuthContext)
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within a DashboardAuthProvider')
  }
  return context
}