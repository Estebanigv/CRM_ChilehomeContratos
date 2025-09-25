import { isEstadoPendiente, getEstadoPrioridad } from '@/utils/contractHelpers'

interface Venta {
  id: string
  cliente_nombre: string
  cliente_rut: string
  valor_total: number | string
  fecha_venta: string
  fecha_entrega?: string
  estado_crm?: string
  ejecutivo_nombre?: string
  modelo_casa?: string
  comuna?: string
  region?: string
  numero_contrato?: string
  observaciones_crm?: string
}

interface MetricasPeriodo {
  totalVentas: number
  montoTotal: number
  promedioVenta: number
  ventasPendientes: number
  ventasCompletadas: number
  ventasRechazadas: number
  tasaConversion: number
  tiempoPromedioResolucion: number
  ventasPorDia: number
  metaCumplida: boolean
  porcentajeMeta: number
}

interface MetricasEjecutivo {
  nombre: string
  ventas: number
  monto: number
  promedio: number
  pendientes: number
  completadas: number
  rechazadas: number
  tasaExito: number
  ranking: number
}

interface Pipeline {
  etapa: string
  cantidad: number
  valor: number
  porcentaje: number
  dias_promedio: number
}

export class CRMMetrics {
  /**
   * Calcula métricas para un período específico
   */
  static calcularMetricasPeriodo(
    ventas: Venta[],
    fechaInicio: Date,
    fechaFin: Date,
    metaDiaria: number = 5
  ): MetricasPeriodo {
    // Filtrar ventas del período
    const ventasPeriodo = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha_venta)
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin
    })

    // Calcular métricas básicas
    const totalVentas = ventasPeriodo.length
    const montoTotal = ventasPeriodo.reduce((sum, v) => {
      const valor = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString() || '0')
      return sum + valor
    }, 0)

    const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0

    // Estados
    const ventasPendientes = ventasPeriodo.filter(v => isEstadoPendiente(v.estado_crm)).length
    const ventasCompletadas = ventasPeriodo.filter(v => {
      const estado = v.estado_crm?.toLowerCase() || ''
      return estado.includes('completad') || estado.includes('entrega ok')
    }).length
    const ventasRechazadas = ventasPeriodo.filter(v => {
      const estado = v.estado_crm?.toLowerCase() || ''
      return estado.includes('rechaz') || estado.includes('cancel')
    }).length

    // Tasa de conversión
    const tasaConversion = totalVentas > 0
      ? ((ventasCompletadas / totalVentas) * 100)
      : 0

    // Tiempo promedio de resolución en días
    const tiemposResolucion = ventasPeriodo
      .filter(v => v.fecha_entrega)
      .map(v => {
        const inicio = new Date(v.fecha_venta)
        const fin = new Date(v.fecha_entrega!)
        return Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
      })

    const tiempoPromedioResolucion = tiemposResolucion.length > 0
      ? tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length
      : 0

    // Ventas por día
    const diasPeriodo = Math.max(1, Math.floor(
      (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24) + 1
    ))
    const ventasPorDia = totalVentas / diasPeriodo

    // Meta
    const metaTotal = metaDiaria * diasPeriodo
    const metaCumplida = totalVentas >= metaTotal
    const porcentajeMeta = (totalVentas / metaTotal) * 100

    return {
      totalVentas,
      montoTotal,
      promedioVenta,
      ventasPendientes,
      ventasCompletadas,
      ventasRechazadas,
      tasaConversion,
      tiempoPromedioResolucion,
      ventasPorDia,
      metaCumplida,
      porcentajeMeta
    }
  }

  /**
   * Calcula métricas por ejecutivo
   */
  static calcularMetricasEjecutivos(ventas: Venta[]): MetricasEjecutivo[] {
    const ejecutivosMap = new Map<string, Venta[]>()

    // Agrupar ventas por ejecutivo
    ventas.forEach(v => {
      const ejecutivo = v.ejecutivo_nombre || 'Sin asignar'
      if (!ejecutivosMap.has(ejecutivo)) {
        ejecutivosMap.set(ejecutivo, [])
      }
      ejecutivosMap.get(ejecutivo)!.push(v)
    })

    // Calcular métricas por ejecutivo
    const metricas: MetricasEjecutivo[] = []

    ejecutivosMap.forEach((ventasEjecutivo, nombre) => {
      const ventas = ventasEjecutivo.length
      const monto = ventasEjecutivo.reduce((sum, v) => {
        const valor = typeof v.valor_total === 'number'
          ? v.valor_total
          : parseFloat(v.valor_total?.toString() || '0')
        return sum + valor
      }, 0)

      const pendientes = ventasEjecutivo.filter(v => isEstadoPendiente(v.estado_crm)).length
      const completadas = ventasEjecutivo.filter(v => {
        const estado = v.estado_crm?.toLowerCase() || ''
        return estado.includes('completad') || estado.includes('entrega ok')
      }).length
      const rechazadas = ventasEjecutivo.filter(v => {
        const estado = v.estado_crm?.toLowerCase() || ''
        return estado.includes('rechaz') || estado.includes('cancel')
      }).length

      const tasaExito = ventas > 0 ? (completadas / ventas) * 100 : 0

      metricas.push({
        nombre,
        ventas,
        monto,
        promedio: ventas > 0 ? monto / ventas : 0,
        pendientes,
        completadas,
        rechazadas,
        tasaExito,
        ranking: 0 // Se asignará después
      })
    })

    // Ordenar por ventas y asignar ranking
    metricas.sort((a, b) => b.ventas - a.ventas)
    metricas.forEach((m, index) => {
      m.ranking = index + 1
    })

    return metricas
  }

  /**
   * Calcula el pipeline de ventas
   */
  static calcularPipeline(ventas: Venta[]): Pipeline[] {
    const etapasMap = new Map<string, { ventas: Venta[], dias: number[] }>()

    // Definir orden de etapas
    const ordenEtapas = [
      'Pre-ingreso',
      'Validación',
      'Contrato',
      'Confirmación',
      'Producción',
      'Entrega OK',
      'Completado'
    ]

    // Inicializar etapas
    ordenEtapas.forEach(etapa => {
      etapasMap.set(etapa, { ventas: [], dias: [] })
    })

    // Clasificar ventas por etapa
    ventas.forEach(v => {
      const estado = v.estado_crm || 'Pre-ingreso'
      let etapaClasificada = 'Pre-ingreso'

      // Clasificar según estado
      const estadoLower = estado.toLowerCase()
      if (estadoLower.includes('validac')) etapaClasificada = 'Validación'
      else if (estadoLower.includes('contrato')) etapaClasificada = 'Contrato'
      else if (estadoLower.includes('confirmac')) etapaClasificada = 'Confirmación'
      else if (estadoLower.includes('produc')) etapaClasificada = 'Producción'
      else if (estadoLower.includes('entrega ok')) etapaClasificada = 'Entrega OK'
      else if (estadoLower.includes('completad')) etapaClasificada = 'Completado'

      const etapaData = etapasMap.get(etapaClasificada)
      if (etapaData) {
        etapaData.ventas.push(v)

        // Calcular días en esta etapa
        const diasEnEtapa = Math.floor(
          (new Date().getTime() - new Date(v.fecha_venta).getTime()) /
          (1000 * 60 * 60 * 24)
        )
        etapaData.dias.push(diasEnEtapa)
      }
    })

    // Construir pipeline
    const totalVentas = ventas.length
    const pipeline: Pipeline[] = []

    etapasMap.forEach((data, etapa) => {
      const cantidad = data.ventas.length
      const valor = data.ventas.reduce((sum, v) => {
        const val = typeof v.valor_total === 'number'
          ? v.valor_total
          : parseFloat(v.valor_total?.toString() || '0')
        return sum + val
      }, 0)

      const diasPromedio = data.dias.length > 0
        ? data.dias.reduce((a, b) => a + b, 0) / data.dias.length
        : 0

      pipeline.push({
        etapa,
        cantidad,
        valor,
        porcentaje: totalVentas > 0 ? (cantidad / totalVentas) * 100 : 0,
        dias_promedio: Math.round(diasPromedio)
      })
    })

    return pipeline
  }

  /**
   * Calcula tendencias comparando períodos
   */
  static calcularTendencias(
    ventasActual: Venta[],
    ventasAnterior: Venta[]
  ): {
    crecimientoVentas: number
    crecimientoMonto: number
    mejorDia: string
    peorDia: string
    tendencia: 'subiendo' | 'bajando' | 'estable'
  } {
    const totalActual = ventasActual.length
    const totalAnterior = ventasAnterior.length

    const montoActual = ventasActual.reduce((sum, v) => {
      const val = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString() || '0')
      return sum + val
    }, 0)

    const montoAnterior = ventasAnterior.reduce((sum, v) => {
      const val = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString() || '0')
      return sum + val
    }, 0)

    // Calcular crecimiento
    const crecimientoVentas = totalAnterior > 0
      ? ((totalActual - totalAnterior) / totalAnterior) * 100
      : 0

    const crecimientoMonto = montoAnterior > 0
      ? ((montoActual - montoAnterior) / montoAnterior) * 100
      : 0

    // Encontrar mejor y peor día
    const ventasPorDia = new Map<string, number>()
    ventasActual.forEach(v => {
      const dia = new Date(v.fecha_venta).toLocaleDateString('es-CL')
      ventasPorDia.set(dia, (ventasPorDia.get(dia) || 0) + 1)
    })

    let mejorDia = ''
    let peorDia = ''
    let maxVentas = 0
    let minVentas = Infinity

    ventasPorDia.forEach((ventas, dia) => {
      if (ventas > maxVentas) {
        maxVentas = ventas
        mejorDia = dia
      }
      if (ventas < minVentas) {
        minVentas = ventas
        peorDia = dia
      }
    })

    // Determinar tendencia
    const tendencia = crecimientoVentas > 5 ? 'subiendo' :
                      crecimientoVentas < -5 ? 'bajando' : 'estable'

    return {
      crecimientoVentas,
      crecimientoMonto,
      mejorDia,
      peorDia,
      tendencia
    }
  }

  /**
   * Genera predicciones basadas en datos históricos
   */
  static generarPredicciones(ventas: Venta[]): {
    proximaSemana: number
    proximoMes: number
    finDeMes: number
    probabilidadMeta: number
  } {
    // Calcular promedio de ventas de los últimos 30 días
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const ventasUltimos30Dias = ventas.filter(v =>
      new Date(v.fecha_venta) >= hace30Dias
    )

    const promedioDiario = ventasUltimos30Dias.length / 30

    // Predicciones simples basadas en promedio
    const proximaSemana = Math.round(promedioDiario * 7)
    const proximoMes = Math.round(promedioDiario * 30)

    // Días restantes del mes actual
    const hoy = new Date()
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    const diasRestantes = Math.floor(
      (finMes.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    )

    const finDeMes = Math.round(promedioDiario * diasRestantes)

    // Probabilidad de cumplir meta mensual (meta de 150 ventas/mes)
    const ventasEsteMes = ventas.filter(v => {
      const fecha = new Date(v.fecha_venta)
      return fecha.getMonth() === hoy.getMonth() &&
             fecha.getFullYear() === hoy.getFullYear()
    }).length

    const proyeccionTotal = ventasEsteMes + finDeMes
    const probabilidadMeta = Math.min(100, (proyeccionTotal / 150) * 100)

    return {
      proximaSemana,
      proximoMes,
      finDeMes,
      probabilidadMeta
    }
  }
}