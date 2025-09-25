import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const supabase = await createClient()

  try {
    const { searchParams } = new URL(request.url)
    const syncType = searchParams.get('type') || 'full' // 'full', 'incremental', 'manual'
    const fechaInicio = searchParams.get('fecha_inicio') || '2024-01-01'
    const fechaFin = searchParams.get('fecha_fin') || new Date().toISOString().split('T')[0]

    console.log(`🔄 Iniciando sincronización CRM [${syncType}]: ${fechaInicio} a ${fechaFin}`)

    // Crear registro de sincronización
    const { data: syncLog, error: syncLogError } = await supabase
      .from('crm_sync_log')
      .insert({
        sync_type: syncType,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        estado: 'iniciado'
      })
      .select()
      .single()

    if (syncLogError) {
      throw new Error(`Error creando log de sincronización: ${syncLogError.message}`)
    }

    let totalVentasProcesadas = 0
    let ventasNuevas = 0
    let ventasActualizadas = 0

    try {
      // Si es sincronización incremental, obtener solo datos nuevos
      let fechaInicioSync = fechaInicio
      if (syncType === 'incremental') {
        // Obtener la fecha de la última sincronización exitosa
        const { data: lastSync } = await supabase
          .from('crm_sync_log')
          .select('fecha_fin')
          .eq('estado', 'completado')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        if (lastSync) {
          fechaInicioSync = lastSync.fecha_fin
          console.log(`📅 Sincronización incremental desde: ${fechaInicioSync}`)
        }
      }

      // Obtener TODAS las ventas del CRM en el rango de fechas
      console.log(`📡 Obteniendo ventas del CRM desde ${fechaInicioSync} hasta ${fechaFin}...`)
      const ventasCRM = await crmApi.obtenerVentas(undefined, fechaInicioSync, fechaFin)

      console.log(`📊 Ventas obtenidas del CRM: ${ventasCRM.length}`)
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
          message: 'No hay ventas nuevas para sincronizar',
          estadisticas: {
            totalVentasProcesadas: 0,
            ventasNuevas: 0,
            ventasActualizadas: 0
          }
        })
      }

      // Procesar ventas en lotes para mejor rendimiento
      const BATCH_SIZE = 100
      const batches = []
      for (let i = 0; i < ventasCRM.length; i += BATCH_SIZE) {
        batches.push(ventasCRM.slice(i, i + BATCH_SIZE))
      }

      console.log(`📦 Procesando ${batches.length} lotes de ${BATCH_SIZE} ventas cada uno...`)

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        console.log(`📦 Procesando lote ${batchIndex + 1}/${batches.length} (${batch.length} ventas)...`)

        // Preparar datos para inserción/actualización
        const ventasParaDB = batch.map(venta => ({
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
          crm_data: venta // Guardar todos los datos brutos del CRM
        }))

        // Usar upsert para insertar o actualizar
        const { error: upsertError, count } = await supabase
          .from('ventas_crm')
          .upsert(ventasParaDB, {
            onConflict: 'id',
            count: 'exact'
          })

        if (upsertError) {
          throw new Error(`Error en lote ${batchIndex + 1}: ${upsertError.message}`)
        }

        // Para determinar si son nuevas o actualizadas, verificamos qué existía antes
        const ventaIds = batch.map(v => v.id)
        const { data: ventasExistentes } = await supabase
          .from('ventas_crm')
          .select('id, updated_at, synced_at')
          .in('id', ventaIds)

        const ventasExistentesMap = new Map(ventasExistentes?.map(v => [v.id, v]) || [])

        batch.forEach(venta => {
          const existente = ventasExistentesMap.get(venta.id)
          if (!existente) {
            ventasNuevas++
          } else {
            ventasActualizadas++
          }
        })

        console.log(`✅ Lote ${batchIndex + 1} completado: ${batch.length} ventas procesadas`)
      }

      // Actualizar el log de sincronización como completado
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

      console.log(`✅ Sincronización completada exitosamente:`)
      console.log(`   📊 Total procesadas: ${totalVentasProcesadas}`)
      console.log(`   🆕 Nuevas: ${ventasNuevas}`)
      console.log(`   🔄 Actualizadas: ${ventasActualizadas}`)
      console.log(`   ⏱️ Duración: ${duracionSegundos} segundos`)

      return NextResponse.json({
        success: true,
        message: 'Sincronización completada exitosamente',
        syncId: syncLog.id,
        estadisticas: {
          totalVentasProcesadas,
          ventasNuevas,
          ventasActualizadas,
          duracionSegundos
        },
        periodo: {
          inicio: fechaInicioSync,
          fin: fechaFin
        }
      })

    } catch (error) {
      // Marcar sincronización como error
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
    console.error('❌ Error en sincronización CRM:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en sincronización CRM',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Endpoint GET para consultar el estado de las sincronizaciones
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Obtener estadísticas generales
    const { data: stats } = await supabase
      .from('ventas_crm')
      .select('count(*), estado_crm')
      .neq('estado_crm', null)

    // Obtener historial de sincronizaciones
    const { data: syncHistory, error } = await supabase
      .from('crm_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Error obteniendo historial: ${error.message}`)
    }

    // Obtener totales
    const { count: totalVentas } = await supabase
      .from('ventas_crm')
      .select('*', { count: 'exact', head: true })

    // Obtener última sincronización
    const ultimaSync = syncHistory?.[0]

    return NextResponse.json({
      success: true,
      estadisticas: {
        totalVentasEnDB: totalVentas,
        ultimaSincronizacion: ultimaSync,
        historialSincronizaciones: syncHistory
      }
    })

  } catch (error) {
    console.error('❌ Error obteniendo estado de sincronización:', error)
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estado',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}