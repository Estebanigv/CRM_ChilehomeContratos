'use client'

import { DashboardAuthProvider, useDashboardAuth } from '@/lib/auth/DashboardAuthProvider'
import { DashboardClient } from '@/components/dashboard'
import { ChileHomeLoader } from '@/components/shared'
import ErrorBoundary from '@/components/ErrorBoundary'

function DashboardContent() {
  const { user, loading, error } = useDashboardAuth()

  if (loading) {
    return <ChileHomeLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error en Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Las otras páginas siguen funcionando</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-600 mb-2">Sin usuario en Dashboard</h2>
          <p className="text-gray-600">Error de autenticación específico del Dashboard</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      pageName="Dashboard Content"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error en Contenido Dashboard</h2>
            <p className="text-gray-600">Error específico del Dashboard</p>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Recargar Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      }
    >
      <DashboardClient
        user={user}
        contratos={[]}
        loading={false}
        onRefresh={() => window.location.reload()}
      />
    </ErrorBoundary>
  )
}

export default function DashboardPageIsolated() {
  return (
    <ErrorBoundary pageName="Dashboard Page">
      <DashboardAuthProvider>
        <DashboardContent />
      </DashboardAuthProvider>
    </ErrorBoundary>
  )
}