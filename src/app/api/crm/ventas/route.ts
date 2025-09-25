import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { crmApi } from '@/lib/crmApi'
import { tempStorage } from '@/lib/tempStorage'
import { requireAuth } from '@/lib/auth/serverAuth'

// GET - Obtener ventas desde CRM
export async function GET(request: NextRequest) {
  try {
    console.log('🔗 API CRM ventas - Conectando al CRM real')

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url)
    const ejecutivoId = searchParams.get('ejecutivo_id')
    const fechaInicio = searchParams.get('fecha_inicio')
    const fechaFin = searchParams.get('fecha_fin')

    try {
      // Obtener ventas del CRM con filtros de fecha (sin filtro de ejecutivo por ahora)
      const ventas = await crmApi.obtenerVentas(undefined, fechaInicio ?? undefined, fechaFin ?? undefined)

      // Filtrar ventas eliminadas usando tempStorage
      const idsEliminados = new Set(tempStorage.getEliminatedIds())
      const ventasDisponibles = ventas.filter(venta => !idsEliminados.has(venta.id))
      
      console.log(`📊 Ventas del CRM: ${ventas.length} total`)
      console.log(`🗑️ Fichas eliminadas: ${idsEliminados.size} filtradas`)
      console.log(`✅ Ventas disponibles: ${ventasDisponibles.length} mostradas`)

      // Debug: Mostrar TODOS los estados únicos que están llegando del CRM
      const estadosUnicos = [...new Set(ventasDisponibles.map(v => v.estado_crm))].filter(Boolean)
      console.log(`🔍 ESTADOS ÚNICOS DEL CRM (${estadosUnicos.length} tipos):`)
      estadosUnicos.forEach(estado => {
        const cantidad = ventasDisponibles.filter(v => v.estado_crm === estado).length
        console.log(`  📊 "${estado}": ${cantidad} ventas`)
      })

      // Debug: Mostrar los campos de fecha disponibles en las primeras 3 ventas
      console.log('🗓️ DEBUG CAMPOS DE FECHA DEL CRM:')
      ventasDisponibles.slice(0, 3).forEach((venta, idx) => {
        console.log(`  Venta ${idx + 1} (ID: ${venta.id}):`)
        console.log(`    - fecha_venta: "${venta.fecha_venta}" (${typeof venta.fecha_venta})`)
        console.log(`    - created_at: "${venta.created_at}" (${typeof venta.created_at})`)
        console.log(`    - fecha_entrega: "${venta.fecha_entrega}" (${typeof venta.fecha_entrega})`)
        console.log(`    - fecha_ingreso: "${venta.fecha_ingreso}" (${typeof venta.fecha_ingreso})`)
        console.log(`    - otros campos de fecha:`, Object.keys(venta).filter(k => k.includes('fecha')))
      })

      // Obtener contratos existentes desde Supabase
      const supabase = await createClient()
      const { data: contractosExistentes } = await supabase
        .from('contratos')
        .select('id')

      const idsContratosExistentes = new Set(
        contractosExistentes?.map(c => c.id) || []
      )

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