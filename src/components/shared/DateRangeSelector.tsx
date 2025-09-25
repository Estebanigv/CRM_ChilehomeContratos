'use client'

import React from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import CustomDatePicker from './CustomDatePicker'

interface DateRangeSelectorProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onPresetSelect?: (preset: string) => void
  title?: string
  showPresets?: boolean
  compact?: boolean
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPresetSelect,
  title = 'Filtrar por fecha',
  showPresets = true,
  compact = false
}) => {
  const [showPresetMenu, setShowPresetMenu] = React.useState(false)

  const presets = [
    { label: 'Hoy', value: 'today' },
    { label: 'Ayer', value: 'yesterday' },
    { label: 'Últimos 7 días', value: 'last7days' },
    { label: 'Últimos 30 días', value: 'last30days' },
    { label: 'Este mes', value: 'thisMonth' },
    { label: 'Mes anterior', value: 'lastMonth' },
    { label: 'Este año', value: 'thisYear' }
  ]

  const handlePresetSelect = (preset: string) => {
    const hoy = new Date()
    let inicio: Date
    let fin: Date = new Date(hoy)

    switch (preset) {
      case 'today':
        inicio = new Date(hoy)
        break
      case 'yesterday':
        inicio = new Date(hoy.getTime() - 24 * 60 * 60 * 1000)
        fin = new Date(inicio)
        break
      case 'last7days':
        inicio = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last30days':
        inicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'thisMonth':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        break
      case 'lastMonth':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
        break
      case 'thisYear':
        inicio = new Date(hoy.getFullYear(), 0, 1)
        break
      default:
        return
    }

    onStartDateChange(inicio.toISOString().split('T')[0])
    onEndDateChange(fin.toISOString().split('T')[0])
    setShowPresetMenu(false)

    if (onPresetSelect) {
      onPresetSelect(preset)
    }
  }

  const formatDateDisplay = (start: string, end: string): string => {
    if (start === end) {
      return new Date(start).toLocaleDateString('es-CL')
    }
    return `${new Date(start).toLocaleDateString('es-CL')} - ${new Date(end).toLocaleDateString('es-CL')}`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <CustomDatePicker
          selectedDate={startDate}
          onChange={onStartDateChange}
          placeholder="Desde"
          minDate=""
          maxDate={endDate}
        />
        <span className="text-gray-500">-</span>
        <CustomDatePicker
          selectedDate={endDate}
          onChange={onEndDateChange}
          placeholder="Hasta"
          minDate={startDate}
          maxDate=""
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {title}
        </h3>
        {showPresets && (
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Rangos rápidos
              <ChevronDown className="h-3 w-3" />
            </button>
            {showPresetMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {presets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => handlePresetSelect(preset.value)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600 text-center py-2 bg-gray-50 rounded">
          {formatDateDisplay(startDate, endDate)}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Desde</label>
            <CustomDatePicker
              selectedDate={startDate}
              onChange={onStartDateChange}
              placeholder="Seleccionar"
              minDate=""
              maxDate={endDate}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Hasta</label>
            <CustomDatePicker
              selectedDate={endDate}
              onChange={onEndDateChange}
              placeholder="Seleccionar"
              minDate={startDate}
              maxDate=""
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DateRangeSelector