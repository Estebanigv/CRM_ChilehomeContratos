import { NextRequest, NextResponse } from 'next/server'
import {
  generarReporteContratos,
  generarReporteVentasDiarias,
  ejecutarReportesProgramados,
  REPORTES_GUILLERMO
} from '@/lib/notificacionesProgramadas'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tipo = searchParams.get('tipo')
  const test = searchParams.get('test') === 'true'

  try {
    switch (tipo) {
      case 'semanal':
        const fechaFin = new Date()
        const fechaInicio = new Date(fechaFin.getTime() - 7 * 24 * 60 * 60 * 1000)
        const reporteSemanal = await generarReporteContratos(fechaInicio, fechaFin)

        if (test) {
          return NextResponse.json({
            success: true,
            tipo: 'Reporte Semanal de Contratos',
            programado: 'Domingos 19:00 hrs',
            destinatario: 'Guillermo Díaz (+56 9 6334 8909)',
            mensaje: reporteSemanal
          })
        }

        // Enviar el reporte real
        const { notificarGuillermoDiaz } = await import('@/lib/whatsappRoles')
        const resultSemanal = await notificarGuillermoDiaz(reporteSemanal)

        return NextResponse.json({
          success: true,
          tipo: 'Reporte Semanal Enviado',
          result: resultSemanal
        })

      case 'diario':
        const reporteDiario = await generarReporteVentasDiarias()

        if (test) {
          return NextResponse.json({
            success: true,
            tipo: 'Reporte Diario de Ventas',
            programado: 'Diario 20:00 hrs',
            destinatario: 'Guillermo Díaz (+56 9 6334 8909)',
            mensaje: reporteDiario
          })
        }

        const { notificarGuillermoDiaz: notificarDiario } = await import('@/lib/whatsappRoles')
        const resultDiario = await notificarDiario(reporteDiario)

        return NextResponse.json({
          success: true,
          tipo: 'Reporte Diario Enviado',
          result: resultDiario
        })

      case 'ejecutar_programados':
        await ejecutarReportesProgramados()
        return NextResponse.json({
          success: true,
          message: 'Reportes programados ejecutados'
        })

      case 'configuracion':
        return NextResponse.json({
          success: true,
          configuraciones_activas: REPORTES_GUILLERMO,
          descripcion: {
            'resumen_semanal_contratos': 'Domingos 19:00 - Lista completa de contratos con links',
            'metricas_ventas_diarias': 'Diario 20:00 - Resumen de ventas del día',
            'resumen_financiero_mensual': 'Primer lunes del mes 09:00 - Estado financiero'
          }
        })

      default:
        return NextResponse.json({
          success: true,
          message: 'Sistema de Reportes para Guillermo Díaz',
          endpoints: {
            'Vista previa semanal': '/api/reportes-guillermo?tipo=semanal&test=true',
            'Vista previa diario': '/api/reportes-guillermo?tipo=diario&test=true',
            'Enviar reporte semanal': '/api/reportes-guillermo?tipo=semanal',
            'Enviar reporte diario': '/api/reportes-guillermo?tipo=diario',
            'Ver configuración': '/api/reportes-guillermo?tipo=configuracion',
            'Ejecutar programados': '/api/reportes-guillermo?tipo=ejecutar_programados'
          },
          programacion: {
            'Reporte Semanal': 'Domingos 19:00 hrs - Lista de contratos con detalles completos',
            'Reporte Diario': 'Diario 20:00 hrs - Métricas de ventas del día',
            'Reporte Mensual': 'Primer lunes del mes 09:00 hrs - Estado financiero'
          }
        })
    }
  } catch (error) {
    console.error('Error generando reporte:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion, configuracion } = body

    switch (accion) {
      case 'configurar_reporte':
        // Guardar configuración personalizada
        const { data, error } = await supabase
          .from('configuraciones_reportes')
          .insert(configuracion)
          .select()
          .single()

        if (error) throw error

        return NextResponse.json({
          success: true,
          message: 'Configuración guardada',
          configuracion: data
        })

      case 'actualizar_reporte':
        const { data: updated, error: updateError } = await supabase
          .from('configuraciones_reportes')
          .update(configuracion)
          .eq('id', configuracion.id)
          .select()
          .single()

        if (updateError) throw updateError

        return NextResponse.json({
          success: true,
          message: 'Configuración actualizada',
          configuracion: updated
        })

      case 'test_reporte_personalizado':
        const mensaje = `
📊 *REPORTE PERSONALIZADO - GUILLERMO DÍAZ*

${configuracion.contenido || 'Contenido de prueba del reporte personalizado'}

⚙️ *Configuración de Prueba*
• Área: ${configuracion.area}
• Frecuencia: ${configuracion.frecuencia}
• Horario: ${configuracion.hora}

Este es un mensaje de prueba para verificar el formato.

---
_Sistema ChileHome - ${new Date().toLocaleString('es-CL')}_
        `.trim()

        const { notificarGuillermoDiaz } = await import('@/lib/whatsappRoles')
        const result = await notificarGuillermoDiaz(mensaje)

        return NextResponse.json({
          success: true,
          message: 'Reporte de prueba enviado',
          result
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error en POST:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}