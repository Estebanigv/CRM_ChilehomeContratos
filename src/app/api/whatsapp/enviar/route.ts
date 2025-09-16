import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { telefono, mensaje } = await request.json()

    if (!telefono || !mensaje) {
      return NextResponse.json({
        success: false,
        error: 'Teléfono y mensaje son requeridos'
      }, { status: 400 })
    }

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN

    if (!phoneId || !token) {
      console.error('❌ Faltan credenciales de WhatsApp Business API')
      return NextResponse.json({
        success: false,
        error: 'Credenciales de WhatsApp no configuradas'
      }, { status: 500 })
    }

    // Formatear número de teléfono (quitar +, espacios, guiones)
    const telefonoLimpio = telefono.replace(/[\s\-\+]/g, '')

    console.log(`📱 Enviando WhatsApp a: ${telefonoLimpio}`)
    console.log(`💬 Mensaje: ${mensaje.substring(0, 100)}...`)

    // Llamada a WhatsApp Business API
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
        signal: AbortSignal.timeout(15000) // 15 segundo timeout
      }
    )

    const responseData = await whatsappResponse.json()

    if (!whatsappResponse.ok) {
      console.error('❌ Error en WhatsApp API:', responseData)

      // Log específico para diferentes tipos de errores
      if (responseData.error?.code === 131026) {
        console.error('📵 Número de teléfono no válido para WhatsApp Business')
      } else if (responseData.error?.code === 100) {
        console.error('🔐 Token de acceso inválido o expirado')
      }

      return NextResponse.json({
        success: false,
        error: 'Error enviando mensaje de WhatsApp',
        detalles: responseData.error?.message || 'Error desconocido',
        codigo_error: responseData.error?.code
      }, { status: 400 })
    }

    console.log('✅ Mensaje WhatsApp enviado exitosamente:', responseData)

    // Guardar en logs si la tabla existe
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase
        .from('logs_notificaciones')
        .insert({
          tipo: 'whatsapp_manual',
          destinatario: 'Usuario',
          telefono: telefonoLimpio,
          mensaje,
          exito: true,
          respuesta_api: responseData
        })
    } catch (logError) {
      console.warn('⚠️  No se pudo guardar en logs:', logError)
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Mensaje enviado exitosamente',
      whatsapp_id: responseData.messages?.[0]?.id,
      detalles: responseData
    })

  } catch (error) {
    console.error('💥 Error crítico enviando WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function GET() {
  // Envío de prueba automático
  const telefono = '+56963348909'
  const mensaje = '🧪 Prueba automática desde GET endpoint - ' + new Date().toLocaleTimeString('es-CL')

  console.log(`🔧 GET Test - Enviando a ${telefono}: ${mensaje}`)

  try {
    const response = await POST(new Request('http://localhost/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, mensaje })
    }))

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error en prueba GET',
      details: error
    }, { status: 500 })
  }
}