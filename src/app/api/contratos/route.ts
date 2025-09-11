import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crmApi } from '@/lib/crmApi'

// GET - Obtener todos los contratos
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener perfil del usuario
    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    // Los admins pueden ver todos los contratos, los ejecutivos solo los suyos
    let query = supabase
      .from('contratos')
      .select(`
        *,
        clientes (*)
      `)
      .order('created_at', { ascending: false })

    if (userProfile.role !== 'admin') {
      query = query.eq('ejecutivo_id', user.id)
    }

    const { data: contratos, error } = await query

    if (error) {
      console.error('Error obteniendo contratos:', error)
      return NextResponse.json({ error: 'Error obteniendo contratos' }, { status: 500 })
    }

    return NextResponse.json(contratos)
  } catch (error) {
    console.error('Error en GET /api/contratos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nuevo contrato desde CRM
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { ventaId } = body

    if (!ventaId) {
      return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 })
    }

    // Obtener datos de la venta desde el CRM
    const ventaData = await crmApi.obtenerVentaPorId(ventaId)

    if (!ventaData) {
      return NextResponse.json({ error: 'Venta no encontrada en CRM' }, { status: 404 })
    }

    // Verificar si ya existe un contrato para esta venta
    const { data: contratoExistente } = await supabase
      .from('contratos')
      .select('id')
      .eq('id', ventaId) // Asumimos que usamos el mismo ID de la venta para el contrato
      .single()

    if (contratoExistente) {
      return NextResponse.json({ error: 'Ya existe un contrato para esta venta' }, { status: 409 })
    }

    // Crear o encontrar cliente
    let { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('rut', ventaData.cliente_rut)
      .single()

    if (clienteError || !cliente) {
      // Crear nuevo cliente
      const { data: nuevoCliente, error: nuevoClienteError } = await supabase
        .from('clientes')
        .insert({
          nombre: ventaData.cliente_nombre,
          rut: ventaData.cliente_rut,
          telefono: ventaData.cliente_telefono,
          correo: ventaData.cliente_correo,
          direccion_entrega: ventaData.direccion_entrega,
        })
        .select()
        .single()

      if (nuevoClienteError) {
        console.error('Error creando cliente:', nuevoClienteError)
        return NextResponse.json({ error: 'Error creando cliente' }, { status: 500 })
      }

      cliente = nuevoCliente
    }

    // Crear contrato
    const { data: nuevoContrato, error: contratoError } = await supabase
      .from('contratos')
      .insert({
        id: ventaId, // Usar el mismo ID de la venta
        cliente_id: cliente.id,
        ejecutivo_id: userProfile.id,
        ejecutivo_nombre: userProfile.nombre,
        fecha_entrega: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 días por defecto
        valor_total: ventaData.valor_total,
        modelo_casa: ventaData.modelo_casa,
        detalle_materiales: ventaData.detalle_materiales,
        estado: 'borrador',
      })
      .select(`
        *,
        clientes (*)
      `)
      .single()

    if (contratoError) {
      console.error('Error creando contrato:', contratoError)
      return NextResponse.json({ error: 'Error creando contrato' }, { status: 500 })
    }

    // Marcar venta como procesada en el CRM
    try {
      await crmApi.marcarVentaComoProcesada(ventaId)
    } catch (error) {
      console.warn('No se pudo marcar la venta como procesada en el CRM:', error)
      // No fallar la operación por esto
    }

    return NextResponse.json({ 
      message: 'Contrato creado exitosamente',
      contrato: nuevoContrato
    }, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/contratos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}