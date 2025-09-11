import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Validar contrato
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

    const canValidate = userProfile?.role === 'admin' || contrato.ejecutivo_id === user.id
    
    if (!canValidate) {
      return NextResponse.json({ error: 'Sin permisos para validar este contrato' }, { status: 403 })
    }

    // Verificar que el contrato esté en estado borrador
    if (contrato.estado !== 'borrador') {
      return NextResponse.json({ error: 'Solo se pueden validar contratos en borrador' }, { status: 400 })
    }

    // Validar que todos los campos requeridos estén completos
    const validationErrors = []

    if (!contrato.clientes.nombre) validationErrors.push('Nombre del cliente requerido')
    if (!contrato.clientes.rut) validationErrors.push('RUT del cliente requerido')
    if (!contrato.clientes.correo) validationErrors.push('Email del cliente requerido para envío')
    if (!contrato.clientes.direccion_entrega) validationErrors.push('Dirección de entrega requerida')
    if (!contrato.valor_total || contrato.valor_total <= 0) validationErrors.push('Valor total válido requerido')
    if (!contrato.modelo_casa) validationErrors.push('Modelo de casa requerido')
    if (!contrato.detalle_materiales) validationErrors.push('Detalle de materiales requerido')
    if (!contrato.fecha_entrega) validationErrors.push('Fecha de entrega requerida')

    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Faltan campos requeridos', 
        details: validationErrors 
      }, { status: 400 })
    }

    // Actualizar estado a validado
    const { data: contratoValidado, error: updateError } = await supabase
      .from('contratos')
      .update({
        estado: 'validado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        clientes (*)
      `)
      .single()

    if (updateError) {
      console.error('Error validando contrato:', updateError)
      return NextResponse.json({ error: 'Error validando contrato' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Contrato validado exitosamente',
      contrato: contratoValidado
    })
  } catch (error) {
    console.error('Error en POST /api/contratos/[id]/validar:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}