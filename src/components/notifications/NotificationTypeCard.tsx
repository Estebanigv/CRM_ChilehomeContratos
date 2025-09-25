'use client'

import { Bell, Clock, Info } from 'lucide-react'
import { TipoNotificacion } from '@/constants/notificationTypes'

interface NotificationTypeCardProps {
  tipo: TipoNotificacion
  isSelected: boolean
  onToggle: (tipoId: string) => void
}

export default function NotificationTypeCard({ tipo, isSelected, onToggle }: NotificationTypeCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      }`}
      onClick={() => onToggle(tipo.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Bell className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
          <h4 className="font-medium text-gray-900 dark:text-white">{tipo.nombre}</h4>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(tipo.id)}
          className="w-4 h-4 text-blue-600 rounded"
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {tipo.descripcion}
      </p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
        <Clock className="h-3 w-3" />
        <span>{tipo.frecuencia}</span>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
        <div className="flex items-center gap-1 mb-1">
          <Info className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-500">Ejemplo:</span>
        </div>
        <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
          {tipo.ejemplo}
        </pre>
      </div>
    </div>
  )
}