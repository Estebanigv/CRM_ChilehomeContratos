import * as XLSX from 'xlsx'
import { formatRUT, formatPhone, formatCurrency } from '@/utils/formatters'
import { getEstadoLabel } from '@/utils/contractHelpers'

interface ExportOptions {
  fileName?: string
  sheetName?: string
  includeTimestamp?: boolean
  autoWidth?: boolean
}

export class ExcelExporter {
  /**
   * Exporta datos de ventas a Excel
   */
  static exportVentas(ventas: any[], options: ExportOptions = {}) {
    const {
      fileName = 'ventas_chilehome',
      sheetName = 'Ventas',
      includeTimestamp = true,
      autoWidth = true
    } = options

    // Preparar datos para exportar
    const dataToExport = ventas.map(venta => ({
      'N° Contrato': venta.numero_contrato || 'Por generar',
      'Estado': getEstadoLabel(venta.estado_crm || ''),
      'Cliente': venta.cliente_nombre,
      'RUT': formatRUT(venta.cliente_rut),
      'Teléfono': formatPhone(venta.cliente_telefono),
      'Ejecutivo': venta.ejecutivo_nombre,
      'Supervisor': venta.supervisor_nombre || '-',
      'Modelo Casa': venta.modelo_casa || '-',
      'Valor Total': formatCurrency(
        typeof venta.valor_total === 'number'
          ? venta.valor_total
          : parseFloat(venta.valor_total?.toString() || '0')
      ),
      'Fecha Venta': new Date(venta.fecha_venta).toLocaleDateString('es-CL'),
      'Fecha Entrega': new Date(venta.fecha_entrega).toLocaleDateString('es-CL'),
      'Dirección': venta.direccion_entrega,
      'Comuna': venta.comuna || '-',
      'Región': venta.region || '-',
      'Observaciones': venta.observaciones_crm || '-'
    }))

    // Crear libro de trabajo
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)

