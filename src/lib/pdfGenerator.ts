import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { ContratoPDFData } from '@/types'

export class ContratoPDFGenerator {
  private readonly pageWidth = 595.28 // A4 width in points
  private readonly pageHeight = 841.89 // A4 height in points
  private readonly margin = 50

  async generateContractPDF(data: ContratoPDFData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([this.pageWidth, this.pageHeight])
    
    // Cargar fuentes
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    
    let yPosition = this.pageHeight - this.margin

    // Header con logo y título
    yPosition = this.drawHeader(page, boldFont, yPosition)
    yPosition -= 30

    // Información del contrato
    yPosition = this.drawContractInfo(page, font, boldFont, data, yPosition)
    yPosition -= 20

    // Información del cliente
    yPosition = this.drawClientInfo(page, font, boldFont, data, yPosition)
    yPosition -= 20

    // Detalles del producto
    yPosition = this.drawProductDetails(page, font, boldFont, data, yPosition)
    yPosition -= 20

    // Condiciones comerciales
    yPosition = this.drawCommercialTerms(page, font, boldFont, data, yPosition)
    yPosition -= 30

    // Términos y condiciones
    yPosition = this.drawTermsAndConditions(page, font, boldFont, data, yPosition)
    yPosition -= 30

    // Firmas
    this.drawSignatures(page, font, boldFont, yPosition)

    return pdfDoc.save()
  }

