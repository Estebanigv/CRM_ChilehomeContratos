import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pdfGenerator } from '@/lib/pdfGenerator'
import { ContratoPDFData } from '@/types'

// GET - Generar y descargar PDF del contrato
export async function GET(
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

    // Verificar permisos (cualquier usuario autenticado puede ver PDFs)
    // En producción podrías querer restringir más esto

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

    // Configurar headers para descarga
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="Contrato_${contrato.clientes.nombre.replace(/\s+/g, '_')}.pdf"`)
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