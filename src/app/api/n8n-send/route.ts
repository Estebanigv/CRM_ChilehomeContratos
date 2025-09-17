import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'

export async function POST(request: NextRequest) {
  try {
    const { tipo = 'ranking_ejecutivos_personalizado', fechaInicio, fechaFin } = await request.json()

    console.log('🚀 Enviando a N8N Cloud:', { tipo, fechaInicio, fechaFin })

    // URL del webhook de N8N ChileHome - WhatsApp Nativo (MODO TEST)
    const N8N_WEBHOOK_URL = 'https://n8n.srv865688.hstgr.cloud/webhook-test/webhook-chilehome-pro'

    // Obtener configuraciones reales de usuarios desde la base de datos
    let usuariosDestino: string[] = []

    try {
      const configResponse = await fetch(`${request.nextUrl.origin}/api/configuraciones-whatsapp`, {
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (configResponse.ok) {
        const configuraciones = await configResponse.json()

        // Filtrar usuarios que reciben este tipo de notificación
        usuariosDestino = configuraciones
          .filter((config: any) => config.activo && config.tipos_notificacion.includes(tipo))
          .map((config: any) => config.destinatario)

        console.log(`📱 Usuarios configurados para "${tipo}":`, usuariosDestino.length)
      } else {
        console.warn('⚠️ No se pudieron obtener configuraciones, usando fallback')
      }
    } catch (error) {
      console.error('❌ Error obteniendo configuraciones:', error)
    }

    // Fallback si no hay configuraciones
    if (usuariosDestino.length === 0) {
      usuariosDestino = ['56963348909'] // Solo número por defecto
      console.log('🔄 Usando número por defecto para pruebas')
    }

    let mensaje = ''
    let destinatarios: string[] = usuariosDestino

    // MODO PRUEBA - Todos los mensajes son de prueba durante integración
    const fechaActual = new Date().toLocaleDateString('es-CL')
    const horaActual = new Date().toLocaleTimeString('es-CL')

    // Mensaje de prueba universal para todos los tipos
    switch (tipo) {
      case 'ranking_ejecutivos_semanal':
        mensaje = `🧪 *PRUEBA RANKING SEMANAL*\n\n📅 ${fechaActual} - ${horaActual}\n\n✅ Sistema N8N funcionando correctamente\n🔗 Webhook: webhook-chilehome-pro\n🎯 ChileHome Contratos\n\n⚙️ Modo integración activo`
        break

      case 'ranking_ejecutivos_personalizado':
        mensaje = `🧪 *PRUEBA RANKING PERSONALIZADO*\n\n📅 ${fechaActual} - ${horaActual}\n\n✅ Sistema N8N funcionando correctamente\n🔗 Webhook: webhook-chilehome-pro\n🎯 ChileHome Contratos\n\n⚙️ Modo integración activo`
        break

      case 'resumen_diario':
        mensaje = `🧪 *PRUEBA RESUMEN DIARIO*\n\n📅 ${fechaActual} - ${horaActual}\n\n✅ Sistema N8N funcionando correctamente\n🔗 Webhook: webhook-chilehome-pro\n🎯 ChileHome Contratos\n\n⚙️ Modo integración activo`
        break

      case 'resumen_semanal':
        mensaje = `🧪 *PRUEBA RESUMEN SEMANAL*\n\n📅 ${fechaActual} - ${horaActual}\n\n✅ Sistema N8N funcionando correctamente\n🔗 Webhook: webhook-chilehome-pro\n🎯 ChileHome Contratos\n\n⚙️ Modo integración activo`
        break

      case 'nueva_venta_crm':
        mensaje = `🧪 *PRUEBA NUEVA VENTA CRM*\n\n📅 ${fechaActual} - ${horaActual}\n\n✅ Sistema N8N funcionando correctamente\n🔗 Webhook: webhook-chilehome-pro\n🎯 ChileHome Contratos\n\n⚙️ Modo integración activo`
        break

      default:
        mensaje = `🧪 *PRUEBA SISTEMA N8N*\n\n📅 ${fechaActual} - ${horaActual}\n\nTipo: ${tipo}\n\n✅ Sistema funcionando correctamente\n🔗 Webhook: webhook-chilehome-pro\n🎯 ChileHome Contratos\n\n⚙️ Modo integración activo`
    }

    // Datos para enviar a N8N Cloud
    const dataParaN8N = {
      mensaje,
      destinatarios,
      tipo,
      timestamp: new Date().toISOString(),
      total_destinatarios: destinatarios.length,
      source: 'ChileHome-Dashboard',
      configuracion: {
        usuarios_configurados: usuariosDestino.length,
        total_destinatarios: destinatarios.length
      }
    }

    console.log('📤 Enviando a N8N Cloud:', {
      url: N8N_WEBHOOK_URL,
      tipo,
      destinatarios: destinatarios.length,
      mensaje: mensaje.substring(0, 100) + '...'
    })

    // Enviar a N8N Cloud
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataParaN8N),
      signal: AbortSignal.timeout(30000) // 30 segundos
    })

    const n8nResult = await n8nResponse.text() // N8N puede devolver texto o JSON

    if (!n8nResponse.ok) {
      console.error('❌ Error enviando a N8N:', n8nResult)
      return NextResponse.json({
        success: false,
        error: 'Error enviando a N8N Cloud',
        status: n8nResponse.status,
        details: n8nResult
      }, { status: 400 })
    }

    console.log('✅ Enviado exitosamente a N8N Cloud!')

    return NextResponse.json({
      success: true,
      message: 'Datos enviados a N8N Cloud exitosamente',
      n8n_webhook: N8N_WEBHOOK_URL,
      data_sent: {
        tipo,
        destinatarios: destinatarios.length,
        mensaje_preview: mensaje.substring(0, 200) + '...',
        timestamp: dataParaN8N.timestamp
      },
      n8n_response: {
        status: n8nResponse.status,
        response: n8nResult
      }
    })

  } catch (error) {
    console.error('💥 Error crítico enviando a N8N:', error)
    return NextResponse.json({
      success: false,
      error: 'Error crítico enviando a N8N Cloud',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'N8N Cloud WhatsApp Integration',
    webhook_url: 'https://n8n.srv865688.hstgr.cloud/webhook-test/a006848b-07ee-4135-ba07-b6274fc8a63d',
    descripcion: 'Envía datos de ranking directamente a N8N Cloud para WhatsApp',
    uso: {
      POST: 'Enviar ranking a N8N',
      body: {
        tipo: 'ranking_ejecutivos_personalizado | ranking_ejecutivos_semanal | resumen_diario',
        fechaInicio: '2025-09-01 (opcional)',
        fechaFin: '2025-09-17 (opcional)'
      }
    },
    ventajas: [
      'Sin restricciones de WhatsApp Business API',
      'Envío a cualquier número sin autorización',
      'Sin filtros de spam',
      'Procesamiento en N8N Cloud'
    ]
  })
}