import { Venta } from '@/types'
import { formatearFecha } from './dateUtils'

export interface ClienteData {
  id: number
  nombre: string
  rut: string
  estado: string
  estadoColor: { bgColor: string; textColor: string; classes: string }
  ejecutivo: string
  fechaIngreso: string
  fechaEntrega: string
}

export const capitalizarNombre = (texto: string | undefined): string => {
  if (!texto) return ''
  return texto.toLowerCase().split(' ').map(palabra =>
    palabra.charAt(0).toUpperCase() + palabra.slice(1)
  ).join(' ')
}

export const getEstadoColor = (estado: string | undefined) => {
  if (!estado) return { bgColor: '#6b7280', textColor: '#ffffff', classes: 'text-white' }

  switch (estado) {
    case 'Despacho':
      return { bgColor: '#3B82F6', textColor: '#ffffff', classes: 'text-white' }
    case 'Entrega OK':
      return { bgColor: '#10B981', textColor: '#ffffff', classes: 'text-white' }
    case 'Confirmación de entrega':
      return { bgColor: '#F97316', textColor: '#ffffff', classes: 'text-white' }
    case 'Contrato':
      return { bgColor: '#0891B2', textColor: '#ffffff', classes: 'text-white' }
    case 'Validación':
      return { bgColor: '#EAB308', textColor: '#ffffff', classes: 'text-white' }
    case 'Pre-ingreso':
      return { bgColor: '#A855F7', textColor: '#ffffff', classes: 'text-white' }
    case 'Producción':
      return { bgColor: '#06B6D4', textColor: '#ffffff', classes: 'text-white' }
    case 'Planificación':
      return { bgColor: '#8B5CF6', textColor: '#ffffff', classes: 'text-white' }
    case 'Adquisiciones':
      return { bgColor: '#F59E0B', textColor: '#ffffff', classes: 'text-white' }
    case 'Rechazo':
      return { bgColor: '#EF4444', textColor: '#ffffff', classes: 'text-white' }
    default:
      return { bgColor: '#6b7280', textColor: '#ffffff', classes: 'text-white' }
  }
}

export const procesarDatosClientes = (ventas: Venta[]): ClienteData[] => {
  return ventas.map((venta, index) => {
    const fechaIngreso = formatearFecha(venta.fecha_venta || venta.created_at)
    const fechaEntrega = venta.fecha_entrega ? formatearFecha(venta.fecha_entrega) : 'Por definir'

    const ejecutivoNombre = (venta.ejecutivo_nombre || venta.supervisor_nombre || 'Sin asignar')
      .replace(/\s*\([^)]*\)/g, '')

    // Debug fechas en desarrollo
    if (process.env.NODE_ENV === 'development' && index === 0) {
      console.log('🗓️ Debug fechas CRM:', {
        venta_id: venta.id,
        fecha_venta_raw: venta.fecha_venta,
        created_at_raw: venta.created_at,
        fecha_entrega_raw: venta.fecha_entrega,
        fechaIngreso_formateada: fechaIngreso,
        fechaEntrega_formateada: fechaEntrega
      })
    }

    return {
      id: venta.id || (2400 - index),
      nombre: capitalizarNombre(venta.cliente_nombre),
      rut: venta.cliente_rut,
      estado: venta.estado_crm || 'Pendiente',
      estadoColor: getEstadoColor(venta.estado_crm),
      ejecutivo: capitalizarNombre(ejecutivoNombre),
      fechaIngreso,
      fechaEntrega
    }
  })
}