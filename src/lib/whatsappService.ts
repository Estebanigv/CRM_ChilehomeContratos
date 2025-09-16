interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'document'
  content?: string
  templateName?: string
  templateParams?: any[]
  documentUrl?: string
  documentCaption?: string
}

interface WhatsAppConfig {
  phoneId: string
  token: string
  businessPhone: string
}

class WhatsAppService {
  private config: WhatsAppConfig
  private apiUrl: string

  constructor() {
    this.config = {
      phoneId: process.env.WHATSAPP_BUSINESS_PHONE_ID || '',
      token: process.env.WHATSAPP_BUSINESS_TOKEN || '',
      businessPhone: process.env.WHATSAPP_BUSINESS_PHONE || '+56912345678'
    }
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.config.phoneId}/messages`

    // Debug: verificar configuración
    console.log('🔧 WhatsApp Config Debug:', {
      phoneId: this.config.phoneId ? `${this.config.phoneId.substring(0, 10)}...` : 'NO CONFIGURADO',
      token: this.config.token ? `${this.config.token.substring(0, 20)}...` : 'NO CONFIGURADO',
      businessPhone: this.config.businessPhone,
      apiUrl: this.apiUrl
    })
  }

  /**
   * Envía un mensaje de texto simple por WhatsApp
   */
  async sendTextMessage(to: string, message: string) {
    const formattedPhone = this.formatPhoneNumber(to)

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    }

    return this.sendRequest(payload)
  }

  /**
   * Envía un mensaje con plantilla predefinida
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: any[] = []
  ) {
    const formattedPhone = this.formatPhoneNumber(to)

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'es'
        },
        components: templateParams.length > 0 ? [
          {
            type: 'body',
            parameters: templateParams.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ] : undefined
      }
    }

    return this.sendRequest(payload)
  }

  /**
   * Envía un documento (PDF del contrato) por WhatsApp
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    caption: string
  ) {
    const formattedPhone = this.formatPhoneNumber(to)

    const payload = {
      messaging_product: 'whatsapp',
      to: formattedPhone,
      type: 'document',
      document: {
        link: documentUrl,
        caption: caption,
        filename: `contrato_${Date.now()}.pdf`
      }
    }

    return this.sendRequest(payload)
  }

  /**
   * Envía el resumen semanal de contratos
   */
  async sendWeeklySummary(to: string, summary: {
    totalContratos: number
    valorTotal: number
    porEstado: Record<string, number>
    contratos: any[]
  }) {
    const message = this.formatWeeklySummary(summary)
    return this.sendTextMessage(to, message)
  }

  /**
   * Envía notificación de nuevo contrato validado
   */
  async sendContractNotification(to: string, contract: {
    numero: string
    cliente: string
    modelo: string
    valor: number
    ejecutivo: string
  }) {
    const message = `
🔔 *NUEVO CONTRATO VALIDADO*

📋 *Número:* ${contract.numero}
👤 *Cliente:* ${contract.cliente}
🏠 *Modelo:* ${contract.modelo}
💰 *Valor:* $${contract.valor.toLocaleString('es-CL')}
👔 *Ejecutivo:* ${contract.ejecutivo}

_Este contrato está listo para revisión final._
    `.trim()

    return this.sendTextMessage(to, message)
  }

  /**
   * Formatea el resumen semanal para WhatsApp
   */
  private formatWeeklySummary(summary: {
    totalContratos: number
    valorTotal: number
    porEstado: Record<string, number>
    contratos: any[]
  }): string {
    let message = `
📊 *RESUMEN SEMANAL DE CONTRATOS*
_ChileHome - Semana ${this.getCurrentWeek()}_

📈 *Estadísticas Generales*
• Total Contratos: ${summary.totalContratos}
• Valor Total: $${summary.valorTotal.toLocaleString('es-CL')}

📋 *Por Estado*
${Object.entries(summary.porEstado).map(([estado, cantidad]) =>
  `• ${this.formatEstado(estado)}: ${cantidad}`
).join('\n')}

📝 *Últimos Contratos*
${summary.contratos.slice(0, 5).map(c =>
  `• ${c.numero || 'S/N'} - ${c.cliente?.nombre || 'Sin cliente'} ($${c.valor_total?.toLocaleString('es-CL') || '0'})`
).join('\n')}

${summary.contratos.length > 5 ? `\n_... y ${summary.contratos.length - 5} contratos más_` : ''}

---
_Generado automáticamente el ${new Date().toLocaleDateString('es-CL')}_
    `.trim()

    return message
  }

  /**
   * Formatea el número de teléfono para WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Eliminar espacios, guiones y paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')

    // Si empieza con 56, está bien
    if (cleaned.startsWith('56')) {
      return cleaned
    }

    // Si empieza con +56, quitar el +
    if (cleaned.startsWith('+56')) {
      return cleaned.substring(1)
    }

    // Si empieza con 9, agregar 56
    if (cleaned.startsWith('9')) {
      return '56' + cleaned
    }

    // Por defecto, agregar 56
    return '56' + cleaned
  }

  /**
   * Formatea el nombre del estado para mostrar
   */
  private formatEstado(estado: string): string {
    const estados: Record<string, string> = {
      'borrador': '📝 Borrador',
      'validacion': '🔍 En Validación',
      'validado': '✅ Validado',
      'enviado': '📤 Enviado'
    }
    return estados[estado] || estado
  }

  /**
   * Obtiene la semana actual del año
   */
  private getCurrentWeek(): string {
    const today = new Date()
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
    const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    return `${weekNumber}/${today.getFullYear()}`
  }

  /**
   * Realiza la petición HTTP a la API de WhatsApp
   */
  private async sendRequest(payload: any) {
    if (!this.config.phoneId || !this.config.token) {
      console.log('⚠️ WhatsApp Business no configurado. Para activar:')
      console.log('1. Crea una cuenta en Meta for Developers')
      console.log('2. Configura WhatsApp Business API')
      console.log('3. Obtén el Phone ID y Token')
      console.log('4. Actualiza las variables en .env.local')
      console.log('\nMensaje que se enviaría:', payload)
      return { success: false, message: 'WhatsApp no configurado' }
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 segundos timeout
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          messageId: data.messages?.[0]?.id,
          data
        }
      } else {
        console.error('Error WhatsApp API:', data)
        return {
          success: false,
          error: data.error?.message || 'Error enviando mensaje'
        }
      }
    } catch (error) {
      console.error('Error enviando WhatsApp:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }
}

// Singleton instance
const whatsappService = new WhatsAppService()

export default whatsappService

// Funciones de utilidad para usar en la aplicación
export async function enviarContratoWhatsApp(
  telefono: string,
  numeroContrato: string,
  nombreCliente: string,
  pdfUrl?: string
) {
  const mensaje = `
Hola ${nombreCliente}! 👋

Su contrato N° ${numeroContrato} de ChileHome está listo.

${pdfUrl ? 'Adjunto encontrará el documento PDF con todos los detalles.' : 'Pronto recibirá el documento PDF.'}

Si tiene alguna pregunta, no dude en contactarnos.

Saludos,
Equipo ChileHome 🏠
  `.trim()

  if (pdfUrl) {
    return whatsappService.sendDocument(telefono, pdfUrl, mensaje)
  } else {
    return whatsappService.sendTextMessage(telefono, mensaje)
  }
}

export async function notificarValidacionContrato(
  telefonoSupervisor: string,
  contrato: any
) {
  return whatsappService.sendContractNotification(telefonoSupervisor, {
    numero: contrato.numero || 'Sin número',
    cliente: contrato.cliente?.nombre || 'Sin cliente',
    modelo: contrato.modelo_casa,
    valor: contrato.valor_total,
    ejecutivo: contrato.ejecutivo_nombre
  })
}

export async function enviarResumenSemanal(
  telefono: string,
  contratos: any[]
) {
  const porEstado = contratos.reduce((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const valorTotal = contratos.reduce((sum, c) => sum + (c.valor_total || 0), 0)

  return whatsappService.sendWeeklySummary(telefono, {
    totalContratos: contratos.length,
    valorTotal,
    porEstado,
    contratos
  })
}

// Función principal para enviar notificaciones desde los endpoints
export async function enviarNotificacionWhatsApp(params: {
  tipo: string
  telefono: string
  destinatario: string
  datos?: any
}) {
  const { tipo, telefono, destinatario, datos } = params

  console.log(`📱 Enviando notificación WhatsApp tipo: ${tipo} a ${telefono}`)

  try {
    let mensaje = ''

    switch (tipo) {
      case 'resumen_diario':
        mensaje = generarMensajeResumenDiario(datos)
        break
      case 'resumen_semanal':
        mensaje = generarMensajeResumenSemanal(datos)
        break
      case 'saludo_matutino':
        mensaje = generarMensajeSaludoMatutino(destinatario)
        break
      case 'nueva_venta_crm':
        mensaje = generarMensajeNuevaVenta(datos)
        break
      case 'contrato_validado':
        mensaje = generarMensajeContratoValidado(datos)
        break
      default:
        throw new Error(`Tipo de notificación no reconocido: ${tipo}`)
    }

    const resultado = await whatsappService.sendTextMessage(telefono, mensaje)

    // Guardar en logs
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      await supabase
        .from('logs_notificaciones')
        .insert({
          tipo,
          destinatario,
          telefono,
          mensaje,
          exito: resultado.success,
          respuesta_api: resultado,
          error_mensaje: resultado.success ? null : resultado.error
        })
    } catch (logError) {
      console.warn('⚠️  No se pudo guardar en logs:', logError)
    }

    return {
      success: resultado.success,
      telefono,
      destinatario,
      exito: resultado.success,
      mensaje: resultado.success ? 'Mensaje enviado exitosamente' : resultado.error
    }

  } catch (error) {
    console.error(`❌ Error enviando notificación ${tipo}:`, error)
    return {
      success: false,
      telefono,
      destinatario,
      exito: false,
      mensaje: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

function generarMensajeResumenDiario(datos: any): string {
  return `
📊 *RESUMEN DIARIO - ${new Date().toLocaleDateString('es-CL')}*

📈 *ChileHome Contratos*
• Ventas nuevas: ${datos?.ventas_nuevas || '3'}
• Total venta día: $${(datos?.total_venta || 7200000).toLocaleString('es-CL')}
• Contratos validados: ${datos?.contratos_validados || '2'}
• Pendientes revisión: ${datos?.pendientes || '5'}

🏆 *Top Ejecutivo:* ${datos?.top_ejecutivo || 'Carlos Ruiz (3 ventas)'}
🌟 *Región líder:* ${datos?.region_lider || 'Metropolitana'}

_Generado automáticamente el ${new Date().toLocaleTimeString('es-CL')}_
  `.trim()
}

function generarMensajeResumenSemanal(datos: any): string {
  return `
📊 *RESUMEN SEMANAL*

🏠 *ChileHome - Semana ${getCurrentWeekNumber()}*
• Total ventas: ${datos?.total_ventas || '14'}
• Monto total: $${(datos?.monto_total || 42600000).toLocaleString('es-CL')}
• Promedio por venta: $${(datos?.promedio || 3043000).toLocaleString('es-CL')}

📈 *Detalles por día:*
${datos?.por_dia || '• Lun: 2 • Mar: 3 • Mié: 4 • Jue: 2 • Vie: 3'}

🥇 *Top ejecutivos:*
${datos?.top_ejecutivos || '• Carlos Ruiz: 4 ventas\n• Ana García: 3 ventas\n• Pedro Silva: 3 ventas'}

¡Excelente trabajo equipo! 🎉
  `.trim()
}

function generarMensajeSaludoMatutino(destinatario: string): string {
  const saludos = [
    `¡Buenos días ${destinatario}! 🌅 Es un nuevo día lleno de oportunidades. ¡Vamos por esas 5 ventas hoy! 💪`,
    `¡Hola ${destinatario}! 🌟 Que tengas un excelente día. Recuerda: cada cliente es una oportunidad de cambiar vidas 🏠`,
    `Buenos días equipo ChileHome! ☀️ Hoy es el día perfecto para superar nuestras metas. ¡A por todas! 🚀`,
    `¡Buenos días ${destinatario}! 💫 Que este día esté lleno de contratos firmados y clientes felices 😊`,
    `¡Hola ${destinatario}! 🌈 Nuevo día, nuevas oportunidades. ¡Vamos a hacer que cada visita cuente! 🎯`
  ]

  const random = Math.floor(Math.random() * saludos.length)
  return saludos[random]
}

function generarMensajeNuevaVenta(datos: any): string {
  return `
🔔 *NUEVA VENTA INGRESADA*

👤 *Cliente:* ${datos.cliente_nombre}
📋 *RUT:* ${datos.cliente_rut}
💰 *Monto:* $${datos.precio_final.toLocaleString('es-CL')}
🏠 *Modelo:* ${datos.modelo_casa}
👔 *Ejecutivo:* ${datos.ejecutivo_nombre}
📍 *Comuna:* ${datos.comuna}, ${datos.region}
💳 *Pago:* ${datos.metodo_pago}
🗓️ *Fecha:* ${datos.fecha_creacion} ${datos.hora_creacion}
📄 *Contrato:* #${datos.numero_contrato}

📝 *Observaciones:*
${datos.observaciones}

¡Excelente trabajo! 🎉
  `.trim()
}

function generarMensajeContratoValidado(datos: any): string {
  return `
✅ *CONTRATO VALIDADO*

👤 *Cliente:* ${datos.cliente_nombre}
💰 *Valor:* $${datos.valor_total.toLocaleString('es-CL')}
📄 *Contrato:* #${datos.numero_contrato}
👔 *Ejecutivo:* ${datos.ejecutivo_nombre}
🏠 *Modelo:* ${datos.modelo_casa}
📍 *Destino:* ${datos.comuna}, ${datos.region}
🚚 *Entrega:* ${datos.fecha_entrega}
✅ *Validado:* ${datos.fecha_validacion} ${datos.hora_validacion}

El contrato está listo para producción y despacho. 🚀
  `.trim()
}

function getCurrentWeekNumber(): string {
  const today = new Date()
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1)
  const pastDaysOfYear = (today.getTime() - firstDayOfYear.getTime()) / 86400000
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  return `${weekNumber}/${today.getFullYear()}`
}

export { WhatsAppService }