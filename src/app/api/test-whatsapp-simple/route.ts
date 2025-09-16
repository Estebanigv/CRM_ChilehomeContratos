import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/lib/whatsappService'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Test WhatsApp Simple - Iniciando...')

    const whatsappService = new WhatsAppService()
    const resultado = await whatsappService.sendTextMessage('+56963348909', '🧪 MENSAJE DE PRUEBA\n\nEste es un mensaje de prueba desde ChileHome.\n\nSi recibes este mensaje, ¡WhatsApp funciona correctamente! ✅')

    console.log('📱 Resultado envío WhatsApp:', resultado)

    return NextResponse.json({
      success: true,
      message: 'Test WhatsApp completado',
      resultado: resultado
    })

  } catch (error) {
    console.error('❌ Error en test WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}