import { useState, useEffect, useCallback } from 'react'
import { cacheManager } from '@/lib/cacheManager'
import { Venta } from '@/types'

interface DashboardFilters {
  fechaInicio: string
  fechaFin: string
  soloValidados: boolean
  busqueda: string
}

interface DashboardState {
  ventas: Venta[]
  loading: boolean
  error: string | null
  filtering: boolean
  totalVentas: number
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    ventas: [],
    loading: true,
    error: null,
    filtering: false,
    totalVentas: 0
  })

  const [filters, setFilters] = useState<DashboardFilters>({
    fechaInicio: '2025-09-01',
    fechaFin: '2025-09-22',
    soloValidados: false,
    busqueda: ''
  })

  // Función para obtener ventas con cache
  const fetchVentas = useCallback(async (
    fechaInicio: string,
    fechaFin: string,
    soloValidados: boolean = false,
    source: string = 'general'
  ) => {
    try {
      setState(prev => ({ ...prev, filtering: true, error: null }))

      const cacheKey = `ventas_${fechaInicio}_${fechaFin}_${soloValidados}`

      const result = await cacheManager.fetchWithCache(
        cacheKey,
        async () => {
          const params = new URLSearchParams({
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
          })

          const response = await fetch(`/api/crm/ventas?${params}`)
          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
          }

          const data = await response.json()
          if (!data.success) {
            throw new Error(data.error || 'Error obteniendo ventas')
          }

          return data.ventas || []
        },
        5 // Cache por 5 minutos
      )

      // Aplicar filtros locales
      let ventasFiltradas = result

      if (soloValidados) {
        ventasFiltradas = result.filter((v: Venta) =>
          v.estado_crm && !v.estado_crm.toLowerCase().includes('pendiente')
        )
      }

      setState(prev => ({
        ...prev,
        ventas: ventasFiltradas,
        loading: false,
        filtering: false,
        totalVentas: ventasFiltradas.length
      }))

    } catch (error) {
      console.error('Error fetching ventas:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
        loading: false,
        filtering: false
      }))
    }
  }, [])

  // Aplicar filtros de búsqueda
  const ventasActuales = state.ventas.filter(venta => {
    if (!filters.busqueda) return true

    const busquedaLower = filters.busqueda.toLowerCase()
    return (
      venta.cliente_nombre?.toLowerCase().includes(busquedaLower) ||
      venta.cliente_rut?.toLowerCase().includes(busquedaLower) ||
      venta.ejecutivo_nombre?.toLowerCase().includes(busquedaLower) ||
      venta.numero_contrato?.toLowerCase().includes(busquedaLower)
    )
  })

  // Efecto inicial para cargar datos
  useEffect(() => {
    fetchVentas(filters.fechaInicio, filters.fechaFin, filters.soloValidados, 'inicial')
  }, [fetchVentas])

  return {
    // Estado
    ventas: ventasActuales,
    loading: state.loading,
    error: state.error,
    filtering: state.filtering,
    totalVentas: ventasActuales.length,

    // Filtros
    filters,
    setFilters,

    // Acciones
    fetchVentas,
    refetch: () => fetchVentas(filters.fechaInicio, filters.fechaFin, filters.soloValidados, 'refetch'),

    // Utilidades
    invalidateCache: () => cacheManager.invalidatePattern('ventas_'),
    setBusqueda: (busqueda: string) => setFilters(prev => ({ ...prev, busqueda }))
  }
}