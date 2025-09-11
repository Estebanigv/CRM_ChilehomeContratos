import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crmApi } from '@/lib/crmApi'

// GET - Obtener ventas desde CRM
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 TEST MODE - Skipping authentication for CRM testing') // Debug
    
    // TEMP: Skip auth for testing
    // const supabase = await createClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) { return NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
    
    // Mock user profile for testing
    const userProfile = { role: 'admin', id: 'test-user' }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const ejecutivoId = searchParams.get('ejecutivo_id')
    const fechaInicio = searchParams.get('fecha_inicio')
    const fechaFin = searchParams.get('fecha_fin')

    try {
      // Los ejecutivos solo pueden ver sus propias ventas (excepto admins)
      const filtroEjecutivo = userProfile.role === 'admin' ? ejecutivoId : userProfile.id

      // Obtener ventas del CRM con filtros de fecha
      const ventas = await crmApi.obtenerVentas(filtroEjecutivo, fechaInicio ?? undefined, fechaFin ?? undefined)

      // TEMP: Skip Supabase for testing
      // const { data: contractosExistentes } = await supabase.from('contratos').select('id')
      const idsContratosExistentes = new Set()
      const ventasDisponibles = ventas

      return NextResponse.json({
        success: true,
        ventas: ventasDisponibles,
        total: ventasDisponibles.length,
        contratos_existentes: idsContratosExistentes.size
      })
    } catch (error) {
      console.error('Error obteniendo ventas del CRM:', error)
      
      // Si hay credenciales configuradas pero falla, devolver error
      const hasCredentials = process.env.CRM_USUARIO && process.env.CRM_CLAVE
      if (hasCredentials) {
        return NextResponse.json({
          success: false,
          error: `Error conectando con CRM: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          ventas: []
        })
      }
      
      // Solo usar datos vacíos si no hay credenciales
      return NextResponse.json({
        success: true,
        ventas: [],
        total: 0,
        contratos_existentes: 0,
        warning: 'CRM no configurado'
      })
    }
  } catch (error) {
    console.error('Error en GET /api/crm/ventas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Validar contrato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ventaId, observaciones } = body
    
    if (action === 'validar_contrato') {
      // Aquí iría la lógica para marcar el contrato como validado en el CRM
      // Por ahora simularemos la validación
      
      console.log(`🔄 Validando contrato ${ventaId}...`)
      
      // Simulamos una llamada a la API del CRM para validar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return NextResponse.json({
        success: true,
        message: 'Contrato validado exitosamente',
        ventaId,
        estadoNuevo: 'validado',
        fechaValidacion: new Date().toISOString()
      })
    }
    
    if (action === 'crear_contrato') {
      const { clienteData, contratoData } = body
      
      console.log(`📄 Creando contrato para cliente ${clienteData.rut}...`)
      
      // Simulamos la creación del contrato
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return NextResponse.json({
        success: true,
        message: 'Contrato creado exitosamente',
        contratoId: `CONT-${Date.now()}`,
        cliente: clienteData.nombre,
        valor: contratoData.valor,
        fechaCreacion: new Date().toISOString()
      })
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    
  } catch (error) {
    console.error('Error en POST /api/crm/ventas:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}