-- Crear tabla de clientes para ChileHome
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    estado TEXT NOT NULL DEFAULT 'Pendiente contrato' 
        CHECK (estado IN ('Pendiente contrato', 'Contrato activo', 'Rechazado')),
    fecha_ingreso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    telefono TEXT,
    rut TEXT,
    direccion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_clientes_fecha_ingreso ON public.clientes(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON public.clientes(nombre);

-- Habilitar Row Level Security
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (temporal para desarrollo)
-- IMPORTANTE: En producción, ajustar estas políticas según necesidades de seguridad
DROP POLICY IF EXISTS "Allow all operations" ON public.clientes;
CREATE POLICY "Allow all operations" 
    ON public.clientes 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Insertar datos de ejemplo
INSERT INTO public.clientes (nombre, email, estado, fecha_ingreso, telefono, rut, direccion) VALUES
('María González Pérez', 'maria.gonzalez@email.com', 'Contrato activo', NOW(), '+56 9 8765 4321', '12345678-9', 'Las Condes, Santiago'),
('Carlos Rodríguez López', 'carlos.rodriguez@email.com', 'Pendiente contrato', NOW() - INTERVAL '1 day', '+56 9 8765 4322', '12345679-7', 'Providencia, Santiago'),
('Ana Martínez Silva', NULL, 'Contrato activo', NOW() - INTERVAL '2 days', '+56 9 8765 4323', '12345680-K', 'Ñuñoa, Santiago'),
('Roberto Sánchez Torres', 'roberto.sanchez@email.com', 'Rechazado', NOW() - INTERVAL '3 days', '+56 9 8765 4324', '12345681-8', 'Maipú, Santiago'),
('Laura Pérez Morales', 'laura.perez@email.com', 'Pendiente contrato', NOW() - INTERVAL '4 days', '+56 9 8765 4325', '12345682-6', 'La Florida, Santiago')
ON CONFLICT (id) DO NOTHING;