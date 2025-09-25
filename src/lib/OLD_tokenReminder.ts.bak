import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TokenExpiration {
  id?: string
  service: string
  token_expires_at: string
  reminder_sent: boolean
  created_at?: string
}

// Fecha de expiración del token de WhatsApp
const WHATSAPP_TOKEN_EXPIRATION = '2025-11-14'

/**
 * Verifica si el token está próximo a expirar
 */
export async function checkTokenExpiration(): Promise<{
  daysRemaining: number
  shouldAlert: boolean
  message: string
}> {
  const today = new Date()
  const expirationDate = new Date(WHATSAPP_TOKEN_EXPIRATION)
  const diffTime = expirationDate.getTime() - today.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let shouldAlert = false
  let message = ''

  if (daysRemaining <= 0) {
    shouldAlert = true
    message = '🚨 ¡URGENTE! El token de WhatsApp Business ha EXPIRADO. Renuévalo inmediatamente.'
  } else if (daysRemaining <= 7) {
    shouldAlert = true
    message = `⚠️ ¡ATENCIÓN! El token de WhatsApp Business expira en ${daysRemaining} días (14/11/2025). Por favor, renuévalo pronto.`
  } else if (daysRemaining <= 14) {
    shouldAlert = true
    message = `📅 Recordatorio: El token de WhatsApp Business expira en ${daysRemaining} días (14/11/2025).`
  } else if (daysRemaining <= 30) {
    message = `ℹ️ El token de WhatsApp Business expira en ${daysRemaining} días.`
  }

  // Guardar en base de datos si necesita alerta
  if (shouldAlert) {
    await saveTokenReminder(daysRemaining)
  }

  return {
    daysRemaining,
    shouldAlert,
    message
  }
}

/**
 * Guarda un recordatorio en la base de datos
 */
async function saveTokenReminder(daysRemaining: number) {
  try {
    // Verificar si ya existe un recordatorio para hoy
    const today = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('token_reminders')
      .select('*')
      .eq('service', 'whatsapp')
      .gte('created_at', `${today}T00:00:00`)
      .single()

    if (!existing) {
      await supabase
        .from('token_reminders')
        .insert({
          service: 'whatsapp',
          token_expires_at: WHATSAPP_TOKEN_EXPIRATION,
          days_remaining: daysRemaining,
          reminder_sent: false
        })
    }
  } catch (error) {
    console.error('Error guardando recordatorio:', error)
  }
}

/**
 * Envía notificación por WhatsApp sobre la expiración del token
 */
export async function sendTokenExpirationAlert(phoneNumber: string = '+56944878554') {
  const { daysRemaining, shouldAlert, message } = await checkTokenExpiration()

  if (!shouldAlert) return

  try {
    // Enviar alerta por WhatsApp
    const response = await fetch('/api/notificaciones/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'mensaje_personalizado',
        data: {
          to: phoneNumber,
          message: `${message}\n\nPara renovar:\n1. Ir a developers.facebook.com\n2. WhatsApp > Configuración de la API\n3. Generar nuevo token\n4. Actualizar en .env.local`
        }
      })
    })

    if (response.ok) {
      // Marcar como enviado
      await supabase
        .from('token_reminders')
        .update({ reminder_sent: true })
        .eq('service', 'whatsapp')
        .eq('reminder_sent', false)
    }
  } catch (error) {
    console.error('Error enviando alerta:', error)
  }
}

/**
 * Programa verificación diaria del token
 */
export function scheduleTokenCheck() {
  // Verificar cada día a las 9 AM
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(9, 0, 0, 0)

  // Si ya pasó las 9 AM de hoy, programar para mañana
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const timeUntilCheck = scheduledTime.getTime() - now.getTime()

  setTimeout(() => {
    checkTokenExpiration()
    sendTokenExpirationAlert()

    // Programar el siguiente chequeo en 24 horas
    setInterval(() => {
      checkTokenExpiration()
      sendTokenExpirationAlert()
    }, 24 * 60 * 60 * 1000)
  }, timeUntilCheck)
}

// Función para uso manual
export function getTokenExpirationInfo() {
  const today = new Date()
  const expirationDate = new Date(WHATSAPP_TOKEN_EXPIRATION)
  const diffTime = expirationDate.getTime() - today.getTime()
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return {
    expirationDate: WHATSAPP_TOKEN_EXPIRATION,
    daysRemaining,
    status: daysRemaining <= 7 ? 'critical' : daysRemaining <= 30 ? 'warning' : 'ok',
    formattedDate: expirationDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}