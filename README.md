# ChileHome - Plataforma de Contratos

Plataforma profesional de generación y validación de contratos para casas prefabricadas ChileHome.

## 🏠 Descripción del Proyecto

Esta aplicación permite a los ejecutivos de ChileHome generar, editar, validar y enviar contratos de compra venta de casas prefabricadas de manera automatizada, integrándose con el sistema CRM existente.

### ✨ Características Principales

- **Integración CRM**: Sincronización automática con ventas del sistema CRM
- **Generación PDF**: Creación de contratos profesionales en formato PDF
- **Envío Automático**: Distribución de contratos por email al cliente y empresa
- **Roles de Usuario**: Sistema de permisos para administradores y ejecutivos
- **Editor Intuitivo**: Interfaz moderna para edición de contratos con optimizaciones de rendimiento
- **Seguridad**: Autenticación robusta y encriptación de datos sensibles
- **Rendimiento Optimizado**: Implementación de React hooks (useMemo, useCallback) para mejorar la experiencia de usuario
- **Interfaz Mejorada**: Firma corporativa integrada y mejores controles de validación

## 🛠 Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, DaisyUI
- **Backend**: Next.js API Routes
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **PDF**: pdf-lib
- **Email**: Resend API
- **Validación**: Zod, React Hook Form

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuenta de Resend (para emails)
- Acceso al CRM de ChileHome

### 1. Clonar e Instalar

```bash
git clone https://github.com/Estebanigv/CRM_ChilehomeContratos.git
cd chilehome-contratos
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_clave_servicio_supabase

# CRM API
CRM_API_BASE_URL=url_api_crm_chilehome
CRM_AUTH_KEY=clave_auth_crm

# Email Service (Resend)
EMAIL_API_KEY=tu_clave_resend
FROM_EMAIL=contratos@chilehome.cl

# Encryption
ENCRYPTION_KEY=clave_encriptacion_32_caracteres

# App Settings
NEXTAUTH_SECRET=secreto_nextauth_aleatorio
NEXTAUTH_URL=http://localhost:3000
```

### 3. Configurar Base de Datos

Ejecuta el script SQL en Supabase:

```bash
# El archivo database.sql contiene todas las tablas y configuraciones necesarias
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard principal
│   ├── editor/            # Editor de contratos
│   ├── previsualizador/   # Vista previa de contratos
│   ├── login/             # Página de login
│   └── crear-contrato/    # Creación desde CRM
├── components/            # Componentes React
├── lib/                   # Librerías y utilidades
│   ├── supabase/         # Cliente Supabase
│   ├── crmApi.ts         # Integración CRM
│   ├── pdfGenerator.ts   # Generador PDF
│   └── mailer.ts         # Servicio de email
├── types/                # Definiciones TypeScript
└── middleware.ts         # Middleware de autenticación
```

## 🔐 Roles y Permisos

### Administrador
- Ver todos los contratos
- Editar cualquier contrato
- Validar y enviar contratos
- Acceso completo al sistema

### Ejecutivo
- Ver solo sus contratos
- Editar sus propios contratos
- Validar y enviar sus contratos
- Crear nuevos contratos desde CRM

## 🔄 Flujo de Trabajo

1. **Sincronización CRM**: Las ventas se obtienen automáticamente del CRM
2. **Creación**: El ejecutivo selecciona una venta y crea el contrato
3. **Edición**: Se completan y ajustan los datos del contrato
4. **Validación**: Se verifica que todos los campos estén correctos
5. **Envío**: Se genera el PDF y se envía por email al cliente
6. **Seguimiento**: El contrato queda registrado con su estado actual

## 📧 Sistema de Emails

Los emails se envían automáticamente cuando se valida y envía un contrato:

- **Cliente**: Recibe el contrato en PDF con instrucciones
- **Empresa**: Recibe copia del contrato para seguimiento

## 🔒 Seguridad

- Autenticación mediante Supabase Auth
- Row Level Security (RLS) en base de datos
- Encriptación de datos sensibles
- Validación de archivos subidos
- Logs de auditoría completos

## 🚀 Deployment

### Vercel (Recomendado)

```bash
vercel --prod
```

### Variables de Entorno en Producción

Configura todas las variables de entorno en tu plataforma de deployment, especialmente:

- URLs de Supabase de producción
- Claves API reales del CRM
- Configuración SMTP de correos

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con coverage
npm run test:coverage
```

## 📝 Logs y Monitoreo

La aplicación registra automáticamente:
- Accesos de usuarios
- Creación y modificación de contratos
- Envíos de email
- Errores del sistema

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:

- **Email**: desarrollo@chilehome.cl
- **Documentación**: Ver `/docs` para guías detalladas
- **Issues**: Usar GitHub Issues para reportar bugs

## 🆕 Actualizaciones Recientes

### Versión Actual - Diciembre 2024

#### 🚀 Optimizaciones de Rendimiento
- **Mejora significativa en campos de entrada**: Implementación de `useMemo` y `useCallback` para eliminar lag en escritura
- **Validación optimizada**: Memoización de validaciones para mejorar respuesta del sistema
- **Renderizado eficiente**: Optimización de re-renders innecesarios en formularios

#### ✨ Mejoras de Interfaz
- **Firma corporativa**: Integración de firma oficial de ChileHome en contratos
- **Selector de forma de pago**: Añadido selector efectivo/transferencia en sección de documentación
- **Advertencias mejoradas**: Mayor visibilidad de advertencias de borrador con styling amarillo
- **Representante corporativo**: Actualizado para mostrar "ChileHome Spa" como firmante

#### 🔧 Corrección de Errores
- **Eliminación de archivos corruptos**: Removido DashboardClient.broken.tsx que causaba errores de compilación
- **Validación de datos**: Corregida lógica para reconocer datos guardados correctamente
- **Sincronización de estados**: Mejorada sincronización entre diferentes estados de UI
- **Prevención de errores**: Agregadas validaciones null/undefined para evitar crashes

#### 📁 Recursos Actualizados
- Agregadas imágenes corporativas oficiales
- Logo de ChileHome integrado
- Firma digital corporativa para contratos

## 📄 Licencia

Este proyecto es propiedad de ChileHome. Todos los derechos reservados.

---

**ChileHome** - Haciendo realidad el hogar de tus sueños 🏡
