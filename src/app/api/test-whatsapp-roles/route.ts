import { NextRequest, NextResponse } from 'next/server'
import {
  enviarMensajePrueba,
  notificarGuillermoDiaz,
  notificarSupervisor,
  notificarTransportista,
  notificarJoseLuisAndraca
} from '@/lib/whatsappRoles'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rol = searchParams.get('rol') as 'guillermo' | 'supervisor' | 'transportista' | 'ejecutivo' | null
  const mensaje = searchParams.get('mensaje')

  try {
    if (mensaje) {
      // Enviar mensaje personalizado
      const result = await notificarGuillermoDiaz(mensaje)
      return NextResponse.json({
        success: true,
        message: 'Mensaje personalizado enviado',
        destinatario: '+56 9 6334 8909',
        result
      })
    }

    if (rol) {
      // Enviar mensaje de prueba según rol
      const result = await enviarMensajePrueba(rol)
      return NextResponse.json({
        success: true,
        message: `Mensaje de prueba enviado como ${rol}`,
        destinatario: '+56 9 6334 8909',
        result
      })
    }

    // Sin parámetros, enviar menú de pruebas
    return NextResponse.json({
      success: true,
      message: 'API de prueba de WhatsApp por roles',
      instrucciones: {
        descripcion: 'Usa los siguientes endpoints para probar diferentes roles',
        numero_configurado: '+56 9 6334 8909',
        endpoints: {
          guillermo: '/api/test-whatsapp-roles?rol=guillermo',
          supervisor: '/api/test-whatsapp-roles?rol=supervisor',
          transportista: '/api/test-whatsapp-roles?rol=transportista',
          ejecutivo: '/api/test-whatsapp-roles?rol=ejecutivo',
          personalizado: '/api/test-whatsapp-roles?mensaje=Tu mensaje aquí'
        }
      }
    })
  } catch (error) {
    console.error('Error en prueba de WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      nota: 'Asegúrate de haber agregado +56 9 6334 8909 en la lista de números permitidos en Meta for Developers'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rol, tipo, data } = body

    let result

    switch (tipo) {
      case 'contrato_nuevo':
        result = await notificarSupervisor({
          id: 'test-001',
          numero: body.numero || 'CH-2025-0001',
          cliente: {
            nombre: body.cliente || 'Juan Pérez',
            telefono: '+56 9 6334 8909'
          },
          modelo_casa: body.modelo || '72M2 6A',
          valor_total: body.valor || 2400000,
          fecha_entrega: body.fecha || '27/09/2025',
          ejecutivo_nombre: body.ejecutivo || 'José Luis Andraca',
          observaciones: body.observaciones || 'Cliente VIP - Entrega urgente'
        })
        break

      case 'entrega_programada':
        result = await notificarTransportista({
          contrato: {
            numero: body.numero || 'CH-2025-0001',
            cliente: { nombre: body.cliente || 'María González' },
            modelo_casa: body.modelo || '54M2 4A',
            materiales: []
          },
          fecha: body.fecha || '25/09/2025',
          direccion: body.direccion || 'Av. Principal 456, La Serena',
          contacto: '+56 9 6334 8909'
        })
        break

      case 'resumen_semanal':
        const contratosEjemplo = [
          {
            numero: 'CH-2025-0001',
            cliente: { nombre: 'Cliente 1' },
            valor_total: 1500000,
            estado: 'validado',
            modelo_casa: '54M2 2A',
            ejecutivo_nombre: 'Ana González'
          },
          {
            numero: 'CH-2025-0002',
            cliente: { nombre: 'Cliente 2' },
            valor_total: 2400000,
            estado: 'enviado',
            modelo_casa: '72M2 6A',
            ejecutivo_nombre: 'José Luis Andraca'
          },
          {
            numero: 'CH-2025-0003',
            cliente: { nombre: 'Cliente 3' },
            valor_total: 3000000,
            estado: 'validacion',
            modelo_casa: '108M2 10A',
            ejecutivo_nombre: 'María Rodríguez'
          }
        ]

        const { enviarResumenSemanalGuillermo } = await import('@/lib/whatsappRoles')
        result = await enviarResumenSemanalGuillermo(contratosEjemplo)
        break

      default:
        result = await notificarGuillermoDiaz(
          body.mensaje || 'Mensaje de prueba desde el sistema ChileHome Contratos'
        )
    }

    return NextResponse.json({
      success: true,
      tipo: tipo || 'mensaje_directo',
      destinatario: '+56 9 6334 8909',
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    console.error('Error enviando mensaje:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      sugerencia: 'Verifica que el número +56 9 6334 8909 esté agregado en Meta for Developers'
    }, { status: 500 })
  }
}