'use client'

import React from 'react'
import { Trophy, User, TrendingUp } from 'lucide-react'
import { Venta } from '@/types'

interface RankingEjecutivosProps {
  ventas: Venta[]
  loading?: boolean
}

export default function RankingEjecutivos({ ventas, loading }: RankingEjecutivosProps) {
  // Procesar datos del CRM para obtener ranking de ejecutivos
  const ejecutivosStats = React.useMemo(() => {
    const stats = new Map()

    // Filtrar ventas del mes actual
    const hoy = new Date()
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)

    const ventasDelMes = ventas.filter(venta => {
      const fechaVenta = new Date(venta.fecha_creacion)
      return fechaVenta >= inicioMes
    })

    // Agrupar por ejecutivo
    ventasDelMes.forEach(venta => {
      const ejecutivo = venta.vendedor || venta.usuario_nombre || 'Sin asignar'

      if (!stats.has(ejecutivo)) {
        stats.set(ejecutivo, {
          nombre: ejecutivo,
          ventasCount: 0,
          montoTotal: 0,
          promedioVenta: 0
        })
      }

      const current = stats.get(ejecutivo)
      current.ventasCount++

      // Calcular monto total
      const valor = typeof venta.valor_total === 'number'
        ? venta.valor_total
        : parseFloat(venta.valor_total?.toString()?.replace(/\D/g, '') || '0')

      current.montoTotal += valor
      current.promedioVenta = current.montoTotal / current.ventasCount
    })

    // Convertir a array y ordenar por cantidad de ventas
    return Array.from(stats.values())
      .sort((a, b) => b.ventasCount - a.ventasCount)
      .slice(0, 10) // Top 10 ejecutivos
  }, [ventas])

  // Colores para las barras de progreso
  const colores = [
    'bg-gradient-to-r from-yellow-400 to-yellow-600', // Oro - 1er lugar
    'bg-gradient-to-r from-gray-400 to-gray-600',    // Plata - 2do lugar
    'bg-gradient-to-r from-amber-600 to-amber-800',  // Bronce - 3er lugar
    'bg-gradient-to-r from-blue-500 to-blue-600',    // Azul
    'bg-gradient-to-r from-green-500 to-green-600',  // Verde
    'bg-gradient-to-r from-purple-500 to-purple-600', // Púrpura
    'bg-gradient-to-r from-pink-500 to-pink-600',    // Rosa
    'bg-gradient-to-r from-indigo-500 to-indigo-600', // Índigo
    'bg-gradient-to-r from-red-500 to-red-600',      // Rojo
    'bg-gradient-to-r from-teal-500 to-teal-600'     // Teal
  ]

  const maxVentas = ejecutivosStats.length > 0 ? ejecutivosStats[0].ventasCount : 1

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
          <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ranking Ejecutivos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ventas del mes - {ejecutivosStats.length} de 17 ejecutivos activos
          </p>
        </div>
      </div>

      {/* Lista de ejecutivos */}
      <div className="space-y-4">
        {ejecutivosStats.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay ventas registradas este mes
            </p>
          </div>
        ) : (
          ejecutivosStats.map((ejecutivo, index) => {
            const porcentaje = (ejecutivo.ventasCount / maxVentas) * 100
            const colorBarra = colores[index] || 'bg-gradient-to-r from-gray-400 to-gray-600'

            return (
              <div key={ejecutivo.nombre} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Posición */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-500' :
                      index === 2 ? 'bg-amber-600' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar y nombre */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {ejecutivo.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {ejecutivo.nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${ejecutivo.montoTotal.toLocaleString()} total
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      {ejecutivo.ventasCount} ventas
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ${Math.round(ejecutivo.promedioVenta).toLocaleString()} promedio
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 ${colorBarra} transition-all duration-500 ease-out`}
                    style={{ width: `${porcentaje}%` }}
                  ></div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Footer con total */}
      {ejecutivosStats.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total vendedores activos
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {ejecutivosStats.length} de 17 ejecutivos
            </span>
          </div>
        </div>
      )}
    </div>
  )
}