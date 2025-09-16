'use client'

import { useState, useEffect } from 'react'
import { PlanoAdjunto } from '@/types'
import { FileText, Upload, Eye, Edit, Trash2, Download, Check, X } from 'lucide-react'

interface GestorPlanosProps {
  modeloCasa: string
  planos: PlanoAdjunto[]
  onChange: (planos: PlanoAdjunto[]) => void
  disabled?: boolean
}

const PLANOS_DISPONIBLES = [
  '36M2 2A', '42M2 2A', '48M2 2A', '54M2 2A', '54M2 4A', '54M2 6A',
  '63M2 6A', '72M2 2A', '72M2 6A', '84M2 6A', '108M2 10A', '120M2 6A'
]

export default function GestorPlanos({
  modeloCasa,
  planos,
  onChange,
  disabled = false
}: GestorPlanosProps) {
  const [planosAdjuntos, setPlanosAdjuntos] = useState<PlanoAdjunto[]>(planos || [])
  const [mostrarSelector, setMostrarSelector] = useState(false)
  const [planoSeleccionado, setPlanoSeleccionado] = useState('')
  const [tieneModificaciones, setTieneModificaciones] = useState(false)
  const [descripcionModificaciones, setDescripcionModificaciones] = useState('')

  useEffect(() => {
    // Auto-seleccionar plano basado en modelo de casa
    if (modeloCasa && !planosAdjuntos.length) {
      const planoMatch = PLANOS_DISPONIBLES.find(p =>
        modeloCasa.toLowerCase().includes(p.toLowerCase().replace(' ', ''))
      )
      if (planoMatch) {
        setPlanoSeleccionado(planoMatch)
      }
    }
  }, [modeloCasa])

  const agregarPlano = () => {
    if (!planoSeleccionado) return

    const nuevoPlano: PlanoAdjunto = {
      id: `plano_${Date.now()}`,
      contrato_id: '',
      tipo: tieneModificaciones ? 'modificado' : 'original',
      modelo_casa: planoSeleccionado,
      url: `/planos/${planoSeleccionado.replace(' ', '/')}.pdf`,
      modificaciones: tieneModificaciones ? descripcionModificaciones : undefined,
      created_at: new Date().toISOString()
    }

    const nuevosPlanos = [...planosAdjuntos, nuevoPlano]
    setPlanosAdjuntos(nuevosPlanos)
    onChange(nuevosPlanos)

    // Resetear formulario
    setMostrarSelector(false)
    setPlanoSeleccionado('')
    setTieneModificaciones(false)
    setDescripcionModificaciones('')
  }

  const eliminarPlano = (id: string) => {
    const nuevosPlanos = planosAdjuntos.filter(p => p.id !== id)
    setPlanosAdjuntos(nuevosPlanos)
    onChange(nuevosPlanos)
  }

  const abrirVisorPlano = (url: string) => {
    // Construir ruta completa al plano
    const rutaBase = 'e:/Plataforma profesional de generación y validación de contratos/Planos Plantas Modelos'
    const rutaCompleta = `${rutaBase}${url}`
    window.open(rutaCompleta, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Planos Adjuntos</h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => setMostrarSelector(true)}
            className="btn btn-sm btn-primary"
          >
            <Upload className="w-4 h-4" />
            Adjuntar Plano
          </button>
        )}
      </div>

      {mostrarSelector && (
        <div className="card bg-base-200 p-4 space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Seleccionar Plano Base</span>
            </label>
            <select
              value={planoSeleccionado}
              onChange={(e) => setPlanoSeleccionado(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">Seleccione un plano...</option>
              {PLANOS_DISPONIBLES.map(plano => (
                <option key={plano} value={plano}>{plano}</option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">¿El plano tiene modificaciones?</span>
              <input
                type="checkbox"
                checked={tieneModificaciones}
                onChange={(e) => setTieneModificaciones(e.target.checked)}
                className="checkbox checkbox-primary"
              />
            </label>
          </div>

          {tieneModificaciones && (
            <div>
              <label className="label">
                <span className="label-text">Descripción de Modificaciones</span>
              </label>
              <textarea
                value={descripcionModificaciones}
                onChange={(e) => setDescripcionModificaciones(e.target.value)}
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Ej: Eliminación de panel lateral, modificación de ventana frontal..."
              />
              <div className="alert alert-info mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm">
                  Nota: Para modificaciones complejas, se implementará un editor visual con IA en futuras versiones.
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={agregarPlano}
              className="btn btn-sm btn-success"
              disabled={!planoSeleccionado}
            >
              <Check className="w-4 h-4" />
              Agregar
            </button>
            <button
              type="button"
              onClick={() => {
                setMostrarSelector(false)
                setPlanoSeleccionado('')
                setTieneModificaciones(false)
                setDescripcionModificaciones('')
              }}
              className="btn btn-sm btn-ghost"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {planosAdjuntos.length === 0 ? (
        <div className="alert">
          <FileText className="w-5 h-5" />
          <span>No hay planos adjuntos</span>
        </div>
      ) : (
        <div className="space-y-2">
          {planosAdjuntos.map((plano) => (
            <div key={plano.id} className="card bg-base-200 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{plano.modelo_casa}</p>
                    <p className="text-sm text-base-content/60">
                      {plano.tipo === 'modificado' ? (
                        <span className="badge badge-warning badge-sm">Modificado</span>
                      ) : (
                        <span className="badge badge-success badge-sm">Original</span>
                      )}
                      {plano.modificaciones && (
                        <span className="ml-2 text-xs">{plano.modificaciones}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => abrirVisorPlano(plano.url)}
                    className="btn btn-sm btn-ghost btn-square"
                    title="Ver plano"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-square"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => eliminarPlano(plano.id)}
                      className="btn btn-sm btn-ghost btn-square text-error"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}