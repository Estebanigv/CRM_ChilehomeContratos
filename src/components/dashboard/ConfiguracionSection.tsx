'use client'

import React from 'react'
import ThemeSettings from '../configuration/ThemeSettings'

export default function ConfiguracionSection() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración</h2>
        <p className="text-gray-600">Personaliza la aplicación según tus preferencias</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuración de Tema */}
        <ThemeSettings />

        {/* Notificaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificaciones</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked={true}
              />
              <span className="text-sm text-gray-700">
                Notificaciones de nuevas ventas
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked={true}
              />
              <span className="text-sm text-gray-700">
                Alertas de contratos pendientes
              </span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked={false}
              />
              <span className="text-sm text-gray-700">
                Notificaciones por email
              </span>
            </label>
          </div>
        </div>

        {/* Exportación */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportación</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato por defecto
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked={true}
              />
              <span className="text-sm text-gray-700">
                Incluir filtros aplicados en exportación
              </span>
            </label>
          </div>
        </div>

        {/* Datos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filas por página
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="10">10 filas</option>
                <option value="25">25 filas</option>
                <option value="50">50 filas</option>
                <option value="100">100 filas</option>
              </select>
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                defaultChecked={false}
              />
              <span className="text-sm text-gray-700">
                Actualización automática cada 30 segundos
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}