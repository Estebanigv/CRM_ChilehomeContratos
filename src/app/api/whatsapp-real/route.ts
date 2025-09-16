import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo = 'test', telefono_destino } = body

    // Credenciales directas
    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN

    if (!phoneId || !token) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales WhatsApp no configuradas'
      }, { status: 500 })
    }

    // Si no se especifica teléfono, usar el de prueba
    const telefono = telefono_destino ? telefono_destino.replace(/[\s\-\+]/g, '') : '56963348909'

    // Generar mensajes con datos reales del CRM
    let mensaje = ''

    try {
      console.log(`🔍 Generando mensaje ${tipo} con datos del CRM...`)

      // Obtener ventas directamente del CRM
      const ventasCompletas = await crmApi.obtenerVentas()
      console.log(`📊 Ventas obtenidas del CRM: ${ventasCompletas.length}`)

      switch (tipo) {
        case 'resumen_diario': {
          // Ventas de hoy
          const hoy = new Date()
          const fechaHoy = hoy.toISOString().split('T')[0]

          const ventasHoy = ventasCompletas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_venta).toISOString().split('T')[0]
            return fechaVenta === fechaHoy
          })

          const totalVentas = ventasHoy.length
          const montoTotal = ventasHoy.reduce((sum, venta) => sum + (venta.valor_total || 0), 0)
          const promedioVenta = totalVentas > 0 ? Math.round(montoTotal / totalVentas) : 0

          // Ejecutivo top del día
          const ventasPorEjecutivo = {}
          ventasHoy.forEach(venta => {
            const ejecutivo = venta.ejecutivo_nombre || 'Sin asignar'
            ventasPorEjecutivo[ejecutivo] = (ventasPorEjecutivo[ejecutivo] || 0) + 1
          })
          const topEjecutivo = Object.entries(ventasPorEjecutivo)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0] || ['Sin ventas', 0]

          mensaje = `📊 RESUMEN DIARIO - ${hoy.toLocaleDateString('es-CL')}\n\n` +
                   `• ${totalVentas} ventas registradas\n` +
                   `• $${montoTotal.toLocaleString('es-CL')} total del día\n` +
                   `• Mejor ejecutivo: ${topEjecutivo[0]} (${topEjecutivo[1]} ventas)\n` +
                   `• Promedio: $${promedioVenta.toLocaleString('es-CL')} por venta\n\n` +
                   `${totalVentas >= 5 ? '🎯 Meta diaria cumplida!' : '📈 Vamos por más ventas!'} 🚀`
          break
        }

        case 'resumen_semanal': {
          // Ventas de la semana anterior (lunes a domingo)
          const hoy = new Date()
          const diaActual = hoy.getDay() // 0 = domingo, 1 = lunes, etc.

          // Calcular el lunes de la semana anterior
          const diasHastaLunesAnterior = diaActual === 0 ? 13 : (diaActual + 6)
          const lunesAnterior = new Date(hoy)
          lunesAnterior.setDate(hoy.getDate() - diasHastaLunesAnterior)

          // Calcular el domingo de la semana anterior
          const domingoAnterior = new Date(lunesAnterior)
          domingoAnterior.setDate(lunesAnterior.getDate() + 6)

          const inicioSemana = lunesAnterior.toISOString().split('T')[0]
          const finSemana = domingoAnterior.toISOString().split('T')[0]

          const ventasSemana = ventasCompletas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_venta).toISOString().split('T')[0]
            return fechaVenta >= inicioSemana && fechaVenta <= finSemana
          })

          const totalVentas = ventasSemana.length
          const montoTotal = ventasSemana.reduce((sum, venta) => sum + (venta.valor_total || 0), 0)
          const promedioVenta = totalVentas > 0 ? Math.round(montoTotal / totalVentas) : 0

          // Ejecutivo top de la semana
          const ventasPorEjecutivo = {}
          ventasSemana.forEach(venta => {
            const ejecutivo = venta.ejecutivo_nombre || 'Sin asignar'
            ventasPorEjecutivo[ejecutivo] = (ventasPorEjecutivo[ejecutivo] || 0) + 1
          })
          const topEjecutivo = Object.entries(ventasPorEjecutivo)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0] || ['Sin ventas', 0]

          // Región top
          const ventasPorRegion = {}
          ventasSemana.forEach(venta => {
            if (venta.direccion_entrega) {
              const partes = venta.direccion_entrega.split(',')
              const region = partes[partes.length - 1]?.trim() || 'Sin región'
              ventasPorRegion[region] = (ventasPorRegion[region] || 0) + 1
            }
          })
          const regionTop = Object.entries(ventasPorRegion)
            .sort(([,a], [,b]) => (b as number) - (a as number))[0] || ['Sin datos', 0]

          const periodo = `${lunesAnterior.toLocaleDateString('es-CL')} al ${domingoAnterior.toLocaleDateString('es-CL')}`

          mensaje = `📈 RESUMEN SEMANAL\nPeriodo: ${periodo}\n\n` +
                   `• ${totalVentas} ventas esta semana\n` +
                   `• $${montoTotal.toLocaleString('es-CL')} total semanal\n` +
                   `🏆 Top ejecutivo: ${topEjecutivo[0]} (${topEjecutivo[1]} ventas)\n` +
                   `📍 Región líder: ${regionTop[0]}\n` +
                   `📊 Promedio: $${promedioVenta.toLocaleString('es-CL')} por venta\n\n` +
                   `${totalVentas >= 25 ? '🎯 Meta semanal cumplida!' : '📈 Sigamos trabajando!'} 💪`
          break
        }

        case 'nueva_venta_crm': {
          // Última venta registrada
          const ultimaVenta = ventasCompletas[0] // Las ventas vienen ordenadas por fecha
          if (ultimaVenta) {
            const region = ultimaVenta.direccion_entrega?.split(',').pop()?.trim() || 'Sin región'
            mensaje = `🎉 NUEVA VENTA INGRESADA AL CRM\n\n` +
                     `👤 Cliente: ${ultimaVenta.cliente_nombre}\n` +
                     `💰 Monto: $${ultimaVenta.valor_total?.toLocaleString('es-CL') || '0'}\n` +
                     `🏠 Modelo: ${ultimaVenta.modelo_casa}\n` +
                     `👨‍💼 Ejecutivo: ${ultimaVenta.ejecutivo_nombre}\n` +
                     `📍 Región: ${region}\n` +
                     `📅 Fecha: ${new Date(ultimaVenta.fecha_venta).toLocaleDateString('es-CL')}\n\n` +
                     `¡Felicitaciones por la nueva venta! 🎊`
          } else {
            mensaje = '🎉 NUEVA VENTA REGISTRADA\n\nSistema funcionando - sin ventas recientes para mostrar'
          }
          break
        }

        case 'contrato_validado': {
          // Buscar contratos validados recientes
          const contratoValidado = ventasCompletas.find(v => v.estado_crm === 'Contrato' || v.estado_crm === 'Validación')

          if (contratoValidado) {
            mensaje = `✅ CONTRATO VALIDADO\n\n` +
                     `👤 Cliente: ${contratoValidado.cliente_nombre}\n` +
                     `💰 Valor: $${contratoValidado.valor_total?.toLocaleString('es-CL') || '0'}\n` +
                     `📋 Contrato: ${contratoValidado.numero_contrato || 'Sin número'}\n` +
                     `👨‍💼 Ejecutivo: ${contratoValidado.ejecutivo_nombre}\n` +
                     `📅 Fecha entrega: ${contratoValidado.fecha_entrega || 'Por definir'}\n` +
                     `🚚 Estado: ${contratoValidado.estado_crm}\n\n` +
                     `¡Proceso completado exitosamente! ✨`
          } else {
            mensaje = '✅ SISTEMA DE CONTRATOS\n\nValidación completada - sin contratos recientes para mostrar'
          }
          break
        }

        case 'saludo_matutino': {
          // Ventas de hoy para la meta
          const hoy = new Date()
          const fechaHoy = hoy.toISOString().split('T')[0]
          const ventasHoy = ventasCompletas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_venta).toISOString().split('T')[0]
            return fechaVenta === fechaHoy
          })

          const metaHoy = ventasHoy.length > 0 ? ventasHoy.length + 2 : 5

          mensaje = `🌅 ¡Buenos días equipo ChileHome!\n\n` +
                   `💪 Es un nuevo día lleno de oportunidades\n` +
                   `📈 Meta de hoy: Superar las ${metaHoy} ventas\n` +
                   `🎯 Recordatorio: Seguimiento de clientes pendientes\n` +
                   `☕ Que tengan un excelente día\n\n` +
                   `¡Vamos por un día increíble! 🚀`
          break
        }

        default:
          mensaje = `🧪 Prueba WhatsApp desde API - ${new Date().toLocaleTimeString('es-CL')}\n\nSistema funcionando correctamente ✅\n\nChileHome Contratos 🏠`
      }
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error)
      // Fallback a mensajes estáticos si falla la conexión
      switch (tipo) {
        case 'resumen_diario':
          mensaje = '📊 RESUMEN DIARIO\n\nError conectando con CRM - usando modo offline\n\nSistema funcionando ✅'
          break
        case 'resumen_semanal':
          mensaje = '📈 RESUMEN SEMANAL\n\nError conectando con CRM - usando modo offline\n\nSistema funcionando ✅'
          break
        default:
          mensaje = `🧪 Prueba WhatsApp desde API - ${new Date().toLocaleTimeString('es-CL')}\n\nSistema funcionando correctamente ✅`
      }
    }

    console.log(`📱 WHATSAPP REAL - Enviando a: ${telefono}`)
    console.log(`💬 Mensaje tipo ${tipo}: ${mensaje.substring(0, 100)}...`)

    // Llamada directa a WhatsApp API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: telefono,
          type: 'text',
          text: {
            body: mensaje
          }
        }),
        signal: AbortSignal.timeout(10000) // 10 segundos
      }
    )

    const responseData = await whatsappResponse.json()

    if (!whatsappResponse.ok) {
      console.error('❌ Error WhatsApp API:', responseData)
      return NextResponse.json({
        success: false,
        error: 'Error enviando WhatsApp',
        detalles: responseData.error?.message,
        codigo: responseData.error?.code
      }, { status: 400 })
    }

    console.log('✅ WhatsApp enviado exitosamente!')

    return NextResponse.json({
      success: true,
      mensaje: 'WhatsApp enviado correctamente',
      tipo,
      telefono: telefono_destino || '+56963348909',
      telefono_enviado: telefono,
      whatsapp_id: responseData.messages?.[0]?.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('💥 Error crítico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Real - Endpoint para números múltiples',
    uso: 'POST con { tipo: "saludo_matutino", telefono_destino: "+56912345678" }'
  })
}