-- Crear tabla para gestionar fichas eliminadas (soft delete)
CREATE TABLE fichas_eliminadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id TEXT NOT NULL, -- ID de la venta del CRM
  datos_originales JSONB NOT NULL, -- Datos completos de la venta para poder restaurarla
  motivo_eliminacion TEXT DEFAULT 'Sin motivo especificado',
  eliminado_por UUID REFERENCES auth.users(id),
  fecha_eliminacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevenir duplicados por venta_id
  UNIQUE(venta_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_fichas_eliminadas_venta_id ON fichas_eliminadas(venta_id);
CREATE INDEX idx_fichas_eliminadas_fecha ON fichas_eliminadas(fecha_eliminacion);
CREATE INDEX idx_fichas_eliminadas_eliminado_por ON fichas_eliminadas(eliminado_por);

-- Políticas de seguridad RLS (Row Level Security)
ALTER TABLE fichas_eliminadas ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver fichas eliminadas" ON fichas_eliminadas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir insertar a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden crear fichas eliminadas" ON fichas_eliminadas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir eliminar (restaurar) a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden restaurar fichas" ON fichas_eliminadas
  FOR DELETE USING (auth.role() = 'authenticated');

-- Comentarios para documentación
COMMENT ON TABLE fichas_eliminadas IS 'Tabla para gestionar fichas eliminadas del CRM usando soft delete';
COMMENT ON COLUMN fichas_eliminadas.venta_id IS 'ID único de la venta en el CRM';
COMMENT ON COLUMN fichas_eliminadas.datos_originales IS 'Datos completos de la venta para poder restaurarla';
COMMENT ON COLUMN fichas_eliminadas.motivo_eliminacion IS 'Razón por la cual se eliminó la ficha';