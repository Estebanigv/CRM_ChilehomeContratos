import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Venta } from '@/types'

interface UseVentasCRMOptions {
  fechaInicio?: string
  fechaFin?: string
  ejecutivo?: string
  estado?: string
  autoRefresh?: boolean
  refreshInterval?: number // en milisegundos, default 30 minutos
}

interface UseVentasCRMReturn {
  ventas: Venta[]
  loading: boolean
  error: string | null
  totalVentas: number
  ultimaActualizacion: string | null
  refetch: () => Promise<void>
  estadisticas: {
    porEstado: Record<string, number>
    porEjecutivo: Record<string, number>
    montoTotal: number
    promedioVenta: number
  }
}

export function useVentasCRM(options: UseVentasCRMOptions = {}): UseVentasCRMReturn {
  const {
    fechaInicio,
    fechaFin,
    ejecutivo,
    estado,
    autoRefresh = false,
    refreshInterval = 30 * 60 * 1000 // 30 minutos
  } = options

  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(null)

  const supabase = createClient()

  const fetchVentas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('ventas_crm')
        .select('*')
        .order('fecha_venta', { ascending: false })

      // Aplicar filtros
      if (fechaInicio) {
        query = query.gte('fecha_venta', fechaInicio)
      }

      if (fechaFin) {
        query = query.lte('fecha_venta', fechaFin)
      }

      if (ejecutivo) {
        query = query.ilike('ejecutivo_nombre', `%${ejecutivo}%`)
      }

      if (estado) {
        query = query.eq('estado_crm', estado)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw new Error(`Error cargando ventas: ${fetchError.message}`)
      }

      // Convertir los datos de Supabase al formato esperado por la aplicación
      const ventasFormateadas: Venta[] = (data || []).map(venta => ({
        id: parseInt(venta.id) || 0,
        cliente_nombre: venta.cliente_nombre || '',
        cliente_rut: venta.cliente_rut || '',
        cliente_telefono: venta.cliente_telefono || '',
        cliente_correo: venta.cliente_correo || '',
        direccion_entrega: venta.direccion_entrega || '',
        valor_total: venta.valor_total || 0,
        modelo_casa: venta.modelo_casa || '',
        detalle_materiales: venta.detalle_materiales || '',
        fecha_venta: venta.fecha_venta,
        fecha_entrega: venta.fecha_entrega,
        ejecutivo_id: venta.ejecutivo_id || '',
        ejecutivo_nombre: venta.ejecutivo_nombre || '',
        supervisor_nombre: venta.supervisor_nombre || '',
        estado_crm: venta.estado_crm || '',
        observaciones_crm: venta.observaciones_crm || '',
        numero_contrato: venta.numero_contrato || '',
        // Campos adicionales que puede necesitar la aplicación
        created_at: venta.created_at,
        updated_at: venta.updated_at
      }))

      setVentas(ventasFormateadas)
      setUltimaActualizacion(new Date().toISOString())

      console.log(`✅ Cargadas ${ventasFormateadas.length} ventas desde Supabase`)

    } catch (err) {
      console.error('❌ Error cargando ventas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [fechaInicio, fechaFin, ejecutivo, estado])

  // Cargar datos al montar el componente o cambiar filtros
  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefresh) return

    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refresh: Actualizando ventas desde Supabase')
      fetchVentas()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, fetchVentas])

  // Calcular estadísticas
  const estadisticas = {
    porEstado: ventas.reduce((acc, venta) => {
      const estado = venta.estado_crm || 'Sin estado'
      acc[estado] = (acc[estado] || 0) + 1
      return acc
    }, {} as Record<string, number>),

    porEjecutivo: ventas.reduce((acc, venta) => {
      const ejecutivo = venta.ejecutivo_nombre || 'Sin ejecutivo'
      acc[ejecutivo] = (acc[ejecutivo] || 0) + 1
      return acc
    }, {} as Record<string, number>),

    montoTotal: ventas.reduce((sum, venta) => sum + (venta.valor_total || 0), 0),

    promedioVenta: ventas.length > 0
      ? ventas.reduce((sum, venta) => sum + (venta.valor_total || 0), 0) / ventas.length
      : 0
  }

  return {
    ventas,
    loading,
    error,
    totalVentas: ventas.length,
    ultimaActualizacion,
    refetch: fetchVentas,
    estadisticas
  }
}

// Hook específico para obtener estadísticas de sincronización
export function useSyncStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/crm/sync')
      const data = await response.json()

      if (data.success) {
        setStats(data.estadisticas)
      } else {
        throw new Error(data.details || 'Error cargando estadísticas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}