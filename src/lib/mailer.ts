import { Resend } from 'resend'

const resend = new Resend(process.env.EMAIL_API_KEY)

interface EmailData {
  clienteNombre: string
  clienteEmail: string
  contratoId: string
  valorTotal: number
  modeloCasa: string
  fechaEntrega: string
  pdfBuffer: Buffer
}

export class EmailService {
  private fromEmail = process.env.FROM_EMAIL || 'contratos@chilehome.cl'

  async enviarContratoACliente(data: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: emailResult, error } = await resend.emails.send({
        from: this.fromEmail,
        to: data.clienteEmail,
        subject: `Contrato de Compra Venta - ChileHome (${data.contratoId.substring(0, 8).toUpperCase()})`,
        html: this.generateClientEmailTemplate(data),
        attachments: [
          {
            filename: `Contrato_${data.clienteNombre.replace(/\s+/g, '_')}.pdf`,
            content: data.pdfBuffer,
          },
        ],
      })

      if (error) {
        console.error('Error enviando correo al cliente:', error)
        return { success: false, error: error.message }
      }

      console.log('Correo enviado al cliente:', emailResult?.id)
      return { success: true }
    } catch (error) {
      console.error('Error enviando correo al cliente:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }
    }
  }

  async enviarCopiaAEmpresa(data: EmailData, ejecutivoNombre: string): Promise<{ success: boolean; error?: string }> {
    try {
      const empresaEmails = [
        'contratos@chilehome.cl',
        'ventas@chilehome.cl',
        // Agregar más emails según necesidad
      ]

      const { data: emailResult, error } = await resend.emails.send({
        from: this.fromEmail,
        to: empresaEmails,
        subject: `[COPIA] Contrato Enviado - ${data.clienteNombre} (${data.contratoId.substring(0, 8).toUpperCase()})`,
        html: this.generateCompanyEmailTemplate(data, ejecutivoNombre),
        attachments: [
          {
            filename: `Contrato_${data.clienteNombre.replace(/\s+/g, '_')}.pdf`,
            content: data.pdfBuffer,
          },
        ],
      })

      if (error) {
        console.error('Error enviando copia a empresa:', error)
        return { success: false, error: error.message }
      }

      console.log('Copia enviada a empresa:', emailResult?.id)
      return { success: true }
    } catch (error) {
      console.error('Error enviando copia a empresa:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }
    }
  }

  async enviarAmbos(data: EmailData, ejecutivoNombre: string): Promise<{ 
    cliente: { success: boolean; error?: string }
    empresa: { success: boolean; error?: string }
  }> {
    const [clienteResult, empresaResult] = await Promise.all([
      this.enviarContratoACliente(data),
      this.enviarCopiaAEmpresa(data, ejecutivoNombre)
    ])

    return {
      cliente: clienteResult,
      empresa: empresaResult
    }
  }

  private generateClientEmailTemplate(data: EmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato ChileHome</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #0ea5e9;
            margin: 0;
            font-size: 28px;
          }
          .content {
            margin-bottom: 30px;
          }
          .highlight {
            background-color: #e0f2fe;
            padding: 15px;
            border-left: 4px solid #0ea5e9;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 14px;
            color: #666;
          }
          .contact-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ChileHome</h1>
            <p style="margin: 0; color: #666; font-size: 16px;">Casas Prefabricadas de Calidad</p>
          </div>
          
          <div class="content">
            <p>Estimado/a <strong>${data.clienteNombre}</strong>,</p>
            
            <p>Nos complace informarle que su contrato de compra venta ha sido <strong>validado y procesado</strong> exitosamente.</p>
            
            <div class="highlight">
              <h3 style="margin-top: 0; color: #0ea5e9;">Detalles de su Pedido:</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Modelo:</strong> ${data.modeloCasa}</li>
                <li><strong>Valor Total:</strong> $${data.valorTotal.toLocaleString('es-CL')}</li>
                <li><strong>Fecha de Entrega Estimada:</strong> ${data.fechaEntrega}</li>
                <li><strong>N° de Contrato:</strong> ${data.contratoId.substring(0, 8).toUpperCase()}</li>
              </ul>
            </div>
            
            <p>Adjunto a este correo encontrará su contrato firmado en formato PDF. Por favor, revíselo cuidadosamente y manténgalo como respaldo de su compra.</p>
            
            <p><strong>Próximos Pasos:</strong></p>
            <ol>
              <li>Revise el contrato adjunto</li>
              <li>Nuestro equipo técnico se pondrá en contacto para coordinar la entrega</li>
              <li>Prepararemos el terreno según especificaciones técnicas</li>
            </ol>
            
            <div class="contact-info">
              <h4 style="margin-top: 0; color: #0ea5e9;">¿Necesita Ayuda?</h4>
              <p style="margin: 5px 0;">Si tiene alguna consulta o necesita aclarar algún detalle:</p>
              <p style="margin: 5px 0;">📧 Email: contratos@chilehome.cl</p>
              <p style="margin: 5px 0;">📞 Teléfono: +56 2 2555-0000</p>
              <p style="margin: 5px 0;">🌐 Web: www.chilehome.cl</p>
            </div>
            
            <p style="margin-top: 25px;">Gracias por confiar en ChileHome. Estamos comprometidos con hacer realidad el hogar de sus sueños.</p>
            
            <p>Atentamente,<br>
            <strong>Equipo ChileHome</strong></p>
          </div>
          
          <div class="footer">
            <p>Este correo fue generado automáticamente. Por favor, no responda a esta dirección.</p>
            <p style="font-size: 12px; color: #999;">ChileHome - Casas Prefabricadas | Santiago, Chile</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateCompanyEmailTemplate(data: EmailData, ejecutivoNombre: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contrato Enviado - ChileHome</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #059669;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #059669;
            margin: 0;
            font-size: 24px;
          }
          .alert {
            background-color: #d1fae5;
            padding: 15px;
            border-left: 4px solid #059669;
            margin: 20px 0;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
          }
          .info-item {
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Contrato Enviado Exitosamente</h1>
            <p style="margin: 0; color: #666;">Sistema de Contratos ChileHome</p>
          </div>
          
          <div class="alert">
            <strong>🎉 ¡Contrato procesado y enviado!</strong><br>
            El contrato ha sido enviado al cliente y todas las copias han sido distribuidas.
          </div>
          
          <h3>Detalles del Envío:</h3>
          
          <div class="info-grid">
            <div class="info-item">
              <strong>Cliente:</strong><br>
              ${data.clienteNombre}
            </div>
            <div class="info-item">
              <strong>Email:</strong><br>
              ${data.clienteEmail}
            </div>
            <div class="info-item">
              <strong>Ejecutivo:</strong><br>
              ${ejecutivoNombre}
            </div>
            <div class="info-item">
              <strong>N° Contrato:</strong><br>
              ${data.contratoId.substring(0, 8).toUpperCase()}
            </div>
            <div class="info-item">
              <strong>Modelo:</strong><br>
              ${data.modeloCasa}
            </div>
            <div class="info-item">
              <strong>Valor Total:</strong><br>
              $${data.valorTotal.toLocaleString('es-CL')}
            </div>
          </div>
          
          <p><strong>Fecha y Hora de Envío:</strong> ${new Date().toLocaleString('es-CL')}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          
          <p style="font-size: 14px; color: #666;">
            <strong>Nota:</strong> Este es un mensaje automático del sistema de contratos. 
            El archivo PDF adjunto es una copia exacta del contrato enviado al cliente.
          </p>
          
          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            Sistema de Contratos ChileHome - Generado automáticamente
          </p>
        </div>
      </body>
      </html>
    `
  }

  // Método para validar configuración de correo
  async validarConfiguracion(): Promise<boolean> {
    try {
      // Verificar que las variables de entorno estén configuradas
      if (!process.env.EMAIL_API_KEY || !process.env.FROM_EMAIL) {
        console.error('Variables de entorno de correo no configuradas')
        return false
      }

      // Test básico con Resend (sin enviar correo real)
      // Aquí podrías implementar un test más robusto si Resend lo permite
      return true
    } catch (error) {
      console.error('Error validando configuración de correo:', error)
      return false
    }
  }
}

export const emailService = new EmailService()