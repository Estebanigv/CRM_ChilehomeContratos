import { NextRequest, NextResponse } from 'next/server'
import { obtenerClientesDelMes, obtenerClientes, crearCliente, Cliente } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const delMes = searchParams.get('del_mes')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '5')

    try {
      if (delMes === 'true') {
        // Obtener solo clientes del mes actual
        const clientes = await obtenerClientesDelMes()
        return NextResponse.json({
          success: true,
          clientes,
          total: clientes.length,
          source: 'supabase'
        })
      } else {
        // Obtener todos los clientes con paginación
        const { clientes, total } = await obtenerClientes(page, limit)
        return NextResponse.json({
          success: true,
          clientes,
          total,
          page,
          limit,
          source: 'supabase'
        })
      }
    } catch (supabaseError) {
      console.warn('Supabase no disponible, usando datos de ejemplo:', supabaseError)
      
      // Fallback a datos de ejemplo si Supabase no está disponible
      const clientesEjemplo: Cliente[] = [
        {
          id: '1',
          nombre: 'María González Pérez',
          email: 'maria.gonzalez@email.com',
          estado: 'Contrato activo',
          fecha_ingreso: new Date().toISOString(),
          telefono: '+56 9 8765 4321',
          rut: '12345678-9',
          direccion: 'Las Condes, Santiago',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          nombre: 'Carlos Rodríguez López',
          email: 'carlos.rodriguez@email.com',
          estado: 'Pendiente contrato',
          fecha_ingreso: new Date(Date.now() - 86400000).toISOString(),
          telefono: '+56 9 8765 4322',
          rut: '12345679-7',
          direccion: 'Providencia, Santiago',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          nombre: 'Ana Martínez Silva',
          email: undefined,
          estado: 'Contrato activo',
          fecha_ingreso: new Date(Date.now() - 172800000).toISOString(),
          telefono: '+56 9 8765 4323',
          rut: '12345680-K',
          direccion: 'Ñuñoa, Santiago',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          nombre: 'Roberto Sánchez Torres',
          email: 'roberto.sanchez@email.com',
          estado: 'Rechazado',
          fecha_ingreso: new Date(Date.now() - 259200000).toISOString(),
          telefono: '+56 9 8765 4324',
          rut: '12345681-8',
          direccion: 'Maipú, Santiago',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '5',
          nombre: 'Laura Pérez Morales',
          email: 'laura.perez@email.com',
          estado: 'Pendiente contrato',
          fecha_ingreso: new Date(Date.now() - 345600000).toISOString(),
          telefono: '+56 9 8765 4325',
          rut: '12345682-6',
          direccion: 'La Florida, Santiago',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      return NextResponse.json({
        success: true,
        clientes: clientesEjemplo.slice(0, limit),
        total: clientesEjemplo.length,
        source: 'mock',
        note: 'Usando datos de ejemplo. Para usar Supabase, ejecuta el script SQL en tu base de datos.'
      })
    }
  } catch (error) {
    console.error('Error en API de clientes:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener clientes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar datos requeridos
    if (!body.nombre) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Crear cliente con valores por defecto
    const nuevoCliente = {
      nombre: body.nombre,
      email: body.email || null,
      estado: body.estado || 'Pendiente contrato' as const,
      fecha_ingreso: body.fecha_ingreso || new Date().toISOString(),
      telefono: body.telefono || null,
      rut: body.rut || null,
      direccion: body.direccion || null
    }

    const cliente = await crearCliente(nuevoCliente)
    
    return NextResponse.json({
      success: true,
      cliente
    })
  } catch (error) {
    console.error('Error creando cliente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al crear cliente',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}