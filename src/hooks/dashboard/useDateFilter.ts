import { useState, useCallback, useMemo } from 'react'

interface DateRange {
  inicio: string
  fin: string
}

interface UseDateFilterReturn {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  resetToCurrentMonth: () => void
  resetToToday: () => void
  resetToLastWeek: () => void
  resetToLastMonth: () => void
  filterData: <T extends { fecha_venta?: string; fecha?: string }>(data: T[]) => T[]
  isWithinRange: (date: string) => boolean
}

export const useDateFilter = (initialRange?: DateRange): UseDateFilterReturn => {
  const getDefaultRange = useCallback((): DateRange => {
    const hoy = new Date()
    const fechaInicioDefecto = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const fechaFinDefecto = hoy.toISOString().split('T')[0]
    return {
      inicio: fechaInicioDefecto,
      fin: fechaFinDefecto
    }
  }, [])

  const [dateRange, setDateRange] = useState<DateRange>(
    initialRange || getDefaultRange()
  )

  const resetToCurrentMonth = useCallback(() => {
    setDateRange(getDefaultRange())
  }, [getDefaultRange])

  const resetToToday = useCallback(() => {
    const hoy = new Date().toISOString().split('T')[0]
    setDateRange({
      inicio: hoy,
      fin: hoy
    })
  }, [])

  const resetToLastWeek = useCallback(() => {
    const hoy = new Date()
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000)
    setDateRange({
      inicio: hace7Dias.toISOString().split('T')[0],
      fin: hoy.toISOString().split('T')[0]
    })
  }, [])

  const resetToLastMonth = useCallback(() => {
    const hoy = new Date()
    const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    setDateRange({
      inicio: mesAnterior.toISOString().split('T')[0],
      fin: finMesAnterior.toISOString().split('T')[0]
    })
  }, [])

  const isWithinRange = useCallback((date: string): boolean => {
    if (!date) return false
    const fechaObj = new Date(date)
    const inicio = new Date(dateRange.inicio)
    const fin = new Date(dateRange.fin)

    // Ajustar las horas para comparación correcta
    inicio.setHours(0, 0, 0, 0)
    fin.setHours(23, 59, 59, 999)
    fechaObj.setHours(12, 0, 0, 0)

    return fechaObj >= inicio && fechaObj <= fin
  }, [dateRange])

  const filterData = useCallback(<T extends { fecha_venta?: string; fecha?: string }>(
    data: T[]
  ): T[] => {
    return data.filter(item => {
      const fecha = item.fecha_venta || item.fecha
      return fecha ? isWithinRange(fecha) : false
    })
  }, [isWithinRange])

  return useMemo(() => ({
    dateRange,
    setDateRange,
    resetToCurrentMonth,
    resetToToday,
    resetToLastWeek,
    resetToLastMonth,
    filterData,
    isWithinRange
  }), [
    dateRange,
    resetToCurrentMonth,
    resetToToday,
    resetToLastWeek,
    resetToLastMonth,
    filterData,
    isWithinRange
  ])
}

// Hook para múltiples filtros de fecha independientes
interface MultipleDateFilters {
  [key: string]: DateRange
}

export const useMultipleDateFilters = (
  sections: string[]
): Record<string, UseDateFilterReturn> => {
  const filters: Record<string, UseDateFilterReturn> = {}

  sections.forEach(section => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    filters[section] = useDateFilter()
  })

  return filters
}