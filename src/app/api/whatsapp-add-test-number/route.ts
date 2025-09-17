import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    if (!phoneId || !token || !businessAccountId) {
      return NextResponse.json({
        success: false,
        error: 'Credenciales WhatsApp no configuradas completamente'
      }, { status: 500 })
    }

    console.log('📱 Agregando número de prueba:', phoneNumber)
    console.log('🏢 Business Account ID:', businessAccountId)

    // Intentar agregar el número como contacto de prueba
    const addTestNumberResponse = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/phone_numbers`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          verified_name: 'Test Contact',
          category: 'test'
        })
      }
    )

    const addTestResult = await addTestNumberResponse.json()
    console.log('Resultado agregar número test:', JSON.stringify(addTestResult, null, 2))

    // También intentar con la API de números de prueba específica
    const testNumberResponse = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/test_users`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_numbers: [phoneNumber]
        })
      }
    )

    const testResult = await testNumberResponse.json()
    console.log('Resultado números de prueba:', JSON.stringify(testResult, null, 2))

    // Verificar el estado actual de los números de prueba
    const currentTestNumbers = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/test_users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const currentResult = await currentTestNumbers.json()
    console.log('Números de prueba actuales:', JSON.stringify(currentResult, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Intento de agregar número de prueba completado',
      results: {
        addTestNumber: addTestResult,
        testNumber: testResult,
        currentTestNumbers: currentResult
      },
      instructions: {
        manual: 'Si los métodos automáticos fallan, debes agregar manualmente el número en Meta Business Manager',
        steps: [
          '1. Ve a https://business.facebook.com',
          '2. Selecciona tu aplicación WhatsApp Business',
          '3. Ve a WhatsApp → Getting Started',
          '4. En "Add phone numbers to test your app", agrega: ' + phoneNumber,
          '5. Guarda y reintenta enviar mensajes'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error agregando número de prueba:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
  const token = process.env.WHATSAPP_BUSINESS_TOKEN

  try {
    // Obtener números de prueba actuales
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/test_users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const result = await response.json()

    return NextResponse.json({
      success: true,
      testNumbers: result,
      instructions: 'Para agregar un número de prueba, usa POST con {"phoneNumber": "56963348909"}'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}