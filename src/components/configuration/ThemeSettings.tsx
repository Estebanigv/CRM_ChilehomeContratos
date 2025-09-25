'use client'

import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeSettings() {
  const { theme, setSpecificTheme } = useTheme()

  const themeOptions = [
    {
      value: 'light' as const,
      label: 'Tema Claro',
      description: 'Interfaz con fondo blanco y texto oscuro',
      icon: Sun,
      preview: 'bg-white border-gray-300'
    },
    {
      value: 'dark' as const,
      label: 'Tema Oscuro',
      description: 'Interfaz con fondo oscuro y texto claro',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-600'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Apariencia</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Personaliza la apariencia de la aplicación según tus preferencias
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tema de la aplicación</label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themeOptions.map((option) => {
            const IconComponent = option.icon
            const isSelected = theme === option.value

            return (
              <button
                key={option.value}
                onClick={() => setSpecificTheme(option.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-blue-600' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {option.label}
                      </h4>
                      {isSelected && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className={`text-sm ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {option.description}
                    </p>

                    {/* Preview */}
                    <div className="mt-3">
                      <div className={`w-full h-8 rounded border-2 ${option.preview} flex items-center px-3`}>
                        <div className={`w-16 h-2 rounded ${
                          option.value === 'light' ? 'bg-gray-300' : 'bg-gray-600'
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Configuraciones adicionales */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración adicional</h4>

        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              defaultChecked={false}
            />
            <span className="text-sm text-gray-700">
              Seguir configuración del sistema operativo
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              defaultChecked={true}
            />
            <span className="text-sm text-gray-700">
              Recordar preferencia de tema
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}