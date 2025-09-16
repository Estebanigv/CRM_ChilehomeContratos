import { createClient } from '@supabase/supabase-js'
import { notificarGuillermoDiaz } from './whatsappRoles'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ConfiguracionReporte {
  id?: string
  destinatario: string
  destinatario_nombre: string
  area: 'contratos' | 'ventas' | 'produccion' | 'logistica' | 'finanzas'
  tipo_reporte: string
  frecuencia: 'diaria' | 'semanal' | 'mensual'
  dia_semana?: number // 0=domingo, 1=lunes, etc.
  hora: string // formato HH:MM
  activo: boolean
  configuracion: {
    incluir_detalles?: boolean
    incluir_links?: boolean
    incluir_metricas?: boolean
    filtros?: any
  }
  ultima_ejecucion?: string
  created_at?: string
}

// Configuraciones predefinidas para Guillermo Díaz
export const REPORTES_GUILLERMO: ConfiguracionReporte[] = [
  {
    destinatario: '+56963348909',
    destinatario_nombre: 'Guillermo Díaz',
    area: 'contratos',
    tipo_reporte: 'resumen_semanal_contratos',
    frecuencia: 'semanal',
    dia_semana: 0, // Domingo
    hora: '19:00',
    activo: true,
    configuracion: {
      incluir_detalles: true,
      incluir_links: true,
      incluir_metricas: true,
      filtros: {
        estados: ['validado', 'enviado', 'validacion'],
        fecha_desde: 'ultima_semana'
      }
    }
  },
  {
    destinatario: '+56963348909',
    destinatario_nombre: 'Guillermo Díaz',
    area: 'ventas',
    tipo_reporte: 'metricas_ventas_diarias',
    frecuencia: 'diaria',
    hora: '20:00',
    activo: true,
    configuracion: {
      incluir_metricas: true,
      filtros: {
        fecha: 'hoy'
      }
    }
  },
  {
    destinatario: '+56963348909',
    destinatario_nombre: 'Guillermo Díaz',
    area: 'finanzas',
    tipo_reporte: 'resumen_financiero_mensual',
    frecuencia: 'mensual',
    dia_semana: 1, // Primer lunes del mes
    hora: '09:00',
    activo: true,
    configuracion: {
      incluir_metricas: true,
      incluir_detalles: true
    }
  }
]

/**
 * Genera reporte semanal de contratos para Guillermo Díaz
 */
