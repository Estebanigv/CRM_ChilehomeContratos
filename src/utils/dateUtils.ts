/**
 * Utilidades para formateo de fechas
 */

export const formatearFecha = (fecha: any): string => {
  if (!fecha) return 'Sin fecha'

  try {
    let fechaObj: Date

    if (typeof fecha === 'string') {
      // Formato del CRM: DD-MM-YYYY HH:MM o DD-MM-YYYY
      if (fecha.includes('-') && fecha.match(/^\d{2}-\d{2}-\d{4}/)) {
        const [fechaParte] = fecha.split(' ') // Quitar hora si existe
        const [dia, mes, año] = fechaParte.split('-')
        fechaObj = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
      }
      // Formato DD/MM/YYYY
      else if (fecha.includes('/')) {
        const [dia, mes, año] = fecha.split('/')
        fechaObj = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
      }
      // Formato YYYY-MM-DD (ISO)
      else if (fecha.includes('-') && fecha.match(/^\d{4}-\d{2}-\d{2}/)) {
        fechaObj = new Date(fecha.includes('T') ? fecha : fecha + 'T00:00:00')
      }
      else {
        fechaObj = new Date(fecha)
      }
    }
    else if (fecha instanceof Date) {
      fechaObj = fecha
    }
    else if (typeof fecha === 'number') {
      fechaObj = new Date(fecha)
    }
    else {
      return 'Formato inválido'
    }

    if (isNaN(fechaObj.getTime())) {
      console.warn('Fecha inválida recibida:', fecha)
      return 'Fecha inválida'
    }

    const año = fechaObj.getFullYear()
    if (año < 2020 || año > 2030) {
      console.warn('Fecha fuera de rango:', fecha, 'Año:', año)
      return 'Fecha fuera de rango'
    }

    return fechaObj.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (e) {
    console.error('Error formateando fecha:', fecha, e)
    return 'Error de formato'
  }
}

export const formatearFechaPeriodo = (fecha: string | undefined): string => {
  if (!fecha) return ''
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const obtenerPeriodoTexto = (fechaInicio?: string, fechaFin?: string): string => {
  return (fechaInicio && fechaFin)
    ? `${formatearFechaPeriodo(fechaInicio)} - ${formatearFechaPeriodo(fechaFin)}`
    : 'Período actual'
}