-- Crear tabla para logs de notificaciones
CREATE TABLE IF NOT EXISTS logs_notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_notificacion TEXT NOT NULL,
  destinatarios_count INTEGER DEFAULT 0,
  exitosos INTEGER DEFAULT 0,
  fallidos INTEGER DEFAULT 0,
  detalles JSONB,
  contenido_enviado TEXT,
  datos_evento JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_logs_notificaciones_tipo ON logs_notificaciones(tipo_notificacion);
CREATE INDEX IF NOT EXISTS idx_logs_notificaciones_created_at ON logs_notificaciones(created_at);

-- Comentarios para documentación
COMMENT ON TABLE logs_notificaciones IS 'Registro de todas las notificaciones WhatsApp enviadas';
COMMENT ON COLUMN logs_notificaciones.tipo_notificacion IS 'Tipo de notificación enviada';
COMMENT ON COLUMN logs_notificaciones.destinatarios_count IS 'Número total de destinatarios';
COMMENT ON COLUMN logs_notificaciones.exitosos IS 'Número de envíos exitosos';
COMMENT ON COLUMN logs_notificaciones.fallidos IS 'Número de envíos fallidos';
COMMENT ON COLUMN logs_notificaciones.detalles IS 'Detalles de cada envío individual';
COMMENT ON COLUMN logs_notificaciones.contenido_enviado IS 'Contenido del mensaje enviado';
COMMENT ON COLUMN logs_notificaciones.datos_evento IS 'Datos del evento que disparó la notificación';