    // Configurar anchos de columna si está habilitado
    if (autoWidth) {
      const columnWidths = [
        { wch: 15 }, // N° Contrato
        { wch: 12 }, // Estado
        { wch: 30 }, // Cliente
        { wch: 13 }, // RUT
        { wch: 15 }, // Teléfono
        { wch: 25 }, // Ejecutivo
        { wch: 25 }, // Supervisor
        { wch: 20 }, // Modelo Casa
        { wch: 15 }, // Valor Total
        { wch: 12 }, // Fecha Venta
        { wch: 12 }, // Fecha Entrega
        { wch: 40 }, // Dirección
        { wch: 15 }, // Comuna
        { wch: 15 }, // Región
        { wch: 40 }  // Observaciones
      ]
      ws['!cols'] = columnWidths
    }

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generar nombre de archivo
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}`
      : ''
    const fullFileName = `${fileName}${timestamp}.xlsx`

    // Descargar archivo
    XLSX.writeFile(wb, fullFileName)

    return {
      success: true,
      fileName: fullFileName,
      recordsExported: dataToExport.length
    }
  }

  /**
   * Exporta resumen de ejecutivos a Excel
   */
  static exportResumenEjecutivos(ejecutivos: any[], options: ExportOptions = {}) {
    const {
      fileName = 'resumen_ejecutivos',
      sheetName = 'Ejecutivos',
      includeTimestamp = true,
      autoWidth = true
    } = options

    // Preparar datos
    const dataToExport = ejecutivos.map(ejecutivo => ({
      'Ejecutivo': ejecutivo.nombre,
      'Total Ventas': ejecutivo.totalVentas,
      'Contratos Listos': ejecutivo.contratosListos,
      'Pendientes': ejecutivo.pendientes,
      'Rechazados': ejecutivo.rechazados,
      'Monto Total': formatCurrency(ejecutivo.montoTotal),
      'Promedio por Venta': formatCurrency(ejecutivo.promedioVenta),
      'Tasa de Éxito': `${ejecutivo.tasaExito}%`,
      'Última Venta': ejecutivo.ultimaVenta
        ? new Date(ejecutivo.ultimaVenta).toLocaleDateString('es-CL')
        : '-'
    }))

    // Crear libro y hoja
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)

    if (autoWidth) {
      ws['!cols'] = [
        { wch: 25 }, // Ejecutivo
        { wch: 12 }, // Total Ventas
        { wch: 15 }, // Contratos Listos
        { wch: 12 }, // Pendientes
        { wch: 12 }, // Rechazados
        { wch: 15 }, // Monto Total
        { wch: 18 }, // Promedio por Venta
        { wch: 12 }, // Tasa de Éxito
        { wch: 12 }  // Última Venta
      ]
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Descargar
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}`
      : ''
    const fullFileName = `${fileName}${timestamp}.xlsx`

    XLSX.writeFile(wb, fullFileName)

    return {
      success: true,
      fileName: fullFileName,
      recordsExported: dataToExport.length
    }
  }

  /**
   * Exporta reporte personalizado
   */
  static exportCustomReport(
    data: any[],
    columns: { key: string; label: string; formatter?: (value: any) => string }[],
    options: ExportOptions = {}
  ) {
    const {
      fileName = 'reporte_personalizado',
      sheetName = 'Reporte',
      includeTimestamp = true,
      autoWidth = true
    } = options

    // Preparar datos con formato personalizado
    const dataToExport = data.map(row => {
      const exportRow: any = {}
      columns.forEach(col => {
        const value = row[col.key]
        exportRow[col.label] = col.formatter ? col.formatter(value) : value
      })
      return exportRow
    })

    // Crear Excel
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataToExport)

    if (autoWidth) {
      // Auto-calcular anchos basado en contenido
      const maxWidths = columns.map(() => 10) // Mínimo 10 caracteres

      dataToExport.forEach(row => {
        columns.forEach((col, idx) => {
          const value = row[col.label]
          const length = String(value).length
          if (length > maxWidths[idx]) {
            maxWidths[idx] = Math.min(length, 50) // Máximo 50 caracteres
          }
        })
      })

      ws['!cols'] = maxWidths.map(w => ({ wch: w + 2 })) // +2 para padding
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Descargar
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}`
      : ''
    const fullFileName = `${fileName}${timestamp}.xlsx`

    XLSX.writeFile(wb, fullFileName)

    return {
      success: true,
      fileName: fullFileName,
      recordsExported: dataToExport.length
    }
  }

  /**
   * Exporta múltiples hojas en un solo archivo
   */
  static exportMultiSheet(
    sheets: {
      name: string
      data: any[]
      columns?: { key: string; label: string; formatter?: (value: any) => string }[]
    }[],
    options: Omit<ExportOptions, 'sheetName'> = {}
  ) {
    const {
      fileName = 'reporte_completo',
      includeTimestamp = true,
      autoWidth = true
    } = options

    const wb = XLSX.utils.book_new()

    sheets.forEach(sheet => {
      let dataToExport: any[]

      if (sheet.columns) {
        // Usar columnas personalizadas
        dataToExport = sheet.data.map(row => {
          const exportRow: any = {}
          sheet.columns!.forEach(col => {
            const value = row[col.key]
            exportRow[col.label] = col.formatter ? col.formatter(value) : value
          })
          return exportRow
        })
      } else {
        // Usar datos tal cual
        dataToExport = sheet.data
      }

      const ws = XLSX.utils.json_to_sheet(dataToExport)

      if (autoWidth) {
        // Configurar anchos automáticos
        const keys = Object.keys(dataToExport[0] || {})
        ws['!cols'] = keys.map(() => ({ wch: 15 }))
      }

      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    })

    // Descargar
    const timestamp = includeTimestamp
      ? `_${new Date().toISOString().split('T')[0]}`
      : ''
    const fullFileName = `${fileName}${timestamp}.xlsx`

    XLSX.writeFile(wb, fullFileName)

    return {
      success: true,
      fileName: fullFileName,
      sheetsExported: sheets.length,
      totalRecords: sheets.reduce((sum, sheet) => sum + sheet.data.length, 0)
    }
  }
}