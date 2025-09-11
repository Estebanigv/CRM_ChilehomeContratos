import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pdfGenerator } from '@/lib/pdfGenerator'
import { ContratoPDFData } from '@/types'

// POST - Generar PDF desde datos del formulario sin guardar
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const contratoData = await request.json()

    // Validar datos requeridos
    if (!contratoData.cliente_nombre || !contratoData.numero_contrato) {
      return NextResponse.json({ 
        error: 'Datos incompletos: se requiere nombre del cliente y número de contrato' 
      }, { status: 400 })
    }

    // Preparar datos para el PDF
    const pdfData: ContratoPDFData = {
      cliente: {
        id: '', // No necesario para PDF temporal
        nombre: contratoData.cliente_nombre,
        rut: contratoData.cliente_rut,
        telefono: contratoData.cliente_telefono,
        correo: contratoData.cliente_correo,
        direccion_entrega: contratoData.direccion_entrega,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      contrato: {
        id: contratoData.numero_contrato,
        numero: contratoData.numero_contrato,
        cliente_id: '',
        ejecutivo_id: user.id,
        ejecutivo_nombre: contratoData.ejecutivo_nombre,
        fecha_entrega: contratoData.fecha_entrega,
        valor_total: contratoData.valor_total,
        modelo_casa: contratoData.modelo_casa,
        detalle_materiales: contratoData.detalle_materiales,
        materiales: contratoData.materiales,
        forma_pago: contratoData.forma_pago,
        observaciones_crm: contratoData.observaciones_crm,
        observaciones_adicionales: contratoData.observaciones_adicionales,
        estado: 'borrador',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
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

    // Configurar headers para descarga
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="Contrato_${contratoData.numero_contrato}.pdf"`)
    headers.set('Content-Length', pdfBuffer.length.toString())

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error generando PDF' }, { status: 500 })
  }
}