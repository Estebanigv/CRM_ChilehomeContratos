'use client'

import React, { useState } from 'react'
import { Clock, Filter, FileText, Calendar, Plus, AlertTriangle, Users, CalendarDays, Check, X, AlertCircle, Truck, Package } from 'lucide-react'
import VentasSection from './VentasSection'
import { Venta } from '@/types'

interface ContratosSectionProps {
  ventas: Venta[]
  loading: boolean
  error: string | null
  generatingContractId: string | null
  onVerContrato: (venta: Venta) => void
  onEditarVenta: (venta: Venta) => void
  onGenerarContrato: (venta: Venta) => void
  onEnviarWhatsApp: (venta: Venta) => void
}

export default function ContratosSection({
  ventas,
  loading,
  error,
  generatingContractId,
  onVerContrato,
  onEditarVenta,
  onGenerarContrato,
  onEnviarWhatsApp
}: ContratosSectionProps) {
  const [contractFilters, setContractFilters] = useState({
    status: 'todos',
    ejecutivo: 'todos',
    modelo: 'todos'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showContractBuilder, setShowContractBuilder] = useState(false)
  const [selectedClientForContract, setSelectedClientForContract] = useState<Venta | null>(null)
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  // Función para aplicar filtros de contrato
  const applyContractFilters = (ventas: Venta[]) => {
    return ventas.filter((v) => {
      // Filtro por fechas
      if (dateRange.from || dateRange.to) {
        const ventaDate = new Date(v.fecha_venta || '1970-01-01')
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from)
          if (ventaDate < fromDate) return false
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999) // Incluir todo el día
          if (ventaDate > toDate) return false
        }
      }

      // Filtro por estado
      if (contractFilters.status !== 'todos') {
        const estado = v.estado_crm?.toLowerCase() || 'preingreso'
        switch (contractFilters.status) {
          case 'preingreso':
            return estado.includes('preingreso') || estado.includes('pre-ingreso') || estado.includes('ingreso')
          case 'validacion':
            return estado.includes('validacion') || estado.includes('validación') || estado.includes('validation')
          case 'contrato':
            return estado.includes('contrato') || estado.includes('contract')
          case 'confirmacion_entrega':
            return estado.includes('confirmacion') || estado.includes('confirmación') || estado.includes('entrega') || estado.includes('delivery')
          case 'produccion':
            return estado.includes('produccion') || estado.includes('producción') || estado.includes('production') || estado.includes('fabrica')
          case 'entrega_ok':
            return estado.includes('entrega ok') || estado.includes('completado') || estado.includes('finalizado') || estado.includes('completed')
        }
      }

      return true
    })
  }

  // Obtener ventas filtradas y ordenadas por fecha más reciente
  const ventasParaMostrar = applyContractFilters(ventas)
    .sort((a, b) => {
      const fechaA = new Date(a.fecha_venta || '1970-01-01').getTime()
      const fechaB = new Date(b.fecha_venta || '1970-01-01').getTime()
      return fechaB - fechaA // Más reciente primero
    })

  // Obtener clientes sin contrato
  const clientesSinContrato = ventas.filter(v => !v.numero_contrato)

  // Manejar creación de contrato
  const handleCrearContrato = (venta: Venta) => {
    setSelectedClientForContract(venta)
    setShowContractBuilder(true)
  }

  return (
    <div className="space-y-8">
      {/* Header Mejorado */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          {/* Línea superior: Título e indicadores */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ventas recientes</h1>
              <p className="text-gray-600 mt-1">Sistema de validación y gestión de contratos</p>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{ventas.length}</span>
                <span>contratos cargados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Conectado al CRM</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-md">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700 font-medium">Auto-sync cada 30min</span>
              </div>
            </div>
          </div>

          {/* Línea de filtros: Calendario y Estados */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-4">
            {/* Selector de fechas */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                <CalendarDays className="h-4 w-4 text-gray-600" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none"
                  placeholder="Desde"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="bg-transparent text-sm text-gray-700 focus:outline-none"
                  placeholder="Hasta"
                />
              </div>

              {/* Botón limpiar fechas */}
              {(dateRange.from || dateRange.to) && (
                <button
                  onClick={() => setDateRange({ from: '', to: '' })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Filtros de estado con etiquetas rectangulares */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'todos' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  contractFilters.status === 'todos'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos ({ventas.length})
              </button>

              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'preingreso' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  contractFilters.status === 'preingreso'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300'
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Preingreso
                <span className="ml-1 font-normal">({ventas.filter(v => v.estado_crm?.toLowerCase().includes('preingreso') || v.estado_crm?.toLowerCase().includes('ingreso')).length})</span>
              </button>

              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'validacion' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  contractFilters.status === 'validacion'
                    ? 'bg-orange-500 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-300'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Validación
                <span className="ml-1 font-normal">({ventas.filter(v => v.estado_crm?.toLowerCase().includes('validacion') || v.estado_crm?.toLowerCase().includes('validación')).length})</span>
              </button>

              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'contrato' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  contractFilters.status === 'contrato'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Contrato
                <span className="ml-1 font-normal">({ventas.filter(v => v.estado_crm?.toLowerCase().includes('contrato')).length})</span>
              </button>

              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'produccion' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  contractFilters.status === 'produccion'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-300'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                Producción
                <span className="ml-1 font-normal">({ventas.filter(v => v.estado_crm?.toLowerCase().includes('produccion') || v.estado_crm?.toLowerCase().includes('producción')).length})</span>
              </button>

              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'confirmacion_entrega' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  contractFilters.status === 'confirmacion_entrega'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-300'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                Entrega
                <span className="ml-1 font-normal">({ventas.filter(v => v.estado_crm?.toLowerCase().includes('confirmacion') || v.estado_crm?.toLowerCase().includes('entrega')).length})</span>
              </button>

              <button
                onClick={() => setContractFilters({ ...contractFilters, status: 'entrega_ok' })}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  contractFilters.status === 'entrega_ok'
                    ? 'bg-green-500 text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-300'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
                Completado
                <span className="ml-1 font-normal">({ventas.filter(v => v.estado_crm?.toLowerCase().includes('entrega ok') || v.estado_crm?.toLowerCase().includes('completado')).length})</span>
              </button>
            </div>
          </div>

          {/* Línea inferior: Información */}
          <div className="flex items-center justify-between gap-4">
            {/* Indicador de resultados */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{ventasParaMostrar.length} contratos encontrados</span>
            </div>

            {/* Lado derecho: Fecha actualización */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Actualizado: {new Date().toLocaleString('es-CL')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de clientes sin contrato */}
      {clientesSinContrato.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-900">
                  Clientes pendientes de contrato
                </h3>
                <p className="text-amber-700 text-sm">
                  {clientesSinContrato.length} clientes necesitan generar su contrato
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Users className="h-4 w-4" />
              <span>{clientesSinContrato.length} pendientes</span>
            </div>
          </div>

          {/* Lista de clientes sin contrato (primeros 5) */}
          <div className="mt-4 space-y-2">
            {clientesSinContrato.slice(0, 5).map((venta) => (
              <div key={venta.id} className="bg-white rounded-lg p-3 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {venta.cliente_nombre?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{venta.cliente_nombre}</p>
                    <p className="text-sm text-gray-500">
                      {venta.valor_total ? `$${parseInt(venta.valor_total).toLocaleString('es-CL')}` : 'Sin valor'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCrearContrato(venta)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Contrato
                </button>
              </div>
            ))}

            {clientesSinContrato.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-amber-600">
                  y {clientesSinContrato.length - 5} clientes más...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabla de contratos */}
      <VentasSection
        ventas={ventasParaMostrar}
        loading={loading}
        error={error}
        generatingContractId={generatingContractId}
        onVerContrato={onVerContrato}
        onEditarVenta={onEditarVenta}
        onGenerarContrato={onGenerarContrato}
        onEnviarWhatsApp={onEnviarWhatsApp}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Modal del constructor de contratos */}
      {showContractBuilder && selectedClientForContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Crear Contrato - {selectedClientForContract.cliente_nombre}
              </h3>
              <button
                onClick={() => {
                  setShowContractBuilder(false)
                  setSelectedClientForContract(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Información del cliente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Datos del Cliente</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nombre:</span>
                      <p className="font-medium">{selectedClientForContract.cliente_nombre}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">RUT:</span>
                      <p className="font-medium">{selectedClientForContract.cliente_rut}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Teléfono:</span>
                      <p className="font-medium">{selectedClientForContract.cliente_telefono}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor:</span>
                      <p className="font-medium text-green-600">
                        {selectedClientForContract.valor_total
                          ? `$${parseInt(selectedClientForContract.valor_total).toLocaleString('es-CL')}`
                          : 'Sin valor'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Workflow de creación */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Acciones Disponibles</h4>

                  <button
                    onClick={() => onGenerarContrato(selectedClientForContract)}
                    className="w-full p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">Generar Contrato Automático</p>
                        <p className="text-sm text-blue-700">
                          Crear contrato con los datos actuales de la venta
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-blue-600" />
                    </div>
                  </button>

                  <button
                    onClick={() => onVerContrato(selectedClientForContract)}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Previsualizar Contrato</p>
                        <p className="text-sm text-gray-700">
                          Ver cómo se vería el contrato antes de generarlo
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>
                  </button>
                </div>

                {/* Estado del proceso */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Estado: Pendiente de contrato
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Una vez generado el contrato, el cliente pasará al estado de validación
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}