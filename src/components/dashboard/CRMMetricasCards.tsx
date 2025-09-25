'use client'

import React, { useState } from 'react'
import {
  BarChart3, Calendar, Check, RefreshCw, ChevronDown
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { getEstadoStyle, getEstadoColor } from '@/utils/contractHelpers'
import { Venta } from '@/types'

interface CRMMetricasCardsProps {
  ventas: Venta[]
  filtros: {
    estado: string
  }
  onFiltroChange: (campo: string, valor: string) => void
  fechaInicio: string
  fechaFin: string
  onFechaChange: (inicio: string, fin: string) => void
}

export default function CRMMetricasCards({
  ventas,
  filtros,
  onFiltroChange,
  fechaInicio,
  fechaFin,
  onFechaChange
}: CRMMetricasCardsProps) {
  const [activeCardCalendar, setActiveCardCalendar] = useState<string | null>(null)
  const [cardDateRanges, setCardDateRanges] = useState({
    totalVentas: { inicio: fechaInicio, fin: fechaFin }
  })

  // Calcular estadísticas locales
  const statsLocales = {
    totalVentas: ventas.length,
    montoTotal: ventas.reduce((sum, v) => {
      const valor = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
      return sum + valor
    }, 0)
  }

  // Agrupar ventas por estado
  const estadosMap = new Map()
  ventas.forEach(venta => {
    const estado = venta.estado_crm || 'Sin estado'
    estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1)
  })

  // Convertir a array y ordenar por cantidad descendente
  const estadosOrdenados = Array.from(estadosMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) // Mostrar top 5 estados

  return (
    <div className="flex gap-4 w-full mb-8">
      {/* Ventas Totales */}
      <div
        className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 flex-1 transition-all duration-200 relative ${
          !filtros.estado ? 'ring-2 ring-blue-200 dark:ring-blue-700 bg-blue-50 dark:bg-blue-900/20' : 'hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-700 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => onFiltroChange('estado', '')}
          >
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsLocales.totalVentas.toLocaleString()}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ventas totales</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mini calendario */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveCardCalendar(activeCardCalendar === 'totalVentas' ? null : 'totalVentas')
                }}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Personalizar período"
              >
                <Calendar className="h-4 w-4" />
              </button>

              {activeCardCalendar === 'totalVentas' && (
                <div className="absolute top-8 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[280px]">
                  <div className="space-y-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 pb-2">
                      Período personalizado - Ventas totales
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Desde</label>
                        <input
                          type="date"
                          value={cardDateRanges.totalVentas.inicio}
                          onChange={(e) => setCardDateRanges(prev => ({
                            ...prev,
                            totalVentas: { ...prev.totalVentas, inicio: e.target.value }
                          }))}
                          className="w-full text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded px-2 py-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">Hasta</label>
                        <input
                          type="date"
                          value={cardDateRanges.totalVentas.fin}
                          onChange={(e) => setCardDateRanges(prev => ({
                            ...prev,
                            totalVentas: { ...prev.totalVentas, fin: e.target.value }
                          }))}
                          className="w-full text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setCardDateRanges(prev => ({
                            ...prev,
                            totalVentas: { inicio: fechaInicio, fin: fechaFin }
                          }))
                        }}
                        className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => {
                          onFechaChange(cardDateRanges.totalVentas.inicio, cardDateRanges.totalVentas.fin)
                          setActiveCardCalendar(null)
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!filtros.estado && (
              <div className="text-blue-600">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estados del CRM dinámicamente */}
      {estadosOrdenados.map(([estado, cantidad], index) => {
        const isSelected = filtros.estado === estado
        const colorClass = getEstadoColor(estado)

        return (
          <div
            key={estado}
            className={`bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 flex-1 transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'ring-2 ring-blue-200 dark:ring-blue-700 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => onFiltroChange('estado', isSelected ? '' : estado)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                <span className="text-lg font-bold text-white">
                  {index + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{cantidad.toLocaleString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={estado}>
                  {estado.length > 12 ? estado.substring(0, 12) + '...' : estado}
                </p>
              </div>
              {isSelected && (
                <div className="text-blue-600">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Monto Total */}
      <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-4 flex-1 transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 hover:border-gray-300 dark:hover:border-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">$</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(statsLocales.montoTotal)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monto total</p>
          </div>
        </div>
      </div>
    </div>
  )
}