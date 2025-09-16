import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de prueba funcionando',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.telefono === '+56963348909') {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp simulado enviado exitosamente',
        telefono: body.telefono,
        mensaje: body.mensaje || 'Mensaje de prueba'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Número de teléfono no válido para pruebas'
    }, { status: 400 })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error en el endpoint de prueba'
    }, { status: 500 })
  }
}