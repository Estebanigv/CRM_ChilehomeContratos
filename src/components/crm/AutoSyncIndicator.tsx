'use client'

import React from 'react'
import { RefreshCw, CheckCircle, AlertCircle, Database, Clock } from 'lucide-react'
import { useAutoSyncCRM } from '@/hooks/useAutoSyncCRM'

interface AutoSyncIndicatorProps {
  enabled?: boolean
  forceSync?: boolean
  position?: 'fixed' | 'static'
  showDetails?: boolean
}

export default function AutoSyncIndicator({
  enabled = true,
  forceSync = false,
  position = 'fixed',
  showDetails = false
}: AutoSyncIndicatorProps) {
  const { status, fechasActuales } = useAutoSyncCRM({ enabled, forceSync })

  // No mostrar nada si está completado y no hay errores (para no molestar)
  if (status.isCompleted && !status.error && !showDetails) {
    return null
  }

  const getIcon = () => {
    if (status.isActive) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
    }
    if (status.error) {
      return <AlertCircle className="h-4 w-4 text-red-600" />
    }
    if (status.isCompleted) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    }
    return <Database className="h-4 w-4 text-gray-600" />
  }

  const getStatusText = () => {
    if (status.isActive) {
      return 'Sincronizando CRM...'
    }
    if (status.error) {
      return 'Error en sincronización'
    }
    if (status.isCompleted) {
      if (status.progress.ventasNuevas > 0 || status.progress.ventasActualizadas > 0) {
        return `Sincronización completada - ${status.progress.ventasNuevas} nuevas, ${status.progress.ventasActualizadas} actualizadas`
      }
      return 'Datos CRM actualizados'
    }
    return 'Preparando sincronización...'
  }

  const getStatusColor = () => {
    if (status.isActive) {
      return 'bg-blue-50 border-blue-200 text-blue-800'
    }
    if (status.error) {
      return 'bg-red-50 border-red-200 text-red-800'
    }
    if (status.isCompleted) {
      return 'bg-green-50 border-green-200 text-green-800'
    }
    return 'bg-gray-50 border-gray-200 text-gray-800'
  }

  const containerClasses = position === 'fixed'
    ? 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm'
    : 'w-full'

  return (
    <div className={containerClasses}>
      <div className={`p-3 rounded-lg border shadow-sm transition-all duration-300 ${getStatusColor()}`}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {getStatusText()}
            </p>

            {showDetails && (
              <div className="mt-1 text-xs opacity-75">
                <p>Período: {fechasActuales.fechaInicio} → {fechasActuales.fechaFin}</p>
                {status.progress.duracion && (
                  <p>Duración: {status.progress.duracion}s</p>
                )}
              </div>
            )}

            {status.error && (
              <p className="text-xs mt-1 opacity-75">
                {status.error}
              </p>
            )}
          </div>

          {status.isActive && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              <span>Auto</span>
            </div>
          )}
        </div>

        {/* Barra de progreso visual cuando está activo */}
        {status.isActive && (
          <div className="mt-2">
            <div className="w-full bg-blue-200 rounded-full h-1">
              <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {/* Estadísticas rápidas cuando está completado */}
        {status.isCompleted && showDetails && !status.error && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/50 rounded px-2 py-1">
              <span className="font-medium">{status.progress.totalVentas}</span>
              <span className="opacity-75"> total</span>
            </div>
            <div className="bg-white/50 rounded px-2 py-1">
              <span className="font-medium text-green-700">+{status.progress.ventasNuevas}</span>
              <span className="opacity-75"> nuevas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente compacto para mostrar en la barra de navegación
export function AutoSyncStatusBadge() {
  const { status } = useAutoSyncCRM({ enabled: true })

  if (status.isCompleted && !status.error) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
        <CheckCircle className="h-3 w-3" />
        <span>CRM actualizado</span>
      </div>
    )
  }

  if (status.isActive) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  if (status.error) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
        <AlertCircle className="h-3 w-3" />
        <span>Error CRM</span>
      </div>
    )
  }

  return null
}