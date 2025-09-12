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
      <div className="navbar bg-base-100 shadow-lg px-6 py-6">
        <div className="flex-1">
          <button 
            className="btn btn-sm btn-ghost gap-2 text-gray-700 hover:text-gray-900"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </button>
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

      <div className="container mx-auto px-6 py-8">
        {/* Contract Preview Title */}
        <div className="text-center mt-8 mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Vista Previa del Contrato N° {contrato.id.substring(0, 8).toUpperCase()}
          </h1>
          <p className="text-gray-600 mt-2">Revise los detalles antes de generar el contrato definitivo</p>
        </div>

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

        {/* Contract Preview - Professional Design */}
        <div className="bg-white max-w-5xl mx-auto">
          {/* Professional Header */}
          <div className="bg-white border-b-4 border-blue-600">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img 
                    src="/logo-chilehome.png" 
                    alt="ChileHome" 
                    className="w-12 h-12 object-contain"
                  />
                  <div className="border-l-2 border-gray-300 pl-4">
                    <h1 className="text-lg font-bold text-gray-900">CHILEHOME SPA</h1>
                    <p className="text-xs text-gray-600">RUT: 76.XXX.XXX-X</p>
                    <p className="text-xs text-gray-600">contratos@chilehome.cl • +56 9 XXXX XXXX</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Documento N°</p>
                  <p className="text-2xl font-bold text-blue-600">{contrato.id.substring(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-600">{new Date().toLocaleDateString('es-CL')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            {/* Contract Title */}
            <div className="text-center py-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">
                Contrato de Compraventa
              </h2>
              <p className="text-sm text-gray-600 mt-2">Casa Prefabricada - Proyecto ChileHome</p>
            </div>
            
            {/* Key Information Bar */}
            <div className="bg-gray-50 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Ejecutivo:</span>
                  <span className="font-bold text-gray-900">{contrato.ejecutivo_nombre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Entrega:</span>
                  <span className="font-bold text-gray-900">
                    {contrato.fecha_entrega && contrato.fecha_entrega !== '' ? 
                      new Date(contrato.fecha_entrega).toLocaleDateString('es-CL') : 
                      'Por definir'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Valor Total:</span>
                  <span className="font-bold text-green-700 text-lg">${contrato.valor_total.toLocaleString('es-CL')}</span>
                </div>
              </div>
            </div>

            {/* Section 1 - Client Information */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                1. DATOS DEL CLIENTE
              </h3>
                
              <div className="bg-gray-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nombre Completo</p>
                    <p className="font-semibold text-gray-900">{contrato.clientes.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">RUT</p>
                    <p className="font-semibold text-gray-900">{contrato.clientes.rut}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                    <p className="font-semibold text-gray-900">{contrato.clientes.telefono || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Correo Electrónico</p>
                    <p className="font-semibold text-gray-900">{contrato.clientes.correo || 'No especificado'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Dirección de Entrega</p>
                    <p className="font-semibold text-gray-900">{contrato.clientes.direccion_entrega}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2 - Product Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                2. DETALLES DEL PRODUCTO
              </h3>
                
              <div className="bg-gray-50 p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Modelo de Casa</p>
                  <p className="font-bold text-gray-900 text-lg">{contrato.modelo_casa}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Descripción y Especificaciones</p>
                  <p className="text-gray-800 leading-relaxed">
                    {contrato.detalle_materiales && !contrato.detalle_materiales.toLowerCase().includes('efectivo') && !contrato.detalle_materiales.toLowerCase().includes('transferencia') ? 
                      contrato.detalle_materiales : 
                      `Casa prefabricada modelo ${contrato.modelo_casa} con estructura modular de alta resistencia. Incluye aislación térmica completa, instalaciones eléctricas y sanitarias certificadas, terminaciones de primera calidad. Garantía de 12 meses en construcción y materiales.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 - Commercial Terms */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                3. CONDICIONES COMERCIALES
              </h3>
                
              <div className="bg-gray-50 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valor Total del Contrato</p>
                    <p className="text-2xl font-bold text-green-700">${contrato.valor_total.toLocaleString('es-CL')}</p>
                    <p className="text-xs text-gray-500 mt-1">Incluye materiales, construcción e instalación</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha de Entrega Estimada</p>
                    <p className="text-lg font-bold text-gray-900">
                      {contrato.fecha_entrega && contrato.fecha_entrega !== '' ? 
                        new Date(contrato.fecha_entrega).toLocaleDateString('es-CL', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        }) : 
                        'Por definir'}
                    </p>
                  </div>
                </div>
                {contrato.observaciones && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Observaciones</p>
                    <p className="text-gray-800">{contrato.observaciones}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4 - Terms and Conditions */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                4. TÉRMINOS Y CONDICIONES
              </h3>
              <div className="bg-gray-50 p-6">
                <ol className="space-y-2 text-sm text-gray-800">
                  <li>1. El presente contrato es válido desde la fecha de firma por ambas partes.</li>
                  <li>2. El cliente se compromete al pago según las condiciones acordadas.</li>
                  <li>3. ChileHome garantiza la calidad de los materiales y construcción por 12 meses.</li>
                  <li>4. Los plazos de entrega están sujetos a condiciones climáticas favorables.</li>
                  <li>5. Cualquier modificación debe ser acordada por escrito por ambas partes.</li>
                  <li>6. El cliente debe proporcionar acceso adecuado para la instalación.</li>
                  <li>7. Se incluye instalación básica según especificaciones técnicas.</li>
                </ol>
              </div>
            </div>

            {/* Section 5 - Signatures */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                FIRMAS Y ACEPTACIÓN
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12">
                {/* Firma del Cliente */}
                <div className="text-center">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="h-20 border-b-2 border-gray-300 mb-4 flex items-end justify-center">
                      <span className="text-gray-400 text-sm mb-2">Firma del Cliente</span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900 text-lg">{contrato.clientes.nombre}</p>
                      <p className="text-sm text-gray-600">RUT: {contrato.clientes.rut}</p>
                      <p className="text-xs text-gray-500 mt-3">Cliente / Comprador</p>
                    </div>
                  </div>
                </div>

                {/* Firma de ChileHome */}
                <div className="text-center">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="h-32 border-b-2 border-gray-300 mb-4 flex items-center justify-center">
                      {/* Firma real de ChileHome - más grande y sin fondo */}
                      <img 
                        src="/firma-chilehome.png" 
                        alt="Firma ChileHome" 
                        className="h-28 object-contain mix-blend-multiply"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900 text-lg">ChileHome Spa</p>
                      <p className="text-sm text-gray-600">RUT: 76.XXX.XXX-X</p>
                      <p className="text-xs text-gray-500 mt-3">Empresa Representante</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Información de fecha y lugar */}
              <div className="bg-blue-50 p-6 rounded-lg text-center mb-8">
                <p className="text-gray-800 font-medium">
                  Contrato firmado en <strong>Santiago de Chile</strong>, el día <strong>{new Date().getDate()}</strong> del mes de <strong>{new Date().toLocaleDateString('es-CL', { month: 'long' })}</strong> del año <strong>{new Date().getFullYear()}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-8 py-4 text-center border-t">
            <p className="text-xs text-gray-600">
              ChileHome Spa - RUT: 76.XXX.XXX-X - Santiago, Chile<br/>
              contratos@chilehome.cl - www.chilehome.cl - +56 9 XXXX XXXX
            </p>
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
                className="btn btn-secondary gap-2 bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700 text-white"
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
                className="btn btn-success gap-2 bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white"
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
            <div className="alert alert-warning mt-4 bg-yellow-100 border-yellow-400 text-yellow-800 border-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium">
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