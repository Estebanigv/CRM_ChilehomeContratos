import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Obtener contrato por ID
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

    const { data: contrato, error } = await supabase
      .from('contratos')
      .select(`
        *,
        clientes (*)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error obteniendo contrato:', error)
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    return NextResponse.json(contrato)
  } catch (error) {
    console.error('Error en GET /api/contratos/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar contrato
export async function PUT(
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

    // Verificar que el usuario puede editar este contrato
    const { data: contrato } = await supabase
      .from('contratos')
      .select('ejecutivo_id')
      .eq('id', params.id)
      .single()

    if (!contrato) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 })
    }

    // Verificar permisos
    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    const canEdit = userProfile?.role === 'admin' || contrato.ejecutivo_id === user.id
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Sin permisos para editar este contrato' }, { status: 403 })
    }

    const body = await request.json()

    // Actualizar cliente
    const { error: clienteError } = await supabase
      .from('clientes')
      .update({
        nombre: body.cliente_nombre,
        rut: body.cliente_rut,
        telefono: body.cliente_telefono || null,
        correo: body.cliente_correo || null,
        direccion_entrega: body.cliente_direccion_entrega,
      })
      .eq('id', (await supabase
        .from('contratos')
        .select('cliente_id')
        .eq('id', params.id)
        .single()).data?.cliente_id)

    if (clienteError) {
      console.error('Error actualizando cliente:', clienteError)
      return NextResponse.json({ error: 'Error actualizando información del cliente' }, { status: 500 })
    }

    // Actualizar contrato
    const { data: contratoActualizado, error: contratoError } = await supabase
      .from('contratos')
      .update({
        fecha_entrega: body.fecha_entrega,
        valor_total: body.valor_total,
        modelo_casa: body.modelo_casa,
        detalle_materiales: body.detalle_materiales,
        observaciones: body.observaciones || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (contratoError) {
      console.error('Error actualizando contrato:', contratoError)
      return NextResponse.json({ error: 'Error actualizando contrato' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Contrato actualizado exitosamente', 
      contrato: contratoActualizado 
    })
  } catch (error) {
    console.error('Error en PUT /api/contratos/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar contrato (solo admins)
export async function DELETE(
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

    // Solo admins pueden eliminar contratos
    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos para eliminar contratos' }, { status: 403 })
    }

    const { error } = await supabase
      .from('contratos')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error eliminando contrato:', error)
      return NextResponse.json({ error: 'Error eliminando contrato' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Contrato eliminado exitosamente' })
  } catch (error) {
    console.error('Error en DELETE /api/contratos/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}