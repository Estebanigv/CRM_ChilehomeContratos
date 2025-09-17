import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'

export async function POST(request: NextRequest) {
  try {
    const { tipo = 'ranking_ejecutivos_personalizado', fechaInicio, fechaFin } = await request.json()

    console.log('🔗 N8N Webhook - Procesando solicitud:', { tipo, fechaInicio, fechaFin })

    // Configuración de números para N8N
    const ejecutivos = [
      '56963348909', '56912345678', '56987654321', '56911111111', '56922222222',
      '56933333333', '56944444444', '56955555555', '56966666666', '56977777777',
      '56988888888', '56999999999', '56900000000', '56901111111', '56902222222',
      '56903333333', '56904444444'
    ]

    const gerencia = ['56963348909', '56965555555', '56967777777']
    const administracion = ['56963348909', '56969999999', '56968888888']

    // Todos los destinatarios únicos
    const todosLosDestinatarios = [...new Set([...ejecutivos, ...gerencia, ...administracion])]

    let mensaje = ''
    let destinatarios: string[] = []

    switch (tipo) {
      case 'ranking_ejecutivos_semanal':
      case 'ranking_ejecutivos_personalizado': {
        // Obtener datos reales del CRM
        let fechaInicioPeriodo: string
        let fechaFinPeriodo: string
        const fechaActual = new Date().toLocaleDateString('es-CL')

        if (tipo === 'ranking_ejecutivos_semanal') {
          const fechaInicioDate = new Date()
          fechaInicioDate.setDate(fechaInicioDate.getDate() - 7)
          fechaInicioPeriodo = fechaInicioDate.toISOString().split('T')[0]
          fechaFinPeriodo = new Date().toISOString().split('T')[0]
        } else {
          fechaInicioPeriodo = fechaInicio || '2025-09-01'
          fechaFinPeriodo = fechaFin || new Date().toISOString().split('T')[0]
        }

        try {
          const ventasDelPeriodo = await crmApi.obtenerVentas(undefined, fechaInicioPeriodo, fechaFinPeriodo)

          // Procesar datos del CRM
          const ventasPorEjecutivo = new Map()
          let totalVentas = 0
          let totalMontoVentas = 0

          ventasDelPeriodo.forEach(venta => {
            if (!venta.ejecutivo_nombre || venta.ejecutivo_nombre === 'null' || venta.ejecutivo_nombre === '') {
              return
            }

            const ejecutivo = venta.ejecutivo_nombre
            if (!ventasPorEjecutivo.has(ejecutivo)) {
              ventasPorEjecutivo.set(ejecutivo, {
                nombre: ejecutivo,
                ventas: 0,
                montoTotal: 0
              })
            }

            const datos = ventasPorEjecutivo.get(ejecutivo)
            datos.ventas += 1

            const valorVenta = venta.valor_total
            let montoVenta = 0
            if (valorVenta !== null && valorVenta !== undefined && valorVenta !== '') {
              montoVenta = typeof valorVenta === 'number' ? valorVenta : parseInt(valorVenta) || 0
            }

            datos.montoTotal += montoVenta
            totalVentas += 1
            totalMontoVentas += montoVenta
          })

          // Generar ranking
          const ejecutivosRanking = Array.from(ventasPorEjecutivo.values())
            .sort((a, b) => b.ventas - a.ventas)
            .slice(0, 5)
            .map(ejecutivo => ({
              nombre: ejecutivo.nombre,
              ventas: ejecutivo.ventas,
              porcentaje: totalVentas > 0 ? (ejecutivo.ventas / totalVentas * 100) : 0,
              montoTotal: ejecutivo.montoTotal
            }))

          const periodoTexto = tipo === 'ranking_ejecutivos_semanal'
            ? `Semana del ${new Date(fechaInicioPeriodo).toLocaleDateString('es-CL')} al ${fechaActual}`
            : `Del ${new Date(fechaInicioPeriodo).toLocaleDateString('es-CL')} al ${new Date(fechaFinPeriodo).toLocaleDateString('es-CL')}`

          // Generar mensaje para N8N
          if (ejecutivosRanking.length > 0) {
            mensaje = `🏆 *RANKING DE EJECUTIVOS DE VENTAS*\n\n`
            mensaje += `📅 *${periodoTexto}*\n`
            mensaje += `🎯 ChileHome Contratos\n\n`

            mensaje += `📊 *RESUMEN EJECUTIVO*\n`
            mensaje += `• Total de Ventas: ${totalVentas}\n`
            mensaje += `• Ejecutivos Activos: ${ejecutivosRanking.length}\n`
            mensaje += `• Monto Total: $${totalMontoVentas.toLocaleString('es-CL')}\n\n`

            mensaje += `🥇 *TOP ${ejecutivosRanking.length} EJECUTIVOS*\n`
            mensaje += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

            ejecutivosRanking.forEach((ejecutivo, index) => {
              const posicion = index + 1
              const emoji = posicion === 1 ? '🥇' : posicion === 2 ? '🥈' : posicion === 3 ? '🥉' : '📍'

              mensaje += `${emoji} *${posicion}. ${ejecutivo.nombre}*\n`
              mensaje += `   📈 Ventas: ${ejecutivo.ventas} (${ejecutivo.porcentaje.toFixed(1)}%)\n`
              mensaje += `   💰 Monto: $${ejecutivo.montoTotal.toLocaleString('es-CL')}\n\n`
            })

            if (ejecutivosRanking.length >= 2) {
              const mejorEjecutivo = ejecutivosRanking[0]
              mensaje += `🎯 *Líder del Período:* ${mejorEjecutivo.nombre}\n`
              mensaje += `• Ventas realizadas: ${mejorEjecutivo.ventas}\n\n`
            }

            mensaje += `🏠 *ChileHome Contratos*\n`
            mensaje += `Sistema CRM - ${fechaActual}`
          } else {
            mensaje = `🏆 *RANKING DE EJECUTIVOS*\n\n📅 ${periodoTexto}\n\n⚠️ No se encontraron ventas para el período seleccionado.\n\n🏠 ChileHome Contratos`
          }

          destinatarios = todosLosDestinatarios

        } catch (error) {
          console.error('❌ Error obteniendo datos del CRM:', error)
          mensaje = `🏆 *RANKING DE EJECUTIVOS*\n\n❌ Error temporal del sistema\n🔄 Reintenta en unos minutos\n\n🏠 ChileHome Contratos`
          destinatarios = todosLosDestinatarios
        }
        break
      }

      case 'resumen_diario': {
        try {
          const hoy = new Date().toISOString().split('T')[0]
          const ventasDelDia = await crmApi.obtenerVentas(undefined, hoy, hoy)

          const totalVentasHoy = ventasDelDia.length
          const montoTotalHoy = ventasDelDia.reduce((sum, venta) => {
            const valorVenta = venta.valor_total
            if (valorVenta === null || valorVenta === undefined || valorVenta === '') {
              return sum
            }
            return sum + (typeof valorVenta === 'number' ? valorVenta : parseInt(valorVenta) || 0)
          }, 0)

          mensaje = `📊 *RESUMEN DIARIO*\n`
          mensaje += `📅 ${new Date().toLocaleDateString('es-CL')}\n\n`
          mensaje += `• ${totalVentasHoy} ventas nuevas\n`
          mensaje += `• $${montoTotalHoy.toLocaleString('es-CL')} total del día\n\n`
          mensaje += totalVentasHoy > 5 ? '¡Excelente día! 🚀' :
                    totalVentasHoy > 0 ? '¡Buen trabajo! 💪' :
                    'Día tranquilo 🌟'

          destinatarios = todosLosDestinatarios
        } catch (error) {
          mensaje = `📊 *RESUMEN DIARIO*\n\n❌ Error obteniendo datos\n🔄 Reintenta en unos minutos`
          destinatarios = todosLosDestinatarios
        }
        break
      }

      default:
        mensaje = `🧪 Prueba N8N - ${new Date().toLocaleTimeString('es-CL')}\n\nSistema funcionando ✅`
        destinatarios = ['56963348909']
    }

    // Datos para enviar a N8N
    const n8nData = {
      mensaje,
      destinatarios,
      tipo,
      timestamp: new Date().toISOString(),
      total_destinatarios: destinatarios.length,
      configuracion: {
        ejecutivos: ejecutivos.length,
        gerencia: gerencia.length,
        administracion: administracion.length
      }
    }

    console.log('📤 Datos preparados para N8N:', {
      tipo,
      mensaje: mensaje.substring(0, 100) + '...',
      destinatarios: destinatarios.length
    })

    // Aquí N8N recibirá estos datos y procesará el envío de WhatsApp
    return NextResponse.json({
      success: true,
      message: 'Datos preparados para N8N',
      data: n8nData,
      instrucciones: {
        n8n: 'Usar estos datos para enviar WhatsApp via Twilio/ChatAPI',
        webhook: 'Configurar N8N webhook para recibir estos datos',
        formato: 'El mensaje está listo para envío directo'
      }
    })

  } catch (error) {
    console.error('💥 Error en N8N webhook:', error)
    return NextResponse.json({
      success: false,
      error: 'Error procesando datos para N8N',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'N8N WhatsApp Webhook',
    descripcion: 'Endpoint para integrar con N8N y envío de WhatsApp sin restricciones',
    uso: {
      POST: 'Enviar datos de ranking para N8N',
      body: {
        tipo: 'ranking_ejecutivos_personalizado | ranking_ejecutivos_semanal | resumen_diario',
        fechaInicio: '2025-09-01 (opcional)',
        fechaFin: '2025-09-17 (opcional)'
      }
    },
    ventajas: [
      'Sin restricciones de templates',
      'Envío a cualquier número',
      'Sin filtros de spam',
      'Integración con Twilio/ChatAPI'
    ]
  })
}