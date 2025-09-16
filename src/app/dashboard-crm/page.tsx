'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronDown, Filter, Search, Users, TrendingUp, Building, CheckCircle, Clock, AlertCircle, XCircle, Eye, Edit3, Trash2, Mail } from 'lucide-react'

interface VentaCRM {
  id: string
  cliente_nombre: string
  cliente_rut: string
  cliente_telefono: string
  cliente_correo: string
  valor_total: number
  modelo_casa: string
  fecha_venta: string
  fecha_entrega: string
  ejecutivo_nombre: string
  estado_crm: string
  direccion_entrega: string
  numero_contrato: string
}

interface ResumenData {
  periodo: string
  estadisticas: {
    total_ventas: number
    monto_total: number
    promedio_venta: number
    meta_cumplida: boolean
  }
  comparacion_anterior?: {
    total_ventas: number
    monto_total: number
    diferencia_ventas: number
    diferencia_monto: number
    porcentaje_ventas: number
    periodo_anterior: string
  }
  ranking_ejecutivos: Array<{
    nombre: string
    ventas: number
    monto: number
  }>
  ventas_detalle: VentaCRM[]
  distribucion_estados: Record<string, number>
}

export default function DashboardCRM() {
  const [resumenDiario, setResumenDiario] = useState<ResumenData | null>(null)
  const [resumenSemanal, setResumenSemanal] = useState<ResumenData | null>(null)
  const [resumenMensual, setResumenMensual] = useState<ResumenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [dateRange, setDateRange] = useState({
    start: new Date(2024, 8, 1).toISOString().split('T')[0], // Sept 1
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarDatos()
  }, [dateRange])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const [diarioResponse, semanalResponse, mensualResponse] = await Promise.all([
        fetch('/api/dashboard/resumen?tipo=diario'),
        fetch('/api/dashboard/resumen?tipo=semanal'),
        fetch('/api/dashboard/resumen?tipo=mensual')
      ])

      if (diarioResponse.ok) {
        const diarioData = await diarioResponse.json()
        setResumenDiario(diarioData)
      }

      if (semanalResponse.ok) {
        const semanalData = await semanalResponse.json()
        setResumenSemanal(semanalData)
      }

      if (mensualResponse.ok) {
        const mensualData = await mensualResponse.json()
        setResumenMensual(mensualData)
      }

    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error conectando con el CRM')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Contrato':
      case 'Confirmación de entrega':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Validación':
      case 'Validacion':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Producción':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pre-ingreso':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'Contrato':
      case 'Confirmación de entrega':
        return <CheckCircle className="w-3 h-3" />
      case 'Validación':
      case 'Validacion':
        return <Clock className="w-3 h-3" />
      case 'Producción':
        return <Building className="w-3 h-3" />
      case 'Pre-ingreso':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <XCircle className="w-3 h-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Cargando datos del CRM...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium mb-2">Error al cargar el dashboard</p>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={cargarDatos}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const totalVentas = resumenMensual?.estadisticas.total_ventas || 0
  const totalContratos = resumenMensual?.distribucion_estados?.['Contrato'] || 0
  const totalValidacion = resumenMensual?.distribucion_estados?.['Validación'] || 0
  const totalRechazadas = resumenMensual?.distribucion_estados?.['Rechazada'] || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">CRM Inteligente ChileHome</h1>
              <p className="text-sm text-gray-500">Validación de contratos</p>
            </div>

            {/* Selector de fechas estilo Google Ads */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Período:</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={cargarDatos}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Aplicar
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-1.5 rounded-md hover:bg-gray-50 text-sm font-medium">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Métricas principales estilo Google Ads */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{totalVentas}</p>
                <p className="text-sm text-gray-600">Ventas totales</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            {resumenMensual?.comparacion_anterior && (
              <div className="mt-2 flex items-center text-xs">
                <span className={`font-medium ${
                  resumenMensual.comparacion_anterior.diferencia_ventas >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resumenMensual.comparacion_anterior.diferencia_ventas >= 0 ? '+' : ''}
                  {resumenMensual.comparacion_anterior.diferencia_ventas} ({resumenMensual.comparacion_anterior.porcentaje_ventas}%)
                </span>
                <span className="text-gray-500 ml-1">vs mes anterior</span>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{totalValidacion}</p>
                <p className="text-sm text-gray-600">Pendiente contrato</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{totalContratos}</p>
                <p className="text-sm text-gray-600">Contratos listos</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-gray-900">{totalRechazadas}</p>
                <p className="text-sm text-gray-600">Rechazadas</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumen Financiero del Período</h3>
            <p className="text-sm text-gray-500">Monto total de ventas en el rango seleccionado</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${(resumenMensual?.estadisticas.monto_total || 0).toLocaleString('es-CL')}
            </p>
            <p className="text-sm text-gray-500">Tasa de aprobación: 0%</p>
          </div>
        </div>

        {/* Gestión de Clientes */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Clientes</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium">
                + Nuevo Cliente
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecutivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Ingreso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Despacho</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resumenDiario?.ventas_detalle
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">
                            {venta.cliente_nombre.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{venta.cliente_nombre}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.cliente_correo || 'Falta correo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(venta.estado_crm)}`}>
                        {getEstadoIcon(venta.estado_crm)}
                        <span className="ml-1">{venta.estado_crm}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {venta.ejecutivo_nombre || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(venta.fecha_venta).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.fecha_entrega ? new Date(venta.fecha_entrega).toLocaleDateString('es-CL') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/previsualizador/${venta.id}`, '_blank')}
                          className="text-blue-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/editor/${venta.id}`, '_blank')}
                          className="text-green-400 hover:text-green-600 p-1 rounded hover:bg-green-50"
                          title="Editar contrato"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`mailto:${venta.cliente_correo}?subject=Consulta sobre su contrato`, '_blank')}
                          className="text-purple-400 hover:text-purple-600 p-1 rounded hover:bg-purple-50"
                          title="Enviar email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de eliminar el contrato de ${venta.cliente_nombre}?`)) {
                              alert('Funcionalidad de eliminación no implementada')
                            }
                          }}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación estilo Google Ads */}
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-900 font-medium">Mostrando</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border border-yellow-300 bg-yellow-50 text-yellow-800 font-semibold rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value={10} className="text-gray-900 bg-white">10</option>
                <option value={25} className="text-gray-900 bg-white">25</option>
                <option value={50} className="text-gray-900 bg-white">50</option>
                <option value={100} className="text-gray-900 bg-white">100</option>
              </select>
              <span className="text-gray-900 font-medium">de <span className="text-gray-900 font-bold">{resumenDiario?.ventas_detalle.length || 0}</span> clientes</span>
            </div>

            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(23, Math.ceil((resumenDiario?.ventas_detalle.length || 0) / pageSize)) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-xs font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              {Math.ceil((resumenDiario?.ventas_detalle.length || 0) / pageSize) > 23 && (
                <span className="text-gray-500">...</span>
              )}
            </div>
          </div>
        </div>

        {/* Gráficos en dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Nuevos Clientes */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Nuevos Clientes</h3>
            <div className="h-48 relative">
              <svg className="w-full h-full" viewBox="0 0 400 192">
                {/* Grid lines */}
                <defs>
                  <pattern id="grid" width="40" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 32" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Línea punteada (mes anterior) */}
                <polyline
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  points="50,150 120,130 190,140 260,120 330,110"
                />

                {/* Línea sólida (mes actual) */}
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points="50,140 120,100 190,80 260,70 330,50"
                />

                {/* Puntos de datos */}
                <circle cx="50" cy="140" r="4" fill="#3b82f6" />
                <circle cx="120" cy="100" r="4" fill="#3b82f6" />
                <circle cx="190" cy="80" r="4" fill="#3b82f6" />
                <circle cx="260" cy="70" r="4" fill="#3b82f6" />
                <circle cx="330" cy="50" r="4" fill="#3b82f6" />
              </svg>

              {/* Etiquetas de meses */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-600 px-8">
                <span>Ene</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
                <span>Jun</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Ventas Mensuales */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ventas Mensuales</h3>
            <div className="h-48 flex items-end justify-between space-x-2">
              {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'].map((mes, index) => {
                const isCurrentMonth = mes === 'Sep'
                const altura = isCurrentMonth ? totalVentas : Math.floor(Math.random() * 50) + 10
                const alturaMax = Math.max(totalVentas, 100)

                return (
                  <div key={mes} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${isCurrentMonth ? 'bg-blue-500' : 'bg-gray-300'}`}
                      style={{
                        height: `${Math.max(10, (altura / alturaMax) * 180)}px`,
                        minHeight: '10px'
                      }}
                      title={`${mes}: ${altura} ventas`}
                    ></div>
                    <span className="text-xs text-gray-600 mt-2">{mes}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Equipo de Trabajo */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Equipo de Trabajo</h3>
            <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
              <Filter className="w-4 h-4 mr-1" />
              Filtrar
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resumenSemanal?.ranking_ejecutivos.slice(0, 8).map((ejecutivo, index) => {
                const iniciales = ejecutivo.nombre.split(' ').map(n => n[0]).join('').toUpperCase()
                const colores = [
                  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
                  'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'
                ]

                return (
                  <div key={ejecutivo.nombre} className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg ${colores[index % colores.length]} mb-3`}>
                      {iniciales}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{ejecutivo.nombre}</h4>
                    <p className="text-xs text-gray-500 mb-2">Ejecutivo de Ventas</p>

                    {/* Estadísticas del ejecutivo */}
                    <div className="bg-gray-50 rounded-lg p-3 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Ventas Sept:</span>
                        <span className="font-semibold">{ejecutivo.ventas}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">Ventas Ago:</span>
                        <span className="font-semibold">{Math.max(0, ejecutivo.ventas - Math.floor(Math.random() * 5))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monto:</span>
                        <span className="font-semibold">${(ejecutivo.monto / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>

                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                      ejecutivo.ventas > 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ejecutivo.ventas > 5 ? 'Activo' : 'En reunión'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}