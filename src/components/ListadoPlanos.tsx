'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Eye, Home, Search, Filter, Users } from 'lucide-react'

interface PlanoDisponible {
  nombre: string
  archivo: string
  metros: number
  ambientes: number
  descripcion: string
  ruta: string
  tamaño?: string
}

export default function ListadoPlanos() {
  const [planos, setPlanos] = useState<PlanoDisponible[]>([])
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroMetros, setFiltroMetros] = useState('')
  const [filtroAmbientes, setFiltroAmbientes] = useState('')

  useEffect(() => {
    cargarPlanos()
  }, [])

  const cargarPlanos = () => {
    // Lista de planos disponibles basada en los archivos físicos
    const planosDisponibles: PlanoDisponible[] = [
      {
        nombre: '36M2 2A',
        archivo: '36M2 2A.pdf',
        metros: 36,
        ambientes: 2,
        descripcion: 'Casa compacta de 36 m² con 2 ambientes perfecta para parejas o personas solas',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/36M2 2A.pdf',
        tamaño: '236 KB'
      },
      {
        nombre: '42M2 2A',
        archivo: '42M2 2A.pdf',
        metros: 42,
        ambientes: 2,
        descripcion: 'Modelo de 42 m² con 2 ambientes amplio y funcional',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/42M2 2A.pdf',
        tamaño: '204 KB'
      },
      {
        nombre: '48M2 2A',
        archivo: '48M2 2A.pdf',
        metros: 48,
        ambientes: 2,
        descripcion: 'Casa de 48 m² con 2 ambientes con mayor espacio de living',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/48M2 2A.pdf',
        tamaño: '202 KB'
      },
      {
        nombre: '54M2 2A',
        archivo: '54M2 2A.pdf',
        metros: 54,
        ambientes: 2,
        descripcion: 'Modelo de 54 m² con 2 ambientes, distribución optimizada',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/54M2 2A.pdf',
        tamaño: '210 KB'
      },
      {
        nombre: '54M2 4A',
        archivo: '54M2 4A.pdf',
        metros: 54,
        ambientes: 4,
        descripcion: 'Casa de 54 m² con 4 ambientes, ideal para familias pequeñas',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/54M2 4A.pdf',
        tamaño: '200 KB'
      },
      {
        nombre: '54M2 6A',
        archivo: '54M2 6A.pdf',
        metros: 54,
        ambientes: 6,
        descripcion: 'Modelo de 54 m² con 6 ambientes, máximo aprovechamiento del espacio',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/54M2 6A.pdf',
        tamaño: '197 KB'
      },
      {
        nombre: '63M2 6A',
        archivo: '63M2 6A.pdf',
        metros: 63,
        ambientes: 6,
        descripcion: 'Casa de 63 m² con 6 ambientes, perfecta para familias medianas',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/63M2 6A.pdf',
        tamaño: '222 KB'
      },
      {
        nombre: '72M2 2A',
        archivo: '72M2 2A.pdf',
        metros: 72,
        ambientes: 2,
        descripcion: 'Modelo amplio de 72 m² con 2 ambientes espaciosos',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/72M2 2A.pdf',
        tamaño: '188 KB'
      },
      {
        nombre: '72M2 6A',
        archivo: '72M2 6A.pdf',
        metros: 72,
        ambientes: 6,
        descripcion: 'Casa de 72 m² con 6 ambientes bien distribuidos',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/72M2 6A.pdf',
        tamaño: '155 KB'
      },
      {
        nombre: '84M2 6A',
        archivo: '84M2 6A.pdf',
        metros: 84,
        ambientes: 6,
        descripcion: 'Modelo de 84 m² con 6 ambientes, ideal para familias grandes',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/84M2 6A.pdf',
        tamaño: '181 KB'
      },
      {
        nombre: '108M2 10A',
        archivo: '108M2 10A.pdf',
        metros: 108,
        ambientes: 10,
        descripcion: 'Casa premium de 108 m² con 10 ambientes, máximo confort',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/108M2 10A.pdf',
        tamaño: '130 KB'
      },
      {
        nombre: '120M2 6A',
        archivo: '120M2 6A.pdf',
        metros: 120,
        ambientes: 6,
        descripcion: 'Modelo ejecutivo de 120 m² con 6 ambientes amplios',
        ruta: 'E:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos/120M2 6A.pdf',
        tamaño: '138 KB'
      }
    ]

    setPlanos(planosDisponibles)
  }

  const planosFiltrados = planos.filter(plano => {
    const matchTexto = plano.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) ||
                      plano.descripcion.toLowerCase().includes(filtroTexto.toLowerCase())

    const matchMetros = !filtroMetros || plano.metros.toString().includes(filtroMetros)

    const matchAmbientes = !filtroAmbientes || plano.ambientes.toString().includes(filtroAmbientes)

    return matchTexto && matchMetros && matchAmbientes
  })

  const abrirPlano = (plano: PlanoDisponible) => {
    // En un entorno real, esto abriría el archivo PDF
    window.open(plano.ruta, '_blank')
  }

  const descargarPlano = (plano: PlanoDisponible) => {
    // Simular descarga
    const link = document.createElement('a')
    link.href = plano.ruta
    link.download = plano.archivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getColorPorMetros = (metros: number) => {
    if (metros <= 48) return 'bg-green-100 text-green-800'
    if (metros <= 72) return 'bg-blue-100 text-blue-800'
    if (metros <= 90) return 'bg-purple-100 text-purple-800'
    return 'bg-orange-100 text-orange-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planos Disponibles</h2>
          <p className="text-gray-600">Listado completo de todos los modelos de casas disponibles</p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {planosFiltrados.length} de {planos.length} planos
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por nombre o descripción
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2"
                placeholder="Ej: 54M2, compacta..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metros cuadrados
            </label>
            <input
              type="text"
              value={filtroMetros}
              onChange={(e) => setFiltroMetros(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Ej: 54, 72..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de ambientes
            </label>
            <input
              type="text"
              value={filtroAmbientes}
              onChange={(e) => setFiltroAmbientes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Ej: 2, 4, 6..."
            />
          </div>
        </div>

        {(filtroTexto || filtroMetros || filtroAmbientes) && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filtros activos:</span>
            <button
              onClick={() => {
                setFiltroTexto('')
                setFiltroMetros('')
                setFiltroAmbientes('')
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Lista de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planosFiltrados.map((plano) => (
          <div key={plano.nombre} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plano.nombre}</h3>
                    <p className="text-sm text-gray-500">{plano.tamaño}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getColorPorMetros(plano.metros)}`}>
                  {plano.metros}m²
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {plano.descripcion}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    {plano.metros}m²
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {plano.ambientes} amb
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => abrirPlano(plano)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Ver Plano
                </button>
                <button
                  onClick={() => descargarPlano(plano)}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {planosFiltrados.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron planos</h3>
          <p className="text-gray-600">
            No hay planos que coincidan con los filtros aplicados.
          </p>
        </div>
      )}

      {/* Resumen estadístico */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Modelos</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {planos.filter(p => p.metros <= 48).length}
            </div>
            <div className="text-sm text-gray-600">Compactas (≤48m²)</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {planos.filter(p => p.metros > 48 && p.metros <= 72).length}
            </div>
            <div className="text-sm text-gray-600">Medianas (49-72m²)</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {planos.filter(p => p.metros > 72 && p.metros <= 90).length}
            </div>
            <div className="text-sm text-gray-600">Grandes (73-90m²)</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {planos.filter(p => p.metros > 90).length}
            </div>
            <div className="text-sm text-gray-600">Premium (&gt;90m²)</div>
          </div>
        </div>
      </div>
    </div>
  )
}