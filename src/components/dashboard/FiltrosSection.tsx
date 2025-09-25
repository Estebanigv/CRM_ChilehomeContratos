'use client'

import React from 'react'
import {
  Calendar, Filter, Download, RefreshCw, Search,
  ChevronDown, X, Check
} from 'lucide-react'
import { CustomDatePicker } from '../shared'

interface FiltrosSectionProps {
  fechaInicio: string
  fechaFin: string
  soloValidados: boolean
  busqueda: string
  loading: boolean
  onFechaInicioChange: (fecha: string) => void
  onFechaFinChange: (fecha: string) => void
  onSoloValidadosChange: (validados: boolean) => void
  onBusquedaChange: (busqueda: string) => void
  onRefresh: () => void
  onExportExcel?: () => void
  totalVentas: number
}

export default function FiltrosSection({
  fechaInicio,
  fechaFin,
  soloValidados,
  busqueda,
  loading,
  onFechaInicioChange,
  onFechaFinChange,
  onSoloValidadosChange,
  onBusquedaChange,
  onRefresh,
  onExportExcel,
  totalVentas
}: FiltrosSectionProps) {
  const limpiarFiltros = () => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    onFechaInicioChange(inicioMes.toISOString().split('T')[0])
    onFechaFinChange(hoy.toISOString().split('T')[0])
    onSoloValidadosChange(false)
    onBusquedaChange('')
  }

  const hayFiltrosActivos = () => {
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    return (
      fechaInicio !== inicioMes.toISOString().split('T')[0] ||
      fechaFin !== hoy.toISOString().split('T')[0] ||
      soloValidados ||
      busqueda.trim() !== ''
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filtros principales */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Filtros de fecha */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Período:</span>
            </div>
            <div className="flex items-center gap-2">
              <CustomDatePicker
                value={fechaInicio}
                onChange={onFechaInicioChange}
                placeholder="Fecha inicio"
                className="w-40"
              />
              <span className="text-gray-500">-</span>
              <CustomDatePicker
                value={fechaFin}
                onChange={onFechaFinChange}
                placeholder="Fecha fin"
                className="w-40"
              />
            </div>
          </div>

          {/* Filtro de validados */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Estado:</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soloValidados}
                onChange={(e) => onSoloValidadosChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Solo validados</span>
            </label>
          </div>
        </div>

        {/* Búsqueda y acciones */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Búsqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente, RUT, ejecutivo..."
              value={busqueda}
              onChange={(e) => onBusquedaChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            {busqueda && (
              <button
                onClick={() => onBusquedaChange('')}
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            {/* Limpiar filtros */}
            {hayFiltrosActivos() && (
              <button
                onClick={limpiarFiltros}
                className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                title="Limpiar filtros"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}

            {/* Refrescar */}
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg transition-colors flex items-center gap-2 ${
                loading
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-gray-50'
              }`}
              title="Refrescar datos"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </button>

            {/* Exportar Excel */}
            {onExportExcel && totalVentas > 0 && (
              <button
                onClick={onExportExcel}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                title="Exportar a Excel"
              >
                <Download className="h-4 w-4" />
                Excel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {(hayFiltrosActivos() || totalVentas > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Mostrando:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {totalVentas} {totalVentas === 1 ? 'venta' : 'ventas'}
            </span>

            {hayFiltrosActivos() && (
              <div className="flex flex-wrap items-center gap-2 ml-2">
                {soloValidados && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Solo validados
                  </span>
                )}

                {busqueda && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    "{busqueda.length > 20 ? busqueda.substring(0, 20) + '...' : busqueda}"
                  </span>
                )}

                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(fechaInicio).toLocaleDateString('es-CL')} - {new Date(fechaFin).toLocaleDateString('es-CL')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}