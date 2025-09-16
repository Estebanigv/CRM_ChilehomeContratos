CREATE TABLE IF NOT EXISTS logs_notificaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  destinatario VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  mensaje TEXT NOT NULL,
  exito BOOLEAN DEFAULT false,
  respuesta_api JSONB,
  error_mensaje TEXT,
  fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_notificaciones_tipo ON logs_notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_notificaciones_fecha ON logs_notificaciones(fecha_envio);
CREATE INDEX IF NOT EXISTS idx_logs_notificaciones_exito ON logs_notificaciones(exito);

INSERT INTO configuraciones_whatsapp (destinatario, destinatario_nombre, rol, activo, tipos_notificacion, configuracion)
VALUES (
  '+56963348909',
  'Guillermo Díaz',
  'administrador',
  true,
  ARRAY['resumen_diario', 'resumen_semanal', 'saludo_matutino', 'nueva_venta_crm', 'contrato_validado'],
  '{"incluir_detalles": true, "incluir_metricas": true, "incluir_links": true}'::jsonb
);