import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo } = body

    console.log(`🧪 Probando notificación REAL: ${tipo}`)

    let resultado
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3009'

    switch (tipo) {
      case 'resumen_diario':
      case 'resumen_semanal':
      case 'saludo_matutino':
        // Hacer llamada REAL a notificaciones programadas
        const responseProgramada = await fetch(`${baseUrl}/api/notificaciones/programadas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo, forzar: true })
        })
        resultado = await responseProgramada.json()
        break

      case 'nueva_venta_crm':
        // Simular nueva venta - LLAMADA REAL
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

        const responseNuevaVenta = await fetch(`${baseUrl}/api/notificaciones/instantaneas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'nueva_venta_crm', datos: datosVentaPrueba })
        })
        resultado = await responseNuevaVenta.json()
        break

      case 'contrato_validado':
        // Simular contrato validado - LLAMADA REAL
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

        const responseContratoValidado = await fetch(`${baseUrl}/api/notificaciones/instantaneas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'contrato_validado', datos: datosContratoPrueba })
        })
        resultado = await responseContratoValidado.json()
        break

      default:
        return NextResponse.json({
          success: false,
          error: `Tipo de notificación no reconocido: ${tipo}`
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mensaje: `Prueba REAL de ${tipo} ejecutada`,
      resultado
    })

  } catch (error) {
    console.error('Error en prueba REAL de notificación:', error)
    return NextResponse.json({
      success: false,
      error: 'Error ejecutando prueba REAL'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para probar notificaciones WhatsApp REALES',
    tipos_disponibles: [
      'resumen_diario',
      'resumen_semanal',
      'saludo_matutino',
      'nueva_venta_crm',
      'contrato_validado'
    ],
    warning: 'Este endpoint envía mensajes REALES de WhatsApp'
  })
}