'use client'

import React, { useState } from 'react'
import {
  Eye, Edit, Phone, DollarSign, Calendar, MapPin, MessageSquare,
  User as UserIcon, Loader2, CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react'
import { formatCurrency, formatDate, formatProperCase, formatRUT, formatPhone } from '@/utils/formatters'
import { getEstadoStyle, getEstadoColor, isEstadoPendiente } from '@/utils/contractHelpers'
import { formatVendorName } from '@/utils/vendorHelpers'
import { Venta } from '@/types'

interface VentasSectionProps {
  ventas: Venta[]
  loading: boolean
  error: string | null
  generatingContractId: string | null
  onVerContrato: (venta: Venta) => void
  onEditarVenta: (venta: Venta) => void
  onGenerarContrato: (venta: Venta) => void
  onEnviarWhatsApp: (venta: Venta) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function VentasSection({
  ventas,
  loading,
  error,
  generatingContractId,
  onVerContrato,
  onEditarVenta,
  onGenerarContrato,
  onEnviarWhatsApp,
  searchQuery,
  onSearchChange
}: VentasSectionProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const ventasFiltradas = ventas.filter(venta => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      venta.cliente_nombre?.toLowerCase().includes(searchLower) ||
      venta.cliente_rut?.toLowerCase().includes(searchLower) ||
      formatVendorName(venta.ejecutivo_nombre)?.toLowerCase().includes(searchLower) ||
      venta.numero_contrato?.toLowerCase().includes(searchLower)
    )
  })

  // Calcular paginación
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const ventasPaginadas = ventasFiltradas.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Cargando ventas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
        <div className="flex items-center justify-center text-red-600">
          <AlertCircle className="h-8 w-8" />
          <span className="ml-3">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header con búsqueda */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Ventas Recientes ({ventasFiltradas.length})
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por cliente, RUT, ejecutivo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
            />
            <MessageSquare className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ejecutivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventasPaginadas.map((venta) => (
              <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatProperCase(venta.cliente_nombre)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatRUT(venta.cliente_rut)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatVendorName(venta.ejecutivo_nombre)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(venta.valor_total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border ${getEstadoStyle(venta.estado_crm)}`}
                  >
                    {venta.numero_contrato ? (
                      isEstadoPendiente(venta.estado_crm) ? (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {venta.estado_crm || 'Sin estado'}
                        </>
                      )
                    ) : (
                      'Sin contrato'
                    )}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(venta.fecha_venta)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onVerContrato(venta)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-all"
                      title="Ver contrato"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEditarVenta(venta)}
                      className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-all"
                      title="Editar venta"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    {venta.cliente_telefono && (
                      <button
                        onClick={() => onEnviarWhatsApp(venta)}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-all"
                        title="Enviar WhatsApp"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                    )}
                    {!venta.numero_contrato && (
                      <button
                        onClick={() => onGenerarContrato(venta)}
                        disabled={generatingContractId === venta.id}
                        className={`p-1 rounded transition-all ${
                          generatingContractId === venta.id
                            ? 'text-blue-400 cursor-not-allowed'
                            : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                        }`}
                        title="Generar contrato"
                      >
                        {generatingContractId === venta.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <DollarSign className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ventasFiltradas.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay ventas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'No se encontraron ventas con los criterios de búsqueda.' : 'No hay ventas para mostrar.'}
          </p>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                <span className="font-medium">{Math.min(endIndex, ventasFiltradas.length)}</span> de{' '}
                <span className="font-medium">{ventasFiltradas.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}