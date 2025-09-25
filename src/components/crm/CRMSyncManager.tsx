'use client'

import React, { useState, useEffect } from 'react'
import { Database, RefreshCw, Clock, CheckCircle, AlertCircle, Download, Calendar, Activity } from 'lucide-react'

interface SyncLog {
  id: string
  sync_type: string
  fecha_inicio: string
  fecha_fin: string
  total_ventas_procesadas: number
  ventas_nuevas: number
  ventas_actualizadas: number
  estado: 'iniciado' | 'completado' | 'error'
  mensaje_error?: string
  duracion_segundos?: number
  created_at: string
  completed_at?: string
}

interface SyncStats {
  totalVentasEnDB: number
  ultimaSincronizacion: SyncLog
  historialSincronizaciones: SyncLog[]
}

export default function CRMSyncManager() {
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    inicio: '2024-01-01',
    fin: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  const cargarEstadisticas = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/crm/sync')
      const data = await response.json()

      if (data.success) {
        setStats(data.estadisticas)
      } else {
        setError(data.details || 'Error cargando estadísticas')
      }
    } catch (err) {
      setError('Error conectando con el servidor')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const iniciarSincronizacion = async (tipo: 'full' | 'incremental' | 'manual') => {
    try {
      setIsSyncing(true)
      setError(null)

      const params = new URLSearchParams({
        type: tipo,
        fecha_inicio: dateRange.inicio,
        fecha_fin: dateRange.fin
      })

      console.log(`🔄 Iniciando sincronización ${tipo}...`)

      const response = await fetch(`/api/crm/sync?${params}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        console.log('✅ Sincronización completada:', data.estadisticas)
        await cargarEstadisticas() // Recargar estadísticas
      } else {
        setError(data.details || 'Error en sincronización')
      }
    } catch (err) {
      setError('Error durante la sincronización')
      console.error('Error:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-CL')
  }

  const formatearDuracion = (segundos?: number) => {
    if (!segundos) return 'N/A'
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return minutos > 0 ? `${minutos}m ${segs}s` : `${segs}s`
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'iniciado':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'iniciado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Sincronización CRM
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Gestiona la sincronización de datos con el CRM SmartCRM
            </p>
          </div>
          <button
            onClick={() => cargarEstadisticas()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Ventas en BD</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalVentasEnDB?.toLocaleString() || '0'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          {stats.ultimaSincronizacion && (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Última Sincronización</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatearFecha(stats.ultimaSincronizacion.created_at)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      {getEstadoIcon(stats.ultimaSincronizacion.estado)}
                      <span className="text-sm capitalize">{stats.ultimaSincronizacion.estado}</span>
                    </div>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Última Actividad</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.ultimaSincronizacion.total_ventas_procesadas} ventas
                    </p>
                    <p className="text-sm text-gray-500">
                      {stats.ultimaSincronizacion.ventas_nuevas} nuevas, {stats.ultimaSincronizacion.ventas_actualizadas} actualizadas
                    </p>
                  </div>
                  <Download className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Controles de Sincronización */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Controles de Sincronización
        </h3>

        {/* Selector de fechas */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Desde:</label>
            <input
              type="date"
              value={dateRange.inicio}
              onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hasta:</label>
            <input
              type="date"
              value={dateRange.fin}
              onChange={(e) => setDateRange(prev => ({ ...prev, fin: e.target.value }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => iniciarSincronizacion('full')}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
          >
            <Database className="h-4 w-4" />
            {isSyncing ? 'Sincronizando...' : 'Sincronización Completa'}
          </button>

          <button
            onClick={() => iniciarSincronizacion('incremental')}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Sincronización Incremental
          </button>

          <button
            onClick={() => iniciarSincronizacion('manual')}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors font-medium"
          >
            <Download className="h-4 w-4" />
            Sincronización Manual
          </button>
        </div>

        {isSyncing && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="font-medium">Sincronización en progreso...</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              Este proceso puede tardar varios minutos dependiendo de la cantidad de datos.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Historial de Sincronizaciones */}
      {stats?.historialSincronizaciones && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Sincronizaciones
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Estado</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Período</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Ventas</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Duración</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {stats.historialSincronizaciones.map((sync) => (
                  <tr key={sync.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(sync.estado)}`}>
                        {getEstadoIcon(sync.estado)}
                        {sync.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white capitalize">
                      {sync.sync_type}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {sync.fecha_inicio} → {sync.fecha_fin}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      <div>
                        <span className="font-medium">{sync.total_ventas_procesadas}</span>
                        <div className="text-xs text-gray-500">
                          +{sync.ventas_nuevas} nuevas, ~{sync.ventas_actualizadas} actualizadas
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatearDuracion(sync.duracion_segundos)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatearFecha(sync.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}