import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN

    console.log('🔍 Iniciando diagnóstico completo de WhatsApp...')

    // 1. Verificar configuración básica
    const config = {
      phoneId: phoneId ? `${phoneId.substring(0, 6)}...` : 'NO CONFIGURADO',
      token: token ? `${token.substring(0, 20)}...` : 'NO CONFIGURADO',
      hasPhoneId: !!phoneId,
      hasToken: !!token
    }

    console.log('📋 Configuración:', config)

    if (!phoneId || !token) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales WhatsApp no configuradas',
        config
      }, { status: 500 })
    }

    // 2. Verificar información del número de teléfono
    console.log('📞 Verificando información del teléfono...')
    const phoneInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}?fields=verified_name,display_phone_number,quality_rating,status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const phoneInfo = await phoneInfoResponse.json()
    console.log('📞 Info del teléfono:', phoneInfo)

    // 3. Verificar límites de la cuenta
    console.log('📊 Verificando límites de la cuenta...')
    const businessResponse = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=message_template_namespace,currency,timezone_id`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const businessInfo = await businessResponse.json()
    console.log('🏢 Info del negocio:', businessInfo)

    // 4. Hacer una prueba de envío con seguimiento detallado
    console.log('📤 Realizando prueba de envío...')
    const testNumber = '56963348909'
    const testMessage = `🧪 PRUEBA DE DIAGNÓSTICO\n\nFecha: ${new Date().toLocaleString('es-CL')}\nID de prueba: ${Date.now()}\n\n✅ Si recibes este mensaje, el sistema funciona correctamente.`

    const sendResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: testNumber,
          type: 'text',
          text: {
            body: testMessage
          }
        })
      }
    )

    const sendResult = await sendResponse.json()
    console.log('📤 Resultado del envío:', sendResult)

    // 5. Verificar el estado del mensaje enviado (si tenemos el ID)
    let messageStatus = null
    if (sendResult.messages && sendResult.messages[0]?.id) {
      const messageId = sendResult.messages[0].id
      console.log(`📋 Verificando estado del mensaje: ${messageId}`)

      try {
        const statusResponse = await fetch(
          `https://graph.facebook.com/v18.0/${messageId}?fields=id,status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            }
          }
        )
        messageStatus = await statusResponse.json()
        console.log('📋 Estado del mensaje:', messageStatus)
      } catch (error) {
        console.log('⚠️ No se pudo verificar el estado del mensaje:', error)
      }
    }

    // 6. Resumen del diagnóstico
    const diagnostico = {
      timestamp: new Date().toISOString(),
      configuracion: config,
      telefono: phoneInfo,
      negocio: businessInfo,
      pruebaEnvio: {
        exitoso: sendResponse.ok,
        numeroDestino: testNumber,
        resultado: sendResult,
        messageId: sendResult.messages?.[0]?.id || null
      },
      estadoMensaje: messageStatus,
      recomendaciones: []
    }

    // Añadir recomendaciones basadas en los resultados
    if (!sendResponse.ok) {
      diagnostico.recomendaciones.push('❌ El envío falló. Revisar credenciales y configuración.')
    } else {
      diagnostico.recomendaciones.push('✅ El envío fue exitoso desde el lado técnico.')
    }

    if (phoneInfo.error) {
      diagnostico.recomendaciones.push('⚠️ Problema con la configuración del número de teléfono.')
    }

    if (phoneInfo.quality_rating && phoneInfo.quality_rating !== 'GREEN') {
      diagnostico.recomendaciones.push(`⚠️ Calidad del número: ${phoneInfo.quality_rating}. Esto puede afectar la entrega.`)
    }

    console.log('📊 Diagnóstico completo:', diagnostico)

    return NextResponse.json({
      success: true,
      diagnostico,
      mensaje: 'Diagnóstico completado. Revisa las recomendaciones.',
      instrucciones: [
        '1. Verifica que recibiste el mensaje de prueba en WhatsApp',
        '2. Si no lo recibiste, el problema puede ser:',
        '   - Filtros de WhatsApp por envío masivo',
        '   - Número bloqueado o restringido',
        '   - Problemas de calidad de la cuenta',
        '3. Revisa la carpeta de spam/mensajes archivados en WhatsApp'
      ]
    })

  } catch (error) {
    console.error('💥 Error en diagnóstico:', error)
    return NextResponse.json({
      success: false,
      error: 'Error realizando diagnóstico',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}