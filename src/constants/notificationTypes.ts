export interface TipoNotificacion {
  id: string
  nombre: string
  descripcion: string
  frecuencia: string
  ejemplo: string
}

export const TIPOS_NOTIFICACIONES: TipoNotificacion[] = [
  {
    id: 'resumen_diario',
    nombre: 'Resumen Diario',
    descripcion: 'Resumen completo de ventas del día con estadísticas y detalles',
    frecuencia: 'Todos los días a las 08:00',
    ejemplo: '📊 RESUMEN DIARIO - ' + new Date().toLocaleDateString('es-CL') + '\n• 7 ventas nuevas\n• $18.750.000 total\n• Mejor ejecutivo: Ana García (3 ventas)\n• Región top: Metropolitana'
  },
  {
    id: 'resumen_semanal',
    nombre: 'Resumen Semanal',
    descripcion: 'Estadísticas completas de la semana con ranking y análisis',
    frecuencia: 'Domingos a las 09:00',
    ejemplo: '📈 RESUMEN SEMANAL\n• 34 ventas esta semana\n• $89.400.000 total\n🏆 Top ejecutivo: Carlos Ruiz (12 ventas)\n📍 Región líder: Valparaíso\n📊 Promedio: $2.630.000 por venta'
  },
  {
    id: 'nueva_venta_crm',
    nombre: 'Nueva Venta CRM',
    descripcion: 'Notificación inmediata cuando se carga una nueva venta al CRM',
    frecuencia: 'Inmediato al cargar al CRM',
    ejemplo: '🎉 NUEVA VENTA INGRESADA\n👤 Cliente: María López Contreras\n💰 Monto: $2.400.000\n🏠 Modelo: Casa 54m²\n👨‍💼 Ejecutivo: Carlos Ruiz\n📍 Región: Bío Bío'
  },
  {
    id: 'venta_alto_valor',
    nombre: 'Venta Alto Valor',
    descripcion: 'Alerta para ventas que superan el monto crítico configurado',
    frecuencia: 'Inmediato cuando supera límite',
    ejemplo: '🚨 VENTA ALTO VALOR\n💰 $8.500.000 - LÍMITE SUPERADO\n👤 Cliente: Roberto Fernández\n👨‍💼 Ejecutivo: Ana García\n📍 Región: Metropolitana\n⚠️ Requiere supervisión'
  },
  {
    id: 'metas_ejecutivo',
    nombre: 'Metas Ejecutivo',
    descripcion: 'Seguimiento diario del progreso de metas de cada ejecutivo',
    frecuencia: 'Todos los días a las 18:00',
    ejemplo: '🎯 METAS EJECUTIVOS\n👨‍💼 Carlos Ruiz: 8/12 ventas (67%)\n👩‍💼 Ana García: 11/15 ventas (73%)\n👨‍💼 Luis Torres: 5/10 ventas (50%)\n📊 Promedio equipo: 63%'
  }
]

export interface ConfiguracionPersona {
  id: string
  destinatario: string
  destinatario_nombre: string
  rol: string
  activo: boolean
  tipos_notificacion: string[]
  configuracion: {
    incluir_detalles: boolean
    incluir_metricas: boolean
    incluir_links: boolean
  }
}