import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Directo - Endpoint funcionando',
    telefono: '+56963348909',
    ejemplo: {
      POST: '/api/whatsapp-directo',
      body: { tipo: 'test' }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo = 'test' } = body

    // Credenciales directas
    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN
    const telefono = '56963348909' // Sin + para API

    if (!phoneId || !token) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales WhatsApp no configuradas'
      }, { status: 500 })
    }

    // Mensajes según tipo
    let mensaje = ''
    switch (tipo) {
      case 'resumen_diario':
        mensaje = '📊 RESUMEN DIARIO - ' + new Date().toLocaleDateString('es-CL') + '\n\n• 7 ventas nuevas registradas\n• $18.750.000 total del día\n• Mejor ejecutivo: Ana García (3 ventas)\n• Región top: Metropolitana\n• Promedio: $2.678.571 por venta\n\n¡Excelente día de trabajo! 🚀'
        break
      case 'resumen_semanal':
        mensaje = '📈 RESUMEN SEMANAL\n\n• 34 ventas esta semana\n• $89.400.000 total semanal\n🏆 Top ejecutivo: Carlos Ruiz (12 ventas)\n📍 Región líder: Valparaíso\n📊 Promedio: $2.630.000 por venta\n\n¡Gran semana equipo! 💪'
        break
      case 'nueva_venta_crm':
        mensaje = '🎉 NUEVA VENTA INGRESADA AL CRM\n\n👤 Cliente: María López Contreras\n💰 Monto: $2.400.000\n🏠 Modelo: Casa 54m²\n👨‍💼 Ejecutivo: Carlos Ruiz\n📍 Región: Bío Bío\n📅 Fecha: ' + new Date().toLocaleDateString('es-CL') + '\n\n¡Felicitaciones! 🎊'
        break
      case 'contrato_validado':
        mensaje = '✅ CONTRATO VALIDADO\n\n👤 Cliente: Pedro Martínez Silva\n💰 Valor: $3.200.000\n📋 Contrato: #3154\n👨‍💼 Ejecutivo: Gloria Codina\n📅 Fecha entrega: 15/11/2024\n🚚 Estado: Listo para producción\n\n¡Proceso completado! ✨'
        break
      case 'saludo_matutino':
        mensaje = '🌅 ¡Buenos días equipo ChileHome!\n\n💪 Es un nuevo día lleno de oportunidades\n📈 Meta de hoy: Superar las 5 ventas\n🎯 Recordatorio: Seguimiento de clientes pendientes\n☕ Que tengan un excelente día\n\n¡Vamos por un día increíble! 🚀'
        break
      case 'saludo':
        mensaje = '🌅 ¡Buenos días desde ChileHome! Que tengas un excelente día lleno de oportunidades. 💪'
        break
      case 'venta':
        mensaje = '🎉 ¡NUEVA VENTA REGISTRADA!\n\n👤 Cliente: María González\n💰 Monto: $2.400.000\n🏠 Modelo: Casa 54m²\n👔 Ejecutivo: Carlos Ruiz\n\n¡Excelente trabajo! 🚀'
        break
      case 'contrato':
        mensaje = '✅ ¡CONTRATO VALIDADO!\n\n👤 Cliente: Pedro Martínez\n💰 Valor: $3.200.000\n📄 Contrato: #3156\n🚚 Entrega: 15/11/2024\n\nListo para producción 🏗️'
        break
      default:
        mensaje = `🧪 Prueba WhatsApp desde API - ${new Date().toLocaleTimeString('es-CL')}\n\nSistema funcionando correctamente ✅\n\nChileHome Contratos 🏠`
    }

    console.log(`📱 WHATSAPP DIRECTO - Enviando a: ${telefono}`)
    console.log(`💬 Mensaje: ${mensaje.substring(0, 100)}...`)

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
      telefono: '+56963348909',
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