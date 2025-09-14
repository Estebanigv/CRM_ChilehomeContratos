'use client'

import { useState, useEffect } from 'react'
import { Trash2, RotateCcw, Calendar, User, AlertTriangle, RefreshCw } from 'lucide-react'
import { safeParseJSON } from '@/lib/utils'

interface FichaEliminada {
  id: string
  venta_id: string
  datos_originales: any
  motivo_eliminacion: string
  eliminado_por: string
  fecha_eliminacion: string
  created_at: string
}

interface FichasEliminadasProps {
  onRestoreFicha?: () => void
}

export default function FichasEliminadas({ onRestoreFicha }: FichasEliminadasProps) {
  const [fichas, setFichas] = useState<FichaEliminada[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null)

  const fetchFichasEliminadas = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/fichas-eliminadas')
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await safeParseJSON(response)
      
      if (data.success) {
        setFichas(data.fichas || [])
      } else {
        throw new Error(data.error || 'Error desconocido')
      }

    } catch (error) {
      console.error('Error cargando fichas eliminadas:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const restaurarFicha = async (ventaId: string, nombreCliente: string) => {
    try {
      setRestaurandoId(ventaId)

      const response = await fetch(`/api/fichas-eliminadas?venta_id=${ventaId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await safeParseJSON(response)
      
      if (data.success) {
        // Remover la ficha de la lista local
        setFichas(prev => prev.filter(f => f.venta_id !== ventaId))
        
        // Refrescar la lista principal de ventas
        if (onRestoreFicha) {
          onRestoreFicha()
        }
        
        // Mostrar notificación
        console.log(`✅ Ficha de ${nombreCliente} restaurada exitosamente`)
      } else {
        throw new Error(data.error || 'Error restaurando ficha')
      }

    } catch (error) {
      console.error('Error restaurando ficha:', error)
      alert(`Error restaurando ficha: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setRestaurandoId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  useEffect(() => {
    fetchFichasEliminadas()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
          <span className="text-gray-600">Cargando fichas eliminadas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error cargando fichas eliminadas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFichasEliminadas}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Fichas Eliminadas</h2>
              <p className="text-sm text-gray-600">
                {fichas.length} {fichas.length === 1 ? 'ficha eliminada' : 'fichas eliminadas'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchFichasEliminadas}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {fichas.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fichas eliminadas</h3>
            <p className="text-gray-500">Las fichas que elimines aparecerán aquí y podrás restaurarlas cuando quieras.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fichas.map((ficha) => {
              const datos = ficha.datos_originales
              return (
                <div key={ficha.id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    {/* Información de la ficha */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {datos.cliente_nombre || 'Cliente sin nombre'}
                        </h3>
                        <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-1 rounded">
                          ID: {ficha.venta_id}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>RUT: {datos.cliente_rut || 'No especificado'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Venta: {datos.fecha_venta ? new Date(datos.fecha_venta).toLocaleDateString('es-CL') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Valor: {formatCurrency(datos.valor_total || 0)}</span>
                        </div>
                      </div>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">
                          <span className="font-medium">Motivo de eliminación:</span> {ficha.motivo_eliminacion}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Eliminado el {formatDate(ficha.fecha_eliminacion)}
                        </p>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => restaurarFicha(ficha.venta_id, datos.cliente_nombre)}
                        disabled={restaurandoId === ficha.venta_id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          restaurandoId === ficha.venta_id
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {restaurandoId === ficha.venta_id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                        {restaurandoId === ficha.venta_id ? 'Restaurando...' : 'Restaurar'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}