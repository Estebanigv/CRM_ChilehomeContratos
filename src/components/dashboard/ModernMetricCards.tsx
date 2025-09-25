'use client'

import React from 'react'
import {
  DollarSign, TrendingUp, Users, FileText, CheckCircle, Clock, BarChart3
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { Venta } from '@/types'

interface ModernMetricCardsProps {
  ventas: Venta[]
  ventasComparacion?: Venta[]
  comparisonEnabled?: boolean
}

export default function ModernMetricCards({
  ventas,
  ventasComparacion = [],
  comparisonEnabled = false
}: ModernMetricCardsProps) {
  // Calcular métricas basadas en estados CRM exactos
  const totalVentas = ventas.length

  // Contar por los 10 estados CRM exactos del sistema
  const preIngreso = ventas.filter(v => v.estado_crm === 'Pre-ingreso').length
  const validacion = ventas.filter(v => v.estado_crm === 'Validación').length
  const produccion = ventas.filter(v => v.estado_crm === 'Producción').length
  const planificacion = ventas.filter(v => v.estado_crm === 'Planificación').length
  const adquisiciones = ventas.filter(v => v.estado_crm === 'Adquisiciones').length
  const contratos = ventas.filter(v => v.estado_crm === 'Contrato').length
  const confirmacionEntrega = ventas.filter(v => v.estado_crm === 'Confirmación de entrega').length
  const despacho = ventas.filter(v => v.estado_crm === 'Despacho').length
  const entregaOk = ventas.filter(v => v.estado_crm === 'Entrega OK').length
  const rechazo = ventas.filter(v => v.estado_crm === 'Rechazo').length

  const montoTotal = ventas.reduce((sum, v) => {
    const valor = typeof v.valor_total === 'number'
      ? v.valor_total
      : parseFloat(v.valor_total?.toString()?.replace(/\D/g, '') || '0')
    return sum + valor
  }, 0)

  // Los 10 estados del CRM completos en orden del proceso
  const estadosCards = [
    {
      id: 'pre_ingreso',
      title: 'Pre-ingreso',
      value: preIngreso.toString(),
      subtitle: `${preIngreso} ${preIngreso === 1 ? 'venta' : 'ventas'}`,
      icon: Clock,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-purple-700 dark:text-purple-300',
      iconBg: 'bg-purple-500 dark:bg-purple-500/80'
    },
    {
      id: 'validacion',
      title: 'Validación',
      value: validacion.toString(),
      subtitle: `${validacion} ${validacion === 1 ? 'venta' : 'ventas'}`,
      icon: Users,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      iconBg: 'bg-yellow-500 dark:bg-yellow-500/80'
    },
    {
      id: 'produccion',
      title: 'Producción',
      value: produccion.toString(),
      subtitle: `${produccion} ${produccion === 1 ? 'venta' : 'ventas'}`,
      icon: BarChart3,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-cyan-700 dark:text-cyan-300',
      iconBg: 'bg-cyan-500 dark:bg-cyan-500/80'
    },
    {
      id: 'planificacion',
      title: 'Planificación',
      value: planificacion.toString(),
      subtitle: `${planificacion} ${planificacion === 1 ? 'venta' : 'ventas'}`,
      icon: Clock,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-violet-700 dark:text-violet-300',
      iconBg: 'bg-violet-500 dark:bg-violet-500/80'
    },
    {
      id: 'adquisiciones',
      title: 'Adquisiciones',
      value: adquisiciones.toString(),
      subtitle: `${adquisiciones} ${adquisiciones === 1 ? 'venta' : 'ventas'}`,
      icon: Users,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-amber-700 dark:text-amber-300',
      iconBg: 'bg-amber-500 dark:bg-amber-500/80'
    },
    {
      id: 'contratos',
      title: 'Contrato',
      value: contratos.toString(),
      subtitle: `${contratos} ${contratos === 1 ? 'venta' : 'ventas'}`,
      icon: FileText,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-500 dark:bg-blue-500/80'
    },
    {
      id: 'confirmacion',
      title: 'Confirmación de entrega',
      value: confirmacionEntrega.toString(),
      subtitle: `${confirmacionEntrega} ${confirmacionEntrega === 1 ? 'venta' : 'ventas'}`,
      icon: Clock,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-orange-700 dark:text-orange-300',
      iconBg: 'bg-orange-500 dark:bg-orange-500/80'
    },
    {
      id: 'despacho',
      title: 'Despacho',
      value: despacho.toString(),
      subtitle: `${despacho} ${despacho === 1 ? 'venta' : 'ventas'}`,
      icon: TrendingUp,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-indigo-700 dark:text-indigo-300',
      iconBg: 'bg-indigo-500 dark:bg-indigo-500/80'
    },
    {
      id: 'entrega_ok',
      title: 'Entrega OK',
      value: entregaOk.toString(),
      subtitle: `${entregaOk} ${entregaOk === 1 ? 'venta' : 'ventas'} (Finalizadas)`,
      icon: CheckCircle,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-green-700 dark:text-green-300',
      iconBg: 'bg-green-500 dark:bg-green-500/80'
    },
    {
      id: 'rechazos',
      title: 'Rechazo',
      value: rechazo.toString(),
      subtitle: `${rechazo} ${rechazo === 1 ? 'venta' : 'ventas'}`,
      icon: TrendingUp,
      bgColor: 'bg-white dark:bg-gray-800/90 dark:backdrop-blur-sm',
      textColor: 'text-red-700 dark:text-red-300',
      iconBg: 'bg-red-500 dark:bg-red-500/80'
    }
  ]

  return (
    <div className="mb-8 space-y-8">
      {/* Sección de Estados del CRM */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estados del CRM</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Distribución de ventas por estado actual</p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('es-CL', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {estadosCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div
                key={card.id}
                className={`${card.bgColor} p-4 border border-gray-200 dark:border-gray-600/60 hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-gray-900/30 hover:border-gray-300 dark:hover:border-gray-500/60 transition-all duration-300 rounded-lg`}
              >
                {/* Icono en la esquina superior derecha */}
                <div className={`w-10 h-10 ${card.iconBg} flex items-center justify-center mb-3 rounded-lg shadow-sm`}>
                  {IconComponent && <IconComponent className="h-5 w-5 text-white drop-shadow-sm" />}
                </div>

                {/* Contenido principal */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                    {card.title}
                  </p>

                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {card.value}
                  </p>

                  {card.subtitle && (
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}