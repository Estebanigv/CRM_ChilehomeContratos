import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
  const token = process.env.WHATSAPP_BUSINESS_TOKEN
  const testNumber = '56963348909'

  console.log('🔍 DIAGNÓSTICO COMPLETO DE WHATSAPP BUSINESS API')

  try {
    // 1. Verificar información de la cuenta de WhatsApp Business
    console.log('\n📱 1. VERIFICANDO INFORMACIÓN DE LA CUENTA...')
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const accountData = await accountResponse.json()
    console.log('Información de cuenta:', JSON.stringify(accountData, null, 2))

    // 2. Verificar el estado del número de teléfono
    console.log('\n📞 2. VERIFICANDO ESTADO DEL NÚMERO DE TELÉFONO...')
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}?fields=status,verified_name,display_phone_number,quality_rating`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const phoneData = await phoneResponse.json()
    console.log('Estado del número:', JSON.stringify(phoneData, null, 2))

    // 3. Intentar obtener información del número destino
    console.log('\n🎯 3. VERIFICANDO NÚMERO DESTINO...')
    try {
      const contactResponse = await fetch(
        `https://graph.facebook.com/v18.0/${phoneId}/check_contact`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contacts: [testNumber]
          })
        }
      )

      const contactData = await contactResponse.json()
      console.log('Verificación de contacto:', JSON.stringify(contactData, null, 2))
    } catch (contactError) {
      console.log('No se pudo verificar el contacto (esto es normal para muchas cuentas)')
    }

    // 4. Enviar mensaje de prueba con seguimiento detallado
    console.log('\n📤 4. ENVIANDO MENSAJE DE PRUEBA CON SEGUIMIENTO...')
    const mensaje = `DIAGNÓSTICO WhatsApp - ${new Date().toISOString()}`

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
            body: mensaje
          }
        })
      }
    )

    const sendData = await sendResponse.json()
    console.log('Respuesta de envío:', JSON.stringify(sendData, null, 2))

    // 5. Verificar límites de la cuenta
    console.log('\n📊 5. VERIFICANDO LÍMITES Y RESTRICCIONES...')
    const businessResponse = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}?fields=name,tier,message_template_namespace`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const businessData = await businessResponse.json()
    console.log('Información del negocio:', JSON.stringify(businessData, null, 2))

    // Compilar reporte completo
    const reporte = {
      timestamp: new Date().toISOString(),
      configuracion: {
        phoneId,
        tokenPrefix: token?.substring(0, 20) + '...',
        numeroDestino: testNumber
      },
      cuenta: accountData,
      telefono: phoneData,
      negocio: businessData,
      mensajeEnviado: sendData,
      diagnostico: {
        problemasPotenciales: [],
        recomendaciones: []
      }
    }

    // Análisis automático de problemas
    if (phoneData.status !== 'CONNECTED') {
      reporte.diagnostico.problemasPotenciales.push('El número de WhatsApp Business no está conectado correctamente')
      reporte.diagnostico.recomendaciones.push('Verificar la configuración del número en Meta Business Manager')
    }

    if (businessData.tier === 'UNVERIFIED') {
      reporte.diagnostico.problemasPotenciales.push('Cuenta no verificada - limitaciones en el envío de mensajes')
      reporte.diagnostico.recomendaciones.push('Verificar la cuenta de WhatsApp Business en Meta Business Manager')
    }

    if (!sendData.messages) {
      reporte.diagnostico.problemasPotenciales.push('El mensaje no se envió correctamente')
      reporte.diagnostico.recomendaciones.push('Revisar las credenciales y configuración de la API')
    }

    console.log('\n📋 REPORTE FINAL:')
    console.log(JSON.stringify(reporte, null, 2))

    return NextResponse.json({
      success: true,
      reporte,
      resumen: {
        problemas: reporte.diagnostico.problemasPotenciales.length,
        estado: sendData.messages ? 'MENSAJE_ENVIADO' : 'ERROR_ENVIO',
        numeroVerificado: phoneData.status === 'CONNECTED',
        cuentaVerificada: businessData.tier !== 'UNVERIFIED'
      }
    })

  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST() {
  return GET() // Mismo comportamiento
}