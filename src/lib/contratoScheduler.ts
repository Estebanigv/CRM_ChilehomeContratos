import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface NotificacionConfig {
  id: string
  tipo: 'email' | 'whatsapp'
  destinatario: string
  frecuencia: 'diaria' | 'semanal' | 'mensual'
  dia_semana?: number // 0-6, donde 0 es domingo
  hora: string // formato HH:MM
  activo: boolean
  filtros?: {
    estados?: string[]
    fecha_desde?: string
    fecha_hasta?: string
  }
}

export async function configurarNotificacion(config: Omit<NotificacionConfig, 'id'>): Promise<NotificacionConfig> {
  const { data, error } = await supabase
    .from('notificaciones_config')
    .insert(config)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function obtenerNotificacionesActivas(): Promise<NotificacionConfig[]> {
  const { data, error } = await supabase
    .from('notificaciones_config')
    .select('*')
    .eq('activo', true)

  if (error) throw error
  return data || []
}

export async function enviarResumenContratos(config: NotificacionConfig) {
  // Obtener contratos según filtros
  let query = supabase
    .from('contratos')
    .select(`
      *,
      cliente:clientes(*)
    `)

  if (config.filtros?.estados) {
    query = query.in('estado', config.filtros.estados)
  }

  if (config.filtros?.fecha_desde) {
    query = query.gte('created_at', config.filtros.fecha_desde)
  }

  if (config.filtros?.fecha_hasta) {
    query = query.lte('created_at', config.filtros.fecha_hasta)
  }

  const { data: contratos, error } = await query

  if (error) throw error

  // Generar resumen
  const resumen = generarResumenContratos(contratos || [])

  // Enviar según el tipo
  if (config.tipo === 'email') {
    await enviarEmailResumen(config.destinatario, resumen)
  } else if (config.tipo === 'whatsapp') {
    await enviarWhatsAppResumen(config.destinatario, resumen)
  }
}

function generarResumenContratos(contratos: any[]): string {
  const totalContratos = contratos.length
  const porEstado = contratos.reduce((acc, contrato) => {
    acc[contrato.estado] = (acc[contrato.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const valorTotal = contratos.reduce((sum, c) => sum + c.valor_total, 0)

  let resumen = `📊 RESUMEN DE CONTRATOS\\n\\n`
  resumen += `Total: ${totalContratos} contratos\\n`
  resumen += `Valor Total: $${valorTotal.toLocaleString('es-CL')}\\n\\n`
  resumen += `Por Estado:\\n`

  Object.entries(porEstado).forEach(([estado, cantidad]) => {
    resumen += `• ${estado}: ${cantidad}\\n`
  })

  resumen += `\\n📋 Detalle:\\n`
  contratos.slice(0, 10).forEach(contrato => {
    resumen += `\\n• ${contrato.numero || 'Sin número'} - ${contrato.cliente?.nombre}\\n`
    resumen += `  Modelo: ${contrato.modelo_casa}\\n`
    resumen += `  Valor: $${contrato.valor_total.toLocaleString('es-CL')}\\n`
    resumen += `  Estado: ${contrato.estado}\\n`
  })

  if (contratos.length > 10) {
    resumen += `\\n... y ${contratos.length - 10} contratos más`
  }

  return resumen
}

async function enviarEmailResumen(destinatario: string, resumen: string) {
  const response = await fetch('/api/notificaciones/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: destinatario,
      subject: 'Resumen Semanal de Contratos - ChileHome',
      html: resumen.replace(/\\n/g, '<br/>')
    })
  })

  if (!response.ok) {
    throw new Error('Error al enviar email')
  }
}

async function enviarWhatsAppResumen(destinatario: string, resumen: string) {
  const response = await fetch('/api/notificaciones/whatsapp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mensaje_personalizado',
      data: {
        to: destinatario,
        message: resumen
      }
    })
  })

  if (!response.ok) {
    throw new Error('Error al enviar WhatsApp')
  }

  const result = await response.json()
  console.log('WhatsApp enviado:', result)
  return result
}

// Función para ejecutar desde un cron job o edge function
export async function ejecutarNotificacionesProgramadas() {
  const ahora = new Date()
  const diaSemana = ahora.getDay()
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`

  const notificaciones = await obtenerNotificacionesActivas()

  for (const notif of notificaciones) {
    let debeEjecutar = false

    // Verificar si debe ejecutarse según frecuencia
    if (notif.frecuencia === 'diaria') {
      debeEjecutar = notif.hora === horaActual
    } else if (notif.frecuencia === 'semanal') {
      debeEjecutar = notif.dia_semana === diaSemana && notif.hora === horaActual
    } else if (notif.frecuencia === 'mensual') {
      const diaDelMes = ahora.getDate()
      debeEjecutar = diaDelMes === 1 && notif.hora === horaActual
    }

    if (debeEjecutar) {
      try {
        await enviarResumenContratos(notif)
        console.log(`Notificación enviada a ${notif.destinatario}`)
      } catch (error) {
        console.error(`Error enviando notificación:`, error)
      }
    }
  }
}