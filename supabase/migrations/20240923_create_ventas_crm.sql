-- Crear tabla para almacenar todas las ventas del CRM
CREATE TABLE IF NOT EXISTS ventas_crm (
  id TEXT PRIMARY KEY,
  cliente_nombre TEXT,
  cliente_rut TEXT,
  cliente_telefono TEXT,
  cliente_correo TEXT,
  direccion_entrega TEXT,
  valor_total BIGINT,
  modelo_casa TEXT,
  detalle_materiales TEXT,
  fecha_venta TIMESTAMP WITH TIME ZONE,
  fecha_entrega DATE,
  ejecutivo_id TEXT,
  ejecutivo_nombre TEXT,
  supervisor_nombre TEXT,
  estado_crm TEXT,
  observaciones_crm TEXT,
  numero_contrato TEXT,
  numero_contrato_temporal TEXT,

  -- Campos de auditoría
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Campos adicionales del CRM
  crm_data JSONB -- Para almacenar todos los datos brutos del CRM
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_ventas_crm_fecha_venta ON ventas_crm(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_crm_estado ON ventas_crm(estado_crm);
CREATE INDEX IF NOT EXISTS idx_ventas_crm_ejecutivo ON ventas_crm(ejecutivo_nombre);
CREATE INDEX IF NOT EXISTS idx_ventas_crm_cliente_rut ON ventas_crm(cliente_rut);
CREATE INDEX IF NOT EXISTS idx_ventas_crm_numero_contrato ON ventas_crm(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_ventas_crm_synced_at ON ventas_crm(synced_at);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
CREATE TRIGGER update_ventas_crm_updated_at BEFORE UPDATE ON ventas_crm
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla para log de sincronización
CREATE TABLE IF NOT EXISTS crm_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual'
  fecha_inicio DATE,
  fecha_fin DATE,
  total_ventas_procesadas INTEGER DEFAULT 0,
  ventas_nuevas INTEGER DEFAULT 0,
  ventas_actualizadas INTEGER DEFAULT 0,
  estado TEXT DEFAULT 'iniciado', -- 'iniciado', 'completado', 'error'
  mensaje_error TEXT,
  duracion_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Crear índice para el log
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_created_at ON crm_sync_log(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_sync_log_estado ON crm_sync_log(estado);

-- Comentarios para documentar
COMMENT ON TABLE ventas_crm IS 'Tabla principal para almacenar todas las ventas sincronizadas del CRM';
COMMENT ON TABLE crm_sync_log IS 'Log de todas las sincronizaciones realizadas con el CRM';
COMMENT ON COLUMN ventas_crm.crm_data IS 'Datos brutos completos del CRM en formato JSON';
COMMENT ON COLUMN ventas_crm.synced_at IS 'Última vez que este registro fue sincronizado desde el CRM';