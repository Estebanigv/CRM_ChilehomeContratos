import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
  const token = process.env.WHATSAPP_BUSINESS_TOKEN
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

  try {
    // Obtener plantillas existentes
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      }
    )

    const templates = await response.json()

    return NextResponse.json({
      success: true,
      templates: templates.data || [],
      count: templates.data?.length || 0,
      instructions: {
        create: 'Usa POST para crear una nueva plantilla',
        uso: 'Las plantillas permiten envío a números no autorizados'
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { templateName, templateText, category = 'MARKETING' } = await request.json()

    const phoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID
    const token = process.env.WHATSAPP_BUSINESS_TOKEN
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID

    if (!templateName || !templateText) {
      return NextResponse.json({
        success: false,
        error: 'templateName y templateText son requeridos'
      }, { status: 400 })
    }

    console.log('📝 Creando plantilla:', templateName)

    // Crear nueva plantilla
    const createResponse = await fetch(
      `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: templateName,
          language: 'es',
          category: category,
          components: [
            {
              type: 'BODY',
              text: templateText
            }
          ]
        })
      }
    )

    const result = await createResponse.json()

    if (!createResponse.ok) {
      console.error('❌ Error creando plantilla:', result)
      return NextResponse.json({
        success: false,
        error: 'Error creando plantilla',
        details: result.error?.message || 'Error desconocido'
      }, { status: 400 })
    }

    console.log('✅ Plantilla creada exitosamente:', result)

    return NextResponse.json({
      success: true,
      message: 'Plantilla creada exitosamente',
      template: result,
      instructions: {
        aprobacion: 'La plantilla debe ser aprobada por Meta antes de usarse',
        tiempo: 'El proceso de aprobación puede tomar 24-48 horas',
        uso: 'Una vez aprobada, permite envío a cualquier número'
      }
    })

  } catch (error) {
    console.error('❌ Error en creación de plantilla:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}