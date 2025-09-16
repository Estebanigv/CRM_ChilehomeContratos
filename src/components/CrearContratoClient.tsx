'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, CRMVenta, FormaPago, PlanoAdjunto } from '@/types'
import CustomDatePicker from './CustomDatePicker'
import FormasPagoMultiples from './FormasPagoMultiples'
import GestorPlanos from './GestorPlanos'
import { safeParseJSON } from '@/lib/utils'
import { puedeEditarContrato, puedeValidarContrato } from '@/lib/permisos'
import { 
  ArrowLeft, 
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Home,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  CheckCircle,
  Save,
  Send,
  Eye,
  Edit,
  X,
  MessageSquare
} from 'lucide-react'

interface CrearContratoClientProps {
  user: User
}

interface ContratoForm {
  // Datos del cliente (pre-cargados del CRM)
  cliente_nombre: string
  cliente_rut: string
  cliente_telefono: string
  cliente_correo: string
  direccion_entrega: string
  
  // Datos del producto (editables)
  modelo_casa: string
  valor_total: number
  detalle_materiales: string
  
  // Datos del contrato (editables)
  numero_contrato: string
  forma_pago: FormaPago[]
  fecha_entrega: string
  ejecutivo_nombre: string
  planos: PlanoAdjunto[]
  
  // Materiales específicos (editable)
  materiales: Array<{
    item: string
    cantidad: number
  }>
  
  // Observaciones
  observaciones_crm: string
  observaciones_adicionales: string
}

