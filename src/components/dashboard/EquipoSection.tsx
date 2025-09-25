'use client'

import React, { useState, useMemo } from 'react'
import {
  Users, Trophy, TrendingUp, Calendar, Filter, Star,
  Award, Target, BarChart3, DollarSign, Clock, UserCheck
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { formatVendorName } from '@/utils/vendorHelpers'
import { calculateExecutiveMetrics, EXECUTIVES_DATA } from '@/utils/executiveData'

interface EquipoSectionProps {
  ventas: any[]
}

export default function EquipoSection({ ventas }: EquipoSectionProps) {
  const [dateRange, setDateRange] = useState({
    inicio: '2025-09-01',
    fin: '2025-09-22'
  })

  // Calcular estadísticas del equipo usando datos reales
  const teamStats = useMemo(() => {
    const ventasFiltradas = ventas.filter(v => {
      const fechaVenta = new Date(v.fecha_venta)
      const fechaInicio = new Date(dateRange.inicio)
      const fechaFin = new Date(dateRange.fin)
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin
    })

    // Usar la utilidad para calcular métricas por ejecutivo
    const executiveMetrics = calculateExecutiveMetrics(ventasFiltradas)

    // Calcular totales por empresa
    const chilehomeTotal = {
      totalVentas: executiveMetrics.chilehome.reduce((sum, exec) => sum + exec.totalVentas, 0),
      totalMonto: executiveMetrics.chilehome.reduce((sum, exec) => sum + exec.montoTotal, 0),
      totalContratos: 0 // Calculamos después basado en número de contrato
    }

    const construmatterTotal = {
      totalVentas: executiveMetrics.construmatter.reduce((sum, exec) => sum + exec.totalVentas, 0),
      totalMonto: executiveMetrics.construmatter.reduce((sum, exec) => sum + exec.montoTotal, 0),
      totalContratos: 0
    }

    return {
      chilehome: {
        ...chilehomeTotal,
        ejecutivos: executiveMetrics.chilehome.sort((a, b) => b.totalVentas - a.totalVentas),
        promedioEquipo: chilehomeTotal.totalVentas > 0 ? chilehomeTotal.totalMonto / chilehomeTotal.totalVentas : 0
      },
      construmatter: {
        ...construmatterTotal,
        ejecutivos: executiveMetrics.construmatter.sort((a, b) => b.totalVentas - a.totalVentas),
        promedioEquipo: construmatterTotal.totalVentas > 0 ? construmatterTotal.totalMonto / construmatterTotal.totalVentas : 0
      },
      total: {
        totalVentas: chilehomeTotal.totalVentas + construmatterTotal.totalVentas,
        totalContratos: chilehomeTotal.totalContratos + construmatterTotal.totalContratos,
        totalMonto: chilehomeTotal.totalMonto + construmatterTotal.totalMonto
      }
    }
  }, [ventas, dateRange])

  // Combinar ejecutivos de ambas empresas para top 3
  const todosEjecutivos = [...teamStats.chilehome.ejecutivos, ...teamStats.construmatter.ejecutivos]
  const top3Ejecutivos = todosEjecutivos.sort((a, b) => b.totalVentas - a.totalVentas).slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Equipo de Trabajo
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión y supervisión del equipo - Contratos por período
            </p>
          </div>

          {/* Filtros de fecha */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={dateRange.inicio}
                onChange={(e) => setDateRange({ ...dateRange, inicio: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-500">a</span>
              <input
                type="date"
                value={dateRange.fin}
                onChange={(e) => setDateRange({ ...dateRange, fin: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Equipos separados por empresa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ChileHome Team */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Equipo ChileHome
            </h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-blue-700">
              <span>{teamStats.chilehome.totalVentas} ventas</span>
              <span>{teamStats.chilehome.totalContratos} contratos</span>
              <span>{formatCurrency(teamStats.chilehome.totalMonto)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ejecutivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamStats.chilehome.ejecutivos.map((ejecutivo, index) => (
                  <tr key={ejecutivo.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {ejecutivo.initials}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {ejecutivo.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(ejecutivo.montoTotal)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {ejecutivo.totalVentas}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(ejecutivo.promedio)} promedio
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ejecutivo.sales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {teamStats.chilehome.ejecutivos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No hay ejecutivos de ChileHome en este período</p>
            </div>
          )}
        </div>

        {/* Construmatter Team */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200 bg-purple-50">
            <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Equipo Construmatter
            </h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-purple-700">
              <span>{teamStats.construmatter.totalVentas} ventas</span>
              <span>{teamStats.construmatter.totalContratos} contratos</span>
              <span>{formatCurrency(teamStats.construmatter.totalMonto)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ejecutivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamStats.construmatter.ejecutivos.map((ejecutivo, index) => (
                  <tr key={ejecutivo.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {ejecutivo.initials}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {ejecutivo.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(ejecutivo.montoTotal)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-purple-600">
                        {ejecutivo.totalVentas}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(ejecutivo.promedio)} promedio
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ejecutivo.sales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {teamStats.construmatter.ejecutivos.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No hay ejecutivos de Construmatter en este período</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}