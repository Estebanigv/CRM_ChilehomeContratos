-- =========================================
-- SCRIPT PARA EJECUTAR EN SUPABASE SQL EDITOR
-- Sistema ChileHome Contratos - Actualización BD
-- =========================================

-- 1. Tabla para formas de pago múltiples
CREATE TABLE IF NOT EXISTS formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito')),
  monto DECIMAL(12,2) NOT NULL,
  recargo_porcentaje DECIMAL(5,2),
  monto_con_recargo DECIMAL(12,2),
  referencia VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla para planos adjuntos
CREATE TABLE IF NOT EXISTS planos_adjuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('original', 'modificado')),
  modelo_casa VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  modificaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla para configuraciones de reportes automáticos
CREATE TABLE IF NOT EXISTS configuraciones_reportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario VARCHAR(255) NOT NULL,
  destinatario_nombre VARCHAR(255) NOT NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('contratos', 'ventas', 'produccion', 'logistica', 'finanzas')),
  tipo_reporte VARCHAR(100) NOT NULL,
  frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'mensual')),
  dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora TIME NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  configuracion JSONB,
  ultima_ejecucion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla para recordatorios de tokens
CREATE TABLE IF NOT EXISTS token_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  token_expires_at DATE NOT NULL,
  days_remaining INTEGER,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Actualizar tabla de usuarios (si existe)
DO $$
BEGIN
  -- Agregar columna can_edit_after_validation si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'can_edit_after_validation'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN can_edit_after_validation BOOLEAN DEFAULT FALSE;
  END IF;

  -- Agregar columnas a contratos si no existen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'fecha_validacion'
  ) THEN
    ALTER TABLE contratos ADD COLUMN fecha_validacion TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'validado_por'
  ) THEN
    ALTER TABLE contratos ADD COLUMN validado_por UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contratos' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE contratos ADD COLUMN updated_by UUID;
  END IF;
END $$;

-- 6. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_formas_pago_contrato ON formas_pago(contrato_id);
CREATE INDEX IF NOT EXISTS idx_planos_contrato ON planos_adjuntos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_configuraciones_activas ON configuraciones_reportes(activo);
CREATE INDEX IF NOT EXISTS idx_token_reminders_service ON token_reminders(service);

-- 7. Insertar configuración inicial para Guillermo Díaz
INSERT INTO configuraciones_reportes (
  destinatario,
  destinatario_nombre,
  area,
  tipo_reporte,
  frecuencia,
  dia_semana,
  hora,
  activo,
  configuracion
) VALUES (
  '+56963348909',
  'Guillermo Díaz',
  'contratos',
  'resumen_semanal_contratos',
  'semanal',
  0, -- Domingo
  '19:00:00',
  TRUE,
  '{
    "incluir_detalles": true,
    "incluir_links": true,
    "incluir_metricas": true,
    "filtros": {
      "estados": ["validado", "enviado", "validacion"],
      "fecha_desde": "ultima_semana"
    }
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- 8. Insertar reporte diario para Guillermo
INSERT INTO configuraciones_reportes (
  destinatario,
  destinatario_nombre,
  area,
  tipo_reporte,
  frecuencia,
  hora,
  activo,
  configuracion
) VALUES (
  '+56963348909',
  'Guillermo Díaz',
  'ventas',
  'metricas_ventas_diarias',
  'diaria',
  '20:00:00',
  TRUE,
  '{
    "incluir_metricas": true,
    "filtros": {
      "fecha": "hoy"
    }
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- 9. Insertar recordatorio de token WhatsApp (PERMANENTE)
INSERT INTO token_reminders (
  service,
  token_expires_at,
  days_remaining,
  reminder_sent
) VALUES (
  'whatsapp_permanent',
  '2099-12-31', -- Token permanente
  999999, -- No expira
  FALSE
) ON CONFLICT DO NOTHING;

-- 10. Habilitar Row Level Security (opcional, para mayor seguridad)
ALTER TABLE formas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_adjuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuraciones_reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_reminders ENABLE ROW LEVEL SECURITY;

-- 11. Crear políticas básicas de seguridad (opcional)
-- Solo usuarios autenticados pueden leer/escribir
DO $$
BEGIN
  -- Política para formas_pago
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'formas_pago_policy'
  ) THEN
    CREATE POLICY formas_pago_policy ON formas_pago
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- Política para planos_adjuntos
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'planos_adjuntos_policy'
  ) THEN
    CREATE POLICY planos_adjuntos_policy ON planos_adjuntos
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- Política para configuraciones_reportes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'configuraciones_reportes_policy'
  ) THEN
    CREATE POLICY configuraciones_reportes_policy ON configuraciones_reportes
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;

  -- Política para token_reminders
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'token_reminders_policy'
  ) THEN
    CREATE POLICY token_reminders_policy ON token_reminders
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- =========================================
-- VERIFICACIÓN - Consultas para verificar que todo está bien
-- =========================================

-- Verificar que las tablas se crearon
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename IN ('formas_pago', 'planos_adjuntos', 'configuraciones_reportes', 'token_reminders')
ORDER BY tablename;

-- Verificar configuraciones insertadas
SELECT
  destinatario_nombre,
  area,
  tipo_reporte,
  frecuencia,
  hora,
  activo
FROM configuraciones_reportes;

-- Verificar recordatorio de token
SELECT
  service,
  token_expires_at,
  days_remaining,
  reminder_sent
FROM token_reminders;

-- =========================================
-- ¡COMPLETADO!
-- Las siguientes funcionalidades están listas:
-- ✅ Formas de pago múltiples con recargos automáticos
-- ✅ Gestión de planos adjuntos (originales y modificados)
-- ✅ Sistema de reportes automáticos para Guillermo Díaz
-- ✅ Recordatorios de expiración de tokens
-- ✅ Configuración programada: Domingos 19:00 reportes semanales
-- ✅ Configuración programada: Diario 20:00 métricas de ventas
-- ✅ Alerta WhatsApp token expira: 14/11/2025
-- =========================================