import { ApiResponse } from '@/types'

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

export class WhatsAppService {
  private config: WhatsAppConfig

  constructor() {
    this.config = {
      phoneId: process.env.WHATSAPP_BUSINESS_PHONE_ID || '',
      token: process.env.WHATSAPP_BUSINESS_TOKEN || '',
      businessPhone: process.env.WHATSAPP_BUSINESS_PHONE || '+56912345678'
    }
  }

  /**
   * Envía un mensaje de texto
   */
  async sendTextMessage(to: string, message: string): Promise<ApiResponse<any>> {
    try {
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

      const result = await this.sendRequest(payload)
      return result

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error enviando mensaje'
      }
    }
  }

  /**
   * Envía un mensaje con plantilla
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: any[] = []
  ): Promise<ApiResponse<any>> {
    try {
      const formattedPhone = this.formatPhoneNumber(to)

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
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

      return await this.sendRequest(payload)

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error enviando template'
      }
    }
  }

  /**
   * Envía un documento
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    caption: string
  ): Promise<ApiResponse<any>> {
    try {
      const formattedPhone = this.formatPhoneNumber(to)

      const payload = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'document',
        document: {
          link: documentUrl,
          caption: caption,
          filename: 'contrato.pdf'
        }
      }

      return await this.sendRequest(payload)

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error enviando documento'
      }
    }
  }

  /**
   * Formatea número de teléfono chileno
   */
  private formatPhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/[^\d+]/g, '')

    if (cleanPhone.startsWith('56')) {
      cleanPhone = '+' + cleanPhone
    } else if (cleanPhone.startsWith('9') && cleanPhone.length === 9) {
      cleanPhone = '+569' + cleanPhone.slice(1)
    } else if (!cleanPhone.startsWith('+56')) {
      cleanPhone = '+56' + cleanPhone
    }

    return cleanPhone
  }

  /**
   * Envía request a la API de WhatsApp
   */
  private async sendRequest(payload: any): Promise<ApiResponse<any>> {
    try {
      const apiUrl = `https://graph.facebook.com/v18.0/${this.config.phoneId}/messages`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('WhatsApp API Error:', data)
        return {
          success: false,
          error: data.error?.message || 'Error en API de WhatsApp'
        }
      }

      return { success: true, data }

    } catch (error) {
      console.error('Error en request WhatsApp:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      }
    }
  }

  /**
   * Verifica la configuración
   */
  isConfigured(): boolean {
    return !!(this.config.phoneId && this.config.token)
  }

  /**
   * Obtiene información de configuración
   */
  getConfigInfo() {
    return {
      phoneId: this.config.phoneId ? `${this.config.phoneId.substring(0, 10)}...` : 'NO CONFIGURADO',
      hasToken: !!this.config.token,
      businessPhone: this.config.businessPhone
    }
  }
}

// Instancia singleton
export const whatsappService = new WhatsAppService()