'use client'

import React, { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, BarChart3, Users } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { calculateCompanyTotals } from '@/utils/executiveData'
import { Venta } from '@/types'
import DateComparisonPicker from '../shared/DateComparisonPicker'

interface ResumenFinancieroProps {
  ventas: Venta[]
  ventasComparacion?: Venta[]
  fechaInicio?: string
  fechaFin?: string
  fechaInicioComparacion?: string
  fechaFinComparacion?: string
  onDateRangeChange?: (startDate: string, endDate: string) => void
  onComparisonDateRangeChange?: (startDate: string, endDate: string) => void
  onComparisonToggle?: (enabled: boolean) => void
}

export default function ResumenFinanciero({
  ventas,
  ventasComparacion = [],
  fechaInicio = '',
  fechaFin = '',
  fechaInicioComparacion = '',
  fechaFinComparacion = '',
  onDateRangeChange,
  onComparisonDateRangeChange,
  onComparisonToggle
}: ResumenFinancieroProps) {
  const [comparisonEnabled, setComparisonEnabled] = useState(!!ventasComparacion.length)

  // Initialize dates with current month if not provided
  useEffect(() => {
    if (!fechaInicio || !fechaFin) {
      // Get current date
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')

      // Set default to first day of current month to today
      const fechaInicioDefecto = `${year}-${month}-01`
      const fechaFinDefecto = `${year}-${month}-${day}`

      if (onDateRangeChange) {
        onDateRangeChange(fechaInicioDefecto, fechaFinDefecto)
      }
    }
  }, [fechaInicio, fechaFin, onDateRangeChange])

  // Calcular métricas principales
  const totalVentas = ventas.length
  const montoTotal = ventas.reduce((sum, v) => {
    const valor = typeof v.valor_total === 'number'
      ? v.valor_total
      : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
    return sum + valor
  }, 0)

  const montoMesAnterior = ventasComparacion.reduce((sum, v) => {
    const valor = typeof v.valor_total === 'number'
      ? v.valor_total
      : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
    return sum + valor
  }, 0)


  // Calcular porcentaje de cambio
  const porcentajeCambio = montoMesAnterior > 0
    ? (((montoTotal - montoMesAnterior) / montoMesAnterior) * 100).toFixed(0)
    : '0'

  // Formatear fechas
  const formatearFecha = (fecha: string) => {
    if (!fecha) return ''
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Debug: Ver qué estados están llegando del CRM
  console.log('🔍 ESTADOS DEL CRM RECIBIDOS:')
  const estadosUnicos = [...new Set(ventas.map(v => v.estado_crm))].filter(Boolean)
  estadosUnicos.forEach(estado => {
    const cantidad = ventas.filter(v => v.estado_crm === estado).length
    console.log(`  📊 ${estado}: ${cantidad} ventas`)
  })

  // Calcular estados de ventas basados en los 10 estados COMPLETOS del CRM
  const estadosCompletos = {
    preIngreso: ventas.filter(v => v.estado_crm === 'Pre-ingreso').length,
    validacion: ventas.filter(v => v.estado_crm === 'Validación').length,
    produccion: ventas.filter(v => v.estado_crm === 'Producción').length,
    planificacion: ventas.filter(v => v.estado_crm === 'Planificación').length,
    adquisiciones: ventas.filter(v => v.estado_crm === 'Adquisiciones').length,
    contratos: ventas.filter(v => v.estado_crm === 'Contrato').length,
    confirmacion: ventas.filter(v => v.estado_crm === 'Confirmación de entrega').length,
    despacho: ventas.filter(v => v.estado_crm === 'Despacho').length,
    entregaOk: ventas.filter(v => v.estado_crm === 'Entrega OK').length,
    rechazo: ventas.filter(v => v.estado_crm === 'Rechazo').length
  }

  // Debug: Mostrar resultados de cálculos
  console.log('📈 RESULTADOS DE CARDS SUPERIORES:')
  Object.entries(estadosCompletos).forEach(([key, value]) => {
    console.log(`  ${key}: ${value} ventas`)
  })

  // Datos para el gráfico de estados - Los 10 estados COMPLETOS del CRM
  const estadosData = [
    {
      estado: 'Pre-ingreso',
      cantidad: estadosCompletos.preIngreso,
      color: '#A855F7', // Púrpura
      porcentaje: totalVentas > 0 ? (estadosCompletos.preIngreso / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Validación',
      cantidad: estadosCompletos.validacion,
      color: '#EAB308', // Amarillo
      porcentaje: totalVentas > 0 ? (estadosCompletos.validacion / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Producción',
      cantidad: estadosCompletos.produccion,
      color: '#06B6D4', // Cyan
      porcentaje: totalVentas > 0 ? (estadosCompletos.produccion / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Planificación',
      cantidad: estadosCompletos.planificacion,
      color: '#8B5CF6', // Violeta
      porcentaje: totalVentas > 0 ? (estadosCompletos.planificacion / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Adquisiciones',
      cantidad: estadosCompletos.adquisiciones,
      color: '#F59E0B', // Ámbar
      porcentaje: totalVentas > 0 ? (estadosCompletos.adquisiciones / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Contrato',
      cantidad: estadosCompletos.contratos,
      color: '#3B82F6', // Azul
      porcentaje: totalVentas > 0 ? (estadosCompletos.contratos / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Confirmación de entrega',
      cantidad: estadosCompletos.confirmacion,
      color: '#F97316', // Naranja
      porcentaje: totalVentas > 0 ? (estadosCompletos.confirmacion / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Despacho',
      cantidad: estadosCompletos.despacho,
      color: '#6366F1', // Índigo
      porcentaje: totalVentas > 0 ? (estadosCompletos.despacho / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Entrega OK',
      cantidad: estadosCompletos.entregaOk,
      color: '#10B981', // Verde - ENTREGAS FINALES
      porcentaje: totalVentas > 0 ? (estadosCompletos.entregaOk / totalVentas * 100).toFixed(1) : '0.0'
    },
    {
      estado: 'Rechazo',
      cantidad: estadosCompletos.rechazo,
      color: '#EF4444', // Rojo
      porcentaje: totalVentas > 0 ? (estadosCompletos.rechazo / totalVentas * 100).toFixed(1) : '0.0'
    }
  ]

  // Mostrar TODOS los estados del CRM, incluso los que están en 0
  // Esto asegura que el informe general de ventas esté completo
  const filteredEstados = estadosData // Mostrar todos, no filtrar por cantidad > 0

  // Calcular ventas por empresas usando la utilidad con datos reales
  const companyTotals = calculateCompanyTotals(ventas)
  const companyTotalsComparacion = calculateCompanyTotals(ventasComparacion)

  const ventasChileHome = companyTotals.chilehome.ventas
  const ventasConstrumatter = companyTotals.construmatter.ventas
  const montoChileHome = companyTotals.chilehome.monto
  const montoConstrumatter = companyTotals.construmatter.monto
  const porcentajeChileHome = companyTotals.chilehome.porcentaje
  const porcentajeConstrumatter = companyTotals.construmatter.porcentaje

  // Datos de comparación por empresa
  const ventasChileHomeAnterior = companyTotalsComparacion.chilehome.ventas
  const ventasConstrumatterAnterior = companyTotalsComparacion.construmatter.ventas

  // Determinar períodos para mostrar
  const currentPeriodStart = fechaInicio
  const currentPeriodEnd = fechaFin
  const comparePeriodStart = fechaInicioComparacion
  const comparePeriodEnd = fechaFinComparacion

  return (
    <div className="space-y-6">
      {/* Header with Date Comparison Picker */}
      <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-600/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resumen Financiero
          </h2>

          {/* Ventas Totales centradas a la derecha */}
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/70 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-500/60">
            <div className={`w-8 h-8 bg-gray-600 dark:bg-gray-600/90 flex items-center justify-center rounded-lg shadow-sm`}>
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-200 uppercase tracking-wide">
                Ventas Totales
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {totalVentas}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DateComparisonPicker
            primaryStartDate={fechaInicio}
            primaryEndDate={fechaFin}
            compareStartDate={fechaInicioComparacion}
            compareEndDate={fechaFinComparacion}
            onPrimaryDateChange={onDateRangeChange}
            onCompareDateChange={onComparisonDateRangeChange}
            onComparisonToggle={(enabled) => {
              setComparisonEnabled(enabled)
              onComparisonToggle?.(enabled)
            }}
            enableComparison={comparisonEnabled || !!ventasComparacion.length}
          />
        </div>

        {(currentPeriodStart && currentPeriodEnd) && (
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            <span>
              <strong>Período principal:</strong> {formatearFecha(currentPeriodStart)} - {formatearFecha(currentPeriodEnd)}
            </span>
            {comparePeriodStart && comparePeriodEnd && (
              <span className="ml-4">
                <strong>Comparación:</strong> {formatearFecha(comparePeriodStart)} - {formatearFecha(comparePeriodEnd)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Grid de métricas principales - TRES FICHAS HORIZONTALES */}
      <div className="grid grid-cols-3 gap-4">

        {/* Ventas del mes - DISEÑO ORIGINAL */}
        <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-600/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ventas del mes</h3>
            <DollarSign className="h-6 w-6 text-gray-600" />
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(montoTotal / 1000000).toFixed(1)}M
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Este mes</p>
            </div>

            {/* Comparación con mes anterior */}
            <div className="bg-gray-50 dark:bg-gray-700/80 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {fechaInicioComparacion && fechaFinComparacion ? (
                      <>
                        Mes anterior<br/>
                        <span className="text-xs opacity-75">
                          ({new Date(fechaInicioComparacion + 'T00:00:00').getDate()}-{new Date(fechaFinComparacion + 'T00:00:00').getDate()} {new Date(fechaInicioComparacion + 'T00:00:00').toLocaleDateString('es-CL', { month: 'short' })})
                        </span>
                      </>
                    ) : 'Mes anterior'}
                  </p>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                    ${(montoMesAnterior / 1000000).toFixed(1)}M
                  </p>
                  {ventasComparacion.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                      {ventasComparacion.length} ventas
                    </p>
                  )}
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                  parseFloat(porcentajeCambio) >= 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200'
                    : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200'
                }`}>
                  <span>{parseFloat(porcentajeCambio) >= 0 ? '↗' : '↘'}</span>
                  <span>{Math.abs(parseFloat(porcentajeCambio))}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de líneas por semanas - MEJORADO */}
          <div className="mt-6">
            {(() => {
              // Determinar semana actual basada en la fecha actual
              const hoy = new Date()
              const diaActual = hoy.getDate()
              let semanaActual = 0
              if (diaActual >= 1 && diaActual <= 7) semanaActual = 1
              else if (diaActual >= 8 && diaActual <= 14) semanaActual = 2
              else if (diaActual >= 15 && diaActual <= 21) semanaActual = 3
              else if (diaActual >= 22) semanaActual = 4

              // Calcular ventas por semana para ambos períodos
              const calcularVentasPorSemana = (ventasData: any[], esActual: boolean = false) => {
                const ventasPorSemana = [0, 0, 0, 0] // 4 semanas

                ventasData.forEach(venta => {
                  const fecha = new Date(venta.fecha_venta + 'T00:00:00')
                  const dia = fecha.getDate()
                  const valor = typeof venta.valor_total === 'number'
                    ? venta.valor_total
                    : parseFloat(venta.valor_total?.toString()?.replace(/\D/g, '') || '0')

                  // Determinar semana basada en el día del mes
                  let semana = 0
                  if (dia >= 1 && dia <= 7) semana = 0      // Semana 1
                  else if (dia >= 8 && dia <= 14) semana = 1 // Semana 2
                  else if (dia >= 15 && dia <= 21) semana = 2 // Semana 3
                  else if (dia >= 22) semana = 3             // Semana 4

                  ventasPorSemana[semana] += valor
                })

                return ventasPorSemana
              }

              const ventasActualesSemana = calcularVentasPorSemana(ventas, true)
              const ventasAnterioresSemana = calcularVentasPorSemana(ventasComparacion, false)

              const maxMonto = Math.max(...ventasActualesSemana, ...ventasAnterioresSemana, 1)
              const alturaGrafico = 100
              const baseY = 130

              // Posiciones X para las 4 semanas
              const xPositions = [80, 160, 240, 320]

              return (
                <svg width="100%" height="160" viewBox="0 0 420 160" className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800" preserveAspectRatio="xMidYMid meet">
                  {/* Fondo limpio */}
                  <rect x="0" y="0" width="420" height="160" fill="white" stroke="none" className="dark:fill-gray-800"/>

                  {/* Grid horizontal discreto */}
                  <g stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-gray-600">
                    <line x1="60" y1="40" x2="380" y2="40" />
                    <line x1="60" y1="70" x2="380" y2="70" />
                    <line x1="60" y1="100" x2="380" y2="100" />
                    <line x1="60" y1="130" x2="380" y2="130" />
                  </g>

                  {/* Línea base */}
                  <line x1="60" y1="130" x2="380" y2="130" stroke="#e2e8f0" strokeWidth="2" className="dark:stroke-gray-500"/>

                  {/* Líneas de datos profesionales */}
                  {/* Línea mes anterior (discontinua) */}
                  <g>
                    {ventasAnterioresSemana.map((valor, index) => {
                      const nextIndex = index + 1
                      if (nextIndex >= ventasAnterioresSemana.length) return null

                      const x1 = 100 + (index * 80)
                      const y1 = 130 - (valor / maxMonto) * 80
                      const x2 = 100 + (nextIndex * 80)
                      const y2 = 130 - (ventasAnterioresSemana[nextIndex] / maxMonto) * 80

                      return (
                        <line
                          key={`line-ant-${index}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="5,3"
                        />
                      )
                    })}
                  </g>

                  {/* Línea mes actual (continua) - solo hasta semana actual */}
                  <g>
                    {ventasActualesSemana.map((valor, index) => {
                      const nextIndex = index + 1
                      const semanaNum = index + 1
                      const siguienteSemanaNum = nextIndex + 1

                      if (siguienteSemanaNum > semanaActual || nextIndex >= ventasActualesSemana.length) return null

                      const x1 = 100 + (index * 80)
                      const y1 = 130 - (valor / maxMonto) * 80
                      const x2 = 100 + (nextIndex * 80)
                      const y2 = 130 - (ventasActualesSemana[nextIndex] / maxMonto) * 80

                      return (
                        <line
                          key={`line-act-${index}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                      )
                    })}
                  </g>

                  {/* Puntos de datos mes anterior */}
                  {ventasAnterioresSemana.map((valor, index) => {
                    if (valor === 0) return null
                    const x = 100 + (index * 80)
                    const y = 130 - (valor / maxMonto) * 80
                    return (
                      <g key={`punto-ant-${index}`}>
                        <circle cx={x} cy={y} r="4" fill="#ef4444" stroke="white" strokeWidth="2"/>
                        <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="600">
                          ${(valor / 1000000).toFixed(1)}M
                        </text>
                      </g>
                    )
                  })}

                  {/* Puntos de datos mes actual - solo hasta semana actual */}
                  {ventasActualesSemana.map((valor, index) => {
                    const semanaNum = index + 1
                    if (valor === 0 || semanaNum > semanaActual) return null
                    const x = 100 + (index * 80)
                    const y = 130 - (valor / maxMonto) * 80
                    return (
                      <g key={`punto-act-${index}`}>
                        <circle cx={x} cy={y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2"/>
                        <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="600">
                          ${(valor / 1000000).toFixed(1)}M
                        </text>
                      </g>
                    )
                  })}

                  {/* Etiquetas eje Y */}
                  <g fontSize="10" fill="#6b7280" textAnchor="end">
                    <text x="55" y="45">${(maxMonto / 1000000).toFixed(0)}M</text>
                    <text x="55" y="75">${(maxMonto * 0.67 / 1000000).toFixed(0)}M</text>
                    <text x="55" y="105">${(maxMonto * 0.33 / 1000000).toFixed(0)}M</text>
                    <text x="55" y="135">0</text>
                  </g>

                  {/* Etiquetas de semanas limpias */}
                  <g fontSize="11" textAnchor="middle" fill="#374151" fontWeight="500">
                    {[1, 2, 3, 4].map(semanaNum => {
                      const index = semanaNum - 1
                      const x = 100 + (index * 80)
                      const esFutura = semanaNum > semanaActual

                      return (
                        <text
                          key={`sem-${semanaNum}`}
                          x={x}
                          y="150"
                          fill={esFutura ? "#94a3b8" : "#374151"}
                        >
                          Semana {semanaNum}
                        </text>
                      )
                    })}
                  </g>
                </svg>
              )
            })()}
          </div>

          {/* Leyenda mejorada */}
          <div className="flex justify-between text-sm mt-6 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-1 bg-blue-600 rounded"></div>
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                  MES ACTUAL
                </span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                ${(montoTotal / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Septiembre 2025
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg flex-1">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-6 h-1 bg-red-500 rounded" style={{backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 4px, transparent 4px, transparent 8px)'}}></div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  MES ANTERIOR
                </span>
              </div>
              <div className="text-lg font-bold text-red-600">
                ${(montoMesAnterior / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-red-600 mt-1">
                Agosto 2025
              </div>
            </div>
          </div>

          {/* Indicador de cambio porcentual integrado */}
          <div className={`flex items-center justify-center mt-4 p-3 rounded-lg ${
            parseFloat(porcentajeCambio) >= 0
              ? 'bg-green-50 dark:bg-green-900/30'
              : 'bg-red-50 dark:bg-red-900/30'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                parseFloat(porcentajeCambio) >= 0
                  ? 'bg-green-100 dark:bg-green-800/70'
                  : 'bg-red-100 dark:bg-red-800/70'
              }`}>
                <TrendingUp className={`h-4 w-4 ${
                  parseFloat(porcentajeCambio) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400 rotate-180'
                }`} />
              </div>
              <span className={`text-xl font-bold ${
                parseFloat(porcentajeCambio) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {parseFloat(porcentajeCambio) >= 0 ? '+' : ''}{porcentajeCambio}%
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-300 ml-2">vs mes anterior</p>
          </div>
        </div>

        {/* Distribución por Estados - CON TODOS LOS ESTADOS DEL CRM */}
        <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-600/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribución por Estados</h3>
            <BarChart3 className="h-6 w-6 text-gray-600" />
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                <span className="text-blue-600">
                  {totalVentas}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ventas totales</p>
            </div>

            {/* Lista de TODOS los estados con barras - incluyendo los que tienen 0 ventas */}
            <div className="space-y-3">
              {filteredEstados.map((estado, index) => (
                <div key={estado.estado} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: estado.color }}></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {estado.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {estado.cantidad}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-600/80 px-2 py-1 rounded-lg">
                        {estado.porcentaje}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600/80 rounded-none h-3">
                    <div
                      className="h-3 rounded-none transition-all duration-500"
                      style={{
                        backgroundColor: estado.color,
                        width: `${estado.porcentaje}%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-gray-500 dark:text-gray-300 mt-3 pt-3 border-t border-gray-200 dark:border-gray-500/60">
              {filteredEstados.filter(e => e.cantidad > 0).length} de 10 estados con ventas | Entregas finales: {estadosCompletos.entregaOk}
            </div>
          </div>
        </div>

        {/* Ventas por Empresas - MEJORADO CON COMPARACIÓN */}
        <div className="bg-white dark:bg-gray-800/95 dark:backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 dark:border-gray-600/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ventas por Empresas</h3>
            <Users className="h-6 w-6 text-gray-600" />
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalVentas}
              </div>
            </div>
            <p className="text-lg text-gray-500 dark:text-gray-400 text-center">Total ventas este mes</p>

            {/* Comparación por Empresa con Mes Anterior */}
            <div className="space-y-6">

              {/* ChileHome */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-lg"></div>
                    <span className="text-lg font-semibold text-blue-700 dark:text-blue-400">ChileHome</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{ventasChileHome} ventas</span>
                </div>

                {/* Barras de comparación */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-blue-700">Este mes</span>
                      <span className="text-sm font-bold text-blue-700">${(montoChileHome / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800/60 rounded-lg h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-lg transition-all duration-500"
                        style={{ width: `${Math.max(montoChileHome, companyTotalsComparacion.chilehome.monto) > 0 ? (montoChileHome / Math.max(montoChileHome, companyTotalsComparacion.chilehome.monto)) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-blue-600">Mes anterior</span>
                      <span className="text-sm font-bold text-blue-600">${(companyTotalsComparacion.chilehome.monto / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-blue-200 dark:bg-blue-800/60 rounded-lg h-4">
                      <div
                        className="bg-blue-400 dark:bg-blue-500/80 h-4 rounded-lg transition-all duration-500"
                        style={{
                          width: `${Math.max(montoChileHome, companyTotalsComparacion.chilehome.monto) > 0 ? (companyTotalsComparacion.chilehome.monto / Math.max(montoChileHome, companyTotalsComparacion.chilehome.monto)) * 100 : 0}%`,
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)'
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">{ventasChileHomeAnterior} ventas el mes anterior</div>
                  </div>
                </div>
              </div>

              {/* Construmatter */}
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-600 rounded-lg"></div>
                    <span className="text-lg font-semibold text-purple-700 dark:text-purple-400">Construmatter</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">{ventasConstrumatter} ventas</span>
                </div>

                {/* Barras de comparación */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-purple-700">Este mes</span>
                      <span className="text-sm font-bold text-purple-700">${(montoConstrumatter / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-800/60 rounded-lg h-4">
                      <div
                        className="bg-purple-600 h-4 rounded-lg transition-all duration-500"
                        style={{ width: `${Math.max(montoConstrumatter, companyTotalsComparacion.construmatter.monto) > 0 ? (montoConstrumatter / Math.max(montoConstrumatter, companyTotalsComparacion.construmatter.monto)) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-purple-600">Mes anterior</span>
                      <span className="text-sm font-bold text-purple-600">${(companyTotalsComparacion.construmatter.monto / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="w-full bg-purple-200 dark:bg-purple-800/60 rounded-lg h-4">
                      <div
                        className="bg-purple-400 dark:bg-purple-500/80 h-4 rounded-lg transition-all duration-500"
                        style={{
                          width: `${Math.max(montoConstrumatter, companyTotalsComparacion.construmatter.monto) > 0 ? (companyTotalsComparacion.construmatter.monto / Math.max(montoConstrumatter, companyTotalsComparacion.construmatter.monto)) * 100 : 0}%`,
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px)'
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-purple-600 mt-1">{ventasConstrumatterAnterior} ventas el mes anterior</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}