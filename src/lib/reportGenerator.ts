import { ExcelExporter } from './excelExporter'
import { CRMMetrics } from './crmMetrics'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface ReportConfig {
  tipo: 'diario' | 'semanal' | 'mensual' | 'personalizado'
  formato: 'excel' | 'pdf' | 'csv'
  destinatarios: string[]
  incluir: {
    resumen_ejecutivo: boolean
    detalle_ventas: boolean
    metricas_crm: boolean
    ranking_ejecutivos: boolean
    pipeline: boolean
    comparaciones: boolean
    graficos: boolean
  }
  filtros?: {
    ejecutivos?: string[]
    estados?: string[]
    fecha_inicio?: string
    fecha_fin?: string
    monto_minimo?: number
    monto_maximo?: number
  }
}

interface ReportData {
  metadatos: {
    titulo: string
    periodo: string
    fecha_generacion: string
    generado_por: string
    total_registros: number
  }
  resumen_ejecutivo: {
    ventas_totales: number
    monto_total: number
    promedio_venta: number
    meta_cumplida: boolean
    crecimiento_vs_anterior: number
    destacados: string[]
    alertas: string[]
  }
  metricas_detalladas: any
  ventas: any[]
  ejecutivos: any[]
  comparaciones: any
}

export class ReportGenerator {
  /**
   * Genera un reporte completo
   */
  static async generateReport(
    config: ReportConfig,
    ventas: any[],
    usuario: string = 'Sistema'
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log(`📊 Generando reporte ${config.tipo} - ${config.formato}`)

      // Filtrar datos según configuración
      const ventasFiltradas = this.applyFilters(ventas, config.filtros)

      // Calcular período
      const periodo = this.calculatePeriod(config.tipo, config.filtros)

      // Generar datos del reporte
      const reportData = this.generateReportData(
        ventasFiltradas,
        periodo,
        config,
        usuario
      )

      // Generar archivo según formato
      let result: { success: boolean; fileName?: string; error?: string }

      switch (config.formato) {
        case 'excel':
          result = this.generateExcelReport(reportData, config)
          break
        case 'pdf':
          result = this.generatePDFReport(reportData, config)
          break
        case 'csv':
          result = this.generateCSVReport(reportData, config)
          break
        default:
          throw new Error(`Formato ${config.formato} no soportado`)
      }

      if (result.success && config.destinatarios.length > 0) {
        // Enviar por email (implementar más tarde)
        console.log(`📧 Enviando reporte a: ${config.destinatarios.join(', ')}`)
      }

      return {
        success: result.success,
        filePath: result.fileName,
        error: result.error
      }

    } catch (error) {
      console.error('Error generando reporte:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Aplica filtros a los datos
   */
  private static applyFilters(ventas: any[], filtros?: ReportConfig['filtros']): any[] {
    if (!filtros) return ventas

    return ventas.filter(venta => {
      // Filtro por ejecutivos
      if (filtros.ejecutivos && filtros.ejecutivos.length > 0) {
        if (!filtros.ejecutivos.includes(venta.ejecutivo_nombre)) {
          return false
        }
      }

      // Filtro por estados
      if (filtros.estados && filtros.estados.length > 0) {
        if (!filtros.estados.includes(venta.estado_crm)) {
          return false
        }
      }

      // Filtro por fechas
      if (filtros.fecha_inicio) {
        if (new Date(venta.fecha_venta) < new Date(filtros.fecha_inicio)) {
          return false
        }
      }

      if (filtros.fecha_fin) {
        if (new Date(venta.fecha_venta) > new Date(filtros.fecha_fin)) {
          return false
        }
      }

      // Filtro por monto
      const valor = typeof venta.valor_total === 'number'
        ? venta.valor_total
        : parseFloat(venta.valor_total?.toString() || '0')

      if (filtros.monto_minimo && valor < filtros.monto_minimo) {
        return false
      }

      if (filtros.monto_maximo && valor > filtros.monto_maximo) {
        return false
      }

      return true
    })
  }

  /**
   * Calcula el período del reporte
   */
  private static calculatePeriod(
    tipo: ReportConfig['tipo'],
    filtros?: ReportConfig['filtros']
  ) {
    const hoy = new Date()

    if (tipo === 'personalizado' && filtros?.fecha_inicio && filtros?.fecha_fin) {
      return {
        inicio: new Date(filtros.fecha_inicio),
        fin: new Date(filtros.fecha_fin),
        label: `${formatDate(filtros.fecha_inicio)} - ${formatDate(filtros.fecha_fin)}`
      }
    }

    switch (tipo) {
      case 'diario':
        return {
          inicio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
          fin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59),
          label: `Reporte Diario - ${formatDate(hoy.toISOString())}`
        }

      case 'semanal':
        const inicioSemana = new Date(hoy)
        inicioSemana.setDate(hoy.getDate() - hoy.getDay())
        const finSemana = new Date(inicioSemana)
        finSemana.setDate(finSemana.getDate() + 6)
        finSemana.setHours(23, 59, 59)

        return {
          inicio: inicioSemana,
          fin: finSemana,
          label: `Reporte Semanal - Semana del ${formatDate(inicioSemana.toISOString())}`
        }

      case 'mensual':
        return {
          inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
          fin: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59),
          label: `Reporte Mensual - ${hoy.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}`
        }

      default:
        return {
          inicio: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
          fin: hoy,
          label: 'Reporte Personalizado'
        }
    }
  }

