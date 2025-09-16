import { NextRequest, NextResponse } from 'next/server'
import { ejecutarReportesProgramados } from '@/lib/notificacionesProgramadas'

// Este endpoint será llamado por un servicio de cron
// Por ejemplo: Vercel Cron, GitHub Actions, o un servicio externo

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'chilehome-cron-2025'

  // Verificar autenticación del cron job
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🔄 Ejecutando reportes programados...', new Date().toISOString())

    await ejecutarReportesProgramados()

    console.log('✅ Reportes programados ejecutados exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Reportes programados ejecutados',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Error ejecutando reportes programados:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accion, tipo } = body

    switch (accion) {
      case 'ejecutar_ahora':
        await ejecutarReportesProgramados()
        return NextResponse.json({
          success: true,
          message: 'Reportes ejecutados manualmente'
        })

      case 'verificar_configuracion':
        // Verificar qué reportes están configurados para ejecutar pronto
        const ahora = new Date()
        const proximaEjecucion = obtenerProximasEjecuciones(ahora)

        return NextResponse.json({
          success: true,
          proximas_ejecuciones: proximaEjecucion,
          configuracion_cron: {
            url: `${request.nextUrl.origin}/api/cron/reportes`,
            metodo: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.CRON_SECRET || 'chilehome-cron-2025'}`
            },
            frecuencia: 'Cada hora (recomendado) o cada 30 minutos'
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Acción no válida'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

function obtenerProximasEjecuciones(ahora: Date) {
  const proximaEjecuciones = []

  // Próximo domingo 19:00 (reporte semanal)
  const proximoDomingo = new Date(ahora)
  const diasHastaDomingo = (7 - ahora.getDay()) % 7
  proximoDomingo.setDate(ahora.getDate() + (diasHastaDomingo === 0 ? 7 : diasHastaDomingo))
  proximoDomingo.setHours(19, 0, 0, 0)

  proximaEjecuciones.push({
    tipo: 'Reporte Semanal de Contratos',
    destinatario: 'Guillermo Díaz',
    fecha: proximoDomingo.toLocaleString('es-CL'),
    faltan: Math.ceil((proximoDomingo.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)) + ' días'
  })

  // Próximo reporte diario 20:00
  const proximoDiario = new Date(ahora)
  proximoDiario.setHours(20, 0, 0, 0)
  if (proximoDiario <= ahora) {
    proximoDiario.setDate(proximoDiario.getDate() + 1)
  }

  proximaEjecuciones.push({
    tipo: 'Reporte Diario de Ventas',
    destinatario: 'Guillermo Díaz',
    fecha: proximoDiario.toLocaleString('es-CL'),
    faltan: Math.ceil((proximoDiario.getTime() - ahora.getTime()) / (1000 * 60 * 60)) + ' horas'
  })

  // Próximo primer lunes del mes 09:00 (reporte mensual)
  const proximoMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1)
  const diaSemana = proximoMes.getDay()
  const diasHastaPrimerLunes = diaSemana === 0 ? 1 : 8 - diaSemana
  proximoMes.setDate(diasHastaPrimerLunes)
  proximoMes.setHours(9, 0, 0, 0)

  proximaEjecuciones.push({
    tipo: 'Reporte Financiero Mensual',
    destinatario: 'Guillermo Díaz',
    fecha: proximoMes.toLocaleString('es-CL'),
    faltan: Math.ceil((proximoMes.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)) + ' días'
  })

  return proximaEjecuciones
}