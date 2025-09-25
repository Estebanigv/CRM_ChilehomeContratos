'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronDown, Filter, Search, Users, TrendingUp, Building, CheckCircle, Clock, AlertCircle, XCircle, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function CRMDashboard() {
  const [resumenDiario, setResumenDiario] = useState<ResumenData | null>(null)
  const [resumenSemanal, setResumenSemanal] = useState<ResumenData | null>(null)
  const [resumenMensual, setResumenMensual] = useState<ResumenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [vendedorNombre, setVendedorNombre] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: new Date(2024, 8, 1).toISOString().split('T')[0], // Sept 1
    end: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarDatos()
    cargarUsuario()

    // Configurar actualización automática cada 30 minutos
    const intervalId = setInterval(() => {
      console.log('🔄 Actualizando datos del CRM automáticamente (cada 30 minutos)')
      cargarDatos()
    }, 30 * 60 * 1000) // 30 minutos en milisegundos

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId)
  }, [])

  const cargarUsuario = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: userProfile } = await supabase
          .from('usuarios')
          .select('nombre')
          .eq('id', authUser.id)
          .single()

        if (userProfile?.nombre) {
          // Obtener solo el primer nombre
          const primerNombre = userProfile.nombre.split(' ')[0]
          setVendedorNombre(primerNombre)
        }
      } else {
        // Usuario de prueba por defecto
        setVendedorNombre('Esteban')
      }
    } catch (error) {
      console.error('Error cargando usuario:', error)
      setVendedorNombre('Esteban')
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando datos del CRM Dashboard...')

      const [diarioResponse, semanalResponse, mensualResponse] = await Promise.all([
        fetch('/api/dashboard/resumen?tipo=diario'),
        fetch('/api/dashboard/resumen?tipo=semanal'),
        fetch('/api/dashboard/resumen?tipo=mensual')
      ])

      if (diarioResponse.ok) {
        const diarioData = await diarioResponse.json()
        setResumenDiario(diarioData)
        console.log('✅ Datos diarios cargados:', diarioData.estadisticas)
      }

      if (semanalResponse.ok) {
        const semanalData = await semanalResponse.json()
        setResumenSemanal(semanalData)
        console.log('✅ Datos semanales cargados:', semanalData.estadisticas)
      }

      if (mensualResponse.ok) {
        const mensualData = await mensualResponse.json()
        setResumenMensual(mensualData)
        console.log('✅ Datos mensuales cargados:', mensualData.estadisticas)
      }

    } catch (err) {
      console.error('❌ Error cargando datos del CRM:', err)
      setError('Error conectando con el CRM')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'contrato':
      case 'confirmación de entrega':
      case 'confirmacion de entrega':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'validación':
      case 'validacion':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'producción':
      case 'produccion':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pre-ingreso':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'entrega ok':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rechazo':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'contrato':
      case 'confirmación de entrega':
      case 'confirmacion de entrega':
      case 'entrega ok':
        return <CheckCircle className="w-3 h-3" />
      case 'validación':
      case 'validacion':
        return <Clock className="w-3 h-3" />
      case 'producción':
      case 'produccion':
        return <Building className="w-3 h-3" />
      case 'pre-ingreso':
        return <AlertCircle className="w-3 h-3" />
      case 'rechazo':
        return <XCircle className="w-3 h-3" />
      default:
        return <XCircle className="w-3 h-3" />
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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
  const totalValidacion = resumenMensual?.distribucion_estados?.['Validación'] || resumenMensual?.distribucion_estados?.['validacion'] || 0
  const totalRechazadas = resumenMensual?.distribucion_estados?.['Rechazo'] || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">CRM Inteligente ChileHome</h1>
              <p className="text-sm text-gray-500 mt-1">Validación de contratos y gestión de ventas</p>
            </div>
            {vendedorNombre && (
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                <User className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <span className="text-blue-600 font-medium">Vendedor:</span>
                  <span className="text-blue-800 font-semibold ml-1">{vendedorNombre}</span>
                </div>
              </div>
            )}
          </div>

          {/* Selector de fechas */}
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
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Resumen Financiero del Período</h3>
          <p className="text-sm text-gray-500">Monto total de ventas en el rango seleccionado</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(resumenMensual?.estadisticas.monto_total || 0)}
          </p>
          <p className="text-sm text-gray-500">
            Promedio por venta: {formatCurrency(resumenMensual?.estadisticas.promedio_venta || 0)}
          </p>
        </div>
      </div>

      {/* Gestión de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecutivo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resumenMensual?.ventas_detalle
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
                        <div className="text-sm text-gray-500">{venta.modelo_casa}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venta.cliente_rut}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEstadoColor(venta.estado_crm)}`}>
                      {getEstadoIcon(venta.estado_crm)}
                      <span className="ml-1">{venta.estado_crm}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(venta.valor_total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {venta.ejecutivo_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(venta.fecha_venta).toLocaleDateString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-700">Mostrando</span>
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
            </select>
            <span className="text-gray-700">de <span className="text-gray-900 font-semibold">{resumenMensual?.ventas_detalle.length || 0}</span> clientes</span>
          </div>

          <div className="flex items-center space-x-2">
            {Array.from({
              length: Math.min(10, Math.ceil((resumenMensual?.ventas_detalle.length || 0) / pageSize))
            }, (_, i) => i + 1).map((page) => (
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
          </div>
        </div>
      </div>

      {/* Ranking de ejecutivos */}
      {resumenMensual?.ranking_ejecutivos && resumenMensual.ranking_ejecutivos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Ejecutivos del Mes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resumenMensual.ranking_ejecutivos.slice(0, 8).map((ejecutivo, index) => {
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

                  <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Ventas:</span>
                      <span className="font-semibold">{ejecutivo.ventas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-semibold">{formatCurrency(ejecutivo.monto)}</span>
                    </div>
                  </div>

                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                    ejecutivo.ventas > 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ejecutivo.ventas > 5 ? 'Excelente' : 'Activo'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}