  /**
   * Genera los datos del reporte
   */
  private static generateReportData(
    ventas: any[],
    periodo: any,
    config: ReportConfig,
    usuario: string
  ): ReportData {
    // Calcular métricas
    const metricas = CRMMetrics.calcularMetricasPeriodo(
      ventas,
      periodo.inicio,
      periodo.fin
    )

    const ejecutivos = CRMMetrics.calcularMetricasEjecutivos(ventas)
    const pipeline = CRMMetrics.calcularPipeline(ventas)

    // Generar destacados y alertas
    const destacados = []
    const alertas = []

    if (metricas.metaCumplida) {
      destacados.push(`✅ Meta cumplida: ${metricas.totalVentas} ventas`)
    } else {
      alertas.push(`⚠️ Meta no cumplida: ${metricas.totalVentas}/${Math.round(metricas.porcentajeMeta)} ventas`)
    }

    if (metricas.ventasPendientes > 10) {
      alertas.push(`🔴 ${metricas.ventasPendientes} contratos pendientes requieren atención`)
    }

    if (ejecutivos.length > 0) {
      destacados.push(`🏆 Mejor ejecutivo: ${ejecutivos[0].nombre} (${ejecutivos[0].ventas} ventas)`)
    }

    return {
      metadatos: {
        titulo: periodo.label,
        periodo: `${formatDate(periodo.inicio.toISOString())} - ${formatDate(periodo.fin.toISOString())}`,
        fecha_generacion: new Date().toISOString(),
        generado_por: usuario,
        total_registros: ventas.length
      },
      resumen_ejecutivo: {
        ventas_totales: metricas.totalVentas,
        monto_total: metricas.montoTotal,
        promedio_venta: metricas.promedioVenta,
        meta_cumplida: metricas.metaCumplida,
        crecimiento_vs_anterior: 0, // TODO: Calcular comparación
        destacados,
        alertas
      },
      metricas_detalladas: metricas,
      ventas: config.incluir.detalle_ventas ? ventas : [],
      ejecutivos: config.incluir.ranking_ejecutivos ? ejecutivos : [],
      comparaciones: config.incluir.comparaciones ? {} : null
    }
  }

  /**
   * Genera reporte en Excel
   */
  private static generateExcelReport(
    data: ReportData,
    config: ReportConfig
  ): { success: boolean; fileName?: string; error?: string } {
    try {
      const sheets = []

      // Hoja 1: Resumen Ejecutivo
      if (config.incluir.resumen_ejecutivo) {
        const resumenData = [
          { Campo: 'Período', Valor: data.metadatos.periodo },
          { Campo: 'Total Ventas', Valor: data.resumen_ejecutivo.ventas_totales },
          { Campo: 'Monto Total', Valor: formatCurrency(data.resumen_ejecutivo.monto_total) },
          { Campo: 'Promedio por Venta', Valor: formatCurrency(data.resumen_ejecutivo.promedio_venta) },
          { Campo: 'Meta Cumplida', Valor: data.resumen_ejecutivo.meta_cumplida ? 'Sí' : 'No' },
          { Campo: 'Fecha Generación', Valor: formatDate(data.metadatos.fecha_generacion) }
        ]

        sheets.push({
          name: 'Resumen Ejecutivo',
          data: resumenData
        })
      }

      // Hoja 2: Detalle de Ventas
      if (config.incluir.detalle_ventas && data.ventas.length > 0) {
        sheets.push({
          name: 'Detalle Ventas',
          data: data.ventas,
          columns: [
            { key: 'numero_contrato', label: 'Contrato' },
            { key: 'cliente_nombre', label: 'Cliente' },
            { key: 'ejecutivo_nombre', label: 'Ejecutivo' },
            { key: 'valor_total', label: 'Valor', formatter: (v: number) => formatCurrency(v) },
            { key: 'fecha_venta', label: 'Fecha', formatter: (v: string) => formatDate(v) },
            { key: 'estado_crm', label: 'Estado' }
          ]
        })
      }

      // Hoja 3: Ranking Ejecutivos
      if (config.incluir.ranking_ejecutivos && data.ejecutivos.length > 0) {
        sheets.push({
          name: 'Ranking Ejecutivos',
          data: data.ejecutivos,
          columns: [
            { key: 'ranking', label: 'Posición' },
            { key: 'nombre', label: 'Ejecutivo' },
            { key: 'ventas', label: 'Ventas' },
            { key: 'monto', label: 'Monto', formatter: (v: number) => formatCurrency(v) },
            { key: 'promedio', label: 'Promedio', formatter: (v: number) => formatCurrency(v) },
            { key: 'tasaExito', label: 'Tasa Éxito', formatter: (v: number) => `${v.toFixed(1)}%` }
          ]
        })
      }

      const result = ExcelExporter.exportMultiSheet(sheets, {
        fileName: `reporte_${config.tipo}_${new Date().toISOString().split('T')[0]}`,
        includeTimestamp: true
      })

      return result

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando Excel'
      }
    }
  }

  /**
   * Genera reporte en PDF (placeholder)
   */
  private static generatePDFReport(
    data: ReportData,
    config: ReportConfig
  ): { success: boolean; fileName?: string; error?: string } {
    // TODO: Implementar generación de PDF
    console.log('📄 Generación de PDF pendiente de implementar')
    return {
      success: false,
      error: 'Generación de PDF no implementada aún'
    }
  }

  /**
   * Genera reporte en CSV
   */
  private static generateCSVReport(
    data: ReportData,
    config: ReportConfig
  ): { success: boolean; fileName?: string; error?: string } {
    try {
      // Generar CSV simple con datos de ventas
      const headers = ['Contrato', 'Cliente', 'Ejecutivo', 'Valor', 'Fecha', 'Estado']
      const csvContent = [
        `# ${data.metadatos.titulo}`,
        `# Generado: ${formatDate(data.metadatos.fecha_generacion)}`,
        `# Total registros: ${data.metadatos.total_registros}`,
        '',
        headers.join(','),
        ...data.ventas.map(v => [
          v.numero_contrato || '',
          `"${v.cliente_nombre}"`,
          `"${v.ejecutivo_nombre}"`,
          typeof v.valor_total === 'number' ? v.valor_total : parseFloat(v.valor_total || '0'),
          formatDate(v.fecha_venta),
          `"${v.estado_crm || ''}"`
        ].join(','))
      ].join('\n')

      const fileName = `reporte_${config.tipo}_${new Date().toISOString().split('T')[0]}.csv`

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      return {
        success: true,
        fileName
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando CSV'
      }
    }
  }

  /**
   * Programa reportes automáticos
   */
  static scheduleAutomaticReports(configs: ReportConfig[]): void {
    console.log(`📅 Programando ${configs.length} reportes automáticos`)

    configs.forEach(config => {
      let interval: number

      switch (config.tipo) {
        case 'diario':
          interval = 24 * 60 * 60 * 1000 // 24 horas
          break
        case 'semanal':
          interval = 7 * 24 * 60 * 60 * 1000 // 7 días
          break
        case 'mensual':
          interval = 30 * 24 * 60 * 60 * 1000 // 30 días
          break
        default:
          return
      }

      // Programar ejecución (en producción usar cron jobs)
      setInterval(async () => {
        try {
          console.log(`🔄 Ejecutando reporte automático ${config.tipo}`)
          // TODO: Obtener datos reales y generar reporte
        } catch (error) {
          console.error(`Error en reporte automático ${config.tipo}:`, error)
        }
      }, interval)
    })
  }
}

// Configuraciones predeterminadas para reportes
export const defaultReportConfigs: Record<string, ReportConfig> = {
  diario_ejecutivos: {
    tipo: 'diario',
    formato: 'excel',
    destinatarios: ['supervisor@chilehome.cl'],
    incluir: {
      resumen_ejecutivo: true,
      detalle_ventas: true,
      metricas_crm: true,
      ranking_ejecutivos: true,
      pipeline: false,
      comparaciones: true,
      graficos: false
    }
  },

  semanal_completo: {
    tipo: 'semanal',
    formato: 'excel',
    destinatarios: ['gerencia@chilehome.cl', 'admin@chilehome.cl'],
    incluir: {
      resumen_ejecutivo: true,
      detalle_ventas: true,
      metricas_crm: true,
      ranking_ejecutivos: true,
      pipeline: true,
      comparaciones: true,
      graficos: true
    }
  },

  mensual_directorio: {
    tipo: 'mensual',
    formato: 'pdf',
    destinatarios: ['direccion@chilehome.cl'],
    incluir: {
      resumen_ejecutivo: true,
      detalle_ventas: false,
      metricas_crm: true,
      ranking_ejecutivos: true,
      pipeline: true,
      comparaciones: true,
      graficos: true
    }
  }
}