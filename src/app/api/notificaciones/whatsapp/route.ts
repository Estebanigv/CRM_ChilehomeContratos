import { NextRequest, NextResponse } from 'next/server'
import whatsappService, {
  enviarContratoWhatsApp,
  notificarValidacionContrato,
  enviarResumenSemanal
} from '@/lib/whatsappService'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'enviar_contrato':
        const { telefono, numeroContrato, nombreCliente, pdfUrl } = data
        const resultContrato = await enviarContratoWhatsApp(
          telefono,
          numeroContrato,
          nombreCliente,
          pdfUrl
        )
        return NextResponse.json(resultContrato)

      case 'notificar_validacion':
        const { telefonoSupervisor, contrato } = data
        const resultValidacion = await notificarValidacionContrato(
          telefonoSupervisor,
          contrato
        )
        return NextResponse.json(resultValidacion)

      case 'resumen_semanal':
        const { telefono: telefonoResumen } = data

        // Obtener contratos de la última semana
        const fechaInicio = new Date()
        fechaInicio.setDate(fechaInicio.getDate() - 7)

        const { data: contratos, error } = await supabase
          .from('contratos')
          .select(`
            *,
            cliente:clientes(*)
          `)
          .gte('created_at', fechaInicio.toISOString())
          .order('created_at', { ascending: false })

        if (error) throw error

        const resultResumen = await enviarResumenSemanal(telefonoResumen, contratos || [])
        return NextResponse.json(resultResumen)

      case 'mensaje_personalizado':
        const { to, message } = data
        const resultMensaje = await whatsappService.sendTextMessage(to, message)
        return NextResponse.json(resultMensaje)

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error en WhatsApp API:', error)
    return NextResponse.json(
      { error: 'Error procesando solicitud WhatsApp' },
      { status: 500 }
    )
  }
}

// Webhook para recibir mensajes de WhatsApp (opcional)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verificación del webhook de WhatsApp
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ Webhook verificado')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json(
    { error: 'Token de verificación inválido' },
    { status: 403 }
  )
}