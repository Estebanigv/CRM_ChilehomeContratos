import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enviarNotificacionWhatsApp } from '@/lib/whatsappService'

// Configuración de horarios para cada tipo de notificación
const HORARIOS_NOTIFICACIONES = {
  resumen_diario: { hora: 8, minuto: 0, dias: [1, 2, 3, 4, 5, 6, 0] }, // Todos los días
  resumen_semanal: { hora: 9, minuto: 0, dias: [0] }, // Solo domingos
  saludo_matutino: { hora: 7, minuto: 30, dias: [1, 2, 3, 4, 5] }, // Lunes a viernes
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { tipo, forzar = false } = body

    console.log(`📅 Procesando notificación programada: ${tipo}`)

    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutoActual = ahora.getMinutes()
    const diaActual = ahora.getDay() // 0 = domingo, 1 = lunes, etc.

    // Verificar si es el momento correcto para esta notificación
    if (!forzar && tipo in HORARIOS_NOTIFICACIONES) {
      const config = HORARIOS_NOTIFICACIONES[tipo as keyof typeof HORARIOS_NOTIFICACIONES]

      if (!config.dias.includes(diaActual)) {
        return NextResponse.json({
          success: false,
          message: `No es día para notificación ${tipo}. Días válidos: ${config.dias.join(',')}`
        })
      }

      if (horaActual !== config.hora || minutoActual !== config.minuto) {
        return NextResponse.json({
          success: false,
          message: `No es la hora para notificación ${tipo}. Hora configurada: ${config.hora}:${config.minuto.toString().padStart(2, '0')}`
        })
      }
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
    let datosAdicionales = {}

    switch (tipo) {
      case 'resumen_diario':
        contenido = await generarResumenDiario()
        break
      case 'resumen_semanal':
        contenido = await generarResumenSemanal()
        break
      case 'saludo_matutino':
        contenido = await generarSaludoMatutino()
        break
      default:
        return NextResponse.json({
          success: false,
          error: `Tipo de notificación no reconocido: ${tipo}`
        }, { status: 400 })
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
            ...datosAdicionales
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
    console.error('Error en notificación programada:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

async function generarResumenDiario(): Promise<string> {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)

  // Simular datos del CRM - en producción esto vendría del CRM real
  const ventasHoy = [
    { cliente: 'María González', monto: 2400000, ejecutivo: 'Carlos Ruiz', region: 'Metropolitana' },
    { cliente: 'Pedro Martinez', monto: 1800000, ejecutivo: 'Ana García', region: 'Valparaíso' },
    { cliente: 'Luis Fernández', monto: 3200000, ejecutivo: 'Gloria Codina', region: 'Bío Bío' },
    { cliente: 'Carmen Soto', monto: 2100000, ejecutivo: 'Carlos Ruiz', region: 'Metropolitana' },
    { cliente: 'Jorge Morales', monto: 2800000, ejecutivo: 'Ana García', region: 'La Araucanía' },
    { cliente: 'Patricia Rojas', monto: 1950000, ejecutivo: 'Gloria Codina', region: 'Valparaíso' },
    { cliente: 'Roberto Silva', monto: 2650000, ejecutivo: 'Carlos Ruiz', region: 'Metropolitana' }
  ]

  const totalVentas = ventasHoy.length
  const montoTotal = ventasHoy.reduce((sum, venta) => sum + venta.monto, 0)
  const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0

  // Calcular top ejecutivo
  const ventasPorEjecutivo = ventasHoy.reduce((acc, venta) => {
    acc[venta.ejecutivo] = (acc[venta.ejecutivo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topEjecutivo = Object.entries(ventasPorEjecutivo)
    .sort(([,a], [,b]) => b - a)[0]

  const fecha = hoy.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `📊 *RESUMEN DIARIO CHILEHOME*
📅 ${fecha}

🎉 *VENTAS DEL DÍA*
• *${totalVentas} ventas nuevas*
• *$${montoTotal.toLocaleString('es-CL')} total*
• *$${Math.round(promedioVenta).toLocaleString('es-CL')} promedio*

🏆 *MEJOR EJECUTIVO*
${topEjecutivo ? `• ${topEjecutivo[0]} - ${topEjecutivo[1]} ventas` : '• No hay datos'}

📍 *VENTAS POR REGIÓN*
${Object.entries(ventasHoy.reduce((acc, venta) => {
  acc[venta.region] = (acc[venta.region] || 0) + 1
  return acc
}, {} as Record<string, number>))
  .sort(([,a], [,b]) => b - a)
  .map(([region, count]) => `• ${region}: ${count} ventas`)
  .join('\n')}

💪 ¡Excelente trabajo equipo!
🚀 ¡Sigamos así mañana!`
}

async function generarResumenSemanal(): Promise<string> {
  const hoy = new Date()
  const inicioSemana = new Date(hoy)
  inicioSemana.setDate(hoy.getDate() - hoy.getDay()) // Domingo anterior

  // Simular datos semanales
  const ventasSemana = 34
  const montoTotal = 89400000
  const promedioVenta = montoTotal / ventasSemana

  const rangoSemana = `${inicioSemana.toLocaleDateString('es-CL')} - ${hoy.toLocaleDateString('es-CL')}`

  return `📈 *RESUMEN SEMANAL CHILEHOME*
📅 Semana del ${rangoSemana}

🎯 *RESULTADOS GENERALES*
• *${ventasSemana} ventas totales*
• *$${montoTotal.toLocaleString('es-CL')} facturado*
• *$${Math.round(promedioVenta).toLocaleString('es-CL')} promedio por venta*

🏆 *RANKING EJECUTIVOS*
• 1️⃣ Carlos Ruiz - 12 ventas
• 2️⃣ Ana García - 10 ventas
• 3️⃣ Gloria Codina - 8 ventas
• 4️⃣ María José - 4 ventas

📍 *REGIONES DESTACADAS*
• Metropolitana: 14 ventas
• Valparaíso: 8 ventas
• Bío Bío: 6 ventas
• La Araucanía: 6 ventas

📊 *META SEMANAL*
• Objetivo: 30 ventas ✅ SUPERADO
• Logrado: ${ventasSemana} ventas (+${ventasSemana - 30})

🎉 ¡FELICITACIONES AL EQUIPO!
🚀 La próxima semana vamos por más!`
}

async function generarSaludoMatutino(): Promise<string> {
  const hoy = new Date()
  const nombreDia = hoy.toLocaleDateString('es-CL', { weekday: 'long' })
  const fecha = hoy.toLocaleDateString('es-CL')

  const saludos = [
    '¡Buenos días campeones de ChileHome! 🌟',
    '¡Buen día equipo! Listos para otra jornada exitosa 💪',
    '¡Buenos días familia ChileHome! 🏠',
    '¡Hola equipo! Un nuevo día de oportunidades nos espera ☀️'
  ]

  const motivaciones = [
    'Cada llamada es una oportunidad de cambiar la vida de una familia',
    'Hoy es el día perfecto para superar nuestras metas',
    'Recordemos: no vendemos casas, cumplimos sueños',
    'La actitud positiva es nuestro mejor vendedor',
    'Cada "no" nos acerca más al próximo "sí"'
  ]

  const saludoAleatorio = saludos[Math.floor(Math.random() * saludos.length)]
  const motivacionAleatoria = motivaciones[Math.floor(Math.random() * motivaciones.length)]

  return `🌅 *${saludoAleatorio}*

📅 ${nombreDia}, ${fecha}

💭 *Reflexión del día:*
${motivacionAleatoria}

🎯 *Recordatorios importantes:*
• Seguimiento de clientes pendientes
• Actualizar estado de contratos
• Revisar agenda de visitas
• Cargar nuevas ventas al CRM

📈 *Meta de hoy:*
¡Vamos por más de 5 ventas!

🚀 *¡Que tengan un día increíble!*
El éxito nos espera 💪

_Mensaje automático - ChileHome Contratos_`
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para notificaciones programadas',
    tipos_disponibles: Object.keys(HORARIOS_NOTIFICACIONES),
    horarios: HORARIOS_NOTIFICACIONES
  })
}