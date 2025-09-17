import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { telefono = '56963348909' } = await request.json()

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN

    console.log('📱 Enviando mensaje con template aprobado...')

    const response = await fetch(
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
          type: 'template',
          template: {
            name: 'hello_world',
            language: {
              code: 'en_US'
            }
          }
        })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Error con template:', result)
      return NextResponse.json({
        success: false,
        error: 'Error enviando template',
        details: result
      }, { status: 400 })
    }

    console.log('✅ Template enviado exitosamente:', result)

    return NextResponse.json({
      success: true,
      message: 'Template enviado exitosamente',
      messageId: result.messages?.[0]?.id,
      result
    })

  } catch (error) {
    console.error('💥 Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Envío de template de prueba',
    instrucciones: 'Usa POST con {"telefono": "56963348909"} para probar'
  })
}