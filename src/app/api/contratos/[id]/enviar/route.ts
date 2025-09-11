import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pdfGenerator } from '@/lib/pdfGenerator'
import { emailService } from '@/lib/mailer'
import { ContratoPDFData } from '@/types'

// POST - Enviar contrato por email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener el contrato con información del cliente
    const { data: contrato, error: contratoError } = await supabase
      .from('contratos')
      .select(`
        *,
        clientes (*)
      `)
      .eq('id', params.id)
      .single()

    if (contratoError || !contrato) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    const canSend = userProfile?.role === 'admin' || contrato.ejecutivo_id === user.id
    
    if (!canSend) {
      return NextResponse.json({ error: 'Sin permisos para enviar este contrato' }, { status: 403 })
    }

    // Verificar que el contrato esté validado
    if (contrato.estado !== 'validado') {
      return NextResponse.json({ error: 'Solo se pueden enviar contratos validados' }, { status: 400 })
    }

    // Verificar que el cliente tenga email
    if (!contrato.clientes.correo) {
      return NextResponse.json({ error: 'El cliente no tiene email configurado' }, { status: 400 })
    }

    // Preparar datos para el PDF
    const pdfData: ContratoPDFData = {
      cliente: contrato.clientes,
      contrato: contrato,
      fecha_actual: new Date().toLocaleDateString('es-CL'),
      terminos_condiciones: `
        1. El presente contrato es válido desde la fecha de firma por ambas partes.
        2. El cliente se compromete al pago según las condiciones acordadas.
        3. ChileHome garantiza la calidad de los materiales y construcción por 12 meses.
        4. Los plazos de entrega están sujetos a condiciones climáticas favorables.
        5. Cualquier modificación debe ser acordada por escrito por ambas partes.
        6. El cliente debe proporcionar acceso adecuado para la instalación.
        7. Se incluye instalación básica según especificaciones técnicas.
      `.trim()
    }

    // Generar el PDF
    const pdfBuffer = await pdfGenerator.generateContractPDF(pdfData)

    // Preparar datos para el envío de email
    const emailData = {
      clienteNombre: contrato.clientes.nombre,
      clienteEmail: contrato.clientes.correo,
      contratoId: contrato.id,
      valorTotal: contrato.valor_total,
      modeloCasa: contrato.modelo_casa,
      fechaEntrega: new Date(contrato.fecha_entrega).toLocaleDateString('es-CL'),
      pdfBuffer: Buffer.from(pdfBuffer),
    }

    // Enviar emails (al cliente y copia a la empresa)
    const emailResults = await emailService.enviarAmbos(emailData, contrato.ejecutivo_nombre)

    // Verificar resultados del envío
    const errores = []
    if (!emailResults.cliente.success) {
      errores.push(`Error enviando al cliente: ${emailResults.cliente.error}`)
    }
    if (!emailResults.empresa.success) {
      errores.push(`Error enviando copia a empresa: ${emailResults.empresa.error}`)
    }

    // Si hubo errores críticos (no se pudo enviar al cliente), reportar error
    if (!emailResults.cliente.success) {
      return NextResponse.json({ 
        error: 'Error enviando contrato al cliente', 
        details: errores 
      }, { status: 500 })
    }

    // Actualizar estado del contrato
    const { data: contratoActualizado, error: updateError } = await supabase
      .from('contratos')
      .update({
        estado: 'enviado',
        enviado_a_cliente: true,
        fecha_envio: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        clientes (*)
      `)
      .single()

    if (updateError) {
      console.error('Error actualizando estado del contrato:', updateError)
      // No retornamos error aquí porque el email ya se envió
      console.warn('El contrato se envió pero no se pudo actualizar el estado en la BD')
    }

    // Respuesta exitosa (incluso si hubo errores menores como copia a empresa)
    const response: any = {
      message: 'Contrato enviado exitosamente al cliente',
      contrato: contratoActualizado || contrato,
      emailResults: {
        cliente: emailResults.cliente.success,
        empresa: emailResults.empresa.success
      }
    }

    if (errores.length > 0 && emailResults.empresa.success === false) {
      response.warnings = errores
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error en POST /api/contratos/[id]/enviar:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}