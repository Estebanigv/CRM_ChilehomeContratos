'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, RotateCcw, TrendingUp } from 'lucide-react'

interface DateComparisonPickerProps {
  primaryStartDate: string
  primaryEndDate: string
  compareStartDate?: string
  compareEndDate?: string
  onPrimaryDateChange: (startDate: string, endDate: string) => void
  onCompareDateChange?: (startDate: string, endDate: string) => void
  enableComparison?: boolean
  onComparisonToggle?: (enabled: boolean) => void
  className?: string
}

interface DatePreset {
  label: string
  value: string
  primary: { start: Date; end: Date }
  compare?: { start: Date; end: Date }
}

const DateComparisonPicker: React.FC<DateComparisonPickerProps> = ({
  primaryStartDate,
  primaryEndDate,
  compareStartDate,
  compareEndDate,
  onPrimaryDateChange,
  onCompareDateChange,
  enableComparison = false,
  onComparisonToggle,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const [comparisonEnabled, setComparisonEnabled] = useState(enableComparison)
  const containerRef = useRef<HTMLDivElement>(null)

  // Inicializar automáticamente con mes anterior - solo una vez
  useEffect(() => {
    if (!primaryStartDate || !primaryEndDate) {
      const presets = getDatePresets()
      const mesActualPreset = presets.find(p => p.value === 'this_month_vs_last_month')
      if (mesActualPreset) {
        handlePresetSelect(mesActualPreset)
      }
    }
  }, []) // Solo ejecutar una vez al montar

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getDatePresets = (): DatePreset[] => {
    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // Este mes
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Mes anterior
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    // Este año
    const thisYearStart = new Date(today.getFullYear(), 0, 1)
    const thisYearEnd = new Date(today.getFullYear(), 11, 31)

    // Año anterior
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1)
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)

    // Últimos 7 días
    const last7DaysStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const prev7DaysStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
    const prev7DaysEnd = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)

    // Últimos 30 días
    const last30DaysStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const prev30DaysStart = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)
    const prev30DaysEnd = new Date(today.getTime() - 31 * 24 * 60 * 60 * 1000)

    return [
      {
        label: 'Hoy vs Ayer',
        value: 'today_vs_yesterday',
        primary: { start: today, end: today },
        compare: { start: yesterday, end: yesterday }
      },
      {
        label: 'Últimos 7 días',
        value: 'last_7_days',
        primary: { start: last7DaysStart, end: today },
        compare: { start: prev7DaysStart, end: prev7DaysEnd }
      },
      {
        label: 'Últimos 30 días',
        value: 'last_30_days',
        primary: { start: last30DaysStart, end: today },
        compare: { start: prev30DaysStart, end: prev30DaysEnd }
      },
      {
        label: 'Este mes vs Mes anterior',
        value: 'this_month_vs_last_month',
        primary: { start: thisMonthStart, end: today },
        compare: { start: lastMonthStart, end: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()) }
      },
      {
        label: 'Este año vs Año anterior',
        value: 'this_year_vs_last_year',
        primary: { start: thisYearStart, end: thisYearEnd },
        compare: { start: lastYearStart, end: lastYearEnd }
      }
    ]
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    // Agregar 'T00:00:00' para evitar problemas de timezone
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatDateRange = (start: string, end: string): string => {
    if (!start || !end) return 'Seleccionar período'
    if (start === end) return formatDate(start)
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const dateToString = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const handlePresetSelect = (preset: DatePreset) => {
    // Aplicar fechas primarias
    onPrimaryDateChange(
      dateToString(preset.primary.start),
      dateToString(preset.primary.end)
    )

    // Aplicar fechas de comparación si están disponibles
    if (preset.compare && onCompareDateChange) {
      onCompareDateChange(
        dateToString(preset.compare.start),
        dateToString(preset.compare.end)
      )
      setComparisonEnabled(true)
      onComparisonToggle?.(true)
    }

    setIsOpen(false)
  }

  const handleComparisonToggle = () => {
    const newState = !comparisonEnabled
    setComparisonEnabled(newState)
    onComparisonToggle?.(newState)
  }

  const handleApplyDates = () => {
    // Aplicar las fechas principales
    if (primaryStartDate && primaryEndDate && onPrimaryDateChange) {
      onPrimaryDateChange(primaryStartDate, primaryEndDate)
    }

    // Aplicar las fechas de comparación si están habilitadas
    if (comparisonEnabled && compareStartDate && compareEndDate && onCompareDateChange) {
      onCompareDateChange(compareStartDate, compareEndDate)
    }

    setIsOpen(false)
  }

  const getCurrentPeriodLabel = (): string => {
    if (!primaryStartDate || !primaryEndDate) return 'Seleccionar período'

    const start = new Date(primaryStartDate)
    const end = new Date(primaryEndDate)
    const today = new Date()

    // Verificar si es hoy
    if (start.toDateString() === today.toDateString() && end.toDateString() === today.toDateString()) {
      return 'Hoy'
    }

    // Verificar si es este mes
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    if (start.getTime() === thisMonthStart.getTime() && end.getTime() === thisMonthEnd.getTime()) {
      return 'Este mes'
    }

    // Verificar si es este año
    const thisYearStart = new Date(today.getFullYear(), 0, 1)
    const thisYearEnd = new Date(today.getFullYear(), 11, 31)
    if (start.getTime() === thisYearStart.getTime() && end.getTime() === thisYearEnd.getTime()) {
      return 'Este año'
    }

    return formatDateRange(primaryStartDate, primaryEndDate)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors min-w-[280px]"
      >
        <Calendar className="h-5 w-5 text-blue-600" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {getCurrentPeriodLabel()}
          </div>
          {comparisonEnabled && compareStartDate && compareEndDate && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              vs {formatDateRange(compareStartDate, compareEndDate)}
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Seleccionar período</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Comparison Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={comparisonEnabled}
                onChange={handleComparisonToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Comparar con período anterior</span>
            </label>
          </div>

          {/* Quick Presets */}
          {showPresets && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Períodos frecuentes</h4>
              <div className="space-y-2">
                {getDatePresets().map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Date Inputs */}
          <div className="space-y-4">
            {/* Primary Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período principal
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={primaryStartDate}
                    onChange={(e) => onPrimaryDateChange(e.target.value, primaryEndDate)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={primaryEndDate}
                    onChange={(e) => onPrimaryDateChange(primaryStartDate, e.target.value)}
                    min={primaryStartDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Comparison Period */}
            {comparisonEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período de comparación
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Desde</label>
                    <input
                      type="date"
                      value={compareStartDate || ''}
                      onChange={(e) => onCompareDateChange?.(e.target.value, compareEndDate || '')}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={compareEndDate || ''}
                      onChange={(e) => onCompareDateChange?.(compareStartDate || '', e.target.value)}
                      min={compareStartDate || undefined}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Reset to "Este mes vs Mes anterior"
                const presets = getDatePresets()
                const mesActualPreset = presets.find(p => p.value === 'this_month_vs_last_month')
                if (mesActualPreset) {
                  handlePresetSelect(mesActualPreset)
                }
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer
            </button>
            <button
              onClick={handleApplyDates}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateComparisonPicker