import { WhatsAppService } from '@/lib/whatsappService'

interface VentaDelDia {
  id: string
  cliente_nombre: string
  ejecutivo_nombre: string
  valor_total: number
  modelo_casa?: string
  estado: string
  fecha_venta: string
}

interface ConfiguracionNotificacion {
  destinatario: string
  destinatario_nombre: string
  rol: string
  incluir_detalles: boolean
  incluir_metricas: boolean
}

export class NotificacionesVentasService {
  private whatsAppService: WhatsAppService

  constructor() {
    this.whatsAppService = new WhatsAppService()
  }

  /**
   * Envía resumen diario de ventas
   */
  async enviarResumenDiario(
    ventas: VentaDelDia[],
    configuraciones: ConfiguracionNotificacion[]
  ): Promise<void> {
    const hoy = new Date().toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Filtrar ventas del día
    const ventasHoy = ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha_venta).toDateString()
      const fechaHoy = new Date().toDateString()
      return fechaVenta === fechaHoy
    })

    // Calcular métricas
    const totalVentas = ventasHoy.length
    const montoTotal = ventasHoy.reduce((sum, venta) => sum + Number(venta.valor_total), 0)
    const ventasPorEjecutivo = this.agruparPorEjecutivo(ventasHoy)

    // Enviar a cada configuración
    for (const config of configuraciones) {
      try {
        const mensaje = this.generarMensajeResumenDiario(
          hoy,
          ventasHoy,
          totalVentas,
          montoTotal,
          ventasPorEjecutivo,
          config
        )

        await this.whatsAppService.sendTextMessage(config.destinatario, mensaje)
        console.log(`✅ Resumen diario enviado a ${config.destinatario_nombre}`)
      } catch (error) {
        console.error(`❌ Error enviando resumen a ${config.destinatario_nombre}:`, error)
      }
    }
  }

  /**
   * Envía notificación de nueva venta
   */
  async enviarNotificacionNuevaVenta(
    venta: VentaDelDia,
    configuraciones: ConfiguracionNotificacion[]
  ): Promise<void> {
    const mensaje = this.generarMensajeNuevaVenta(venta)

    for (const config of configuraciones) {
      try {
        await this.whatsAppService.sendTextMessage(config.destinatario, mensaje)
        console.log(`✅ Notificación de nueva venta enviada a ${config.destinatario_nombre}`)
      } catch (error) {
        console.error(`❌ Error enviando notificación a ${config.destinatario_nombre}:`, error)
      }
    }
  }

  /**
   * Envía resumen semanal
   */
  async enviarResumenSemanal(
    ventas: VentaDelDia[],
    configuraciones: ConfiguracionNotificacion[]
  ): Promise<void> {
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - 7)

    const ventasSemana = ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha_venta)
      return fechaVenta >= fechaInicio
    })

    const totalVentas = ventasSemana.length
    const montoTotal = ventasSemana.reduce((sum, venta) => sum + Number(venta.valor_total), 0)
    const ventasPorEjecutivo = this.agruparPorEjecutivo(ventasSemana)

    for (const config of configuraciones) {
      try {
        const mensaje = this.generarMensajeResumenSemanal(
          ventasSemana,
          totalVentas,
          montoTotal,
          ventasPorEjecutivo,
          config
        )

        await this.whatsAppService.sendTextMessage(config.destinatario, mensaje)
        console.log(`✅ Resumen semanal enviado a ${config.destinatario_nombre}`)
      } catch (error) {
        console.error(`❌ Error enviando resumen semanal a ${config.destinatario_nombre}:`, error)
      }
    }
  }

  private generarMensajeResumenDiario(
    fecha: string,
    ventas: VentaDelDia[],
    totalVentas: number,
    montoTotal: number,
    ventasPorEjecutivo: Record<string, VentaDelDia[]>,
    config: ConfiguracionNotificacion
  ): string {
    let mensaje = `📊 *RESUMEN DIARIO DE VENTAS*\n`
    mensaje += `📅 ${fecha}\n\n`

    // Métricas generales
    if (config.incluir_metricas) {
      mensaje += `📈 *MÉTRICAS DEL DÍA:*\n`
      mensaje += `• Total ventas: ${totalVentas}\n`
      mensaje += `• Monto total: $${montoTotal.toLocaleString('es-CL')}\n`
      mensaje += `• Promedio por venta: $${totalVentas > 0 ? Math.round(montoTotal / totalVentas).toLocaleString('es-CL') : '0'}\n\n`
    }

    // Ventas por ejecutivo
    if (config.incluir_detalles && Object.keys(ventasPorEjecutivo).length > 0) {
      mensaje += `👥 *VENTAS POR EJECUTIVO:*\n`
      for (const [ejecutivo, ventasEjecutivo] of Object.entries(ventasPorEjecutivo)) {
        const montoEjecutivo = ventasEjecutivo.reduce((sum, v) => sum + Number(v.valor_total), 0)
        mensaje += `• ${ejecutivo}: ${ventasEjecutivo.length} ventas - $${montoEjecutivo.toLocaleString('es-CL')}\n`
      }
      mensaje += `\n`
    }

    // Detalle de ventas
    if (config.incluir_detalles && ventas.length > 0) {
      mensaje += `📋 *DETALLE DE VENTAS:*\n`
      ventas.forEach((venta, index) => {
        mensaje += `${index + 1}. ${venta.cliente_nombre}\n`
        mensaje += `   💰 $${Number(venta.valor_total).toLocaleString('es-CL')}\n`
        mensaje += `   🏠 ${venta.modelo_casa || 'Modelo no especificado'}\n`
        mensaje += `   👤 ${venta.ejecutivo_nombre}\n`
        mensaje += `   📊 Estado: ${venta.estado}\n\n`
      })
    }

    if (totalVentas === 0) {
      mensaje += `ℹ️ No se registraron ventas el día de hoy.\n\n`
    }

    mensaje += `🚀 *ChileHome* - Sistema de Contratos\n`
    mensaje += `⏰ Enviado automáticamente`

    return mensaje
  }

  private generarMensajeNuevaVenta(venta: VentaDelDia): string {
    let mensaje = `🎉 *NUEVA VENTA REGISTRADA*\n\n`
    mensaje += `👤 *Cliente:* ${venta.cliente_nombre}\n`
    mensaje += `💰 *Valor:* $${Number(venta.valor_total).toLocaleString('es-CL')}\n`
    mensaje += `🏠 *Modelo:* ${venta.modelo_casa || 'No especificado'}\n`
    mensaje += `👨‍💼 *Ejecutivo:* ${venta.ejecutivo_nombre}\n`
    mensaje += `📊 *Estado:* ${venta.estado}\n\n`
    mensaje += `🚀 *ChileHome* - Nueva oportunidad de negocio`

    return mensaje
  }

  private generarMensajeResumenSemanal(
    ventas: VentaDelDia[],
    totalVentas: number,
    montoTotal: number,
    ventasPorEjecutivo: Record<string, VentaDelDia[]>,
    config: ConfiguracionNotificacion
  ): string {
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - 7)
    const fechaFin = new Date()

    let mensaje = `📊 *RESUMEN SEMANAL DE VENTAS*\n`
    mensaje += `📅 Del ${fechaInicio.toLocaleDateString('es-CL')} al ${fechaFin.toLocaleDateString('es-CL')}\n\n`

    // Métricas
    if (config.incluir_metricas) {
      mensaje += `📈 *MÉTRICAS DE LA SEMANA:*\n`
      mensaje += `• Total ventas: ${totalVentas}\n`
      mensaje += `• Monto total: $${montoTotal.toLocaleString('es-CL')}\n`
      mensaje += `• Promedio diario: ${Math.round(totalVentas / 7)} ventas\n`
      mensaje += `• Promedio por venta: $${totalVentas > 0 ? Math.round(montoTotal / totalVentas).toLocaleString('es-CL') : '0'}\n\n`
    }

    // Top ejecutivos
    if (config.incluir_detalles) {
      const ejecutivosOrdenados = Object.entries(ventasPorEjecutivo)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 5)

      if (ejecutivosOrdenados.length > 0) {
        mensaje += `🏆 *TOP EJECUTIVOS DE LA SEMANA:*\n`
        ejecutivosOrdenados.forEach(([ejecutivo, ventasEjecutivo], index) => {
          const montoEjecutivo = ventasEjecutivo.reduce((sum, v) => sum + Number(v.valor_total), 0)
          const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'
          mensaje += `${emoji} ${ejecutivo}: ${ventasEjecutivo.length} ventas - $${montoEjecutivo.toLocaleString('es-CL')}\n`
        })
        mensaje += `\n`
      }
    }

    mensaje += `🚀 *ChileHome* - Resumen Semanal\n`
    mensaje += `⏰ Enviado automáticamente los domingos`

    return mensaje
  }

  private agruparPorEjecutivo(ventas: VentaDelDia[]): Record<string, VentaDelDia[]> {
    return ventas.reduce((grupos, venta) => {
      const ejecutivo = venta.ejecutivo_nombre || 'Sin asignar'
      if (!grupos[ejecutivo]) {
        grupos[ejecutivo] = []
      }
      grupos[ejecutivo].push(venta)
      return grupos
    }, {} as Record<string, VentaDelDia[]>)
  }
}

// Configuraciones predefinidas para personas importantes
export const CONFIGURACIONES_PREDEFINIDAS: ConfiguracionNotificacion[] = [
  {
    destinatario: '+56963348909',
    destinatario_nombre: 'Guillermo Díaz (Pruebas)',
    rol: 'dueño',
    incluir_detalles: true,
    incluir_metricas: true
  }
  // Nota: José Luis Andraca tendrá su propio número cuando esté listo
  // {
  //   destinatario: '+56912345678', // Número real de José Luis
  //   destinatario_nombre: 'José Luis Andraca',
  //   rol: 'gerente_ventas',
  //   incluir_detalles: true,
  //   incluir_metricas: true
  // }
]