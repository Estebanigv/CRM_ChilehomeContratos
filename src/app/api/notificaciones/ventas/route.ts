import { NextRequest, NextResponse } from 'next/server'
import { NotificacionesVentasService, CONFIGURACIONES_PREDEFINIDAS } from '@/lib/notificacionesVentas'

const notificacionesService = new NotificacionesVentasService()

export async function POST(request: NextRequest) {
  try {
    const { tipo } = await request.json()

    // Datos de ventas de ejemplo para la prueba
    const ventasEjemplo = [
      {
        id: '1',
        cliente_nombre: 'María González',
        ejecutivo_nombre: 'Ana María González',
        valor_total: 2400000,
        modelo_casa: '54M2 2A',
        estado: 'validado',
        fecha_venta: new Date().toISOString()
      },
      {
        id: '2',
        cliente_nombre: 'Carlos Pérez',
        ejecutivo_nombre: 'José Javier Call',
        valor_total: 1950000,
        modelo_casa: '48M2 2A',
        estado: 'enviado',
        fecha_venta: new Date().toISOString()
      },
      {
        id: '3',
        cliente_nombre: 'Patricia Silva',
        ejecutivo_nombre: 'Victoria Herrera',
        valor_total: 3200000,
        modelo_casa: '72M2 6A',
        estado: 'validacion',
        fecha_venta: new Date().toISOString()
      }
    ]

    switch (tipo) {
      case 'resumen_diario':
        console.log('📊 Enviando resumen diario de prueba...')
        await notificacionesService.enviarResumenDiario(
          ventasEjemplo,
          CONFIGURACIONES_PREDEFINIDAS
        )
        return NextResponse.json({
          success: true,
          message: 'Resumen diario enviado',
          ventas_procesadas: ventasEjemplo.length,
          destinatarios: CONFIGURACIONES_PREDEFINIDAS.length
        })

      case 'nueva_venta':
        console.log('🎉 Enviando notificación de nueva venta...')
        await notificacionesService.enviarNotificacionNuevaVenta(
          ventasEjemplo[0],
          CONFIGURACIONES_PREDEFINIDAS
        )
        return NextResponse.json({
          success: true,
          message: 'Notificación de nueva venta enviada',
          venta: ventasEjemplo[0].cliente_nombre
        })

      case 'resumen_semanal':
        console.log('📈 Enviando resumen semanal de prueba...')
        // Generar más ventas para la semana
        const ventasSemana = []
        for (let i = 0; i < 7; i++) {
          const fecha = new Date()
          fecha.setDate(fecha.getDate() - i)

          ventasSemana.push({
            id: `semana_${i}`,
            cliente_nombre: `Cliente ${i + 1}`,
            ejecutivo_nombre: ['Ana María González', 'José Javier Call', 'Victoria Herrera'][i % 3],
            valor_total: 1500000 + (Math.random() * 2000000),
            modelo_casa: ['36M2 2A', '48M2 2A', '54M2 4A', '72M2 6A'][i % 4],
            estado: ['validado', 'enviado', 'validacion'][i % 3],
            fecha_venta: fecha.toISOString()
          })
        }

        await notificacionesService.enviarResumenSemanal(
          ventasSemana,
          CONFIGURACIONES_PREDEFINIDAS
        )
        return NextResponse.json({
          success: true,
          message: 'Resumen semanal enviado',
          ventas_procesadas: ventasSemana.length
        })

      case 'test_guillermo':
        console.log('👤 Enviando mensaje de prueba específico para Guillermo...')
        const configGuillermo = CONFIGURACIONES_PREDEFINIDAS.find(c =>
          c.destinatario_nombre.includes('Guillermo')
        )

        if (configGuillermo) {
          await notificacionesService.enviarResumenDiario(
            ventasEjemplo,
            [configGuillermo]
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Mensaje de prueba enviado a Guillermo Díaz',
          destinatario: configGuillermo?.destinatario
        })

      case 'test_jose_luis':
        console.log('👤 Enviando mensaje de prueba específico para José Luis...')
        const configJoseLuis = CONFIGURACIONES_PREDEFINIDAS.find(c =>
          c.destinatario_nombre.includes('José Luis')
        )

        if (configJoseLuis) {
          await notificacionesService.enviarResumenDiario(
            ventasEjemplo,
            [configJoseLuis]
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Mensaje de prueba enviado a José Luis Andraca',
          destinatario: configJoseLuis?.destinatario
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de notificación no válido'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      endpoints_disponibles: [
        {
          tipo: 'resumen_diario',
          descripcion: 'Envía resumen diario de ventas',
          metodo: 'POST'
        },
        {
          tipo: 'nueva_venta',
          descripcion: 'Notifica una nueva venta',
          metodo: 'POST'
        },
        {
          tipo: 'resumen_semanal',
          descripcion: 'Envía resumen semanal',
          metodo: 'POST'
        },
        {
          tipo: 'test_guillermo',
          descripcion: 'Mensaje de prueba para Guillermo Díaz',
          metodo: 'POST'
        },
        {
          tipo: 'test_jose_luis',
          descripcion: 'Mensaje de prueba para José Luis Andraca',
          metodo: 'POST'
        }
      ],
      configuraciones_activas: CONFIGURACIONES_PREDEFINIDAS.map(c => ({
        nombre: c.destinatario_nombre,
        rol: c.rol,
        telefono: c.destinatario
      }))
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo información'
    }, { status: 500 })
  }
}