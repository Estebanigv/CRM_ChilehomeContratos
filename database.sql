-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (complementa auth.users)
CREATE TABLE public.usuarios (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'ejecutivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(255),
    direccion_entrega TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contratos
CREATE TABLE public.contratos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
    ejecutivo_id UUID REFERENCES public.usuarios(id) NOT NULL,
    ejecutivo_nombre VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_entrega DATE NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    modelo_casa VARCHAR(255) NOT NULL,
    detalle_materiales TEXT,
    observaciones TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'validado', 'enviado')),
    pdf_url TEXT,
    enviado_a_cliente BOOLEAN DEFAULT FALSE,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs para auditoría
CREATE TABLE public.logs_contratos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contrato_id UUID REFERENCES public.contratos(id),
    usuario_id UUID REFERENCES public.usuarios(id),
    accion VARCHAR(100) NOT NULL,
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_contratos_cliente_id ON public.contratos(cliente_id);
CREATE INDEX idx_contratos_ejecutivo_id ON public.contratos(ejecutivo_id);
CREATE INDEX idx_contratos_estado ON public.contratos(estado);
CREATE INDEX idx_contratos_fecha_creacion ON public.contratos(fecha_creacion);
CREATE INDEX idx_clientes_rut ON public.clientes(rut);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contratos_updated_at
    BEFORE UPDATE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Policies de seguridad RLS (Row Level Security)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_contratos ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios
CREATE POLICY "Los usuarios pueden ver su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Policies para clientes (solo usuarios autenticados pueden acceder)
CREATE POLICY "Usuarios autenticados pueden ver clientes" ON public.clientes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden crear clientes" ON public.clientes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" ON public.clientes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policies para contratos
CREATE POLICY "Los ejecutivos pueden ver todos los contratos" ON public.contratos
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND role IN ('admin', 'ejecutivo')
        )
    );

CREATE POLICY "Los ejecutivos pueden crear contratos" ON public.contratos
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND role IN ('admin', 'ejecutivo')
        ) AND
        ejecutivo_id = auth.uid()
    );

CREATE POLICY "Los ejecutivos pueden actualizar sus contratos" ON public.contratos
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        ejecutivo_id = auth.uid()
    );

-- Los admins pueden actualizar cualquier contrato
CREATE POLICY "Los admins pueden actualizar cualquier contrato" ON public.contratos
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM public.usuarios 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policies para logs
CREATE POLICY "Solo lectura de logs para usuarios autenticados" ON public.logs_contratos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Insertar logs para usuarios autenticados" ON public.logs_contratos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Función para registrar logs automáticamente
CREATE OR REPLACE FUNCTION public.log_contrato_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.logs_contratos (contrato_id, usuario_id, accion, detalles)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        auth.uid(),
        TG_OP,
        jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
        )
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para log automático en contratos
CREATE TRIGGER log_contratos_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.log_contrato_change();

-- Datos de ejemplo para desarrollo (opcional)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--     uuid_generate_v4(),
--     'admin@chilehome.cl',
--     crypt('admin123', gen_salt('bf')),
--     NOW(),
--     NOW(),
--     NOW()
-- );

-- Función para crear usuario con perfil
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, nombre, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'ejecutivo')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user_profile();