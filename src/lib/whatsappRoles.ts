import whatsappService from './whatsappService'

// Números configurados para pruebas/producción
const NUMEROS = {
  GUILLERMO_DIAZ: process.env.WHATSAPP_GUILLERMO_DIAZ || '+56963348909',
  SUPERVISOR: process.env.WHATSAPP_SUPERVISOR || '+56963348909',
  TRANSPORTISTA: process.env.WHATSAPP_TRANSPORTISTA || '+56963348909',
  TEST: process.env.WHATSAPP_TEST_NUMBER || '+56963348909'
}

/**
 * Envía notificación a Guillermo Díaz (Dueño)
 */
export async function notificarGuillermoDiaz(mensaje: string) {
  const mensajeCompleto = `
👔 *MENSAJE PARA GUILLERMO DÍAZ*
_Dueño - ChileHome_

${mensaje}

---
_Enviado: ${new Date().toLocaleString('es-CL')}_
  `.trim()

  return whatsappService.sendTextMessage(NUMEROS.GUILLERMO_DIAZ, mensajeCompleto)
}

/**
 * Envía resumen semanal a Guillermo Díaz
 */
export async function enviarResumenSemanalGuillermo(contratos: any[]) {
  const totalContratos = contratos.length
  const valorTotal = contratos.reduce((sum, c) => sum + (c.valor_total || 0), 0)
  const porEstado = contratos.reduce((acc, c) => {
    acc[c.estado] = (acc[c.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const mensaje = `
📊 *RESUMEN SEMANAL - GUILLERMO DÍAZ*
_Semana ${obtenerSemanaActual()}_

📈 *Métricas Generales*
• Total Contratos: ${totalContratos}
• Valor Total: $${valorTotal.toLocaleString('es-CL')}
• Promedio por Contrato: $${Math.round(valorTotal / totalContratos).toLocaleString('es-CL')}

📋 *Estado de Contratos*
${Object.entries(porEstado).map(([estado, cantidad]) =>
  `• ${formatearEstado(estado)}: ${cantidad} (${Math.round(cantidad * 100 / totalContratos)}%)`
).join('\n')}

🏆 *Top 5 Contratos por Valor*
${contratos
  .sort((a, b) => b.valor_total - a.valor_total)
  .slice(0, 5)
  .map((c, i) => `${i + 1}. ${c.cliente?.nombre || 'Sin cliente'} - $${c.valor_total?.toLocaleString('es-CL')}`)
  .join('\n')}

📍 *Distribución por Modelo*
${obtenerDistribucionModelos(contratos)}

💼 *Rendimiento Ejecutivos*
${obtenerRendimientoEjecutivos(contratos)}

⚠️ *Requieren Atención*
• Pendientes de validación: ${porEstado['validacion'] || 0}
• En borrador: ${porEstado['borrador'] || 0}

---
_Reporte automático generado el ${new Date().toLocaleDateString('es-CL')}_
  `.trim()

  return notificarGuillermoDiaz(mensaje)
}

/**
 * Envía notificación a Supervisor
 */
export async function notificarSupervisor(contrato: any) {
  const mensaje = `
🔍 *VALIDACIÓN REQUERIDA - SUPERVISOR*

📋 *Contrato:* ${contrato.numero || 'Sin número'}
👤 *Cliente:* ${contrato.cliente?.nombre || 'Sin nombre'}
📞 *Teléfono:* ${contrato.cliente?.telefono || 'Sin teléfono'}
🏠 *Modelo:* ${contrato.modelo_casa}
💰 *Valor:* $${contrato.valor_total?.toLocaleString('es-CL')}
📅 *Fecha Entrega:* ${contrato.fecha_entrega}
👔 *Ejecutivo:* ${contrato.ejecutivo_nombre}

📝 *Observaciones:*
${contrato.observaciones || 'Sin observaciones'}

⚡ *Acciones Requeridas:*
1. Revisar términos del contrato
2. Validar precio y condiciones
3. Aprobar o rechazar con observaciones

🔗 *Ver en sistema:* http://localhost:3000/contrato/${contrato.id}

---
_Notificación automática_
  `.trim()

  return whatsappService.sendTextMessage(NUMEROS.SUPERVISOR, mensaje)
}

/**
 * Envía notificación a Transportista
 */
export async function notificarTransportista(entrega: {
  contrato: any,
  fecha: string,
  direccion: string,
  contacto: string
}) {
  const mensaje = `
🚚 *NUEVA ENTREGA PROGRAMADA*

📦 *Detalles de Entrega*
📋 Contrato: ${entrega.contrato.numero}
📅 Fecha: ${entrega.fecha}
📍 Dirección: ${entrega.direccion}
👤 Cliente: ${entrega.contrato.cliente?.nombre}
📞 Contacto: ${entrega.contacto}

🏠 *Producto*
• Modelo: ${entrega.contrato.modelo_casa}
• Materiales: ${entrega.contrato.materiales?.length || 0} items

⚠️ *Instrucciones Especiales*
${entrega.contrato.observaciones || 'Ninguna'}

📱 *Confirmar recepción respondiendo:*
• "OK" - Entrega confirmada
• "PROBLEMA" - Reportar inconveniente

---
_Por favor confirmar recepción_
  `.trim()

  return whatsappService.sendTextMessage(NUMEROS.TRANSPORTISTA, mensaje)
}

/**
 * Simula notificación a José Luis Andraca
 */
export async function notificarJoseLuisAndraca(mensaje: string) {
  const mensajeCompleto = `
👤 *MENSAJE PARA JOSÉ LUIS ANDRACA*
_Ejecutivo de Ventas_

${mensaje}

---
_Sistema ChileHome Contratos_
  `.trim()

  return whatsappService.sendTextMessage(NUMEROS.TEST, mensajeCompleto)
}

/**
 * Envía mensaje de prueba simulando diferentes roles
 */
export async function enviarMensajePrueba(rol: 'guillermo' | 'supervisor' | 'transportista' | 'ejecutivo') {
  const contratoEjemplo = {
    id: 'test-123',
    numero: 'CH-2025-TEST',
    cliente: {
      nombre: 'Cliente de Prueba',
      telefono: '+56 9 1234 5678'
    },
    modelo_casa: '72M2 6A',
    valor_total: 2400000,
    fecha_entrega: '27/09/2025',
    ejecutivo_nombre: 'José Luis Andraca',
    observaciones: 'Entrega urgente - Cliente VIP',
    estado: 'validacion',
    materiales: [
      { item: 'Paneles', cantidad: 20 },
      { item: 'Cerchas', cantidad: 15 }
    ]
  }

  switch (rol) {
    case 'guillermo':
      return enviarResumenSemanalGuillermo([contratoEjemplo, contratoEjemplo, contratoEjemplo])

    case 'supervisor':
      return notificarSupervisor(contratoEjemplo)

    case 'transportista':
      return notificarTransportista({
        contrato: contratoEjemplo,
        fecha: '27/09/2025',
        direccion: 'Av. Principal 123, Santiago',
        contacto: '+56 9 1234 5678'
      })

    case 'ejecutivo':
      return notificarJoseLuisAndraca(`
Nuevo contrato asignado:
• Cliente: ${contratoEjemplo.cliente.nombre}
• Valor: $${contratoEjemplo.valor_total.toLocaleString('es-CL')}
• Estado: Pendiente de validación

Por favor revisar y completar la documentación.
      `)

    default:
      return { success: false, error: 'Rol no válido' }
  }
}

// Funciones auxiliares
function obtenerSemanaActual(): string {
  const ahora = new Date()
  const inicio = new Date(ahora.getFullYear(), 0, 1)
  const dias = Math.floor((ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
  const semana = Math.ceil((dias + inicio.getDay() + 1) / 7)
  return `${semana}/${ahora.getFullYear()}`
}

function formatearEstado(estado: string): string {
  const estados: Record<string, string> = {
    'borrador': '📝 Borrador',
    'validacion': '🔍 Validación',
    'validado': '✅ Validado',
    'enviado': '📤 Enviado'
  }
  return estados[estado] || estado
}

function obtenerDistribucionModelos(contratos: any[]): string {
  const modelos = contratos.reduce((acc, c) => {
    const modelo = c.modelo_casa || 'Sin modelo'
    acc[modelo] = (acc[modelo] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(modelos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([modelo, cantidad]) => `• ${modelo}: ${cantidad}`)
    .join('\n')
}

function obtenerRendimientoEjecutivos(contratos: any[]): string {
  const ejecutivos = contratos.reduce((acc, c) => {
    const ejecutivo = c.ejecutivo_nombre || 'Sin asignar'
    if (!acc[ejecutivo]) {
      acc[ejecutivo] = { cantidad: 0, valor: 0 }
    }
    acc[ejecutivo].cantidad++
    acc[ejecutivo].valor += c.valor_total || 0
    return acc
  }, {} as Record<string, { cantidad: number, valor: number }>)

  return Object.entries(ejecutivos)
    .sort((a, b) => b[1].valor - a[1].valor)
    .slice(0, 3)
    .map(([nombre, data]) =>
      `• ${nombre}: ${data.cantidad} contratos ($${data.valor.toLocaleString('es-CL')})`
    )
    .join('\n')
}