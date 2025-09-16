-- Actualización de la tabla de usuarios para incluir nuevos roles y permisos
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS can_edit_after_validation BOOLEAN DEFAULT FALSE;

-- Agregar rol de desarrollador para Esteban
UPDATE usuarios
SET role = 'developer'
WHERE email LIKE '%esteban%' OR nombre LIKE '%Esteban%';

-- Asegurar que Esteban tenga todos los permisos
UPDATE usuarios
SET can_edit_after_validation = TRUE
WHERE role = 'developer';

UPDATE usuarios
SET role = 'supervisor'
WHERE role = 'admin' AND email LIKE '%supervisor%';

-- Crear tabla para formas de pago múltiples
CREATE TABLE IF NOT EXISTS formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito')),
  monto DECIMAL(12,2) NOT NULL,
  recargo_porcentaje DECIMAL(5,2),
  monto_con_recargo DECIMAL(12,2),
  referencia VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para planos adjuntos
CREATE TABLE IF NOT EXISTS planos_adjuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('original', 'modificado')),
  modelo_casa VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  modificaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actualizar tabla de contratos para nuevos estados
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validado_por UUID REFERENCES usuarios(id);

-- Agregar el nuevo estado 'validacion'
ALTER TABLE contratos
DROP CONSTRAINT IF EXISTS contratos_estado_check;

ALTER TABLE contratos
ADD CONSTRAINT contratos_estado_check
CHECK (estado IN ('borrador', 'validacion', 'validado', 'enviado'));

-- Crear tabla para configuración de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'whatsapp')),
  destinatario VARCHAR(255) NOT NULL,
  frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'mensual')),
  dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora TIME NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  filtros JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_formas_pago_contrato ON formas_pago(contrato_id);
CREATE INDEX IF NOT EXISTS idx_planos_contrato ON planos_adjuntos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos(estado);
CREATE INDEX IF NOT EXISTS idx_contratos_validacion ON contratos(fecha_validacion);
CREATE INDEX IF NOT EXISTS idx_notificaciones_activas ON notificaciones_config(activo);

-- Insertar configuración de notificación para Guillermo Díaz (ejemplo)
INSERT INTO notificaciones_config (tipo, destinatario, frecuencia, dia_semana, hora, filtros)
VALUES (
  'email',
  'guillermo.diaz@chilehome.cl',
  'semanal',
  1, -- Lunes
  '09:00',
  '{"estados": ["validado", "enviado"]}'::jsonb
)
ON CONFLICT DO NOTHING;

-- Función para verificar permisos de edición
CREATE OR REPLACE FUNCTION verificar_permiso_edicion(
  p_usuario_id UUID,
  p_contrato_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
  v_estado VARCHAR;
  v_ejecutivo_id UUID;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO v_role
  FROM usuarios
  WHERE id = p_usuario_id;

  -- Obtener estado y ejecutivo del contrato
  SELECT estado, ejecutivo_id INTO v_estado, v_ejecutivo_id
  FROM contratos
  WHERE id = p_contrato_id;

  -- Admins y supervisores pueden editar siempre
  IF v_role IN ('admin', 'supervisor') THEN
    RETURN TRUE;
  END IF;

  -- Ejecutivos solo pueden editar contratos en borrador que sean suyos
  IF v_role = 'ejecutivo' THEN
    IF v_estado = 'borrador' AND v_ejecutivo_id = p_usuario_id THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar cambios de estado
CREATE TABLE IF NOT EXISTS contratos_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(20),
  estado_nuevo VARCHAR(20),
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observaciones TEXT
);

CREATE OR REPLACE FUNCTION registrar_cambio_estado()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO contratos_historial (
      contrato_id,
      estado_anterior,
      estado_nuevo,
      usuario_id,
      observaciones
    ) VALUES (
      NEW.id,
      OLD.estado,
      NEW.estado,
      NEW.updated_by,
      CASE
        WHEN NEW.estado = 'validado' THEN 'Contrato validado'
        WHEN NEW.estado = 'validacion' THEN 'Contrato en proceso de validación'
        WHEN NEW.estado = 'enviado' THEN 'Contrato enviado al cliente'
        ELSE NULL
      END
    );

    -- Si se valida, actualizar fecha y usuario de validación
    IF NEW.estado = 'validado' THEN
      NEW.fecha_validacion = NOW();
      NEW.validado_por = NEW.updated_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cambio_estado ON contratos;
CREATE TRIGGER trigger_cambio_estado
BEFORE UPDATE ON contratos
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_estado();

-- Agregar columna updated_by para rastrear quién hace los cambios
ALTER TABLE contratos
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES usuarios(id);