import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo = 'saludo_matutino' } = body

    console.log(`🔥 PRUEBA DIRECTA - Enviando ${tipo}`)

    // Usar directamente la API de WhatsApp sin base de datos
    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN
    const telefono = '+56963348909' // Número correcto hardcodeado

    if (!phoneId || !token) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales de WhatsApp no configuradas'
      }, { status: 500 })
    }

    // Generar mensaje según tipo
    let mensaje = ''
    switch (tipo) {
      case 'saludo_matutino':
        mensaje = '¡Buenos días! 🌅 Es un nuevo día lleno de oportunidades. ¡Vamos por esas 5 ventas hoy! 💪\n\n✅ Mensaje de prueba desde ChileHome - Sistema funcionando correctamente'
        break
      case 'nueva_venta_crm':
        mensaje = '🔔 *NUEVA VENTA INGRESADA*\n\n👤 *Cliente:* María González Pérez\n💰 *Monto:* $2.400.000\n🏠 *Modelo:* Casa 54m² - 6 Aguas\n👔 *Ejecutivo:* Carlos Ruiz Montenegro\n\n¡Excelente trabajo! 🎉'
        break
      case 'contrato_validado':
        mensaje = '✅ *CONTRATO VALIDADO*\n\n👤 *Cliente:* Pedro Martinez Silva\n💰 *Valor:* $3.200.000\n📄 *Contrato:* #3156\n🚚 *Entrega:* 15/11/2024\n\nEl contrato está listo para producción y despacho. 🚀'
        break
      default:
        mensaje = `📊 *PRUEBA DIRECTA - ${tipo.toUpperCase()}*\n\nSistema de notificaciones WhatsApp funcionando correctamente ✅\n\nChileHome 🏠`
    }

    // Limpiar número de teléfono
    const telefonoLimpio = telefono.replace(/[\s\-\+]/g, '')

    console.log(`📱 Enviando a: ${telefonoLimpio}`)
    console.log(`💬 Mensaje: ${mensaje.substring(0, 100)}...`)

    // Llamada directa a WhatsApp Business API
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
          to: telefonoLimpio,
          type: 'text',
          text: {
            body: mensaje
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    )

    const responseData = await whatsappResponse.json()

    if (!whatsappResponse.ok) {
      console.error('❌ Error en WhatsApp API:', responseData)
      return NextResponse.json({
        success: false,
        error: 'Error enviando mensaje de WhatsApp',
        detalles: responseData.error?.message || 'Error desconocido',
        codigo_error: responseData.error?.code
      }, { status: 400 })
    }

    console.log('✅ Mensaje WhatsApp enviado exitosamente:', responseData)

    return NextResponse.json({
      success: true,
      mensaje: `Mensaje ${tipo} enviado exitosamente`,
      telefono: telefono,
      whatsapp_id: responseData.messages?.[0]?.id,
      detalles: responseData
    })

  } catch (error) {
    console.error('💥 Error crítico enviando WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de prueba directa de WhatsApp',
    tipos_disponibles: ['saludo_matutino', 'nueva_venta_crm', 'contrato_validado'],
    ejemplo_uso: {
      metodo: 'POST',
      body: { tipo: 'saludo_matutino' }
    }
  })
}