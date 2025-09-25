import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CRMMetrics } from '@/lib/crmMetrics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'diario'
    const fechaInicio = searchParams.get('fecha_inicio')
    const fechaFin = searchParams.get('fecha_fin')

    // Crear cliente de Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            for (const cookie of cookies) {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            }
          }
        }
      }
    )

    // Obtener ventas del CRM
    let query = supabase.from('ventas').select('*')

    // Aplicar filtros de fecha si se proporcionan
    if (fechaInicio) {
      query = query.gte('fecha_venta', fechaInicio)
    }
    if (fechaFin) {
      query = query.lte('fecha_venta', fechaFin)
    }

    const { data: ventas, error } = await query.order('fecha_venta', { ascending: false })

    if (error) {
      console.error('Error obteniendo ventas:', error)
      return NextResponse.json(
        { error: 'Error al obtener datos de ventas' },
        { status: 500 }
      )
    }

    // Definir rangos de fecha según el tipo
    const hoy = new Date()
    let fechaInicioCalculo: Date
    let fechaFinCalculo: Date
    let fechaInicioAnterior: Date
    let fechaFinAnterior: Date

    switch (tipo) {
      case 'diario':
        fechaInicioCalculo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
        fechaFinCalculo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59)
        fechaInicioAnterior = new Date(fechaInicioCalculo)
        fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - 1)
        fechaFinAnterior = new Date(fechaFinCalculo)
        fechaFinAnterior.setDate(fechaFinAnterior.getDate() - 1)
        break

      case 'semanal':
        const inicioSemana = new Date(hoy)
        inicioSemana.setDate(hoy.getDate() - hoy.getDay()) // Domingo
        fechaInicioCalculo = new Date(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate())
        fechaFinCalculo = new Date(fechaInicioCalculo)
        fechaFinCalculo.setDate(fechaFinCalculo.getDate() + 6)
        fechaFinCalculo.setHours(23, 59, 59)

        fechaInicioAnterior = new Date(fechaInicioCalculo)
        fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - 7)
        fechaFinAnterior = new Date(fechaFinCalculo)
        fechaFinAnterior.setDate(fechaFinAnterior.getDate() - 7)
        break

      case 'mensual':
      default:
        fechaInicioCalculo = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        fechaFinCalculo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59)
        fechaInicioAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
        fechaFinAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0, 23, 59, 59)
        break
    }

    // Filtrar ventas para el período actual
    const ventasActual = ventas?.filter(v => {
      const fecha = new Date(v.fecha_venta)
      return fecha >= fechaInicioCalculo && fecha <= fechaFinCalculo
    }) || []

    // Filtrar ventas para el período anterior
    const ventasAnterior = ventas?.filter(v => {
      const fecha = new Date(v.fecha_venta)
      return fecha >= fechaInicioAnterior && fecha <= fechaFinAnterior
    }) || []

    // Calcular métricas
    const metasDiarias = { diario: 5, semanal: 35, mensual: 150 }
    const metaDiaria = metasDiarias[tipo as keyof typeof metasDiarias] || 5

    const metricas = CRMMetrics.calcularMetricasPeriodo(
      ventasActual,
      fechaInicioCalculo,
      fechaFinCalculo,
      metaDiaria
    )

    const metricasAnterior = CRMMetrics.calcularMetricasPeriodo(
      ventasAnterior,
      fechaInicioAnterior,
      fechaFinAnterior,
      metaDiaria
    )

    const ejecutivos = CRMMetrics.calcularMetricasEjecutivos(ventasActual)
    const pipeline = CRMMetrics.calcularPipeline(ventasActual)
    const tendencias = CRMMetrics.calcularTendencias(ventasActual, ventasAnterior)
    const predicciones = CRMMetrics.generarPredicciones(ventas || [])

    // Distribución por estados
    const distribucionEstados: Record<string, number> = {}
    ventasActual.forEach(v => {
      const estado = v.estado_crm || 'Sin estado'
      distribucionEstados[estado] = (distribucionEstados[estado] || 0) + 1
    })

    // Respuesta completa
    const response = {
      tipo,
      periodo: {
        inicio: fechaInicioCalculo.toISOString(),
        fin: fechaFinCalculo.toISOString(),
        label: tipo === 'diario' ? 'Hoy' :
               tipo === 'semanal' ? 'Esta semana' : 'Este mes'
      },
      metricas,
      comparacion: {
        periodo_anterior: {
          inicio: fechaInicioAnterior.toISOString(),
          fin: fechaFinAnterior.toISOString(),
          label: tipo === 'diario' ? 'Ayer' :
                 tipo === 'semanal' ? 'Semana pasada' : 'Mes pasado'
        },
        ...metricasAnterior,
        diferencias: {
          ventas: metricas.totalVentas - metricasAnterior.totalVentas,
          monto: metricas.montoTotal - metricasAnterior.montoTotal,
          porcentaje_ventas: metricasAnterior.totalVentas > 0
            ? ((metricas.totalVentas - metricasAnterior.totalVentas) / metricasAnterior.totalVentas) * 100
            : 0,
          porcentaje_monto: metricasAnterior.montoTotal > 0
            ? ((metricas.montoTotal - metricasAnterior.montoTotal) / metricasAnterior.montoTotal) * 100
            : 0
        }
      },
      ejecutivos: ejecutivos.slice(0, 10), // Top 10
      pipeline,
      tendencias,
      predicciones,
      distribucion_estados: distribucionEstados,
      ventas_detalle: ventasActual.slice(0, 20), // Últimas 20 ventas
      estadisticas_adicionales: {
        total_ejecutivos: ejecutivos.length,
        mejor_ejecutivo: ejecutivos[0]?.nombre || 'N/A',
        peor_dia_semana: tendencias.peorDia,
        mejor_dia_semana: tendencias.mejorDia,
        tiempo_promedio_cierre: metricas.tiempoPromedioResolucion,
        eficiencia: metricas.tasaConversion
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error en API de métricas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para métricas en tiempo real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'update_metrics') {
      // Aquí se podría implementar actualización en tiempo real
      // usando WebSockets o Server-Sent Events
      return NextResponse.json({
        success: true,
        message: 'Métricas actualizadas'
      })
    }

    if (action === 'export_metrics') {
      // Exportar métricas
      const { tipo, formato } = data

      // TODO: Implementar exportación
      return NextResponse.json({
        success: true,
        download_url: `/api/export/metricas?tipo=${tipo}&formato=${formato}`
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error en POST métricas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}