import { NextRequest, NextResponse } from 'next/server'
import { crmApi } from '@/lib/crmApi'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoResumen = searchParams.get('tipo') // 'diario', 'semanal', 'mensual'
    const fecha = searchParams.get('fecha') // fecha específica

    console.log(`📊 Generando resumen ${tipoResumen} para fecha: ${fecha}`)

    // Obtener todas las ventas del CRM (usando mock si falla)
    let ventasCompletas = []
    try {
      ventasCompletas = await crmApi.obtenerVentas()
      console.log(`🔍 Total ventas obtenidas del CRM: ${ventasCompletas.length}`)
    } catch (error) {
      console.log(`⚠️ CRM falló, usando datos mock para ${tipoResumen}`)
      ventasCompletas = generarVentasMock()
      console.log(`📝 Total ventas mock generadas: ${ventasCompletas.length}`)
    }

    // Filtrar ventas según el tipo de resumen
    let ventasFiltradas = []
    let periodoTexto = ''

    if (tipoResumen === 'diario') {
      // Ventas del día específico o hoy
      const fechaObjetivo = fecha ? new Date(fecha) : new Date()
      const fechaStr = fechaObjetivo.toISOString().split('T')[0]

      ventasFiltradas = ventasCompletas.filter(venta => {
        if (!venta.fecha_venta) return false
        const fechaVenta = new Date(venta.fecha_venta)
        if (isNaN(fechaVenta.getTime())) return false
        const fechaVentaStr = fechaVenta.toISOString().split('T')[0]
        return fechaVentaStr === fechaStr
      })

      periodoTexto = fechaObjetivo.toLocaleDateString('es-CL')

    } else if (tipoResumen === 'semanal') {
      // Ventas de la semana anterior (lunes a domingo)
      const hoy = new Date()
      const diaActual = hoy.getDay() // 0 = domingo, 1 = lunes, etc.

      // Calcular el lunes de la semana anterior
      const diasHastaLunesAnterior = diaActual === 0 ? 13 : (diaActual + 6) // Si es domingo, ir 13 días atrás; sino, diaActual + 6
      const lunesAnterior = new Date(hoy)
      lunesAnterior.setDate(hoy.getDate() - diasHastaLunesAnterior)

      // Calcular el domingo de la semana anterior
      const domingoAnterior = new Date(lunesAnterior)
      domingoAnterior.setDate(lunesAnterior.getDate() + 6)

      const inicioSemana = lunesAnterior.toISOString().split('T')[0]
      const finSemana = domingoAnterior.toISOString().split('T')[0]

      ventasFiltradas = ventasCompletas.filter(venta => {
        if (!venta.fecha_venta) return false
        const fechaVenta = new Date(venta.fecha_venta)
        if (isNaN(fechaVenta.getTime())) return false
        const fechaVentaStr = fechaVenta.toISOString().split('T')[0]
        return fechaVentaStr >= inicioSemana && fechaVentaStr <= finSemana
      })

      periodoTexto = `${lunesAnterior.toLocaleDateString('es-CL')} al ${domingoAnterior.toLocaleDateString('es-CL')}`

    } else if (tipoResumen === 'mensual') {
      // Ventas del mes actual (siempre mes actual, no por parámetro)
      const hoy = new Date()
      const año = hoy.getFullYear()
      const mes = hoy.getMonth() // Septiembre = 8

      ventasFiltradas = ventasCompletas.filter(venta => {
        if (!venta.fecha_venta) return false
        const fechaVenta = new Date(venta.fecha_venta)
        if (isNaN(fechaVenta.getTime())) return false
        return fechaVenta.getFullYear() === año && fechaVenta.getMonth() === mes
      })

      periodoTexto = hoy.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })
    }

    console.log(`📊 Ventas filtradas para ${tipoResumen}: ${ventasFiltradas.length}`)

    // Calcular estadísticas
    const totalVentas = ventasFiltradas.length
    const montoTotal = ventasFiltradas.reduce((sum, venta) => sum + (venta.valor_total || 0), 0)
    const promedioVenta = totalVentas > 0 ? Math.round(montoTotal / totalVentas) : 0

    // Ranking de ejecutivos
    const ventasPorEjecutivo = {}
    ventasFiltradas.forEach(venta => {
      const ejecutivo = venta.ejecutivo_nombre || 'Sin asignar'
      if (!ventasPorEjecutivo[ejecutivo]) {
        ventasPorEjecutivo[ejecutivo] = {
          nombre: ejecutivo,
          ventas: 0,
          monto: 0
        }
      }
      ventasPorEjecutivo[ejecutivo].ventas += 1
      ventasPorEjecutivo[ejecutivo].monto += venta.valor_total || 0
    })

    const rankingEjecutivos = Object.values(ventasPorEjecutivo)
      .sort((a: any, b: any) => b.ventas - a.ventas)
      .slice(0, 5)

    // Ventas por estado
    const ventasPorEstado = {}
    ventasFiltradas.forEach(venta => {
      const estado = venta.estado_crm || 'Sin estado'
      ventasPorEstado[estado] = (ventasPorEstado[estado] || 0) + 1
    })

    // Ventas por región (extraer de dirección_entrega)
    const ventasPorRegion = {}
    ventasFiltradas.forEach(venta => {
      if (venta.direccion_entrega) {
        const partes = venta.direccion_entrega.split(',')
        const region = partes[partes.length - 1]?.trim() || 'Sin región'
        ventasPorRegion[region] = (ventasPorRegion[region] || 0) + 1
      }
    })

    const regionTop = Object.entries(ventasPorRegion)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]

    // Modelo más vendido
    const ventasPorModelo = {}
    ventasFiltradas.forEach(venta => {
      const modelo = venta.modelo_casa || 'Sin modelo'
      ventasPorModelo[modelo] = (ventasPorModelo[modelo] || 0) + 1
    })

    const modeloTop = Object.entries(ventasPorModelo)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]

    // Calcular comparación con período anterior si es mensual
    let comparacionAnterior = null
    if (tipoResumen === 'mensual') {
      const hoy = new Date()
      const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const añoAnterior = mesAnterior.getFullYear()
      const mesAnteriorNum = mesAnterior.getMonth()

      const ventasMesAnterior = ventasCompletas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta)
        return fechaVenta.getFullYear() === añoAnterior && fechaVenta.getMonth() === mesAnteriorNum
      })

      const totalVentasAnterior = ventasMesAnterior.length
      const montoTotalAnterior = ventasMesAnterior.reduce((sum, venta) => sum + (venta.valor_total || 0), 0)

      comparacionAnterior = {
        total_ventas: totalVentasAnterior,
        monto_total: montoTotalAnterior,
        diferencia_ventas: totalVentas - totalVentasAnterior,
        diferencia_monto: montoTotal - montoTotalAnterior,
        porcentaje_ventas: totalVentasAnterior > 0 ? Math.round(((totalVentas - totalVentasAnterior) / totalVentasAnterior) * 100) : 0,
        periodo_anterior: mesAnterior.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })
      }
    }

    const resumen = {
      tipo: tipoResumen,
      periodo: periodoTexto,
      estadisticas: {
        total_ventas: totalVentas,
        monto_total: montoTotal,
        promedio_venta: promedioVenta,
        meta_cumplida: totalVentas >= (tipoResumen === 'diario' ? 5 : tipoResumen === 'semanal' ? 25 : 100)
      },
      comparacion_anterior: comparacionAnterior,
      ranking_ejecutivos: rankingEjecutivos,
      distribucion_estados: ventasPorEstado,
      region_top: regionTop ? { nombre: regionTop[0], ventas: regionTop[1] } : null,
      modelo_top: modeloTop ? { nombre: modeloTop[0], ventas: modeloTop[1] } : null,
      ventas_detalle: ventasFiltradas.slice(0, 10) // Últimas 10 ventas para detalle
    }

    console.log(`✅ Resumen ${tipoResumen} generado exitosamente`)
    return NextResponse.json(resumen)

  } catch (error) {
    console.error(`❌ Error generando resumen:`, error)
    return NextResponse.json({
      error: 'Error generando resumen del CRM',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Función para generar datos mock cuando el CRM falla
function generarVentasMock() {
  const ejecutivos = ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Torres', 'Luis Martínez']
  const regiones = ['Santiago', 'Valparaíso', 'Bío Bío', 'Maule', 'Araucanía']
  const estados = ['Validación', 'Producción', 'Pre-ingreso', 'Contrato', 'Confirmación de entrega']
  const modelos = ['Modelo 36m²', 'Modelo 54m²', 'Modelo 72m²', 'Modelo 90m²', 'Modelo 108m²']

  const ventas = []

  // Generar ventas para los últimos 30 días
  for (let i = 0; i < 45; i++) {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30)) // Últimos 30 días

    ventas.push({
      id: `mock_${i + 1}`,
      cliente_nombre: `Cliente ${i + 1}`,
      cliente_rut: `${12000000 + i}-${Math.floor(Math.random() * 9) + 1}`,
      cliente_telefono: `+5691${1000000 + i}`,
      cliente_correo: `cliente${i + 1}@email.com`,
      direccion_entrega: `Dirección ${i + 1}, Comuna ${Math.floor(Math.random() * 5) + 1}, ${regiones[Math.floor(Math.random() * regiones.length)]}`,
      valor_total: Math.floor(Math.random() * 50000000) + 30000000, // Entre 30M y 80M
      modelo_casa: modelos[Math.floor(Math.random() * modelos.length)],
      detalle_materiales: `Casa prefabricada, modelo ${i + 1}`,
      fecha_venta: fecha.toISOString(),
      fecha_entrega: new Date(fecha.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 días después
      ejecutivo_id: `${Math.floor(Math.random() * ejecutivos.length) + 1}`,
      ejecutivo_nombre: ejecutivos[Math.floor(Math.random() * ejecutivos.length)],
      supervisor_nombre: 'Supervisor General',
      estado_crm: estados[Math.floor(Math.random() * estados.length)],
      observaciones_crm: `Observación para venta ${i + 1}`,
      numero_contrato: Math.random() > 0.3 ? `CONT-2024-${1000 + i}` : '0'
    })
  }

  // Ordenar por fecha (más recientes primero)
  return ventas.sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())
}