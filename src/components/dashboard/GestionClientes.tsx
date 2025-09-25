'use client'

import React, { useMemo } from 'react'
import { Search, Filter, Loader2, Eye, Mail, Edit, Download, X, User } from 'lucide-react'
import { Venta } from '@/types'
import { procesarDatosClientes } from '@/utils/clienteUtils'
import { usePaginacion } from '@/hooks/usePaginacion'
import Paginacion from '@/components/shared/Paginacion'
import RankingEjecutivosSection from './RankingEjecutivosSection'

interface GestionClientesProps {
  ventas: Venta[]
  loading?: boolean
  fechaInicio?: string
  fechaFin?: string
}

export default function GestionClientes({ ventas, loading, fechaInicio, fechaFin }: GestionClientesProps) {
  // Procesar datos de clientes
  const todosLosClientes = useMemo(() => procesarDatosClientes(ventas), [ventas])

  // Hook de paginación
  const paginacion = usePaginacion({
    datos: todosLosClientes,
    elementosPorPaginaInicial: 10
  })

  return (
    <div className="space-y-6">
      {/* Tabla de Gestión de Clientes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Clientes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Administra y monitorea todos tus clientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 w-32"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nombre..."
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 w-40"
              />
            </div>
            <button
              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
              title="Exportar datos de clientes"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Cliente</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Estado</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Vendedor</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">F. Ingreso</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">F. Entrega</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : (
                paginacion.datosPaginados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cliente.nombre}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {cliente.id} | RUT: {cliente.rut}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide text-white`}
                        style={{
                          backgroundColor: cliente.estadoColor.bgColor,
                          color: cliente.estadoColor.textColor
                        }}
                      >
                        {cliente.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">
                      {cliente.ejecutivo}
                    </td>
                    <td className="py-4 px-4">
                      <div className={`text-sm font-medium ${
                        cliente.fechaIngreso === 'Sin fecha' || cliente.fechaIngreso.includes('inválida') || cliente.fechaIngreso.includes('Error')
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {cliente.fechaIngreso}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`text-sm font-medium ${
                        cliente.fechaEntrega === 'Por definir'
                          ? 'text-amber-500 dark:text-amber-400'
                          : cliente.fechaEntrega === 'Sin fecha' || cliente.fechaEntrega.includes('inválida')
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {cliente.fechaEntrega}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Componente de Paginación */}
        <Paginacion
          paginaActual={paginacion.paginaActual}
          totalPaginas={paginacion.totalPaginas}
          elementosPorPagina={paginacion.elementosPorPagina}
          indiceInicio={paginacion.indiceInicio}
          indiceFin={paginacion.indiceFin}
          totalElementos={paginacion.totalElementos}
          onCambiarPagina={paginacion.cambiarPagina}
          onCambiarElementosPorPagina={paginacion.cambiarElementosPorPagina}
        />
      </div>

      {/* Componente de Ranking de Ejecutivos */}
      <RankingEjecutivosSection
        ventas={ventas}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
      />
    </div>
  )
}