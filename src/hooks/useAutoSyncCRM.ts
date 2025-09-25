import { useState, useEffect, useCallback } from 'react'

interface AutoSyncStatus {
  isActive: boolean
  isCompleted: boolean
  error: string | null
  progress: {
    totalVentas: number
    ventasNuevas: number
    ventasActualizadas: number
    duracion?: number
  }
}

interface UseAutoSyncCRMOptions {
  enabled?: boolean
  forceSync?: boolean // Forzar sincronización aunque ya se haya hecho hoy
}

export function useAutoSyncCRM(options: UseAutoSyncCRMOptions = {}) {
  const { enabled = true, forceSync = false } = options

  const [status, setStatus] = useState<AutoSyncStatus>({
    isActive: false,
    isCompleted: false,
    error: null,
    progress: {
      totalVentas: 0,
      ventasNuevas: 0,
      ventasActualizadas: 0
    }
  })

  const obtenerFechasDelMesActual = () => {
    const hoy = new Date()
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    return {
      fechaInicio: primerDiaDelMes.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    }
  }

  const verificarSiNecesitaSincronizacion = async (): Promise<boolean> => {
    try {
      // Si forzamos la sincronización, siempre retornar true
      if (forceSync) return true

      // Verificar si ya se hizo sincronización hoy usando el endpoint de auto-sync simple
      const response = await fetch('/api/crm/auto-sync-simple')
      const data = await response.json()

      if (!data.success) return true // Si hay error, mejor sincronizar

      // En la versión simple, siempre permitimos sync (hasta que las tablas estén configuradas)
      const necesitaSync = true

      console.log(`🔍 Verificación sincronización simple:`, {
        necesitaSync,
        message: data.message
      })

      return necesitaSync

    } catch (error) {
      console.warn('⚠️ Error verificando necesidad de sincronización, ejecutando por seguridad:', error)
      return true // En caso de error, mejor sincronizar
    }
  }

  const ejecutarSincronizacion = useCallback(async () => {
    if (!enabled) {
      console.log('🚫 Auto-sync deshabilitado')
      return
    }

    try {
      setStatus(prev => ({
        ...prev,
        isActive: true,
        isCompleted: false,
        error: null
      }))

      console.log('🔍 Verificando si necesita sincronización...')
      const necesitaSync = await verificarSiNecesitaSincronizacion()

      if (!necesitaSync) {
        console.log('✅ Sincronización no necesaria - datos actuales')
        setStatus(prev => ({
          ...prev,
          isActive: false,
          isCompleted: true
        }))
        return
      }

      const { fechaInicio, fechaFin } = obtenerFechasDelMesActual()

      console.log(`🔄 Iniciando auto-sincronización del mes actual: ${fechaInicio} → ${fechaFin}`)

      const startTime = Date.now()

      const response = await fetch('/api/crm/auto-sync-simple', {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        const duracion = Math.round((Date.now() - startTime) / 1000)

        console.log('✅ Auto-sincronización completada:', {
          ...data.estadisticas,
          duracion
        })

        setStatus({
          isActive: false,
          isCompleted: true,
          error: null,
          progress: {
            totalVentas: data.estadisticas?.totalVentasProcesadas || 0,
            ventasNuevas: data.estadisticas?.ventasNuevas || 0,
            ventasActualizadas: data.estadisticas?.ventasActualizadas || 0,
            duracion
          }
        })
      } else {
        throw new Error(data.details || 'Error en sincronización automática')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error en auto-sincronización:', errorMessage)

      setStatus(prev => ({
        ...prev,
        isActive: false,
        error: errorMessage
      }))
    }
  }, [enabled, forceSync])

  // Ejecutar sincronización al montar el componente
  useEffect(() => {
    // Pequeño delay para no bloquear la carga inicial de la UI
    const timer = setTimeout(() => {
      ejecutarSincronizacion()
    }, 2000) // 2 segundos de delay

    return () => clearTimeout(timer)
  }, [ejecutarSincronizacion])

  return {
    status,
    ejecutarSincronizacion,
    fechasActuales: obtenerFechasDelMesActual()
  }
}