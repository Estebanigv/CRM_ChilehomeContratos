import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = await createClient()

  try {
    console.log('🚀 Iniciando auto-sincronización optimizada...')

    // Obtener fechas del mes actual
    const hoy = new Date()
    const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const fechaInicio = primerDiaDelMes.toISOString().split('T')[0]
    const fechaFin = hoy.toISOString().split('T')[0]

    console.log(`📅 Sincronizando período: ${fechaInicio} → ${fechaFin}`)

    // Verificar si necesitamos sincronización (si ya se hizo hoy)
    const { data: ultimaSync } = await supabase
      .from('crm_sync_log')
      .select('created_at, estado')
      .eq('estado', 'completado')
      .gte('created_at', `${fechaFin}T00:00:00.000Z`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (ultimaSync) {
      console.log('✅ Ya se realizó sincronización hoy, omitiendo')
      return NextResponse.json({
        success: true,
        message: 'Sincronización no necesaria - ya actualizada hoy',
        estadisticas: {
          totalVentasProcesadas: 0,
          ventasNuevas: 0,
          ventasActualizadas: 0,
          yaActualizado: true
        }
      })
    }

    // Crear registro de sincronización
    const { data: syncLog, error: syncLogError } = await supabase
      .from('crm_sync_log')
      .insert({
        sync_type: 'auto',
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'iniciado'
      })
      .select()
      .single()

    if (syncLogError) {
      throw new Error(`Error creando log: ${syncLogError.message}`)
    }

    let totalVentasProcesadas = 0
    let ventasNuevas = 0
    let ventasActualizadas = 0

    try {
      // Obtener solo ventas del mes actual para optimizar
      console.log(`📡 Obteniendo ventas del mes actual del CRM...`)
      const ventasCRM = await crmApi.obtenerVentas(undefined, fechaInicio, fechaFin)

      console.log(`📊 Ventas del mes obtenidas: ${ventasCRM.length}`)
      totalVentasProcesadas = ventasCRM.length

      if (ventasCRM.length === 0) {
        await supabase
          .from('crm_sync_log')
          .update({
            estado: 'completado',
            total_ventas_procesadas: 0,
            ventas_nuevas: 0,
            ventas_actualizadas: 0,
            completed_at: new Date().toISOString(),
            duracion_segundos: Math.round((Date.now() - startTime) / 1000)
          })
          .eq('id', syncLog.id)

        return NextResponse.json({
          success: true,
          message: 'No hay ventas nuevas en el mes actual',
          estadisticas: {
            totalVentasProcesadas: 0,
            ventasNuevas: 0,
            ventasActualizadas: 0
          }
        })
      }

      // Optimización: verificar qué ventas ya existen
      const ventaIds = ventasCRM.map(v => v.id)
      const { data: ventasExistentes } = await supabase
        .from('ventas_crm')
        .select('id, updated_at')
        .in('id', ventaIds)

      const ventasExistentesSet = new Set(ventasExistentes?.map(v => v.id) || [])

      // Preparar datos para inserción/actualización
      const ventasParaDB = ventasCRM.map(venta => ({
        id: venta.id,
        cliente_nombre: venta.cliente_nombre,
        cliente_rut: venta.cliente_rut,
        cliente_telefono: venta.cliente_telefono,
        cliente_correo: venta.cliente_correo,
        direccion_entrega: venta.direccion_entrega,
        valor_total: venta.valor_total,
        modelo_casa: venta.modelo_casa,
        detalle_materiales: venta.detalle_materiales,
        fecha_venta: venta.fecha_venta,
        fecha_entrega: venta.fecha_entrega === 'Por definir' ? null : venta.fecha_entrega,
        ejecutivo_id: venta.ejecutivo_id,
        ejecutivo_nombre: venta.ejecutivo_nombre,
        supervisor_nombre: venta.supervisor_nombre,
        estado_crm: venta.estado_crm,
        observaciones_crm: venta.observaciones_crm,
        numero_contrato: venta.numero_contrato,
        numero_contrato_temporal: venta.numero_contrato_temporal,
        synced_at: new Date().toISOString(),
        crm_data: venta
      }))

      // Contar nuevas vs actualizadas
      ventasCRM.forEach(venta => {
        if (ventasExistentesSet.has(venta.id)) {
          ventasActualizadas++
        } else {
          ventasNuevas++
        }
      })

      // Insertar/actualizar en un solo batch
      const { error: upsertError } = await supabase
        .from('ventas_crm')
        .upsert(ventasParaDB, {
          onConflict: 'id'
        })

      if (upsertError) {
        throw new Error(`Error en upsert: ${upsertError.message}`)
      }

      // Actualizar log como completado
      const duracionSegundos = Math.round((Date.now() - startTime) / 1000)
      await supabase
        .from('crm_sync_log')
        .update({
          estado: 'completado',
          total_ventas_procesadas: totalVentasProcesadas,
          ventas_nuevas: ventasNuevas,
          ventas_actualizadas: ventasActualizadas,
          completed_at: new Date().toISOString(),
          duracion_segundos: duracionSegundos
        })
        .eq('id', syncLog.id)

      console.log(`✅ Auto-sincronización completada:`)
      console.log(`   📊 Total: ${totalVentasProcesadas}`)
      console.log(`   🆕 Nuevas: ${ventasNuevas}`)
      console.log(`   🔄 Actualizadas: ${ventasActualizadas}`)
      console.log(`   ⏱️ Duración: ${duracionSegundos}s`)

      return NextResponse.json({
        success: true,
        message: 'Auto-sincronización completada',
        estadisticas: {
          totalVentasProcesadas,
          ventasNuevas,
          ventasActualizadas,
          duracionSegundos
        },
        periodo: {
          inicio: fechaInicio,
          fin: fechaFin
        }
      })

    } catch (error) {
      // Marcar como error
      await supabase
        .from('crm_sync_log')
        .update({
          estado: 'error',
          mensaje_error: error instanceof Error ? error.message : 'Error desconocido',
          total_ventas_procesadas: totalVentasProcesadas,
          ventas_nuevas: ventasNuevas,
          ventas_actualizadas: ventasActualizadas,
          duracion_segundos: Math.round((Date.now() - startTime) / 1000)
        })
        .eq('id', syncLog.id)

      throw error
    }

  } catch (error) {
    console.error('❌ Error en auto-sincronización:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en auto-sincronización',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET para verificar estado de auto-sync
export async function GET() {
  try {
    const supabase = await createClient()
    const hoy = new Date().toISOString().split('T')[0]

    // Verificar si ya se hizo auto-sync hoy
    const { data: syncHoy, error } = await supabase
      .from('crm_sync_log')
      .select('*')
      .eq('sync_type', 'auto')
      .gte('created_at', `${hoy}T00:00:00.000Z`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }

    return NextResponse.json({
      success: true,
      necesitaSync: !syncHoy || syncHoy.estado !== 'completado',
      ultimaAutoSync: syncHoy,
      fechaHoy: hoy
    })

  } catch (error) {
    console.error('❌ Error verificando estado auto-sync:', error)
    return NextResponse.json({
      success: false,
      error: 'Error verificando estado',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}