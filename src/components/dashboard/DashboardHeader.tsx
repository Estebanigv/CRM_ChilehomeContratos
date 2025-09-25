'use client'

import React from 'react'
import { Calendar, Loader2, RefreshCw, RotateCw } from 'lucide-react'
import { CustomDatePicker } from '../shared'

interface DashboardHeaderProps {
  fechaInicio: string
  fechaFin: string
  onFechaInicioChange: (fecha: string) => void
  onFechaFinChange: (fecha: string) => void
  onApplyFilter: () => void
  onResetFilter: () => void
  onForceRefresh?: () => void
  applyingFilter: boolean
  resetting: boolean
  refreshing?: boolean
}

export default function DashboardHeader({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  onApplyFilter,
  onResetFilter,
  onForceRefresh,
  applyingFilter,
  resetting,
  refreshing = false
}: DashboardHeaderProps) {
  // Convertir fechas string a Date objects para el DatePicker
  const startDate = fechaInicio ? (() => {
    const parts = fechaInicio.split('-')
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    return null
  })() : null

  const endDate = fechaFin ? (() => {
    const parts = fechaFin.split('-')
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    }
    return null
  })() : null

  const handleRangeChange = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return

    const startString = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`
    const endString = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`

    onFechaInicioChange(startString)
    onFechaFinChange(endString)
    onApplyFilter()
  }

  return (
    <div className="mb-6 flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
        <p className="text-gray-600 dark:text-gray-300">Dashboard ejecutivo de ventas y contratos</p>
      </div>

      {/* Filtro de fechas con rango */}
      <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-600/60 p-3 w-fit">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-200">Período:</span>
            <CustomDatePicker
              isRange={true}
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleRangeChange}
              minDate={new Date('2024-01-01')}
              maxDate={new Date()}
              placeholder="Seleccionar período"
              className="w-64"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={onApplyFilter}
              disabled={applyingFilter}
              className={`px-3 py-1 text-white rounded text-sm transition-all duration-200 flex items-center gap-1 shadow-sm ${
                applyingFilter
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600'
              }`}
            >
              {applyingFilter && <Loader2 className="h-3 w-3 animate-spin" />}
              {applyingFilter ? 'Aplicando...' : 'Aplicar'}
            </button>

            <button
              onClick={onResetFilter}
              disabled={resetting}
              className={`p-2 rounded text-sm transition-all duration-200 flex items-center justify-center shadow-sm ${
                resetting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 dark:bg-gray-700/80 dark:text-gray-300 dark:hover:bg-gray-600/80'
              }`}
              title="Limpiar y restaurar al período actual"
            >
              {resetting ?
                <Loader2 className="h-4 w-4 animate-spin" /> :
                <RefreshCw className="h-4 w-4" />
              }
            </button>

            {/* Botón de actualización forzada - Solo icono */}
            {onForceRefresh && (
              <button
                onClick={onForceRefresh}
                disabled={refreshing}
                className={`p-2 rounded text-sm transition-all duration-200 flex items-center justify-center shadow-sm ${
                  refreshing
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                    : 'bg-gray-100 text-green-600 hover:bg-green-100 hover:text-green-700 active:scale-95 dark:bg-gray-700/80 dark:text-green-400 dark:hover:bg-green-900/20 dark:hover:text-green-300'
                }`}
                title="Actualizar datos del CRM"
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}