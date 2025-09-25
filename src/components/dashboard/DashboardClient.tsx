'use client'

import React, { useState, lazy, Suspense, useRef, useEffect } from 'react'
import { LogOut, Menu, Settings } from 'lucide-react'
import Sidebar from '../layout/Sidebar'
import VentasSection from './VentasSection'
import MetricasSection from './MetricasSection'
import FiltrosSection from './FiltrosSection'
import CRMMetricasCards from './CRMMetricasCards'
import DashboardHeader from './DashboardHeader'
import ContratosSection from './ContratosSection'
import EquipoSection from './EquipoSection'
import ModernMetricCards from './ModernMetricCards'
import ResumenFinanciero from './ResumenFinanciero'
import GestionClientes from './GestionClientes'
import ConfiguracionSection from './ConfiguracionSection'
import NotificationToast from '../shared/NotificationToast'
import { ChileHomeLoader } from '../shared'
import { useDashboardData } from '@/hooks/dashboard/useDashboardData'
import { useNotifications } from '@/hooks/dashboard/useNotifications'
import { ExcelExporter } from '@/services'
import AutoSyncIndicator from '@/components/crm/AutoSyncIndicator'

// Lazy loading para componentes pesados
const ContratoPrevisualizador = lazy(() => import('../ContratoPrevisualizador'))
const CRMDashboard = lazy(() => import('../crm/CRMDashboard'))
const FichasEliminadas = lazy(() => import('../FichasEliminadas'))
const ConfiguracionMensajes = lazy(() => import('../ConfiguracionMensajes'))
const ListadoPlanos = lazy(() => import('../ListadoPlanos'))

interface DashboardClientProps {
  user: any
  contratos: any[]
}

