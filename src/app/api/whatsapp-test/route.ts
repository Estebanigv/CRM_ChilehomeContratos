import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
  const token = process.env.WHATSAPP_BUSINESS_TOKEN
  const telefono = '56963348909' // Sin + para API

  if (!phoneId || !token) {
    return NextResponse.json({
      success: false,
      error: 'Credenciales WhatsApp no configuradas',
      phoneId: phoneId ? 'Configurado' : 'No configurado',
      token: token ? 'Configurado' : 'No configurado'
    }, { status: 500 })
  }

  try {
    console.log('🧪 TESTING WhatsApp API credentials...')
    console.log(`📱 Phone ID: ${phoneId}`)
    console.log(`🔑 Token: ${token.substring(0, 20)}...`)
    console.log(`📞 Destino: ${telefono}`)

    // Mensaje de prueba simple
    const mensaje = `🧪 PRUEBA DE CONECTIVIDAD WhatsApp\n\nFecha: ${new Date().toLocaleString('es-CL')}\nEstado: API funcionando ✅`

    // Llamada directa a WhatsApp API con logs detallados
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
        signal: AbortSignal.timeout(15000) // 15 segundos
      }
    )

    const responseData = await whatsappResponse.json()

    console.log('📊 WhatsApp API Response:')
    console.log('Status:', whatsappResponse.status)
    console.log('Headers:', Object.fromEntries(whatsappResponse.headers.entries()))
    console.log('Data:', JSON.stringify(responseData, null, 2))

    if (!whatsappResponse.ok) {
      console.error('❌ Error WhatsApp API:', responseData)

      return NextResponse.json({
        success: false,
        error: 'Error enviando WhatsApp',
        status: whatsappResponse.status,
        statusText: whatsappResponse.statusText,
        errorCode: responseData.error?.code,
        errorMessage: responseData.error?.message,
        errorType: responseData.error?.type,
        fullResponse: responseData
      }, { status: 400 })
    }

    console.log('✅ WhatsApp enviado exitosamente!')

    return NextResponse.json({
      success: true,
      mensaje: 'WhatsApp de prueba enviado correctamente',
      telefono: '+56963348909',
      whatsapp_id: responseData.messages?.[0]?.id,
      timestamp: new Date().toISOString(),
      phoneId,
      tokenPrefix: token.substring(0, 20) + '...',
      fullResponse: responseData
    })

  } catch (error) {
    console.error('💥 Error crítico:', error)

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido',
      phoneId,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'No configurado'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET() // Mismo comportamiento para POST
}