'use client'

import { useState, useEffect } from 'react'
import { FormaPago } from '@/types'
import { CreditCard, DollarSign, Building, Smartphone, Plus, Trash2, AlertCircle } from 'lucide-react'

interface FormasPagoMultiplesProps {
  valorTotal: number
  formasPago: FormaPago[]
  onChange: (formasPago: FormaPago[]) => void
  disabled?: boolean
}

const RECARGO_TARJETA_CREDITO = 3.5 // 3.5% de recargo

export default function FormasPagoMultiples({
  valorTotal,
  formasPago,
  onChange,
  disabled = false
}: FormasPagoMultiplesProps) {
  const [pagos, setPagos] = useState<FormaPago[]>(formasPago || [])
  const [totalPagos, setTotalPagos] = useState(0)

  useEffect(() => {
    const total = pagos.reduce((sum, pago) => {
      return sum + (pago.monto_con_recargo || pago.monto)
    }, 0)
    setTotalPagos(total)
  }, [pagos])

  const agregarFormaPago = () => {
    const nuevoPago: FormaPago = {
      tipo: 'efectivo',
      monto: 0
    }
    const nuevosPagos = [...pagos, nuevoPago]
    setPagos(nuevosPagos)
    onChange(nuevosPagos)
  }

  const eliminarFormaPago = (index: number) => {
    const nuevosPagos = pagos.filter((_, i) => i !== index)
    setPagos(nuevosPagos)
    onChange(nuevosPagos)
  }

  const actualizarPago = (index: number, campo: keyof FormaPago, valor: any) => {
    const nuevosPagos = [...pagos]
    const pago = { ...nuevosPagos[index] }

    if (campo === 'tipo') {
      pago.tipo = valor
      // Aplicar recargo automático para tarjeta de crédito
      if (valor === 'tarjeta_credito') {
        pago.recargo_porcentaje = RECARGO_TARJETA_CREDITO
        pago.monto_con_recargo = pago.monto * (1 + RECARGO_TARJETA_CREDITO / 100)
      } else {
        delete pago.recargo_porcentaje
        delete pago.monto_con_recargo
      }
    } else if (campo === 'monto') {
      pago.monto = Number(valor)
      // Recalcular con recargo si es tarjeta de crédito
      if (pago.tipo === 'tarjeta_credito') {
        pago.monto_con_recargo = pago.monto * (1 + RECARGO_TARJETA_CREDITO / 100)
      }
    } else {
      (pago as any)[campo] = valor
    }

    nuevosPagos[index] = pago
    setPagos(nuevosPagos)
    onChange(nuevosPagos)
  }

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'efectivo':
        return <DollarSign className="w-5 h-5" />
      case 'transferencia':
        return <Building className="w-5 h-5" />
      case 'tarjeta_credito':
        return <CreditCard className="w-5 h-5" />
      case 'tarjeta_debito':
        return <Smartphone className="w-5 h-5" />
      default:
        return <DollarSign className="w-5 h-5" />
    }
  }

  const diferencia = valorTotal - totalPagos

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Formas de Pago</h3>
        {!disabled && (
          <button
            type="button"
            onClick={agregarFormaPago}
            className="btn btn-sm btn-primary"
          >
            <Plus className="w-4 h-4" />
            Agregar Pago
          </button>
        )}
      </div>

      {pagos.length === 0 && (
        <div className="alert alert-warning">
          <AlertCircle className="w-5 h-5" />
          <span>No hay formas de pago configuradas</span>
        </div>
      )}

      <div className="space-y-3">
        {pagos.map((pago, index) => (
          <div key={index} className="card bg-base-200 p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Tipo de Pago</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {getIconoTipo(pago.tipo)}
                    <select
                      value={pago.tipo}
                      onChange={(e) => actualizarPago(index, 'tipo', e.target.value)}
                      className="select select-bordered select-sm flex-1"
                      disabled={disabled}
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta_credito">Tarjeta Crédito</option>
                      <option value="tarjeta_debito">Tarjeta Débito</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Monto</span>
                  </label>
                  <input
                    type="number"
                    value={pago.monto}
                    onChange={(e) => actualizarPago(index, 'monto', e.target.value)}
                    className="input input-bordered input-sm w-full"
                    placeholder="$0"
                    disabled={disabled}
                  />
                </div>

                {pago.tipo === 'tarjeta_credito' && (
                  <div>
                    <label className="label">
                      <span className="label-text">Monto con Recargo (3.5%)</span>
                    </label>
                    <div className="input input-bordered input-sm flex items-center">
                      ${pago.monto_con_recargo?.toLocaleString('es-CL') || 0}
                    </div>
                  </div>
                )}

                {(pago.tipo === 'transferencia' || pago.tipo === 'tarjeta_credito' || pago.tipo === 'tarjeta_debito') && (
                  <div className="md:col-span-3">
                    <label className="label">
                      <span className="label-text">Referencia/Número</span>
                    </label>
                    <input
                      type="text"
                      value={pago.referencia || ''}
                      onChange={(e) => actualizarPago(index, 'referencia', e.target.value)}
                      className="input input-bordered input-sm w-full"
                      placeholder="Ej: Número de transferencia, últimos 4 dígitos"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>

              {!disabled && (
                <button
                  type="button"
                  onClick={() => eliminarFormaPago(index)}
                  className="btn btn-sm btn-ghost btn-square text-error"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-title">Valor Total Contrato</div>
          <div className="stat-value text-lg">${valorTotal.toLocaleString('es-CL')}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Pagos</div>
          <div className="stat-value text-lg">${totalPagos.toLocaleString('es-CL')}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Diferencia</div>
          <div className={`stat-value text-lg ${diferencia === 0 ? 'text-success' : diferencia > 0 ? 'text-warning' : 'text-error'}`}>
            ${Math.abs(diferencia).toLocaleString('es-CL')}
          </div>
          <div className="stat-desc">
            {diferencia === 0 ? 'Cuadrado ✓' : diferencia > 0 ? 'Falta por pagar' : 'Exceso de pago'}
          </div>
        </div>
      </div>
    </div>
  )
}