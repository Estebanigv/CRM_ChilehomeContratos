# Guía de Configuración - ChileHome Contratos

Esta guía te ayudará a configurar completamente la plataforma de contratos de ChileHome.

## 🔧 Configuración Inicial

### 1. Configurar Supabase

1. Crear un nuevo proyecto en [supabase.com](https://supabase.com)
2. Ir a Settings > API para obtener las claves
3. Ejecutar el script `database.sql` en el SQL Editor
4. Configurar las variables de entorno de Supabase

### 2. Configurar Resend (Emails)

1. Crear cuenta en [resend.com](https://resend.com)
2. Verificar el dominio `chilehome.cl`
3. Generar API Key
4. Configurar la variable `EMAIL_API_KEY`

### 3. Integración CRM

La aplicación está preparada para integrarse con el CRM de ChileHome:

- Configura `CRM_API_BASE_URL` con la URL base del CRM
- Configura `CRM_AUTH_KEY` con la clave de autenticación
- La API del CRM debe implementar estos endpoints:

```
GET /ventas                    # Obtener todas las ventas
GET /ventas/{id}              # Obtener venta específica
POST /ventas/{id}/procesar    # Marcar como procesada
GET /ejecutivos               # Obtener lista de ejecutivos
GET /health                   # Health check
```

## 📊 Estructura de Datos CRM

### Formato Esperado de Venta

```json
{
  "id": "uuid",
  "cliente_nombre": "string",
  "cliente_rut": "string",
  "cliente_telefono": "string",
  "cliente_correo": "string",
  "direccion_entrega": "string",
  "valor_total": "number",
  "modelo_casa": "string", 
  "detalle_materiales": "string",
  "fecha_venta": "ISO date",
  "ejecutivo_id": "string",
  "ejecutivo_nombre": "string"
}
```

## 🗃 Configuración Base de Datos

### Usuarios Iniciales

Puedes crear usuarios manualmente en Supabase Auth o usar estos comandos SQL:

```sql
-- Crear usuario admin
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@chilehome.cl',
  crypt('password_admin', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- El trigger automáticamente creará el perfil en la tabla usuarios
```

### Datos de Prueba

Para desarrollo, puedes insertar datos de prueba:

```sql
-- Insertar cliente de prueba
INSERT INTO clientes (nombre, rut, telefono, correo, direccion_entrega)
VALUES (
  'Cliente de Prueba',
  '12345678-9',
  '+56912345678',
  'cliente@test.com',
  'Dirección de Prueba 123'
);

-- Insertar contrato de prueba
INSERT INTO contratos (cliente_id, ejecutivo_id, ejecutivo_nombre, fecha_entrega, valor_total, modelo_casa, detalle_materiales)
VALUES (
  (SELECT id FROM clientes LIMIT 1),
  (SELECT id FROM usuarios LIMIT 1),
  'Ejecutivo Prueba',
  '2024-06-01',
  50000000,
  'Modelo Prueba',
  'Detalles de prueba'
);
```

## 🔒 Configuración de Seguridad

### Claves de Encriptación

Genera claves seguras para producción:

```bash
# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Generar ENCRYPTION_KEY (32 caracteres)
openssl rand -hex 16
```

### Variables de Entorno de Producción

```env
# Supabase Producción
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# CRM Producción
CRM_API_BASE_URL=https://crm.chilehome.cl/api
CRM_AUTH_KEY=clave_produccion

# Email Producción
EMAIL_API_KEY=re_...
FROM_EMAIL=contratos@chilehome.cl

# Seguridad
ENCRYPTION_KEY=clave_segura_32_caracteres
NEXTAUTH_SECRET=secreto_nextauth_muy_seguro
NEXTAUTH_URL=https://contratos.chilehome.cl
```

## 🚀 Deploy en Vercel

### 1. Conectar Repositorio

1. Push del código a GitHub/GitLab
2. Importar proyecto en Vercel
3. Configurar variables de entorno

### 2. Configuración de Dominio

1. Agregar dominio personalizado en Vercel
2. Configurar DNS para apuntar a Vercel
3. Verificar SSL automático

### 3. Variables de Entorno

Copiar todas las variables del archivo `.env.local` a la configuración de Vercel.

## 📧 Configuración de Correos

### Plantillas de Email

Las plantillas están en `src/lib/mailer.ts`. Puedes personalizarlas:

- Colores corporativos
- Logo de la empresa
- Información de contacto
- Términos legales

### Dominios y SPF

Para evitar que los correos vayan a spam:

1. Configurar SPF record: `v=spf1 include:_spf.resend.com ~all`
2. Configurar DKIM en Resend
3. Configurar DMARC policy

## 🔍 Monitoreo y Logs

### Logs de la Aplicación

Los logs se guardan automáticamente en:
- Tabla `logs_contratos` (Supabase)
- Console.log para desarrollo
- Sentry/DataDog para producción (opcional)

### Métricas Importantes

- Contratos creados por día
- Tiempo promedio de procesamiento
- Tasa de éxito de envío de emails
- Errores de integración CRM

## 🧪 Testing

### Setup de Testing

```bash
# Instalar dependencias de testing
npm install --save-dev jest @testing-library/react

# Configurar en package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Base de Datos de Testing

Crear proyecto separado en Supabase para testing:

```env
# .env.test.local
NEXT_PUBLIC_SUPABASE_URL=https://testing-project.supabase.co
# ... otras variables de testing
```

## 🔄 Backup y Recuperación

### Backup Automático

Supabase hace backups automáticos, pero puedes configurar backups adicionales:

```sql
-- Crear backup manual
pg_dump -h host -U postgres -d database > backup.sql
```

### Recuperación de Datos

```sql
-- Restaurar desde backup
psql -h host -U postgres -d database < backup.sql
```

## 📞 Troubleshooting

### Errores Comunes

1. **Error de conexión CRM**: Verificar URLs y claves de API
2. **Emails no se envían**: Revisar configuración de Resend
3. **Error de autenticación**: Verificar configuración de Supabase
4. **PDF no se genera**: Verificar dependencias de pdf-lib

### Logs de Debug

Activar logs detallados en desarrollo:

```env
DEBUG=true
LOG_LEVEL=debug
```

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Next.js](https://nextjs.org/docs)
- [API de Resend](https://resend.com/docs)
- [Guía de pdf-lib](https://pdf-lib.js.org/)

---

¿Necesitas ayuda? Contacta al equipo de desarrollo: desarrollo@chilehome.cl