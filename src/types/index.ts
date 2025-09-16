export interface User {
  id: string;
  email: string;
  role: 'developer' | 'admin' | 'ejecutivo' | 'supervisor' | 'transportista';
  nombre: string;
  created_at: string;
  can_edit_after_validation?: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  rut: string;
  telefono: string;
  correo: string;
  direccion_entrega: string;
  created_at: string;
  updated_at: string;
}

export interface Contrato {
  id: string;
  numero?: string;
  cliente_id: string;
  cliente?: Cliente;
  ejecutivo_id: string;
  ejecutivo_nombre: string;
  fecha_creacion?: string;
  fecha_entrega: string;
  valor_total: number;
  modelo_casa: string;
  detalle_materiales: string;
  materiales?: Array<{
    item: string;
    cantidad: number;
  }>;
  forma_pago?: FormaPago[];
  observaciones?: string;
  observaciones_crm?: string;
  observaciones_adicionales?: string;
  estado: 'borrador' | 'validacion' | 'validado' | 'enviado';
  planos?: PlanoAdjunto[];
  fecha_validacion?: string;
  validado_por?: string;
  pdf_url?: string;
  enviado_a_cliente?: boolean;
  fecha_envio?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMVenta {
  id: string;
  cliente_nombre: string;
  cliente_rut: string;
  cliente_telefono: string;
  cliente_correo: string;
  direccion_entrega: string;
  valor_total: number;
  modelo_casa: string;
  detalle_materiales: string;
  fecha_venta: string;
  fecha_entrega: string;          // ⭐ Nueva: fecha de entrega
  ejecutivo_id: string;
  ejecutivo_nombre: string;
  supervisor_nombre: string;       // ⭐ Nueva: nombre del supervisor
  estado_crm: string;             // ⭐ Nueva: último estado de la bitácora
  observaciones_crm: string;      // ⭐ Nueva: última observación de la bitácora
  numero_contrato?: string;       // ⭐ Nueva: número de contrato del CRM (0 = sin contrato)
  numero_contrato_temporal?: string; // ⭐ Nueva: número temporal correlativo para contratos sin número
}

export interface FormaPago {
  tipo: 'efectivo' | 'transferencia' | 'tarjeta_credito' | 'tarjeta_debito';
  monto: number;
  recargo_porcentaje?: number;
  monto_con_recargo?: number;
  referencia?: string;
}

export interface PlanoAdjunto {
  id: string;
  contrato_id: string;
  tipo: 'original' | 'modificado';
  modelo_casa: string;
  url: string;
  modificaciones?: string;
  created_at: string;
}

export interface ContratoPDFData {
  cliente: Cliente;
  contrato: Contrato;
  fecha_actual: string;
  terminos_condiciones: string;
  planos?: PlanoAdjunto[];
}