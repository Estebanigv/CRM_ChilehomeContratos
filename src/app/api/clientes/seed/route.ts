import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Datos de ejemplo para poblar la tabla de clientes
    const clientesEjemplo = [
      {
        nombre: 'María González Pérez',
        email: 'maria.gonzalez@email.com',
        estado: 'Contrato activo',
        fecha_ingreso: new Date().toISOString(),
        telefono: '+56 9 8765 4321',
        rut: '12345678-9',
        direccion: 'Las Condes, Santiago'
      },
      {
        nombre: 'Carlos Rodríguez López',
        email: 'carlos.rodriguez@email.com',
        estado: 'Pendiente contrato',
        fecha_ingreso: new Date(Date.now() - 86400000).toISOString(), // Ayer
        telefono: '+56 9 8765 4322',
        rut: '12345679-7',
        direccion: 'Providencia, Santiago'
      },
      {
        nombre: 'Ana Martínez Silva',
        email: null, // Sin correo para mostrar "Falta correo"
        estado: 'Contrato activo',
        fecha_ingreso: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
        telefono: '+56 9 8765 4323',
        rut: '12345680-K',
        direccion: 'Ñuñoa, Santiago'
      },
      {
        nombre: 'Roberto Sánchez Torres',
        email: 'roberto.sanchez@email.com',
        estado: 'Rechazado',
        fecha_ingreso: new Date(Date.now() - 259200000).toISOString(), // Hace 3 días
        telefono: '+56 9 8765 4324',
        rut: '12345681-8',
        direccion: 'Maipú, Santiago'
      },
      {
        nombre: 'Laura Pérez Morales',
        email: 'laura.perez@email.com',
        estado: 'Pendiente contrato',
        fecha_ingreso: new Date(Date.now() - 345600000).toISOString(), // Hace 4 días
        telefono: '+56 9 8765 4325',
        rut: '12345682-6',
        direccion: 'La Florida, Santiago'
      }
    ]

    // Primero verificar si la tabla existe y crearla si no existe
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'clientes')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.log('Error verificando tablas, intentando crear tabla...')
    }

    // Intentar crear la tabla si no existe
    if (!tables || tables.length === 0) {
      console.log('Creando tabla clientes...')
      
      const { error: createError } = await supabaseAdmin.rpc('create_clientes_table')
      
      if (createError) {
        console.log('Error creando tabla con RPC, intentando con SQL directo...')
        
        // SQL para crear la tabla
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS public.clientes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nombre TEXT NOT NULL,
            email TEXT,
            estado TEXT NOT NULL DEFAULT 'Pendiente contrato' CHECK (estado IN ('Pendiente contrato', 'Contrato activo', 'Rechazado')),
            fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            telefono TEXT,
            rut TEXT,
            direccion TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Crear índices
          CREATE INDEX IF NOT EXISTS idx_clientes_fecha_ingreso ON public.clientes(fecha_ingreso);
          CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado);
          
          -- Habilitar RLS
          ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
          
          -- Política para permitir todas las operaciones (ajustar según necesidades)
          CREATE POLICY IF NOT EXISTS "Allow all operations" ON public.clientes FOR ALL USING (true);
        `
        
        console.log('Ejecutando SQL de creación de tabla...')
        // Como no podemos ejecutar SQL directamente, insertemos los datos y si falla creamos la tabla manualmente
      }
    }

    // Insertar datos de ejemplo
    console.log('Insertando datos de ejemplo...')
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .insert(clientesEjemplo)
      .select()

    if (error) {
      console.error('Error insertando datos:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al insertar datos de ejemplo',
        details: error.message,
        hint: 'Es posible que necesites crear la tabla manualmente en Supabase'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de ejemplo insertados correctamente',
      clientesCreados: data?.length || 0,
      clientes: data
    })

  } catch (error) {
    console.error('Error en seed:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}