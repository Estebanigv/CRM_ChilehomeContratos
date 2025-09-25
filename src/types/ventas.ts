import { BaseEntity } from './common'

export interface Venta extends BaseEntity {
  cliente_nombre: string
  cliente_rut: string
  cliente_telefono: string
  cliente_correo?: string
  ejecutivo_nombre?: string
  supervisor_nombre?: string
  valor_total: number | string
  fecha_venta: string
  fecha_entrega?: string
  direccion_entrega: string
  comuna?: string
  region?: string
  estado_crm?: string
  observaciones_crm?: string
  modelo_casa?: string
  numero_contrato?: string
  numero_contrato_temporal?: string
  forma_pago?: string
  pie?: number | string
  dividendos?: number | string
  empresa?: string
}

export interface VentaFormData {
  cliente_nombre: string
  cliente_rut: string
  cliente_telefono: string
  cliente_correo?: string
  direccion_entrega: string
  comuna?: string
  region?: string
  valor_total: number | string
  fecha_venta: string
  fecha_entrega?: string
  modelo_casa?: string
  observaciones?: string
  forma_pago?: string
  pie?: number | string
  dividendos?: number | string
}

export interface VentaValidation {
  isValid: boolean
  errors: Record<string, string>
  formatted?: Partial<Venta>
}

export type EstadoVenta =
  | 'pendiente'
  | 'proceso'
  | 'pre-ingreso'
  | 'validacion'
  | 'contrato'
  | 'confirmacion'
  | 'produccion'
  | 'entrega-ok'
  | 'completado'
  | 'rechazado'
  | 'cancelado'