import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarNotificacionWhatsApp } from '@/lib/whatsappService'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { tipo, datos } = body

    console.log(`🚀 Procesando notificación instantánea: ${tipo}`)

    // Validar tipo de notificación
    if (!['nueva_venta_crm', 'contrato_validado'].includes(tipo)) {
      return NextResponse.json({
        success: false,
        error: `Tipo de notificación no válido: ${tipo}`
      }, { status: 400 })
    }

    // Obtener configuraciones activas para este tipo de notificación
    const { data: configuraciones, error } = await supabase
      .from('configuraciones_whatsapp')
      .select('*')
      .eq('activo', true)
      .contains('tipos_notificacion', `["${tipo}"]`)

    if (error) {
      console.error('Error obteniendo configuraciones:', error)
      return NextResponse.json({
        success: false,
        error: 'Error obteniendo configuraciones'
      }, { status: 500 })
    }

    if (!configuraciones || configuraciones.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No hay destinatarios configurados para ${tipo}`
      })
    }

    // Generar contenido según el tipo de notificación
    let contenido = ''

    switch (tipo) {
      case 'nueva_venta_crm':
        contenido = generarMensajeNuevaVenta(datos)
        break
      case 'contrato_validado':
        contenido = generarMensajeContratoValidado(datos)
        break
    }

    // Enviar notificación a cada destinatario configurado
    const resultados = []
    for (const config of configuraciones) {
      try {
        const resultado = await enviarNotificacionWhatsApp({
          tipo: tipo,
          telefono: config.destinatario,
          destinatario: config.destinatario_nombre,
          datos: {
            contenido,
            ...datos
          }
        })

        resultados.push({
          destinatario: config.destinatario_nombre,
          telefono: config.destinatario,
          exito: resultado.success,
          mensaje: resultado.message
        })

        console.log(`✅ Notificación ${tipo} enviada a ${config.destinatario_nombre}`)
      } catch (error) {
        console.error(`❌ Error enviando a ${config.destinatario_nombre}:`, error)
        resultados.push({
          destinatario: config.destinatario_nombre,
          telefono: config.destinatario,
          exito: false,
          mensaje: `Error: ${error}`
        })
      }
    }

    // Registrar en logs
    await supabase.from('logs_notificaciones').insert({
      tipo_notificacion: tipo,
      destinatarios_count: configuraciones.length,
      exitosos: resultados.filter(r => r.exito).length,
      fallidos: resultados.filter(r => !r.exito).length,
      detalles: resultados,
      contenido_enviado: contenido,
      datos_evento: datos,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      tipo,
      enviados: resultados.filter(r => r.exito).length,
      fallidos: resultados.filter(r => !r.exito).length,
      resultados
    })

  } catch (error) {
    console.error('Error en notificación instantánea:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

function generarMensajeNuevaVenta(datos: any): string {
  const {
    cliente_nombre = 'Cliente no especificado',
    cliente_rut = '',
    precio_final = 0,
    modelo_casa = 'No especificado',
    ejecutivo_nombre = 'No asignado',
    comuna = 'No especificada',
    region = 'No especificada',
    metodo_pago = 'No especificado',
    fecha_creacion = new Date().toLocaleDateString('es-CL'),
    hora_creacion = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    numero_contrato = '',
    observaciones = ''
  } = datos

  const montoFormateado = Number(precio_final).toLocaleString('es-CL')

  let mensaje = `🎉 *NUEVA VENTA INGRESADA AL CRM*

👤 *Cliente:* ${cliente_nombre}`

  if (cliente_rut) {
    mensaje += `\n🆔 *RUT:* ${cliente_rut}`
  }

  mensaje += `\n💰 *Monto:* $${montoFormateado}
🏠 *Modelo:* ${modelo_casa}
👨‍💼 *Ejecutivo:* ${ejecutivo_nombre}
📍 *Ubicación:* ${comuna}, ${region}
💳 *Pago:* ${metodo_pago}
📅 *Registrado:* ${fecha_creacion} a las ${hora_creacion}`

  if (numero_contrato) {
    mensaje += `\n📋 *Contrato:* #${numero_contrato}`
  }

  if (observaciones && observaciones.trim()) {
    mensaje += `\n📝 *Observaciones:* ${observaciones.substring(0, 100)}${observaciones.length > 100 ? '...' : ''}`
  }

  mensaje += `\n\n🚀 *¡Excelente trabajo!*
💪 Sigamos construyendo sueños

_Notificación automática ChileHome CRM_`

  return mensaje
}

function generarMensajeContratoValidado(datos: any): string {
  const {
    cliente_nombre = 'Cliente no especificado',
    valor_total = 0,
    numero_contrato = '',
    ejecutivo_nombre = 'No asignado',
    fecha_entrega = '',
    modelo_casa = 'No especificado',
    comuna = 'No especificada',
    region = 'No especificada',
    fecha_validacion = new Date().toLocaleDateString('es-CL'),
    hora_validacion = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
  } = datos

  const montoFormateado = Number(valor_total).toLocaleString('es-CL')
  const fechaEntregaFormateada = fecha_entrega ? new Date(fecha_entrega).toLocaleDateString('es-CL') : 'Por definir'

  let mensaje = `✅ *CONTRATO VALIDADO*

👤 *Cliente:* ${cliente_nombre}
💰 *Valor:* $${montoFormateado}
🏠 *Modelo:* ${modelo_casa}
👨‍💼 *Ejecutivo:* ${ejecutivo_nombre}
📍 *Entrega en:* ${comuna}, ${region}
📅 *Fecha entrega:* ${fechaEntregaFormateada}`

  if (numero_contrato) {
    mensaje += `\n📋 *Contrato:* #${numero_contrato}`
  }

  mensaje += `\n⏰ *Validado:* ${fecha_validacion} a las ${hora_validacion}

🎯 *Estado:* Listo para producción
📋 *Siguiente paso:* Coordinación de entrega

🎉 *¡Contrato exitosamente validado!*
🏗️ ¡Una casa más en camino!

_Notificación automática ChileHome Contratos_`

  return mensaje
}

// Función helper para llamar desde otros endpoints
export async function notificarNuevaVenta(datosVenta: any) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notificaciones/instantaneas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'nueva_venta_crm',
        datos: datosVenta
      })
    })

    return await response.json()
  } catch (error) {
    console.error('Error notificando nueva venta:', error)
    return { success: false, error }
  }
}

export async function notificarContratoValidado(datosContrato: any) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notificaciones/instantaneas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: 'contrato_validado',
        datos: datosContrato
      })
    })

    return await response.json()
  } catch (error) {
    console.error('Error notificando contrato validado:', error)
    return { success: false, error }
  }
}