export default function CrearContratoClient({ user }: CrearContratoClientProps) {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [ventas, setVentas] = useState<CRMVenta[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  
  // Estado del formulario
  const [contratoForm, setContratoForm] = useState<ContratoForm>({
    cliente_nombre: '',
    cliente_rut: '',
    cliente_telefono: '',
    cliente_correo: '',
    direccion_entrega: '',
    modelo_casa: '',
    valor_total: 0,
    detalle_materiales: '',
    numero_contrato: '',
    forma_pago: [],
    fecha_entrega: '',
    ejecutivo_nombre: '',
    planos: [],
    materiales: [
      { item: 'Paneles Exteriores Forrados por Una Cara en media luna', cantidad: 10 },
      { item: 'Paneles Interiores sin Forro en Tabiquería', cantidad: 7 },
      { item: 'Cerchas Tradicionales de 1 mt de Altura en par', cantidad: 10 },
      { item: 'Costaneras de 1x4"', cantidad: 45 },
      { item: 'Tablas de Media Luna para el Cierre de Cerchas', cantidad: 35 },
      { item: 'Caballetes de 2 mts.', cantidad: 5 },
      { item: 'Planchas de Zinc 3,66', cantidad: 24 }
    ],
    observaciones_crm: '',
    observaciones_adicionales: ''
  })

  useEffect(() => {
    // Cargar datos del CRM si vienen en la URL
    const crmDataParam = searchParams.get('crm_data')
    if (crmDataParam) {
      try {
        const crmData = JSON.parse(decodeURIComponent(crmDataParam))
        setContratoForm(prev => ({
          ...prev,
          cliente_nombre: crmData.cliente_nombre || '',
          cliente_rut: crmData.cliente_rut || '',
          cliente_telefono: crmData.cliente_telefono || '',
          direccion_entrega: crmData.direccion_entrega || '',
          modelo_casa: crmData.modelo_casa || '',
          valor_total: crmData.valor_total || 0,
          detalle_materiales: crmData.detalle_materiales || '',
          fecha_entrega: crmData.fecha_entrega || '',
          ejecutivo_nombre: crmData.ejecutivo_nombre || user.nombre,
          observaciones_crm: crmData.observaciones_crm || '',
          numero_contrato: `CH-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
        }))
      } catch (error) {
        console.error('Error parsing CRM data:', error)
      }
    } else {
      // Si no hay datos del CRM, generar número de contrato
      setContratoForm(prev => ({
        ...prev,
        numero_contrato: `CH-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        ejecutivo_nombre: user.nombre
      }))
    }

    // Cargar ventas del CRM
    loadVentas()
  }, [searchParams, user.nombre])

  // Función para cargar ventas del CRM
  const loadVentas = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/crm/ventas')
      const data = await safeParseJSON(response)
      
      if (data.success) {
        setVentas(data.ventas || [])
      } else {
        setError(data.error || 'Error cargando ventas')
        setVentas([])
      }
      
      if (data.warning) {
        setError(data.warning)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando ventas')
      setVentas([]) // Mostrar estado vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  // Filtrar y ordenar ventas
  const ventasFiltradas = ventas
    .filter(venta => 
      venta.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venta.cliente_rut.includes(searchTerm) ||
      venta.ejecutivo_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.fecha_venta).getTime() - new Date(a.fecha_venta).getTime())

  // Función para actualizar campos del formulario
  const updateField = (field: keyof ContratoForm, value: any) => {
    setContratoForm(prev => ({ ...prev, [field]: value }))
  }

  // Función para agregar material
  const addMaterial = () => {
    setContratoForm(prev => ({
      ...prev,
      materiales: [...prev.materiales, { item: '', cantidad: 0 }]
    }))
  }

  // Función para actualizar material
  const updateMaterial = (index: number, field: 'item' | 'cantidad', value: string | number) => {
    setContratoForm(prev => ({
      ...prev,
      materiales: prev.materiales.map((mat, i) => 
        i === index ? { ...mat, [field]: value } : mat
      )
    }))
  }

  // Función para eliminar material
  const removeMaterial = (index: number) => {
    setContratoForm(prev => ({
      ...prev,
      materiales: prev.materiales.filter((_, i) => i !== index)
    }))
  }

  // Función para guardar contrato
  const saveContrato = async () => {
    setSaving(true)
    setError('')
    
    try {
      const response = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contratoForm)
      })
      
      if (!response.ok) {
        throw new Error('Error al guardar contrato')
      }
      
      const contrato = await safeParseJSON(response)
      setSuccess('Contrato guardado exitosamente')
      
      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => router.push('/dashboard'), 2000)
      
    } catch (error) {
      setError('Error al guardar el contrato')
    } finally {
      setSaving(false)
    }
  }

  // Función para generar PDF
  const generatePDF = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/contratos/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contratoForm)
      })
      
      if (!response.ok) {
        throw new Error('Error al generar PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato-${contratoForm.numero_contrato}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      setError('Error al generar PDF')
    } finally {
      setSaving(false)
    }
  }

  // Función para enviar por WhatsApp
  const enviarPorWhatsApp = async () => {
    if (!contratoForm.cliente_telefono) {
      setError('Se requiere número de teléfono para enviar por WhatsApp')
      return
    }

    setSaving(true)
    try {
      // Generar el PDF primero
      const pdfResponse = await fetch('/api/contratos/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contratoForm)
      })
      
      if (!pdfResponse.ok) {
        throw new Error('Error al generar PDF')
      }

      // Crear mensaje para WhatsApp
      const mensaje = `¡Hola ${contratoForm.cliente_nombre}! 👋\n\nTe saluda ${contratoForm.ejecutivo_nombre} de ChileHome.\n\nTe envío tu contrato de compra de ${contratoForm.modelo_casa} por un valor de $${contratoForm.valor_total.toLocaleString('es-CL')}.\n\n📋 Número de contrato: ${contratoForm.numero_contrato}\n📅 Fecha de entrega: ${contratoForm.fecha_entrega}\n💰 Forma de pago: ${contratoForm.forma_pago}\n\n¡Gracias por confiar en ChileHome! 🏠✨`
      
      // Limpiar número de teléfono (remover espacios, guiones, etc.)
      const telefonoLimpio = contratoForm.cliente_telefono.replace(/[\s\-\(\)]/g, '')
      const telefonoConPrefijo = telefonoLimpio.startsWith('56') ? telefonoLimpio : `56${telefonoLimpio}`
      
      // Abrir WhatsApp Web con el mensaje
      const whatsappURL = `https://wa.me/${telefonoConPrefijo}?text=${encodeURIComponent(mensaje)}`
      window.open(whatsappURL, '_blank')
      
      setSuccess('Mensaje de WhatsApp preparado. Envía el contrato desde WhatsApp Web.')
      
    } catch (error) {
      setError('Error al preparar envío por WhatsApp')
    } finally {
      setSaving(false)
    }
  }

  // Función para enviar por Email
  const enviarPorEmail = async () => {
    if (!contratoForm.cliente_correo) {
      setError('Se requiere correo electrónico para enviar por Email')
      return
    }

    setSaving(true)
    try {
      // Por ahora, crear un mailto con la información
      const asunto = `Contrato ChileHome - ${contratoForm.numero_contrato}`
      const cuerpo = `Estimado/a ${contratoForm.cliente_nombre},

Espero que se encuentre bien.

Le adjunto su contrato de compra de ${contratoForm.modelo_casa} con los siguientes detalles:

📋 Número de contrato: ${contratoForm.numero_contrato}
💰 Valor total: $${contratoForm.valor_total.toLocaleString('es-CL')}
📅 Fecha de entrega estimada: ${contratoForm.fecha_entrega}
💳 Forma de pago: ${contratoForm.forma_pago}

${contratoForm.observaciones_adicionales ? `\nObservaciones adicionales:\n${contratoForm.observaciones_adicionales}` : ''}

Si tiene alguna pregunta o necesita aclaración sobre algún punto del contrato, no dude en contactarme.

Saludos cordiales,
${contratoForm.ejecutivo_nombre}
ChileHome - Casas Prefabricadas
📞 Teléfono de contacto disponible
📧 contratos@chilehome.cl
🌐 www.chilehome.cl`

      // Crear enlace mailto
      const mailtoURL = `mailto:${contratoForm.cliente_correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
      window.location.href = mailtoURL
      
      setSuccess('Cliente de email abierto. Adjunte el PDF del contrato antes de enviar.')
      
    } catch (error) {
      setError('Error al preparar envío por Email')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Crear Contrato</h1>
                <p className="text-sm text-gray-500">{contratoForm.numero_contrato}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Editar' : 'Vista Previa'}
              </button>
              
              <button
                onClick={generatePDF}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Generar PDF
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => enviarPorWhatsApp()}
                  disabled={saving || !contratoForm.cliente_telefono}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-lg hover:bg-green-600 disabled:opacity-50"
                  title="Enviar por WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => enviarPorEmail()}
                  disabled={saving || !contratoForm.cliente_correo}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-500 border border-transparent rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  title="Enviar por Email"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={saveContrato}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {!showPreview ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario Principal */}
            <div className="lg:col-span-2 space-y-8">
              {/* Información del Cliente */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Información del Cliente
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={contratoForm.cliente_nombre}
                      onChange={(e) => updateField('cliente_nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={contratoForm.cliente_rut}
                      onChange={(e) => updateField('cliente_rut', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={contratoForm.cliente_telefono}
                      onChange={(e) => updateField('cliente_telefono', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={contratoForm.cliente_correo}
                      onChange={(e) => updateField('cliente_correo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección de Entrega
                    </label>
                    <textarea
                      value={contratoForm.direccion_entrega}
                      onChange={(e) => updateField('direccion_entrega', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Información del Producto */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Home className="w-5 h-5 mr-2 text-blue-600" />
                  Información del Producto
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo de Casa
                    </label>
                    <input
                      type="text"
                      value={contratoForm.modelo_casa}
                      onChange={(e) => updateField('modelo_casa', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ej: KIT BÁSICO DE 54 m² 2 AGUAS"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Total
                    </label>
                    <input
                      type="number"
                      value={contratoForm.valor_total}
                      onChange={(e) => updateField('valor_total', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormasPagoMultiples
                      valorTotal={contratoForm.valor_total}
                      formasPago={contratoForm.forma_pago}
                      onChange={(formasPago) => updateField('forma_pago', formasPago)}
                      disabled={false}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Entrega
                    </label>
                    <CustomDatePicker
                      selected={contratoForm.fecha_entrega ? (() => {
                        const parts = contratoForm.fecha_entrega.split('-');
                        if (parts.length === 3) {
                          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        }
                        return null;
                      })() : null}
                      onChange={(date) => {
                        const dateString = date ? (() => {
                          const year = date.getFullYear();
                          const month = (date.getMonth() + 1).toString().padStart(2, '0');
                          const day = date.getDate().toString().padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })() : ''
                        updateField('fecha_entrega', dateString)
                      }}
                      placeholder="Seleccionar fecha de entrega"
                      className="w-full"
                      required
                      minDate={new Date()}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detalle de Materiales
                    </label>
                    <textarea
                      value={contratoForm.detalle_materiales}
                      onChange={(e) => updateField('detalle_materiales', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Lista de Materiales */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Lista de Materiales
                  </h2>
                  <button
                    onClick={addMaterial}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </button>
                </div>
                
                <div className="space-y-3">
                  {contratoForm.materiales.map((material, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="text"
                        value={material.item}
                        onChange={(e) => updateMaterial(index, 'item', e.target.value)}
                        placeholder="Nombre del material"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={material.cantidad}
                        onChange={(e) => updateMaterial(index, 'cantidad', parseInt(e.target.value))}
                        placeholder="Cantidad"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeMaterial(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel Lateral */}
            <div className="space-y-6">
              {/* Información del Contrato */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos del Contrato</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Contrato
                    </label>
                    <input
                      type="text"
                      value={contratoForm.numero_contrato}
                      onChange={(e) => updateField('numero_contrato', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ejecutivo
                    </label>
                    <input
                      type="text"
                      value={contratoForm.ejecutivo_nombre}
                      onChange={(e) => updateField('ejecutivo_nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Planos Adjuntos */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <GestorPlanos
                  modeloCasa={contratoForm.modelo_casa}
                  planos={contratoForm.planos}
                  onChange={(planos) => updateField('planos', planos)}
                  disabled={false}
                />
              </div>

              {/* Observaciones */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
                <div className="space-y-4">
                  {contratoForm.observaciones_crm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones del CRM
                      </label>
                      <textarea
                        value={contratoForm.observaciones_crm}
                        readOnly
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones Adicionales
                    </label>
                    <textarea
                      value={contratoForm.observaciones_adicionales}
                      onChange={(e) => updateField('observaciones_adicionales', e.target.value)}
                      rows={4}
                      placeholder="Agregar observaciones adicionales..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumen</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Cliente:</span>
                    <span className="text-blue-900 font-medium">{contratoForm.cliente_nombre || 'Sin especificar'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Modelo:</span>
                    <span className="text-blue-900 font-medium">{contratoForm.modelo_casa || 'Sin especificar'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Valor:</span>
                    <span className="text-blue-900 font-bold">
                      ${contratoForm.valor_total > 0 ? contratoForm.valor_total.toLocaleString('es-CL') : '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Pago:</span>
                    <span className="text-blue-900 font-medium capitalize">{contratoForm.forma_pago}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Materiales:</span>
                    <span className="text-blue-900 font-medium">{contratoForm.materiales.length} items</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Vista previa del contrato
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">VISTA PREVIA DEL CONTRATO</h2>
              
              {/* Header del contrato */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-4 text-gray-900">CONTRATO DE COMPRA VENTA</h1>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-800">
                  <div className="text-left">
                    <p><strong>FORMA DE PAGO:</strong> {contratoForm.forma_pago.toUpperCase()}</p>
                    <p><strong>NUMERO DE CONTRATO:</strong> {contratoForm.numero_contrato}</p>
                    <p><strong>NOMBRE:</strong> {contratoForm.cliente_nombre}</p>
                  </div>
                  <div className="text-left">
                    <p><strong>LUGAR DE ENTREGA:</strong> {contratoForm.direccion_entrega}</p>
                    <p><strong>FECHA DE ENTREGA:</strong> {contratoForm.fecha_entrega}</p>
                    <p><strong>EJECUTIVO:</strong> {contratoForm.ejecutivo_nombre}</p>
                  </div>
                </div>
              </div>
              
              {/* Contenido del contrato */}
              <div className="space-y-6 text-sm text-justify text-gray-800">
                <p className="text-gray-800">
                  Con fecha de hoy {new Date().toLocaleDateString('es-CL')}, entre <strong className="text-gray-900">CHILE HOME SPA</strong>, 
                  RUT 77.930.819-7, en adelante "El Vendedor" y/o "CHILE HOME", por una parte; y por la otra, 
                  <strong className="text-gray-900"> {contratoForm.cliente_nombre}</strong>, Rut {contratoForm.cliente_rut}, con domicilio en {contratoForm.direccion_entrega}, 
                  teléfono {contratoForm.cliente_telefono}, correo electrónico {contratoForm.cliente_correo}, 
                  en adelante "El Comprador", han convenido en celebrar el siguiente contrato de compraventa:
                </p>
                
                <div>
                  <p className="text-gray-800"><strong className="text-gray-900">PRIMERO:</strong> CHILE HOME vende, transfiere y cede {contratoForm.modelo_casa}, 
                  que El Comprador declara conocer y aceptar de acuerdo con las siguientes cantidades:</p>
                  
                  <div className="mt-4">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left text-gray-900">Ítem</th>
                          <th className="border border-gray-300 px-4 py-2 text-center text-gray-900">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contratoForm.materiales.map((material, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-4 py-2 text-gray-800">{material.item}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center text-gray-800">{material.cantidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <p className="text-gray-800">
                  <strong className="text-gray-900">TERCERO:</strong> El valor de la compraventa a pagar por parte de El Comprador es de 
                  <strong className="text-green-600"> ${contratoForm.valor_total.toLocaleString('es-CL')}.-</strong> el cual será pagado 
                  en su totalidad en <strong className="text-gray-900">{contratoForm.forma_pago.toUpperCase()}</strong>.
                </p>
                
                {contratoForm.observaciones_adicionales && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="text-gray-900"><strong>OBSERVACIONES ADICIONALES:</strong></p>
                    <p className="text-gray-800 mt-2">{contratoForm.observaciones_adicionales}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}