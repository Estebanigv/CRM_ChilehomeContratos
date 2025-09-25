import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fecha_inicio') || '2025-09-01'
    const fechaFin = searchParams.get('fecha_fin') || '2025-09-30'

    console.log(`🔍 DEBUG CRM - Analizando período: ${fechaInicio} a ${fechaFin}`)

    // Obtener datos reales del CRM
    const ventasCompletas = await crmApi.obtenerVentas(undefined, fechaInicio, fechaFin)

    console.log(`📊 DEBUG CRM - Total ventas encontradas: ${ventasCompletas.length}`)

    // Analizar estados únicos
    const estadosUnicos = [...new Set(ventasCompletas.map(v => v.estado_crm))].filter(Boolean)
    console.log(`🏷️ DEBUG CRM - Estados únicos encontrados:`, estadosUnicos)

    // Contar por estado
    const conteoEstados = {}
    ventasCompletas.forEach(venta => {
      const estado = venta.estado_crm || 'Sin estado'
      conteoEstados[estado] = (conteoEstados[estado] || 0) + 1
    })

    // Filtrar solo "Entrega OK"
    const ventasEntregaOK = ventasCompletas.filter(v => v.estado_crm === 'Entrega OK')
    console.log(`✅ DEBUG CRM - Ventas "Entrega OK": ${ventasEntregaOK.length}`)

    // Analizar fechas de ventas con "Entrega OK"
    const fechasEntregaOK = ventasEntregaOK.map(v => ({
      id: v.id,
      cliente: v.cliente_nombre,
      fecha_venta: v.fecha_venta,
      estado_original: v.estado_crm,
      ejecutivo: v.ejecutivo_nombre
    }))

    // Datos brutos de algunas ventas para análisis
    const muestraVentas = ventasCompletas.slice(0, 5).map(v => ({
      id: v.id,
      cliente_nombre: v.cliente_nombre,
      estado_crm: v.estado_crm,
      fecha_venta: v.fecha_venta,
      fecha_entrega: v.fecha_entrega,
      ejecutivo_nombre: v.ejecutivo_nombre,
      numero_contrato: v.numero_contrato
    }))

    const debug = {
      periodo: {
        inicio: fechaInicio,
        fin: fechaFin
      },
      resumen: {
        totalVentas: ventasCompletas.length,
        ventasEntregaOK: ventasEntregaOK.length,
        estadosUnicos: estadosUnicos.length
      },
      estadosDetalle: conteoEstados,
      estadosUnicos,
      ventasEntregaOK: fechasEntregaOK,
      muestraVentas,
      timestamp: new Date().toISOString()
    }

    console.log(`🔍 DEBUG CRM - Análisis completo:`, debug)

    return NextResponse.json(debug)

  } catch (error) {
    console.error('❌ Error en debug CRM:', error)
    return NextResponse.json({
      error: 'Error analizando datos CRM',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}