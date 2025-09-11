'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Contrato, Cliente } from '@/types'
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Send,
  Calendar,
  DollarSign,
  Home,
  FileText,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from 'lucide-react'

const contratoSchema = z.object({
  cliente_nombre: z.string().min(2, 'Nombre requerido'),
  cliente_rut: z.string().min(8, 'RUT requerido'),
  cliente_telefono: z.string().optional(),
  cliente_correo: z.string().email('Email inválido').optional(),
  cliente_direccion_entrega: z.string().min(10, 'Dirección de entrega requerida'),
  fecha_entrega: z.string().min(1, 'Fecha de entrega requerida'),
  valor_total: z.number().min(1, 'Valor total requerido'),
  modelo_casa: z.string().min(2, 'Modelo de casa requerido'),
  detalle_materiales: z.string().min(10, 'Detalle de materiales requerido'),
  observaciones: z.string().optional(),
})

type ContratoFormData = z.infer<typeof contratoSchema>

interface ContratoEditorProps {
  contrato: Contrato & { clientes: Cliente }
  user: User
}

export default function ContratoEditor({ contrato, user }: ContratoEditorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch
  } = useForm<ContratoFormData>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      cliente_nombre: contrato.clientes.nombre,
      cliente_rut: contrato.clientes.rut,
      cliente_telefono: contrato.clientes.telefono || '',
      cliente_correo: contrato.clientes.correo || '',
      cliente_direccion_entrega: contrato.clientes.direccion_entrega || '',
      fecha_entrega: new Date(contrato.fecha_entrega).toISOString().split('T')[0],
      valor_total: contrato.valor_total,
      modelo_casa: contrato.modelo_casa,
      detalle_materiales: contrato.detalle_materiales || '',
      observaciones: contrato.observaciones || '',
    }
  })

  const valorTotal = watch('valor_total')

  const onSubmit = async (data: ContratoFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/contratos/${contrato.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar contrato')
      }

      setSuccess('Contrato actualizado exitosamente')
      reset(data) // Resetear el estado de dirty
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleValidar = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/contratos/${contrato.id}/validar`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al validar contrato')
      }

      router.push(`/previsualizador/${contrato.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar contrato')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <button 
            className="btn btn-ghost gap-2"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </button>
          <div className="divider divider-horizontal"></div>
          <h1 className="text-xl font-bold">
            Editor de Contrato - {contrato.id.substring(0, 8).toUpperCase()}
          </h1>
        </div>
        <div className="flex-none gap-2">
          <div className="badge badge-warning">
            {contrato.estado === 'borrador' ? 'BORRADOR' : contrato.estado.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Alerts */}
        {error && (
          <div className="alert alert-error mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Información del Cliente */}
            <div className="bg-base-100 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-6">
                <UserIcon className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Información del Cliente</h2>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Nombre Completo *</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${errors.cliente_nombre ? 'input-error' : ''}`}
                    placeholder="Juan Pérez González"
                    {...register('cliente_nombre')}
                  />
                  {errors.cliente_nombre && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.cliente_nombre.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">RUT *</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${errors.cliente_rut ? 'input-error' : ''}`}
                    placeholder="12345678-9"
                    {...register('cliente_rut')}
                  />
                  {errors.cliente_rut && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.cliente_rut.message}</span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Teléfono</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        className="input input-bordered pl-10"
                        placeholder="+56912345678"
                        {...register('cliente_telefono')}
                      />
                      <Phone className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        className={`input input-bordered pl-10 ${errors.cliente_correo ? 'input-error' : ''}`}
                        placeholder="cliente@email.com"
                        {...register('cliente_correo')}
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    {errors.cliente_correo && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.cliente_correo.message}</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Dirección de Entrega *</span>
                  </label>
                  <div className="relative">
                    <textarea
                      className={`textarea textarea-bordered pl-10 ${errors.cliente_direccion_entrega ? 'textarea-error' : ''}`}
                      placeholder="Av. Los Pinos 123, Las Condes, Santiago"
                      rows={2}
                      {...register('cliente_direccion_entrega')}
                    />
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  </div>
                  {errors.cliente_direccion_entrega && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.cliente_direccion_entrega.message}</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Información del Producto */}
            <div className="bg-base-100 rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-6">
                <Home className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Información del Producto</h2>
              </div>

              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Modelo de Casa *</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered ${errors.modelo_casa ? 'input-error' : ''}`}
                    placeholder="Modelo Araucaria - 120m²"
                    {...register('modelo_casa')}
                  />
                  {errors.modelo_casa && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.modelo_casa.message}</span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Valor Total *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className={`input input-bordered pl-10 ${errors.valor_total ? 'input-error' : ''}`}
                        placeholder="85000000"
                        {...register('valor_total', { valueAsNumber: true })}
                      />
                      <DollarSign className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    {valorTotal && (
                      <label className="label">
                        <span className="label-text-alt text-success">
                          ${valorTotal.toLocaleString('es-CL')}
                        </span>
                      </label>
                    )}
                    {errors.valor_total && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.valor_total.message}</span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Fecha de Entrega *</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        className={`input input-bordered pl-10 ${errors.fecha_entrega ? 'input-error' : ''}`}
                        {...register('fecha_entrega')}
                      />
                      <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
                    </div>
                    {errors.fecha_entrega && (
                      <label className="label">
                        <span className="label-text-alt text-error">{errors.fecha_entrega.message}</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Detalle de Materiales *</span>
                  </label>
                  <textarea
                    className={`textarea textarea-bordered ${errors.detalle_materiales ? 'textarea-error' : ''}`}
                    placeholder="Casa prefabricada de madera, 3 dormitorios, 2 baños, cocina americana..."
                    rows={4}
                    {...register('detalle_materiales')}
                  />
                  {errors.detalle_materiales && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.detalle_materiales.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Observaciones</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered"
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    {...register('observaciones')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-base-100 rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary gap-2"
                  disabled={loading || !isDirty}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-outline gap-2"
                  onClick={() => router.push(`/contrato/${contrato.id}`)}
                >
                  <Eye className="w-4 h-4" />
                  Vista Previa
                </button>
              </div>

              {contrato.estado === 'borrador' && (
                <button
                  type="button"
                  className="btn btn-success gap-2"
                  onClick={handleValidar}
                  disabled={loading || isDirty}
                >
                  <Send className="w-4 h-4" />
                  Validar y Enviar
                </button>
              )}
            </div>

            {isDirty && (
              <div className="alert alert-warning mt-4">
                <AlertCircle className="w-4 h-4" />
                <span>Hay cambios sin guardar. Guarda antes de validar el contrato.</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}