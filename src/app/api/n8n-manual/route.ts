import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { n8n_webhook_url } = await request.json()

    // Validar URL del webhook
    if (!n8n_webhook_url || !n8n_webhook_url.includes('n8n.srv865688.hstgr.cloud')) {
      return NextResponse.json({
        success: false,
        error: 'URL de webhook N8N requerida'
      }, { status: 400 })
    }

    console.log('🎯 Configurando N8N webhook manual:', n8n_webhook_url)

    // Datos de prueba para configurar N8N
    const testData = {
      mensaje: "🏆 *RANKING DE EJECUTIVOS*\n\n📅 Del 01/09/2025 al 17/09/2025\n🎯 ChileHome Contratos\n\n📊 *RESUMEN*\n• Ventas: 132\n• Ejecutivos: 5\n• Total: $254.425.350\n\n🥇 *TOP 5*\n\n🥇 *1. MAURICIO REYES RIVERA*\n   📈 24 ventas (18.2%)\n   💰 $34.600.100\n\n🥈 *2. JOSE JAVIER CALL VENEZUELA*\n   📈 21 ventas (15.9%)\n   💰 $61.908.250\n\n🥉 *3. Maria Jose Rodriguez*\n   📈 14 ventas (10.6%)\n   💰 $24.350.000\n\n📍 *4. Claudia Huenteo*\n   📈 12 ventas (9.1%)\n   💰 $23.610.000\n\n📍 *5. Paola*\n   📈 11 ventas (8.3%)\n   💰 $23.984.000\n\n🎯 *Líder:* MAURICIO REYES RIVERA\nCon 24 ventas\n\n🏠 ChileHome Contratos\n17-09-2025",
      destinatarios: [
        "56963348909", "56912345678", "56987654321", "56911111111", "56922222222",
        "56933333333", "56944444444", "56955555555", "56966666666", "56977777777"
      ],
      tipo: "ranking_ejecutivos_personalizado",
      timestamp: new Date().toISOString(),
      total_destinatarios: 10,
      source: "ChileHome-Dashboard-Manual"
    }

    console.log('📤 Enviando datos de configuración a N8N...')

    // Enviar datos a N8N
    const response = await fetch(n8n_webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      signal: AbortSignal.timeout(30000)
    })

    const result = await response.text()

    if (!response.ok) {
      console.error('❌ Error en N8N manual:', result)
      return NextResponse.json({
        success: false,
        error: 'Error configurando N8N manual',
        status: response.status,
        details: result,
        instructions: [
          '1. Ve a tu N8N Cloud: https://n8n.srv865688.hstgr.cloud',
          '2. Abre el workflow que tiene el webhook',
          '3. Click "Execute workflow" para activar',
          '4. Inmediatamente después ejecuta esta API'
        ]
      }, { status: 400 })
    }

    console.log('✅ N8N configurado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'N8N configurado exitosamente',
      webhook_url: n8n_webhook_url,
      data_sent: {
        mensaje_preview: testData.mensaje.substring(0, 150) + '...',
        destinatarios: testData.total_destinatarios,
        timestamp: testData.timestamp
      },
      n8n_response: {
        status: response.status,
        response: result
      },
      instrucciones: [
        'N8N está ahora configurado para recibir rankings',
        'Usa /api/n8n-send para enviar datos reales',
        'Asegúrate de tener el workflow en modo Production para uso continuo'
      ]
    })

  } catch (error) {
    console.error('💥 Error configurando N8N manual:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico configurando N8N',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'N8N Manual Configuration',
    descripcion: 'Configura N8N con datos de prueba para WhatsApp',
    uso: {
      POST: 'Configurar N8N webhook',
      body: {
        n8n_webhook_url: 'https://n8n.srv865688.hstgr.cloud/webhook-test/a006848b-07ee-4135-ba07-b6274fc8a63d'
      }
    },
    instrucciones: [
      '1. Ejecuta "Execute workflow" en N8N Cloud',
      '2. Inmediatamente ejecuta esta API',
      '3. N8N quedará configurado para WhatsApp',
      '4. Cambia a modo Production para uso automático'
    ]
  })
}