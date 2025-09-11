import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente con service role para operaciones administrativas
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)

// Tipos de datos para clientes
export interface Cliente {
  id: string
  nombre: string
  email?: string
  estado: 'Pendiente contrato' | 'Contrato activo' | 'Rechazado'
  fecha_ingreso: string
  telefono?: string
  rut?: string
  direccion?: string
  created_at: string
  updated_at: string
}

// Función para obtener clientes del mes actual
export async function obtenerClientesDelMes(): Promise<Cliente[]> {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .gte('fecha_ingreso', inicioMes.toISOString())
    .order('fecha_ingreso', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error obteniendo clientes:', error)
    throw error
  }

  return data || []
}

// Función para crear cliente
export async function crearCliente(cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single()

  if (error) {
    console.error('Error creando cliente:', error)
    throw error
  }

  return data
}

// Función para obtener todos los clientes con paginación
export async function obtenerClientes(page: number = 1, limit: number = 10): Promise<{ clientes: Cliente[], total: number }> {
  const offset = (page - 1) * limit

  const [clientesResult, countResult] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .order('fecha_ingreso', { ascending: false })
      .range(offset, offset + limit - 1),
    
    supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })
  ])

  if (clientesResult.error) {
    console.error('Error obteniendo clientes:', clientesResult.error)
    throw clientesResult.error
  }

  if (countResult.error) {
    console.error('Error obteniendo total de clientes:', countResult.error)
    throw countResult.error
  }

  return {
    clientes: clientesResult.data || [],
    total: countResult.count || 0
  }
}