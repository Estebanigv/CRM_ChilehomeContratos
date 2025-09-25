'use client'

import React from 'react'
import {
  BarChart3, Users, TrendingUp, ArrowUpRight, DollarSign,
  Clock, CheckCircle, AlertTriangle, Calendar
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { Venta } from '@/types'

interface MetricasSectionProps {
  ventas: Venta[]
  loading: boolean
}

interface MetricaCard {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: {
    value: number
    label: string
  }
}

export default function MetricasSection({ ventas, loading }: MetricasSectionProps) {
  const calcularMetricas = (): MetricaCard[] => {
    if (!ventas.length) return []

    const totalVentas = ventas.length
    const montoTotal = ventas.reduce((sum, v) => {
      const valor = typeof v.valor_total === 'number'
        ? v.valor_total
        : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
      return sum + valor
    }, 0)

    const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0

    const ventasPendientes = ventas.filter(v =>
      v.estado_crm?.toLowerCase().includes('pendiente') || !v.numero_contrato
    ).length

    const ventasCompletadas = ventas.filter(v =>
      v.estado_crm?.toLowerCase().includes('completad') ||
      v.estado_crm?.toLowerCase().includes('entrega ok')
    ).length

    const ejecutivosUnicos = new Set(
      ventas.map(v => v.ejecutivo_nombre).filter(Boolean)
    ).size

    // Calcular ventas del mes actual
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    const ventasEsteMes = ventas.filter(v =>
      new Date(v.fecha_venta) >= inicioMes
    ).length

    // Calcular ventas del mes anterior para tendencia
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
    const ventasMesAnterior = ventas.filter(v => {
      const fecha = new Date(v.fecha_venta)
      return fecha >= inicioMesAnterior && fecha <= finMesAnterior
    }).length

    const tendenciaVentas = ventasMesAnterior > 0
      ? ((ventasEsteMes - ventasMesAnterior) / ventasMesAnterior) * 100
      : 0

    return [
      {
        title: 'Total Ventas',
        value: totalVentas,
        subtitle: 'ventas registradas',
        icon: <BarChart3 className="h-8 w-8" />,
        color: 'blue',
        trend: {
          value: tendenciaVentas,
          label: 'vs mes anterior'
        }
      },
      {
        title: 'Monto Total',
        value: formatCurrency(montoTotal),
        subtitle: 'en ventas',
        icon: <DollarSign className="h-8 w-8" />,
        color: 'green'
      },
      {
        title: 'Promedio por Venta',
        value: formatCurrency(promedioVenta),
        subtitle: 'valor promedio',
        icon: <TrendingUp className="h-8 w-8" />,
        color: 'purple'
      },
      {
        title: 'Ventas Pendientes',
        value: ventasPendientes,
        subtitle: 'requieren atención',
        icon: <Clock className="h-8 w-8" />,
        color: 'yellow'
      },
      {
        title: 'Ventas Completadas',
        value: ventasCompletadas,
        subtitle: 'finalizadas',
        icon: <CheckCircle className="h-8 w-8" />,
        color: 'green'
      },
      {
        title: 'Ejecutivos Activos',
        value: ejecutivosUnicos,
        subtitle: 'con ventas',
        icon: <Users className="h-8 w-8" />,
        color: 'blue'
      }
    ]
  }

  const metricas = calcularMetricas()

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400'
    if (value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800/50 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas del Dashboard</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>Actualizado: {new Date().toLocaleDateString('es-CL')}</span>
        </div>
      </div>

      {/* Métricas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricas.map((metrica, index) => (
          <div key={index} className="bg-white dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${getColorClasses(metrica.color)}`}>
                {metrica.icon}
              </div>
              {metrica.trend && (
                <div className={`flex items-center space-x-1 ${getTrendColor(metrica.trend.value)}`}>
                  {metrica.trend.value > 0 ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : metrica.trend.value < 0 ? (
                    <ArrowUpRight className="h-4 w-4 rotate-180" />
                  ) : null}
                  <span className="text-sm font-medium">
                    {metrica.trend.value > 0 ? '+' : ''}{metrica.trend.value.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {metrica.title}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {metrica.value}
              </p>
              {metrica.subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {metrica.subtitle}
                </p>
              )}
              {metrica.trend && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {metrica.trend.label}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resumen rápido */}
      {ventas.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Resumen de Rendimiento
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {ventas.length} ventas totales con un valor promedio de {formatCurrency(calcularMetricas()[2]?.value || 0)}.
                {calcularMetricas()[3]?.value ? ` ${calcularMetricas()[3].value} ventas pendientes de procesamiento.` : ' Todas las ventas están procesadas.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}