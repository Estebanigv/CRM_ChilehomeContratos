import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo } = body

    console.log(`🧪 Probando notificación: ${tipo}`)

    let resultado
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3009'

    switch (tipo) {
      case 'resumen_diario':
      case 'resumen_semanal':
      case 'saludo_matutino':
        // Simular respuesta exitosa de notificación programada
        resultado = {
          success: true,
          tipo: tipo,
          mensaje: `Notificación ${tipo} enviada exitosamente`,
          enviados: 1,
          fallidos: 0,
          resultados: [{
            destinatario: 'Usuario de prueba',
            telefono: '+56912345678',
            exito: true,
            mensaje: 'Mensaje programado enviado exitosamente (SIMULADO)'
          }]
        }
        break

      case 'nueva_venta_crm':
        // Simular nueva venta
        const datosVentaPrueba = {
          cliente_nombre: 'María Gonzalez Pérez',
          cliente_rut: '12.345.678-9',
          precio_final: 2400000,
          modelo_casa: 'Casa 54m² - 6 Aguas',
          ejecutivo_nombre: 'Carlos Ruiz Montenegro',
          comuna: 'La Florida',
          region: 'Metropolitana',
          metodo_pago: 'Vale Vista',
          fecha_creacion: new Date().toLocaleDateString('es-CL'),
          hora_creacion: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          numero_contrato: '3155',
          observaciones: 'Cliente validado, se confirma entrega para próxima semana'
        }

        // Simular respuesta exitosa sin hacer llamada real a WhatsApp
        resultado = {
          success: true,
          tipo: 'nueva_venta_crm',
          enviados: 1,
          fallidos: 0,
          resultados: [{
            destinatario: 'Usuario de prueba',
            telefono: '+56912345678',
            exito: true,
            mensaje: 'Mensaje enviado exitosamente (SIMULADO)'
          }]
        }
        break

      case 'contrato_validado':
        // Simular contrato validado
        const datosContratoPrueba = {
          cliente_nombre: 'Pedro Martinez Silva',
          valor_total: 3200000,
          numero_contrato: '3156',
          ejecutivo_nombre: 'Ana García López',
          fecha_entrega: '2024-11-15',
          modelo_casa: 'Casa 72m² - Americana',
          comuna: 'Valparaíso',
          region: 'Valparaíso',
          fecha_validacion: new Date().toLocaleDateString('es-CL'),
          hora_validacion: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
        }

        // Simular respuesta exitosa sin hacer llamada real a WhatsApp
        resultado = {
          success: true,
          tipo: 'contrato_validado',
          enviados: 1,
          fallidos: 0,
          resultados: [{
            destinatario: 'Usuario de prueba',
            telefono: '+56912345678',
            exito: true,
            mensaje: 'Mensaje enviado exitosamente (SIMULADO)'
          }]
        }
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Tipo de notificación no reconocido: ${tipo}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mensaje: `Prueba de ${tipo} ejecutada`,
      resultado
    })

  } catch (error) {
    console.error('Error en prueba de notificación:', error)
    return NextResponse.json({
      success: false,
      error: 'Error ejecutando prueba'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para probar notificaciones WhatsApp',
    tipos_disponibles: [
      'resumen_diario',
      'resumen_semanal',
      'saludo_matutino',
      'nueva_venta_crm',
      'contrato_validado'
    ],
    ejemplo_uso: {
      metodo: 'POST',
      body: {
        tipo: 'nueva_venta_crm'
      }
    }
  })
}