  private drawHeader(page: any, boldFont: any, yPosition: number): number {
    const { width } = page.getSize()
    
    // Título principal
    page.drawText('CONTRATO DE COMPRA VENTA', {
      x: this.margin,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 15

    // Subtítulo
    page.drawText('Casa Prefabricada ChileHome', {
      x: this.margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Línea separadora
    yPosition -= 10
    page.drawLine({
      start: { x: this.margin, y: yPosition },
      end: { x: width - this.margin, y: yPosition },
      thickness: 2,
      color: rgb(0.8, 0.8, 0.8),
    })

    return yPosition
  }

  private drawContractInfo(page: any, font: any, boldFont: any, data: ContratoPDFData, yPosition: number): number {
    yPosition -= 15

    // Número de contrato
    page.drawText(`Contrato N°: ${data.contrato.id.substring(0, 8).toUpperCase()}`, {
      x: this.margin,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    page.drawText(`Fecha: ${data.fecha_actual}`, {
      x: this.pageWidth - this.margin - 150,
      y: yPosition,
      size: 12,
      font: font,
    })

    yPosition -= 15

    page.drawText(`Ejecutivo: ${data.contrato.ejecutivo_nombre}`, {
      x: this.margin,
      y: yPosition,
      size: 12,
      font: font,
    })

    return yPosition
  }

  private drawClientInfo(page: any, font: any, boldFont: any, data: ContratoPDFData, yPosition: number): number {
    yPosition -= 15

    // Título de sección
    page.drawText('DATOS DEL CLIENTE', {
      x: this.margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 20

    const clientData = [
      [`Nombre Completo:`, data.cliente.nombre],
      [`RUT:`, data.cliente.rut],
      [`Teléfono:`, data.cliente.telefono || 'No especificado'],
      [`Correo Electrónico:`, data.cliente.correo || 'No especificado'],
      [`Dirección de Entrega:`, data.cliente.direccion_entrega || 'No especificada'],
    ]

    clientData.forEach(([label, value]) => {
      page.drawText(label, {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      page.drawText(value, {
        x: this.margin + 120,
        y: yPosition,
        size: 10,
        font: font,
      })

      yPosition -= 15
    })

    return yPosition
  }

  private drawProductDetails(page: any, font: any, boldFont: any, data: ContratoPDFData, yPosition: number): number {
    yPosition -= 15

    // Título de sección
    page.drawText('DETALLES DEL PRODUCTO', {
      x: this.margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 20

    // Modelo de casa
    page.drawText('Modelo de Casa:', {
      x: this.margin,
      y: yPosition,
      size: 10,
      font: boldFont,
    })

    page.drawText(data.contrato.modelo_casa, {
      x: this.margin + 120,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 20

    // Lista de materiales si está disponible, sino mostrar descripción
    if (data.contrato.materiales && data.contrato.materiales.length > 0) {
      page.drawText('Lista de Materiales:', {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      yPosition -= 15

      // Encabezado de tabla
      page.drawText('Ítem', {
        x: this.margin,
        y: yPosition,
        size: 9,
        font: boldFont,
      })

      page.drawText('Cantidad', {
        x: this.pageWidth - this.margin - 100,
        y: yPosition,
        size: 9,
        font: boldFont,
      })

      yPosition -= 12

      // Línea separadora
      page.drawLine({
        start: { x: this.margin, y: yPosition },
        end: { x: this.pageWidth - this.margin, y: yPosition },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      })

      yPosition -= 10

      // Materiales
      data.contrato.materiales.forEach(material => {
        page.drawText(material.item, {
          x: this.margin,
          y: yPosition,
          size: 9,
          font: font,
        })

        page.drawText(material.cantidad.toString(), {
          x: this.pageWidth - this.margin - 100,
          y: yPosition,
          size: 9,
          font: font,
        })

        yPosition -= 12
      })
    } else if (data.contrato.detalle_materiales) {
      // Descripción de materiales (fallback)
      page.drawText('Descripción y Materiales:', {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      yPosition -= 15

      // Dividir el texto en líneas para que quepa en la página
      const materialLines = this.splitTextIntoLines(data.contrato.detalle_materiales, 70)
      materialLines.forEach(line => {
        page.drawText(line, {
          x: this.margin,
          y: yPosition,
          size: 9,
          font: font,
        })
        yPosition -= 12
      })
    }

    return yPosition
  }

  private drawCommercialTerms(page: any, font: any, boldFont: any, data: ContratoPDFData, yPosition: number): number {
    yPosition -= 15

    // Título de sección
    page.drawText('CONDICIONES COMERCIALES', {
      x: this.margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 20

    // Valor total
    page.drawText('Valor Total:', {
      x: this.margin,
      y: yPosition,
      size: 12,
      font: boldFont,
    })

    page.drawText(`$${data.contrato.valor_total.toLocaleString('es-CL')}`, {
      x: this.margin + 120,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.0, 0.6, 0.0),
    })

    yPosition -= 20

    // Forma de pago
    if (data.contrato.forma_pago) {
      page.drawText('Forma de Pago:', {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      page.drawText(data.contrato.forma_pago.toUpperCase(), {
        x: this.margin + 120,
        y: yPosition,
        size: 10,
        font: font,
      })

      yPosition -= 15
    }

    // Fecha de entrega
    page.drawText('Fecha de Entrega Estimada:', {
      x: this.margin,
      y: yPosition,
      size: 10,
      font: boldFont,
    })

    page.drawText(new Date(data.contrato.fecha_entrega).toLocaleDateString('es-CL'), {
      x: this.margin + 180,
      y: yPosition,
      size: 10,
      font: font,
    })

    yPosition -= 15

    // Observaciones del CRM
    if (data.contrato.observaciones_crm) {
      page.drawText('Observaciones del CRM:', {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      yPosition -= 15

      const crmObsLines = this.splitTextIntoLines(data.contrato.observaciones_crm, 70)
      crmObsLines.forEach(line => {
        page.drawText(line, {
          x: this.margin,
          y: yPosition,
          size: 9,
          font: font,
          color: rgb(0.3, 0.3, 0.7),
        })
        yPosition -= 12
      })

      yPosition -= 10
    }

    // Observaciones adicionales
    if (data.contrato.observaciones_adicionales) {
      page.drawText('Observaciones Adicionales:', {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      yPosition -= 15

      const adicObsLines = this.splitTextIntoLines(data.contrato.observaciones_adicionales, 70)
      adicObsLines.forEach(line => {
        page.drawText(line, {
          x: this.margin,
          y: yPosition,
          size: 9,
          font: font,
        })
        yPosition -= 12
      })
    }

    // Observaciones generales (fallback)
    if (data.contrato.observaciones && !data.contrato.observaciones_crm && !data.contrato.observaciones_adicionales) {
      page.drawText('Observaciones:', {
        x: this.margin,
        y: yPosition,
        size: 10,
        font: boldFont,
      })

      yPosition -= 15

      const observacionesLines = this.splitTextIntoLines(data.contrato.observaciones, 70)
      observacionesLines.forEach(line => {
        page.drawText(line, {
          x: this.margin,
          y: yPosition,
          size: 9,
          font: font,
        })
        yPosition -= 12
      })
    }

    return yPosition
  }

  private drawTermsAndConditions(page: any, font: any, boldFont: any, data: ContratoPDFData, yPosition: number): number {
    yPosition -= 15

    // Título de sección
    page.drawText('TÉRMINOS Y CONDICIONES', {
      x: this.margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    })

    yPosition -= 20

    const terms = [
      '1. El presente contrato es válido desde la fecha de firma por ambas partes.',
      '2. El cliente se compromete al pago según las condiciones acordadas.',
      '3. ChileHome garantiza la calidad de los materiales y construcción por 12 meses.',
      '4. Los plazos de entrega están sujetos a condiciones climáticas favorables.',
      '5. Cualquier modificación debe ser acordada por escrito por ambas partes.',
      '6. El cliente debe proporcionar acceso adecuado para la instalación.',
      '7. Se incluye instalación básica según especificaciones técnicas.',
    ]

    terms.forEach(term => {
      const termLines = this.splitTextIntoLines(term, 80)
      termLines.forEach(line => {
        page.drawText(line, {
          x: this.margin,
          y: yPosition,
          size: 9,
          font: font,
        })
        yPosition -= 12
      })
      yPosition -= 3 // Espacio extra entre términos
    })

    return yPosition
  }

  private drawSignatures(page: any, font: any, boldFont: any, yPosition: number): void {
    yPosition -= 30

    // Líneas para firmas
    const signatureWidth = 200
    const leftSignatureX = this.margin
    const rightSignatureX = this.pageWidth - this.margin - signatureWidth

    // Línea izquierda (cliente)
    page.drawLine({
      start: { x: leftSignatureX, y: yPosition },
      end: { x: leftSignatureX + signatureWidth, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    // Línea derecha (empresa)
    page.drawLine({
      start: { x: rightSignatureX, y: yPosition },
      end: { x: rightSignatureX + signatureWidth, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    })

    yPosition -= 15

    // Etiquetas de firma
    page.drawText('Firma del Cliente', {
      x: leftSignatureX + 60,
      y: yPosition,
      size: 10,
      font: boldFont,
    })

    page.drawText('ChileHome', {
      x: rightSignatureX + 80,
      y: yPosition,
      size: 10,
      font: boldFont,
    })

    yPosition -= 20

    // Footer con información de contacto
    page.drawText('ChileHome - Casas Prefabricadas | contratos@chilehome.cl | www.chilehome.cl', {
      x: this.margin,
      y: yPosition,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  private splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    words.forEach(word => {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine) lines.push(currentLine)
    return lines
  }
}

export const pdfGenerator = new ContratoPDFGenerator()