# 📊 SISTEMA DE REPORTES AUTOMÁTICOS PARA GUILLERMO DÍAZ

## 🎯 Descripción General

Sistema de notificaciones automáticas por WhatsApp para Guillermo Díaz (Dueño de ChileHome), con reportes personalizados por área de negocio.

### 📱 Destinatario Configurado
- **Número:** +56 9 6334 8909
- **Rol:** Dueño/Director General
- **Propósito:** Supervisión ejecutiva de todas las áreas

## 📅 Programación de Reportes

### 1. REPORTE SEMANAL DE CONTRATOS
- **Frecuencia:** Domingos 19:00 hrs
- **Área:** Contratos
- **Contenido:**
  - Lista completa de contratos de la semana
  - Nombre de cliente y dirección de entrega
  - Modelo de casa y valor
  - Links directos a cada contrato online
  - Métricas de crecimiento
  - Estado de cada contrato
  - Rendimiento por ejecutivo
  - Alertas de contratos pendientes

**Ejemplo del mensaje:**
```
📊 REPORTE SEMANAL DE CONTRATOS
Para: Guillermo Díaz - Dueño ChileHome
Período: 08/09/2025 - 15/09/2025

💼 RESUMEN EJECUTIVO
• Total Contratos: 12
• Valor Total: $28,500,000
• Valor Promedio: $2,375,000
• Crecimiento vs semana anterior: +15.2%

📋 ESTADO DE CONTRATOS
• ✅ Validado: 8 (67%)
• 📤 Enviado: 3 (25%)
• 🔍 En Validación: 1 (8%)

📝 DETALLE DE CONTRATOS
1. CH-2025-0156
   👤 María González
   📍 Av. Principal 123, Santiago
   🏠 72M2 6A
   💰 $2,400,000
   📅 Entrega: 27/09/2025
   🔗 Ver: http://localhost:3000/contrato/156

... y más contratos con detalles completos
```

### 2. REPORTE DIARIO DE VENTAS
- **Frecuencia:** Diario 20:00 hrs
- **Área:** Ventas
- **Contenido:**
  - Resumen de ventas del día
  - Nuevos contratos generados
  - Cumplimiento de metas diarias
  - Mejor ejecutivo del día

### 3. REPORTE FINANCIERO MENSUAL
- **Frecuencia:** Primer lunes del mes 09:00 hrs
- **Área:** Finanzas
- **Contenido:**
  - Ingresos totales del mes
  - Distribución por formas de pago
  - Proyecciones y cumplimiento de metas
  - Análisis de rentabilidad

## 🛠️ Configuración Técnica

### APIs Disponibles

#### 1. Vista Previa de Reportes
```bash
# Reporte semanal (vista previa)
GET /api/reportes-guillermo?tipo=semanal&test=true

# Reporte diario (vista previa)
GET /api/reportes-guillermo?tipo=diario&test=true
```

#### 2. Envío Manual de Reportes
```bash
# Enviar reporte semanal ahora
GET /api/reportes-guillermo?tipo=semanal

# Enviar reporte diario ahora
GET /api/reportes-guillermo?tipo=diario
```

#### 3. Configuración del Sistema
```bash
# Ver configuración actual
GET /api/reportes-guillermo?tipo=configuracion

# Ejecutar todos los reportes programados
GET /api/reportes-guillermo?tipo=ejecutar_programados
```

### Automatización con Cron Jobs

#### Endpoint para Cron
```
GET /api/cron/reportes
Headers: Authorization: Bearer chilehome-cron-2025
```

#### Configuración Recomendada
- **Frecuencia:** Cada hora
- **Servicio:** Vercel Cron, GitHub Actions, o servicio externo
- **Comando:** `curl -H "Authorization: Bearer chilehome-cron-2025" https://tu-dominio.com/api/cron/reportes`

## 📋 Personalización por Área

### Contratos
- **Información incluida:**
  - Número de contrato
  - Datos del cliente (nombre, dirección)
  - Modelo de casa y especificaciones
  - Valor y forma de pago
  - Estado actual del contrato
  - Link directo al contrato online
  - Fecha de entrega programada

### Ventas
- **Métricas incluidas:**
  - Número de ventas del día/período
  - Valor total de ventas
  - Cumplimiento vs metas
  - Rendimiento por ejecutivo
  - Zonas geográficas más activas

### Finanzas
- **Reportes financieros:**
  - Ingresos por período
  - Distribución de formas de pago
  - Análisis de flujo de caja
  - Proyecciones de crecimiento

## 🔧 Mantenimiento y Configuración

### Modificar Horarios
Para cambiar los horarios de envío, editar en:
```
src/lib/notificacionesProgramadas.ts
```

### Agregar Nuevos Reportes
1. Crear función generadora en `notificacionesProgramadas.ts`
2. Agregar configuración en `REPORTES_GUILLERMO`
3. Actualizar endpoint en `api/reportes-guillermo`

### Cambiar Destinatario
Actualizar variables en `.env.local`:
```
WHATSAPP_GUILLERMO_DIAZ=+56963348909
```

## 📊 Métricas y KPIs Incluidos

### Contratos
- Total de contratos por período
- Valor total y promedio
- Crecimiento vs período anterior
- Distribución por estado
- Modelos más vendidos
- Rendimiento por ejecutivo
- Alertas de contratos pendientes

### Operacional
- Contratos sin validar
- Entregas programadas
- Problemas de documentación
- Retrasos en procesos

### Financiero
- Ingresos por período
- Formas de pago utilizadas
- Cumplimiento de metas
- Proyecciones de ingresos

## 🚨 Alertas Especiales

El sistema incluye alertas automáticas para:
- Contratos pendientes de validación por más de 48 horas
- Contratos sin fecha de entrega asignada
- Caída significativa en ventas diarias
- Problemas en el flujo de trabajo

## 📱 Formato de Mensajes

- **Emojis:** Para fácil identificación visual
- **Estructura clara:** Resumen ejecutivo + detalles
- **Links directos:** Acceso inmediato al sistema
- **Métricas clave:** Información accionable
- **Timestamp:** Hora de generación del reporte

## 🔐 Seguridad

- **Autenticación:** Token secreto para cron jobs
- **Acceso restringido:** Solo número configurado de Guillermo
- **Logs:** Registro de envíos exitosos/fallidos
- **Backup:** Configuraciones respaldadas en base de datos

## 📞 Soporte y Contacto

Para modificaciones o problemas:
1. Revisar logs en consola del servidor
2. Verificar configuración de WhatsApp Business
3. Comprobar variables de entorno
4. Validar conectividad con Supabase

---

*Sistema desarrollado para ChileHome - Automatización de reportes ejecutivos*