export async function generarReporteContratos(fechaInicio: Date, fechaFin: Date) {
  // Obtener contratos de la semana
  const { data: contratos, error } = await supabase
    .from('contratos')
    .select(`
      *,
      cliente:clientes(*),
      formas_pago:formas_pago(*),
      planos:planos_adjuntos(*)
    `)
    .gte('created_at', fechaInicio.toISOString())
    .lte('created_at', fechaFin.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw error

  const totalContratos = contratos?.length || 0
  const valorTotal = contratos?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0
  const valorPromedio = totalContratos > 0 ? Math.round(valorTotal / totalContratos) : 0

  // Agrupar por estado
  const porEstado = contratos?.reduce((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Agrupar por modelo
  const porModelo = contratos?.reduce((acc, c) => {
    const modelo = c.modelo_casa || 'Sin modelo'
    acc[modelo] = (acc[modelo] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Top ejecutivos
  const porEjecutivo = contratos?.reduce((acc, c) => {
    const ejecutivo = c.ejecutivo_nombre || 'Sin asignar'
    if (!acc[ejecutivo]) {
      acc[ejecutivo] = { cantidad: 0, valor: 0 }
    }
    acc[ejecutivo].cantidad++
    acc[ejecutivo].valor += c.valor_total || 0
    return acc
  }, {} as Record<string, { cantidad: number, valor: number }>) || {}

  const mensaje = `
📊 *REPORTE SEMANAL DE CONTRATOS*
_Para: Guillermo Díaz - Dueño ChileHome_
_Período: ${fechaInicio.toLocaleDateString('es-CL')} - ${fechaFin.toLocaleDateString('es-CL')}_

💼 *RESUMEN EJECUTIVO*
• Total Contratos: ${totalContratos}
• Valor Total: $${valorTotal.toLocaleString('es-CL')}
• Valor Promedio: $${valorPromedio.toLocaleString('es-CL')}
• Crecimiento vs semana anterior: ${await calcularCrecimiento(fechaInicio)}

📋 *ESTADO DE CONTRATOS*
${Object.entries(porEstado).map(([estado, cantidad]) =>
  `• ${formatearEstado(estado)}: ${cantidad} (${Math.round(cantidad * 100 / totalContratos)}%)`
).join('\n')}

🏠 *MODELOS MÁS VENDIDOS*
${Object.entries(porModelo)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3)
  .map(([modelo, cantidad]) => `• ${modelo}: ${cantidad} unidades`)
  .join('\n')}

👥 *RENDIMIENTO EJECUTIVOS*
${Object.entries(porEjecutivo)
  .sort((a, b) => b[1].valor - a[1].valor)
  .slice(0, 3)
  .map(([nombre, data]) =>
    `• ${nombre}: ${data.cantidad} contratos ($${data.valor.toLocaleString('es-CL')})`
  )
  .join('\n')}

📝 *DETALLE DE CONTRATOS*
${contratos?.slice(0, 10).map((c, i) => `
${i + 1}. *${c.numero || 'Sin número'}*
   👤 ${c.cliente?.nombre || 'Sin cliente'}
   📍 ${c.cliente?.direccion_entrega || 'Sin dirección'}
   🏠 ${c.modelo_casa || 'Sin modelo'}
   💰 $${c.valor_total?.toLocaleString('es-CL') || '0'}
   📅 Entrega: ${c.fecha_entrega || 'Sin fecha'}
   🔗 Ver: ${process.env.NEXTAUTH_URL}/contrato/${c.id}
`).join('') || 'No hay contratos'}

${totalContratos > 10 ? `\n_... y ${totalContratos - 10} contratos más_` : ''}

⚠️ *ALERTAS*
• Pendientes validación: ${porEstado['validacion'] || 0}
• En borrador: ${porEstado['borrador'] || 0}
• Contratos sin fecha entrega: ${contratos?.filter(c => !c.fecha_entrega).length || 0}

📊 *Ver dashboard completo:* ${process.env.NEXTAUTH_URL}/dashboard

---
_Reporte generado automáticamente el ${new Date().toLocaleString('es-CL')}_
_Sistema ChileHome Contratos_
  `.trim()

  return mensaje
}

/**
 * Genera reporte diario de ventas
 */
export async function generarReporteVentasDiarias() {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000)

  const { data: contratos } = await supabase
    .from('contratos')
    .select('*, cliente:clientes(*)')
    .gte('created_at', inicioHoy.toISOString())
    .lt('created_at', finHoy.toISOString())

  const totalVentas = contratos?.length || 0
  const valorTotal = contratos?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0

  const mensaje = `
📈 *REPORTE DIARIO DE VENTAS*
_${hoy.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}_

💰 *RESUMEN DEL DÍA*
• Nuevos contratos: ${totalVentas}
• Valor total: $${valorTotal.toLocaleString('es-CL')}
• Meta diaria: ${calcularMetaDiaria()}
• Cumplimiento: ${calcularPorcentajeMeta(valorTotal)}

${totalVentas > 0 ? `
📋 *CONTRATOS DE HOY*
${contratos?.map((c, i) => `
${i + 1}. ${c.cliente?.nombre} - $${c.valor_total?.toLocaleString('es-CL')}
   Ejecutivo: ${c.ejecutivo_nombre}
`).join('') || ''}
` : '📝 No hay nuevos contratos hoy'}

---
_Reporte automático diario 20:00 hrs_
  `.trim()

  return mensaje
}

/**
 * Ejecuta reportes programados
 */
export async function ejecutarReportesProgramados() {
  const ahora = new Date()
  const diaSemana = ahora.getDay()
  const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`

  // Obtener configuraciones activas
  const { data: configuraciones, error } = await supabase
    .from('configuraciones_reportes')
    .select('*')
    .eq('activo', true)

  if (error) {
    console.error('Error obteniendo configuraciones:', error)
    return
  }

  // Si no hay configuraciones en BD, usar las predefinidas
  const configs = configuraciones?.length ? configuraciones : REPORTES_GUILLERMO

  for (const config of configs) {
    let debeEjecutar = false

    // Verificar si debe ejecutarse según frecuencia
    if (config.frecuencia === 'diaria') {
      debeEjecutar = config.hora === horaActual
    } else if (config.frecuencia === 'semanal') {
      debeEjecutar = config.dia_semana === diaSemana && config.hora === horaActual
    } else if (config.frecuencia === 'mensual') {
      const diaDelMes = ahora.getDate()
      const primerLunes = obtenerPrimerLunesDelMes(ahora)
      debeEjecutar = diaDelMes === primerLunes && config.hora === horaActual
    }

    if (debeEjecutar) {
      try {
        await ejecutarReporte(config)

        // Actualizar última ejecución
        await supabase
          .from('configuraciones_reportes')
          .update({ ultima_ejecucion: ahora.toISOString() })
          .eq('id', config.id)

        console.log(`✅ Reporte ${config.tipo_reporte} enviado a ${config.destinatario_nombre}`)
      } catch (error) {
        console.error(`❌ Error ejecutando reporte ${config.tipo_reporte}:`, error)
      }
    }
  }
}

/**
 * Ejecuta un reporte específico
 */
async function ejecutarReporte(config: ConfiguracionReporte) {
  let mensaje = ''

  switch (config.tipo_reporte) {
    case 'resumen_semanal_contratos':
      const fechaFin = new Date()
      const fechaInicio = new Date(fechaFin.getTime() - 7 * 24 * 60 * 60 * 1000)
      mensaje = await generarReporteContratos(fechaInicio, fechaFin)
      break

    case 'metricas_ventas_diarias':
      mensaje = await generarReporteVentasDiarias()
      break

    case 'resumen_financiero_mensual':
      mensaje = await generarReporteFinancieroMensual()
      break

    default:
      throw new Error(`Tipo de reporte no soportado: ${config.tipo_reporte}`)
  }

  // Enviar por WhatsApp
  return await notificarGuillermoDiaz(mensaje)
}

// Funciones auxiliares
function formatearEstado(estado: string): string {
  const estados: Record<string, string> = {
    'borrador': '📝 Borrador',
    'validacion': '🔍 En Validación',
    'validado': '✅ Validado',
    'enviado': '📤 Enviado'
  }
  return estados[estado] || estado
}

async function calcularCrecimiento(fechaInicio: Date): Promise<string> {
  const semanaAnterior = new Date(fechaInicio.getTime() - 7 * 24 * 60 * 60 * 1000)

  const { data: semanaActual } = await supabase
    .from('contratos')
    .select('valor_total')
    .gte('created_at', fechaInicio.toISOString())

  const { data: semanaPrevia } = await supabase
    .from('contratos')
    .select('valor_total')
    .gte('created_at', semanaAnterior.toISOString())
    .lt('created_at', fechaInicio.toISOString())

  const valorActual = semanaActual?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0
  const valorPrevio = semanaPrevia?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0

  if (valorPrevio === 0) return 'N/A'

  const crecimiento = ((valorActual - valorPrevio) / valorPrevio) * 100
  const signo = crecimiento >= 0 ? '+' : ''
  return `${signo}${crecimiento.toFixed(1)}%`
}

function calcularMetaDiaria(): string {
  // Meta mensual ejemplo: $50M, dividido en 30 días
  const metaMensual = 50000000
  const metaDiaria = metaMensual / 30
  return `$${metaDiaria.toLocaleString('es-CL')}`
}

function calcularPorcentajeMeta(valorActual: number): string {
  const metaDiaria = 50000000 / 30
  const porcentaje = (valorActual / metaDiaria) * 100
  return `${porcentaje.toFixed(1)}%`
}

function obtenerPrimerLunesDelMes(fecha: Date): number {
  const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
  const diaSemana = primerDia.getDay()
  const diasHastaPrimerLunes = diaSemana === 0 ? 1 : 8 - diaSemana
  return diasHastaPrimerLunes
}

async function generarReporteFinancieroMensual(): Promise<string> {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const { data: contratos } = await supabase
    .from('contratos')
    .select('*, formas_pago:formas_pago(*)')
    .gte('created_at', inicioMes.toISOString())

  const ingresosMes = contratos?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0

  return `
💰 *REPORTE FINANCIERO MENSUAL*
_${ahora.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}_

📊 *INGRESOS*
• Total del mes: $${ingresosMes.toLocaleString('es-CL')}
• Contratos cerrados: ${contratos?.length || 0}
• Ticket promedio: $${contratos?.length ? Math.round(ingresosMes / contratos.length).toLocaleString('es-CL') : '0'}

💳 *FORMAS DE PAGO*
${await obtenerDistribucionPagos(contratos || [])}

📈 *PROYECCIÓN*
• Meta mensual: $50,000,000
• Cumplimiento: ${Math.round((ingresosMes / 50000000) * 100)}%
• Días restantes: ${30 - ahora.getDate()}

---
_Reporte financiero automático_
  `.trim()
}

async function obtenerDistribucionPagos(contratos: any[]): Promise<string> {
  const distribucion: Record<string, number> = {}

  contratos.forEach(contrato => {
    if (contrato.formas_pago) {
      contrato.formas_pago.forEach((fp: any) => {
        distribucion[fp.tipo] = (distribucion[fp.tipo] || 0) + fp.monto
      })
    }
  })

  return Object.entries(distribucion)
    .map(([tipo, monto]) => `• ${tipo}: $${monto.toLocaleString('es-CL')}`)
    .join('\n') || '• Sin datos de formas de pago'
}