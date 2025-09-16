import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
  const token = process.env.WHATSAPP_BUSINESS_TOKEN
  const businessPhone = process.env.WHATSAPP_BUSINESS_PHONE

  // Mensaje de prueba
  const testMessage = {
    messaging_product: "whatsapp",
    to: businessPhone?.replace('+', ''), // Enviarse a sí mismo como prueba
    type: "text",
    text: {
      body: `🎉 ¡WhatsApp Business API Configurado!\n\n✅ Sistema ChileHome Contratos\n📱 Número: ${businessPhone}\n🔧 Phone ID: ${phoneId}\n📅 Token válido hasta: 14/11/2025\n\nEste es un mensaje de prueba enviado ${new Date().toLocaleString('es-CL')}`
    }
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      }
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Mensaje de prueba enviado correctamente',
        messageId: data.messages?.[0]?.id,
        details: {
          to: businessPhone,
          phoneId,
          timestamp: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Error enviando mensaje',
        details: data
      }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      config: {
        phoneId: phoneId ? '✅ Configurado' : '❌ Falta',
        token: token ? '✅ Configurado' : '❌ Falta',
        businessPhone: businessPhone ? '✅ Configurado' : '❌ Falta'
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN

    const whatsappMessage = {
      messaging_product: "whatsapp",
      to: to.replace('+', '').replace(/\s/g, ''),
      type: "text",
      text: {
        body: message
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(whatsappMessage)
      }
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        messageId: data.messages?.[0]?.id,
        to,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Error enviando mensaje',
        details: data
      }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}