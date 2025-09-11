'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Contrato, Cliente } from '@/types'
import { 
  ArrowLeft, 
  Edit, 
  Download,
  Send,
  FileText,
  Calendar,
  DollarSign,
  Home,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface ContratoPrevisualizadorProps {
  contrato: Contrato & { clientes: Cliente }
  user: User
}

export default function ContratoPrevisualizador({ contrato, user }: ContratoPrevisualizadorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleGenerarPDF = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/contratos/${contrato.id}/pdf`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Error al generar PDF')
      }

      // Descargar el PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_${contrato.clientes.nombre.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setSuccess('PDF descargado exitosamente')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar PDF')
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarContrato = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/contratos/${contrato.id}/enviar`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar contrato')
      }

      setSuccess('Contrato enviado exitosamente al cliente y empresa')
      
      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar contrato')
    } finally {
      setLoading(false)
    }
  }

  const canEdit = user.role === 'admin' || contrato.ejecutivo_id === user.id
  const canSend = contrato.estado === 'validado' && canEdit

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
            Vista Previa - {contrato.id.substring(0, 8).toUpperCase()}
          </h1>
        </div>
        <div className="flex-none gap-2">
          <div className={`badge ${
            contrato.estado === 'borrador' ? 'badge-warning' :
            contrato.estado === 'validado' ? 'badge-success' :
            'badge-info'
          }`}>
            {contrato.estado.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Alerts */}
        {error && (
          <div className="alert alert-error mb-6">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Contract Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 max-w-4xl mx-auto">
          {/* Header del Contrato */}
          <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              CONTRATO DE COMPRA VENTA
            </h1>
            <h2 className="text-lg font-semibold text-gray-600">
              Casa Prefabricada ChileHome
            </h2>
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <span>Contrato N°: {contrato.id.substring(0, 8).toUpperCase()}</span>
              <span>Fecha: {new Date().toLocaleDateString('es-CL')}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Ejecutivo: {contrato.ejecutivo_nombre}
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              DATOS DEL CLIENTE
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Nombre Completo:</strong> {contrato.clientes.nombre}</div>
              <div><strong>RUT:</strong> {contrato.clientes.rut}</div>
              <div><strong>Teléfono:</strong> {contrato.clientes.telefono || 'No especificado'}</div>
              <div><strong>Email:</strong> {contrato.clientes.correo || 'No especificado'}</div>
              <div className="md:col-span-2">
                <strong>Dirección de Entrega:</strong> {contrato.clientes.direccion_entrega}
              </div>
            </div>
          </div>

          {/* Información del Producto */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-green-600" />
              DETALLES DEL PRODUCTO
            </h3>
            <div className="space-y-3 text-sm">
              <div><strong>Modelo de Casa:</strong> {contrato.modelo_casa}</div>
              <div>
                <strong>Descripción y Materiales:</strong>
                <p className="mt-1 text-gray-700 leading-relaxed">
                  {contrato.detalle_materiales}
                </p>
              </div>
            </div>
          </div>

          {/* Condiciones Comerciales */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              CONDICIONES COMERCIALES
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Valor Total:</strong>
                  <span className="text-2xl font-bold text-green-600 ml-2">
                    ${contrato.valor_total.toLocaleString('es-CL')}
                  </span>
                </div>
                <div>
                  <strong>Fecha de Entrega Estimada:</strong> {new Date(contrato.fecha_entrega).toLocaleDateString('es-CL')}
                </div>
              </div>
              {contrato.observaciones && (
                <div className="mt-4">
                  <strong>Observaciones:</strong>
                  <p className="mt-1 text-gray-700">
                    {contrato.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Términos y Condiciones */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              TÉRMINOS Y CONDICIONES
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>1. El presente contrato es válido desde la fecha de firma por ambas partes.</p>
              <p>2. El cliente se compromete al pago según las condiciones acordadas.</p>
              <p>3. ChileHome garantiza la calidad de los materiales y construcción por 12 meses.</p>
              <p>4. Los plazos de entrega están sujetos a condiciones climáticas favorables.</p>
              <p>5. Cualquier modificación debe ser acordada por escrito por ambas partes.</p>
              <p>6. El cliente debe proporcionar acceso adecuado para la instalación.</p>
              <p>7. Se incluye instalación básica según especificaciones técnicas.</p>
            </div>
          </div>

          {/* Firmas */}
          <div className="border-t-2 border-gray-300 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="font-semibold">Firma del Cliente</p>
                <p className="text-sm text-gray-600">{contrato.clientes.nombre}</p>
              </div>
              <div className="text-center">
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="font-semibold">ChileHome</p>
                <p className="text-sm text-gray-600">Representante Legal</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>ChileHome - Casas Prefabricadas | contratos@chilehome.cl | www.chilehome.cl</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-base-100 rounded-lg shadow p-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
              {canEdit && contrato.estado === 'borrador' && (
                <button
                  className="btn btn-outline gap-2"
                  onClick={() => router.push(`/editor/${contrato.id}`)}
                >
                  <Edit className="w-4 h-4" />
                  Editar Contrato
                </button>
              )}

              <button
                className="btn btn-secondary gap-2"
                onClick={handleGenerarPDF}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descargar PDF
              </button>
            </div>

            {canSend && (
              <button
                className="btn btn-success gap-2"
                onClick={handleEnviarContrato}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar a Cliente
                  </>
                )}
              </button>
            )}
          </div>

          {contrato.estado === 'borrador' && (
            <div className="alert alert-info mt-4">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Este contrato está en borrador. Completa la edición y valida para poder enviarlo al cliente.
              </span>
            </div>
          )}

          {contrato.estado === 'enviado' && (
            <div className="alert alert-success mt-4">
              <CheckCircle className="w-4 h-4" />
              <div>
                <p><strong>Contrato enviado exitosamente</strong></p>
                <p className="text-sm">
                  Enviado el: {contrato.fecha_envio ? new Date(contrato.fecha_envio).toLocaleString('es-CL') : 'Fecha no disponible'}
                </p>
                <p className="text-sm">
                  Cliente: {contrato.clientes.correo || 'Email no disponible'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}