export default function DashboardClient({ user, contratos }: DashboardClientProps) {
  // Navigation state
  const [activeSection, setActiveSection] = useState('dashboard')
  const [contratosSubsection, setContratosSubsection] = useState('activos')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Contract preview state
  const [showContractPreview, setShowContractPreview] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<any>(null)
  const [generatingContractId, setGeneratingContractId] = useState<string | null>(null)

  // Filter state
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [applyingFilter, setApplyingFilter] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Comparison state
  const [comparisonEnabled, setComparisonEnabled] = useState(false)
  const [compareStartDate, setCompareStartDate] = useState('')
  const [compareEndDate, setCompareEndDate] = useState('')
  const [ventasComparacion, setVentasComparacion] = useState<any[]>([])
  const [loadingComparison, setLoadingComparison] = useState(false)

  // Sidebar ref for click-outside functionality
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Hooks
  const {
    ventas,
    loading,
    error,
    filtering,
    totalVentas,
    filters,
    setFilters,
    fetchVentas,
    refetch,
    invalidateCache,
    setBusqueda
  } = useDashboardData()

  const {
    notification,
    showSuccess,
    showError,
    hideNotification
  } = useNotifications()

  // Función para fetch de datos de comparación
  const fetchVentasComparacion = async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return

    setLoadingComparison(true)
    try {
      // Hacer llamada directa a la API para obtener datos de comparación
      const params = new URLSearchParams()
      params.append('fecha_inicio', startDate)
      params.append('fecha_fin', endDate)
      if (filters.soloValidados) params.append('solo_validados', 'true')

      const response = await fetch(`/api/crm/ventas?${params}`)

      if (!response.ok) {
        throw new Error('Error al obtener ventas de comparación')
      }

      const data = await response.json()
      setVentasComparacion(data.ventas || [])
    } catch (error) {
      console.error('Error fetching comparison data:', error)
      setVentasComparacion([])
      showError('Error al cargar datos de comparación')
    } finally {
      setLoadingComparison(false)
    }
  }

  // Handlers para el DateComparisonPicker
  const handlePrimaryDateChange = (startDate: string, endDate: string) => {
    setFilters(prev => ({
      ...prev,
      fechaInicio: startDate,
      fechaFin: endDate
    }))
    // Actualizar los datos cuando cambian las fechas
    fetchVentas(startDate, endDate, filters.soloValidados)

    // Automáticamente actualizar las fechas de comparación con el mismo rango del mes anterior
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Calcular el mismo período pero del mes anterior
    const compareStart = new Date(start.getFullYear(), start.getMonth() - 1, start.getDate())
    const compareEnd = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate())

    const compareStartStr = compareStart.toISOString().split('T')[0]
    const compareEndStr = compareEnd.toISOString().split('T')[0]

    setCompareStartDate(compareStartStr)
    setCompareEndDate(compareEndStr)
    fetchVentasComparacion(compareStartStr, compareEndStr)
  }

  const handleComparisonDateChange = (startDate: string, endDate: string) => {
    setCompareStartDate(startDate)
    setCompareEndDate(endDate)
    // Siempre cargar datos de comparación cuando cambian las fechas, incluso si aún no está habilitado
    if (startDate && endDate) {
      fetchVentasComparacion(startDate, endDate)
    }
  }

  const handleComparisonToggle = (enabled: boolean) => {
    setComparisonEnabled(enabled)
    if (enabled) {
      // Si se activa la comparación y no hay fechas, usar el mes anterior como predeterminado
      if (!compareStartDate || !compareEndDate) {
        const today = new Date()
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
        const startStr = lastMonthStart.toISOString().split('T')[0]
        const endStr = lastMonthEnd.toISOString().split('T')[0]
        setCompareStartDate(startStr)
        setCompareEndDate(endStr)
        fetchVentasComparacion(startStr, endStr)
      } else {
        fetchVentasComparacion(compareStartDate, compareEndDate)
      }
    } else {
      setVentasComparacion([])
    }
  }

  // Cargar automáticamente datos del mes anterior con el mismo rango de días
  useEffect(() => {
    // Obtener fecha actual
    const today = new Date()
    const currentDay = today.getDate()

    // Calcular el mismo período pero del mes anterior
    // Por ejemplo: si hoy es 22 de septiembre, comparar con 1-22 de agosto
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth() - 1, currentDay)

    const startStr = lastMonthStart.toISOString().split('T')[0]
    const endStr = lastMonthEnd.toISOString().split('T')[0]

    // Establecer las fechas de comparación
    setCompareStartDate(startStr)
    setCompareEndDate(endStr)

    // Cargar los datos del mes anterior
    fetchVentasComparacion(startStr, endStr)

  }, []) // Solo ejecutar al montar el componente

  // Click-outside functionality for sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarCollapsed) return // No hacer nada si ya está colapsado

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarCollapsed(true)
      }
    }

    // Agregar listener solo si el sidebar está expandido
    if (!sidebarCollapsed) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarCollapsed])

  // Handlers
  const handleVerContrato = (venta: any) => {
    setSelectedVenta(venta)
    setShowContractPreview(true)
  }

  const handleEditarVenta = (venta: any) => {
    showError('Función de edición en desarrollo')
  }

  const handleGenerarContrato = async (venta: any) => {
    try {
      setGeneratingContractId(venta.id)
      showSuccess('Generando contrato...')

      // Aquí iría la lógica de generación de contrato
      setTimeout(() => {
        setGeneratingContractId(null)
        showSuccess('Contrato generado exitosamente')
      }, 2000)

    } catch (error) {
      setGeneratingContractId(null)
      showError('Error al generar contrato')
    }
  }

  const handleEnviarWhatsApp = (venta: any) => {
    const mensaje = `Hola ${venta.cliente_nombre}, le escribo desde ChileHome respecto a su cotización.`
    const url = `https://wa.me/56${venta.cliente_telefono?.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    showSuccess('WhatsApp abierto')
  }

  const handleExportExcel = async () => {
    try {
      await ExcelExporter.exportVentas(ventas)
      showSuccess('Excel exportado exitosamente')
    } catch (error) {
      showError('Error al exportar Excel')
    }
  }

  const handleFiltroChange = (campo: string, valor: string) => {
    if (campo === 'estado') {
      setEstadoFiltro(valor)
    }
  }

  const handleApplyFilter = async () => {
    setApplyingFilter(true)
    try {
      await fetchVentas(filters.fechaInicio, filters.fechaFin, filters.soloValidados)
    } finally {
      setApplyingFilter(false)
    }
  }

  const handleResetFilter = async () => {
    setResetting(true)
    try {
      const hoy = new Date()
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      const fechaInicioDefecto = inicioMes.toISOString().split('T')[0]
      const fechaFinDefecto = hoy.toISOString().split('T')[0]

      setFilters(prev => ({
        ...prev,
        fechaInicio: fechaInicioDefecto,
        fechaFin: fechaFinDefecto
      }))

      await fetchVentas(fechaInicioDefecto, fechaFinDefecto, false)
    } finally {
      setResetting(false)
    }
  }

  const handleForceRefresh = async () => {
    setRefreshing(true)
    try {
      // Invalidar caché primero
      invalidateCache()
      // Luego hacer refetch con los filtros actuales
      await refetch()
      showSuccess('Datos actualizados exitosamente')
    } catch (error) {
      showError('Error al actualizar los datos')
    } finally {
      setRefreshing(false)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'contratos':
        return (
          <div className="space-y-6">
            {/* Submenú de contratos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setContratosSubsection('activos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contratosSubsection === 'activos'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Contratos Activos
                </button>
                <button
                  onClick={() => setContratosSubsection('eliminados')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contratosSubsection === 'eliminados'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  Fichas Eliminadas
                </button>
              </div>
            </div>

            {/* Contenido según subsección */}
            {contratosSubsection === 'activos' ? (
              <ContratosSection
                ventas={ventas}
                loading={loading}
                error={error}
                generatingContractId={generatingContractId}
                onVerContrato={handleVerContrato}
                onEditarVenta={handleEditarVenta}
                onGenerarContrato={handleGenerarContrato}
                onEnviarWhatsApp={handleEnviarWhatsApp}
              />
            ) : (
              <Suspense fallback={<ChileHomeLoader />}>
                <FichasEliminadas onRestoreFicha={() => refetch()} />
              </Suspense>
            )}
          </div>
        )

      case 'planos':
        return (
          <Suspense fallback={<ChileHomeLoader />}>
            <ListadoPlanos />
          </Suspense>
        )

      case 'logistica':
      case 'crm':
        return (
          <Suspense fallback={<ChileHomeLoader />}>
            <CRMDashboard user={user} />
          </Suspense>
        )

      case 'equipo':
        return <EquipoSection ventas={ventas} />

      case 'mensajes':
        return (
          <Suspense fallback={<ChileHomeLoader />}>
            <ConfiguracionMensajes />
          </Suspense>
        )

      case 'configuracion':
        return <ConfiguracionSection />

      default:
        return (
          <div className="space-y-8">
            {/* Header con filtros de fecha */}
            <DashboardHeader
              fechaInicio={filters.fechaInicio}
              fechaFin={filters.fechaFin}
              onFechaInicioChange={(fecha) => setFilters(prev => ({ ...prev, fechaInicio: fecha }))}
              onFechaFinChange={(fecha) => setFilters(prev => ({ ...prev, fechaFin: fecha }))}
              onApplyFilter={handleApplyFilter}
              onResetFilter={handleResetFilter}
              onForceRefresh={handleForceRefresh}
              applyingFilter={applyingFilter}
              resetting={resetting}
              refreshing={refreshing}
            />

            {/* Cards de métricas modernas */}
            <ModernMetricCards
              ventas={ventas}
              ventasComparacion={ventasComparacion}
              comparisonEnabled={comparisonEnabled}
            />

            {/* Resumen Financiero con gráficos */}
            <ResumenFinanciero
              ventas={ventas}
              ventasComparacion={ventasComparacion}
              fechaInicio={filters.fechaInicio}
              fechaFin={filters.fechaFin}
              fechaInicioComparacion={compareStartDate}
              fechaFinComparacion={compareEndDate}
              onDateRangeChange={handlePrimaryDateChange}
              onComparisonDateRangeChange={handleComparisonDateChange}
              onComparisonToggle={handleComparisonToggle}
            />


            {/* Gestión de Clientes */}
            <GestionClientes
              ventas={ventas.filter(v => !estadoFiltro || v.estado_crm === estadoFiltro)}
              loading={loading}
              fechaInicio={filters.fechaInicio}
              fechaFin={filters.fechaFin}
            />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Indicador de sincronización automática */}
      <AutoSyncIndicator enabled={true} position="fixed" />

      <Sidebar
        ref={sidebarRef}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-72'} transition-all duration-300`}>
        <main className="p-8">
          {renderContent()}
        </main>
      </div>

      {/* Contract Preview Modal */}
      {showContractPreview && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                Contrato - {selectedVenta.cliente_nombre}
              </h3>
              <button
                onClick={() => {
                  setShowContractPreview(false)
                  setSelectedVenta(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <Suspense fallback={<ChileHomeLoader />}>
                <ContratoPrevisualizador
                  contratoData={{
                    cliente_nombre: selectedVenta.cliente_nombre,
                    cliente_rut: selectedVenta.cliente_rut,
                    cliente_telefono: selectedVenta.cliente_telefono,
                    direccion_entrega: selectedVenta.direccion_entrega,
                    numero_contrato: selectedVenta.numero_contrato,
                    fecha_creacion: new Date().toISOString(),
                    fecha_entrega: selectedVenta.fecha_entrega,
                    valor_total: selectedVenta.valor_total,
                    modelo_casa: selectedVenta.modelo_casa,
                    observaciones: selectedVenta.observaciones_crm || '',
                    forma_pago: 'efectivo',
                    estado: 'borrador'
                  }}
                  user={user}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </div>
  )
}
