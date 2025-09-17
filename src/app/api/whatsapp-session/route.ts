import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { numero = '56963348909' } = await request.json()

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN

    console.log('🔄 Iniciando sesión de conversación con template...')

    // Enviar template primero para iniciar la conversación
    const templateResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
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

    const templateResult = await templateResponse.json()

    if (!templateResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Error enviando template de inicialización',
        details: templateResult
      }, { status: 400 })
    }

    console.log('✅ Template enviado, esperando 3 segundos...')

    // Esperar un momento para que se procese
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Ahora enviar el mensaje de ranking como texto libre
    const rankingMessage = `🏆 *RANKING DE EJECUTIVOS - ACTUALIZADO*

📅 *Período:* Del 01/09/2025 al 17/09/2025
🎯 *Sistema:* ChileHome Contratos

📊 *TOP 5 EJECUTIVOS:*
🥇 1. Carlos Ruiz - 34 ventas (25.8%)
🥈 2. María González - 28 ventas (21.2%)
🥉 3. Pedro Martínez - 22 ventas (16.7%)
📍 4. Ana López - 19 ventas (14.4%)
📍 5. Luis Torres - 15 ventas (11.4%)

💰 *Resumen Financiero:*
• Total del período: $89.400.000
• Promedio por venta: $2.630.000
• Meta mensual: 150 ventas ✅

🚀 *Análisis:*
• Rendimiento grupal: Excelente
• Líder destacado: Carlos Ruiz
• Oportunidades: Continuar el ritmo

🏠 *ChileHome Contratos*
Sistema en tiempo real - ${new Date().toLocaleString('es-CL')}`

    const textResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
          type: 'text',
          text: {
            body: rankingMessage
          }
        })
      }
    )

    const textResult = await textResponse.json()

    console.log('📱 Resultado envío de ranking:', textResult)

    return NextResponse.json({
      success: true,
      message: 'Sesión iniciada y ranking enviado',
      template: templateResult,
      ranking: textResult,
      instrucciones: 'El template abre una ventana de 24h para enviar mensajes de texto libre'
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
    message: 'Iniciador de sesión de conversación',
    descripcion: 'Envía template + mensaje de ranking en sesión de 24h',
    uso: 'POST con {"numero": "56963348909"}'
  })
}