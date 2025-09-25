# 📁 Estructura del Proyecto ChileHome Contratos

## 🏗️ Arquitectura Reorganizada

### 📋 **Estructura de Carpetas**

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── crm/                 # Endpoints CRM
│   │   ├── whatsapp/            # Endpoints WhatsApp
│   │   ├── dashboard/           # Endpoints Dashboard
│   │   └── ...
│   ├── dashboard/               # Páginas Dashboard
│   ├── login/                   # Autenticación
│   └── ...
│
├── components/                   # Componentes React
│   ├── shared/                  # Componentes reutilizables
│   │   ├── ChileHomeLoader.tsx
│   │   ├── DateRangeSelector.tsx
│   │   ├── CustomDatePicker.tsx
│   │   └── LazyLoadWrapper.tsx
│   ├── dashboard/               # Componentes del Dashboard
│   │   └── DashboardClient.tsx
│   ├── crm/                     # Componentes CRM
│   │   └── CRMDashboard.tsx
│   ├── layout/                  # Componentes de Layout
│   │   └── Sidebar.tsx
│   ├── forms/                   # Formularios
│   └── index.ts                 # Exportación centralizada
│
├── services/                     # Lógica de negocio
│   ├── crm/
│   │   └── crmService.ts        # Servicio CRM
│   ├── whatsapp/
│   │   └── whatsappService.ts   # Servicio WhatsApp
│   ├── auth/                    # Servicios de autenticación
│   ├── reports/                 # Servicios de reportes
│   ├── validation/              # Servicios de validación
│   └── index.ts                 # Exportación centralizada
│
├── hooks/                        # Hooks personalizados
│   ├── dashboard/
│   │   └── useDateFilter.ts
│   ├── auth/                    # Hooks de autenticación
│   ├── validation/              # Hooks de validación
│   └── index.ts                 # Exportación centralizada
│
├── types/                        # Definiciones de tipos
│   ├── common.ts                # Tipos comunes
│   ├── ventas.ts                # Tipos de ventas
│   ├── dashboard.ts             # Tipos de dashboard
│   └── index.ts                 # Exportación centralizada
│
├── lib/                         # Utilidades y configuraciones
│   ├── supabase/                # Configuración Supabase
│   ├── auth/                    # Configuración autenticación
│   ├── validators.ts            # Validadores chilenos
│   ├── permissions.ts           # Sistema de permisos
│   ├── cacheManager.ts          # Gestión de cache
│   ├── excelExporter.ts         # Exportación Excel
│   ├── reportGenerator.ts       # Generador reportes
│   ├── crmMetrics.ts           # Métricas CRM
│   └── utils.ts                 # Utilidades generales
│
├── contexts/                     # Contextos React
│   └── AuthContext.tsx          # Contexto autenticación
│
└── utils/                        # Utilidades específicas
    ├── formatters.ts            # Formateadores
    └── contractHelpers.ts       # Helpers contratos
```

## 🎯 **Principios de Organización**

### 1. **Separación por Dominio**
- **CRM**: Todo lo relacionado con gestión de ventas
- **WhatsApp**: Integración y mensajería
- **Dashboard**: Métricas y visualización
- **Auth**: Autenticación y permisos

### 2. **Componentes Modulares**
- **Shared**: Componentes reutilizables
- **Domain-specific**: Componentes específicos por dominio
- **Layout**: Componentes de estructura

### 3. **Servicios Centralizados**
- Un servicio por dominio
- Interfaz consistente con `ApiResponse<T>`
- Manejo de errores estandarizado

### 4. **Tipos Centralizados**
- Tipos comunes en `common.ts`
- Tipos específicos por dominio
- Exportación centralizada en `index.ts`

## 📦 **Importaciones Estandarizadas**

### **Estructura de Imports**
```typescript
// 1. Librerías externas
import React from 'react'
import { NextRequest } from 'next/server'

// 2. Tipos centralizados
import { Venta, ApiResponse, User } from '@/types'

// 3. Servicios
import { crmService, whatsappService } from '@/services'

// 4. Componentes
import { ChileHomeLoader, DateRangeSelector } from '@/components/shared'

// 5. Hooks
import { useDateFilter, useAuth } from '@/hooks'

// 6. Utilidades
import { formatCurrency } from '@/utils/formatters'
```

## 🔧 **Convenciones de Código**

### **Nomenclatura**
- **Archivos**: camelCase para archivos, PascalCase para componentes
- **Servicios**: Sufijo `Service` (ej: `CRMService`)
- **Hooks**: Prefijo `use` (ej: `useDateFilter`)
- **Tipos**: PascalCase (ej: `ApiResponse<T>`)

### **Estructura de Servicios**
```typescript
export class ExampleService {
  async get(id: string): Promise<ApiResponse<Entity>> { }
  async list(filters?: FilterOptions): Promise<ApiResponse<Entity[]>> { }
  async create(data: CreateData): Promise<ApiResponse<Entity>> { }
  async update(id: string, data: UpdateData): Promise<ApiResponse<Entity>> { }
  async delete(id: string): Promise<ApiResponse<void>> { }
}
```

### **Estructura de Componentes**
```typescript
interface ComponentProps {
  // Props tipadas
}

export default function Component({ ...props }: ComponentProps) {
  // Lógica del componente
  return (
    // JSX
  )
}
```

## 🧹 **Archivos Eliminables**

### **Archivos Duplicados o No Utilizados**
```bash
# Archivos que se pueden eliminar
src/lib/smartcrm.ts                  # Duplicado en crmService
src/lib/whatsappRoles.ts            # Integrado en whatsappService
src/components/DashboardClient.minimal.tsx  # Versión antigua
src/components/ClientOnlyWrapper.tsx        # No utilizado
src/lib/tempStorage.ts                      # No utilizado
src/lib/tokenReminder.ts                    # No utilizado

# APIs de testing que se pueden limpiar
src/app/api/test-*                   # APIs de prueba
src/app/api/dev/                     # APIs de desarrollo
```

## 🚀 **Beneficios de la Nueva Estructura**

### **Mantenibilidad**
- Código organizado por dominio
- Imports claros y predecibles
- Separación de responsabilidades

### **Escalabilidad**
- Fácil agregar nuevos dominios
- Servicios independientes
- Componentes reutilizables

### **Desarrollador Experience**
- Autocompletado mejorado
- Navegación más fácil
- Menos acoplamiento

## ⚡ **Próximos Pasos**

1. **Migrar imports** en archivos restantes
2. **Eliminar archivos** no utilizados
3. **Consolidar APIs** duplicadas
4. **Documentar componentes** principales
5. **Agregar tests** para servicios

---

*Esta estructura sigue las mejores prácticas de Next.js 13+ y React moderno.*