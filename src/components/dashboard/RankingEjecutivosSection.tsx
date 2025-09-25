'use client'

import React from 'react'
import { BarChart, Download } from 'lucide-react'
import { Venta } from '@/types'
import { obtenerPeriodoTexto } from '@/utils/dateUtils'
import { generarPDFRanking } from '@/utils/pdfUtils'

interface RankingEjecutivosSectionProps {
  ventas: Venta[]
  fechaInicio?: string
  fechaFin?: string
}

interface EjecutivoData {
  nombre: string
  cantidadVentas: number
  montoTotal: number
}

const coloresEjecutivos = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
  '#EC4899', '#F59E0B', '#84CC16', '#14B8A6', '#0EA5E9',
  '#7C3AED', '#DC2626'
]

export default function RankingEjecutivosSection({ ventas, fechaInicio, fechaFin }: RankingEjecutivosSectionProps) {
  const periodoTexto = obtenerPeriodoTexto(fechaInicio, fechaFin)

  // Calcular ventas por ejecutivo
  const ventasPorEjecutivo = ventas.reduce((acc, venta) => {
    const ejecutivo = venta.ejecutivo_nombre || venta.supervisor_nombre || 'Sin asignar'
    const nombreLimpio = ejecutivo.replace(/\s*\([^)]*\)/g, '').trim()

    if (!acc[nombreLimpio]) {
      acc[nombreLimpio] = {
        nombre: nombreLimpio,
        cantidadVentas: 0,
        montoTotal: 0
      }
    }

    acc[nombreLimpio].cantidadVentas++
    const valor = typeof venta.valor_total === 'number'
      ? venta.valor_total
      : parseFloat(venta.valor_total?.toString()?.replace(/\D/g, '') || '0')
    acc[nombreLimpio].montoTotal += valor

    return acc
  }, {} as Record<string, EjecutivoData>)

  const ranking = Object.values(ventasPorEjecutivo)
    .sort((a, b) => b.montoTotal - a.montoTotal)

  const maxMonto = ranking.length > 0 ? ranking[0].montoTotal : 1
  const ejecutivosUnicos = [...new Set(ventas.map(v => v.ejecutivo_nombre || v.supervisor_nombre).filter(Boolean))]

  const handleDescargarPDF = () => {
    generarPDFRanking(ranking, periodoTexto, ventas.length)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ranking de Ejecutivos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ventas del período: <span className="font-semibold text-blue-600">{periodoTexto}</span>
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <BarChart className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {ejecutivosUnicos.length} ejecutivos activos
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <strong>{ventas.length}</strong> ventas totales
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDescargarPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            title="Descargar Ranking en PDF"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {ranking.map((ejecutivo, index) => {
          const posicion = index + 1
          const porcentajeDelTotal = ventas.length > 0 ? (ejecutivo.cantidadVentas / ventas.length * 100).toFixed(1) : '0.0'
          const porcentajeBarra = (ejecutivo.montoTotal / maxMonto) * 100
          const colorEjecutivo = coloresEjecutivos[index % coloresEjecutivos.length]

          return (
            <div key={ejecutivo.nombre} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center w-8 h-8 font-bold text-sm text-white"
                    style={{ backgroundColor: colorEjecutivo }}
                  >
                    {posicion}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {ejecutivo.nombre}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {ejecutivo.cantidadVentas} ventas ({porcentajeDelTotal}% del total)
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900 dark:text-white">
                    ${(ejecutivo.montoTotal / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    ${(ejecutivo.montoTotal / ejecutivo.cantidadVentas / 1000000).toFixed(2)}M promedio
                  </div>
                </div>
              </div>

              {/* Barra de progreso RECTA */}
              <div className="w-full bg-gray-200 dark:bg-gray-600 h-4">
                <div
                  className="h-4 transition-all duration-300"
                  style={{
                    width: `${porcentajeBarra}%`,
                    backgroundColor: colorEjecutivo
                  }}
                />
              </div>

              {/* Porcentaje de la barra */}
              <div className="text-right mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {porcentajeBarra.toFixed(1)}% del top performer
                </span>
              </div>
            </div>
          )
        })}

        {ventas.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay datos de ventas para mostrar el ranking
          </div>
        )}
      </div>
    </div>
  )
}