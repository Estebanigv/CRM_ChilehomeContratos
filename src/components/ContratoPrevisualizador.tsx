'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Contrato, Cliente } from '@/types'
import { safeParseJSON } from '@/lib/utils'
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
  const [planoFile, setPlanoFile] = useState<File | null>(null)
  const [planoPreview, setPlanoPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  // Función para convertir números a palabras en español
  const numeroATexto = (numero: number): string => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (numero === 0) return 'cero';
    if (numero === 100) return 'cien';
    if (numero === 1000) return 'mil';
    if (numero === 1000000) return 'un millón';

    let resultado = '';
    
    // Millones
    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      if (millones === 1) {
        resultado += 'un millón ';
      } else {
        resultado += numeroATexto(millones) + ' millones ';
      }
      numero %= 1000000;
    }

    // Miles
    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      if (miles === 1) {
        resultado += 'mil ';
      } else {
        resultado += numeroATexto(miles) + ' mil ';
      }
      numero %= 1000;
    }

    // Centenas
    if (numero >= 100) {
      const cent = Math.floor(numero / 100);
      resultado += centenas[cent] + ' ';
      numero %= 100;
    }

    // Decenas y unidades
    if (numero >= 20) {
      const dec = Math.floor(numero / 10);
      resultado += decenas[dec];
      numero %= 10;
      if (numero > 0) {
        resultado += ' y ' + unidades[numero];
      }
    } else if (numero >= 10) {
      resultado += especiales[numero - 10];
    } else if (numero > 0) {
      resultado += unidades[numero];
    }

    return resultado.trim();
  }

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

      const result = await safeParseJSON(response)

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

  const handleFileUpload = (file: File) => {
    if (file.type.includes('image/') || file.type === 'application/pdf') {
      setPlanoFile(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setPlanoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      
      setSuccess(`Plano "${file.name}" cargado correctamente`)
    } else {
      setError('Solo se permiten archivos de imagen (PNG, JPG, JPEG) o PDF')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const removePlano = () => {
    setPlanoFile(null)
    setPlanoPreview(null)
    setSuccess('Plano removido')
  }

  const canEdit = user.role === 'admin' || contrato.ejecutivo_id === user.id
  const canSend = contrato.estado === 'validado' && canEdit

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header - Simplified with navigation */}
      <div className="bg-blue-600 text-white shadow-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="inline-flex items-center gap-2 text-white hover:text-blue-200 transition-colors font-sans text-sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </button>
            <div className="w-px h-5 bg-blue-400"></div>
            <h1 className="text-lg font-sans font-semibold">Vista Previa del Contrato</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm opacity-90">Cliente: <span className="font-bold">{contrato.clientes.nombre}</span></p>
              <p className="text-sm opacity-90">Valor: <span className="font-bold">${contrato.valor_total.toLocaleString('es-CL')}</span></p>
            </div>
            <div className={`px-3 py-1 text-xs font-medium font-sans rounded-lg ${
              contrato.estado === 'borrador' ? 'bg-yellow-500 text-yellow-900' :
              contrato.estado === 'validado' ? 'bg-green-500 text-green-900' :
              'bg-blue-500 text-blue-900'
            }`}>
              {contrato.estado.charAt(0).toUpperCase() + contrato.estado.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Contract Summary - Clean */}
        <div className="bg-white border border-gray-200 shadow-md rounded-lg mb-8">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-sans font-semibold text-gray-800">
                Resumen del Contrato
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 font-sans">
                <span>ID: <span className="font-bold text-gray-900">{contrato.id.substring(0, 8).toUpperCase()}</span></span>
                <span>Modelo: <span className="font-bold text-gray-900">{contrato.modelo_casa}</span></span>
              </div>
            </div>
          </div>
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

        {/* Contract Preview - ChileHome Official Format */}
        <div className="bg-white max-w-5xl mx-auto shadow-lg print:shadow-none">
          {/* Professional Header */}
          <div className="bg-white">
            {/* Top Bar with Contract Number */}
            <div className="bg-gray-700 px-8 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">Contrato N°</span>
                  <span className="bg-white px-3 py-1 rounded text-gray-700 font-bold text-sm">
                    {contrato.numero || contrato.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm">
                    {new Date().toLocaleDateString('es-CL', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    contrato.estado === 'borrador' ? 'bg-yellow-400 text-yellow-900' :
                    contrato.estado === 'validado' ? 'bg-green-400 text-green-900' :
                    'bg-blue-400 text-blue-900'
                  }`}>
                    {contrato.estado.charAt(0).toUpperCase() + contrato.estado.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Header Content */}
            <div className="px-8 py-6 border-b-2 border-gray-200">
              <div className="grid grid-cols-3 items-center">
                {/* Logo and Company Info - Left aligned */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg p-2 shadow-sm">
                    <img 
                      src="/logo-chilehome.png" 
                      alt="Chile Home Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 font-sans">Chile Home SPA</h2>
                    <p className="text-xs text-gray-600 font-sans">RUT: 77.930.819-7</p>
                    <p className="text-xs text-gray-600 font-sans">www.chilehome.cl</p>
                  </div>
                </div>

                {/* Contract Title - Perfectly Centered */}
                <div className="text-center">
                  <h1 className="text-2xl font-sans font-bold text-gray-900 mb-1">
                    CONTRATO DE<br/>COMPRAVENTA
                  </h1>
                  <div className="flex justify-center mb-1">
                    <div className="w-20 h-0.5 bg-orange-500"></div>
                  </div>
                  <p className="text-sm text-gray-700 font-medium font-sans">
                    Kit Básico Modelo {contrato.modelo_casa}
                  </p>
                  <p className="text-xs text-orange-600 font-bold font-sans mt-1">
                    Tabiquería 2x3 - 60 cm
                  </p>
                </div>

                {/* QR Code - Right aligned - Real functional QR */}
                <div className="flex justify-end">
                  <div className="text-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://chilehome.cl/contrato/${contrato.id}`)}`}
                      alt="QR Code Contrato" 
                      className="w-20 h-20 border border-gray-300"
                    />
                    <p className="text-xs text-gray-600 mt-1 font-sans">Verificación</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client and Contract Details Bar */}
            <div className="bg-gray-100 px-8 py-4">
              <div className="grid grid-cols-2 gap-8">
                {/* Client Information */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Información del Cliente</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cliente:</span>
                      <span className="text-sm font-bold text-gray-900">{contrato.clientes.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">RUT:</span>
                      <span className="text-sm font-bold text-gray-900">{contrato.clientes.rut}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Teléfono:</span>
                      <span className="text-sm font-bold text-gray-900">{contrato.clientes.telefono}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery and Payment Information */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Detalles de Entrega y Pago</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fecha entrega:</span>
                      <span className="text-sm font-bold text-gray-900">{
                        contrato.fecha_entrega && contrato.fecha_entrega !== '' ? 
                          (() => {
                            if (contrato.fecha_entrega.includes('-') && contrato.fecha_entrega.split('-')[0].length === 2) {
                              const [day, month, year] = contrato.fecha_entrega.split('-');
                              return new Date(`${year}-${month}-${day}`).toLocaleDateString('es-CL', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              });
                            }
                            return new Date(contrato.fecha_entrega).toLocaleDateString('es-CL', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            });
                          })() : 
                          'Por definir'
                      }</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dirección:</span>
                      <span className="text-sm font-bold text-gray-900 text-right max-w-xs">
                        {contrato.clientes.direccion_entrega?.split(',').slice(-2).join(',').trim()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Forma de pago:</span>
                      <span className="text-sm font-bold text-orange-600">
                        {(contrato.forma_pago || 'Efectivo').charAt(0).toUpperCase() + (contrato.forma_pago || 'Efectivo').slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Executive Info Bar */}
              <div className="mt-3 text-center">
                <span className="text-xs text-gray-600">Ejecutivo de Ventas: </span>
                <span className="text-xs font-bold text-gray-800">
                  {contrato.ejecutivo_nombre}
                </span>
              </div>
            </div>
          </div>

          <div className="px-8 py-8 print:py-6 leading-relaxed">
            {/* Contract Introduction */}
            <div className="mb-8 text-gray-800 leading-7 print:text-sm print:leading-6">
              <p className="text-justify">
                Con fecha de hoy <strong className="text-gray-900">{new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^(\w)/, c => c.toUpperCase())}</strong>, entre <strong className="text-gray-900">Chile Home SPA</strong>, RUT <strong className="text-gray-900">77.930.819-7</strong>, en adelante <strong className="text-gray-900">"El Vendedor"</strong> y/o <strong className="text-gray-900">"Chile Home"</strong>, por una parte; y por la otra, <strong className="text-gray-900">{contrato.clientes.nombre}</strong>, Rut <strong className="text-gray-900">{contrato.clientes.rut}</strong>, con domicilio en <strong className="text-gray-900">{contrato.clientes.direccion_entrega}</strong>, teléfono <strong className="text-gray-900">{contrato.clientes.telefono}</strong>{contrato.clientes.correo ? `, correo electrónico ${contrato.clientes.correo}` : ''}, en adelante <strong className="text-gray-900">"El Comprador"</strong>, han convenido en celebrar el siguiente contrato de compraventa:
              </p>
            </div>

            {/* PRIMER CLAUSE - Product Details */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Primero:
              </h3>
              <div className="text-gray-800 leading-7 print:text-sm print:leading-6 pl-4">
                <p className="mb-6 text-justify">
                  Chile Home vende, transfiere y cede <strong className="text-gray-900">1 Kit Básico de {contrato.modelo_casa}</strong>, compuesto de paneles exteriores con forro exterior en tabla media luna, paneles interiores solo tabiquería sin forrar, paneles en tabiquería 2 x 3", techumbre de Zinc, caballetes, cerchas, costaneras y tablas en media lunas para frontones, que El Comprador declara conocer y aceptar de acuerdo con las siguientes cantidades:
                </p>
                
                {/* Kit Details Table */}
                <div className="mb-6">
                  <h4 className="font-bold mb-3 text-lg text-gray-900">Kit Básico de {contrato.modelo_casa}:</h4>
                  <div className="overflow-hidden rounded-lg shadow-sm border border-gray-300">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-700">
                          <th className="border-b border-gray-800 px-4 py-3 text-left font-bold text-white">Ítem Kit Básico</th>
                          <th className="border-b border-gray-800 px-4 py-3 text-center font-bold text-white w-20">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Paneles Exteriores Forrados por Una Cara en media luna</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">10</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Paneles Interiores sin Forro en Tabiquería</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">7</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Cerchas Tradicionales de 1 mt de Altura en par</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">10</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Costaneras de 1x4"</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">45</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Tablas de Media Luna para el Cierre de Cerchas</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">35</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Caballetes de 2 mts.</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border-b border-gray-200 px-4 py-3 text-gray-800 font-medium">Planchas de Zinc 3,66</td>
                          <td className="border-b border-gray-200 px-4 py-3 text-center font-bold text-gray-900">24</td>
                        </tr>
                        <tr className="bg-orange-100 hover:bg-orange-200">
                          <td className="px-4 py-3 font-bold text-orange-900">Traslado a {contrato.clientes.direccion_entrega?.split(',').pop()?.trim()}</td>
                          <td className="px-4 py-3 text-center font-bold text-orange-900">Incluido</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        <strong>Importante:</strong> Kit Básico {contrato.modelo_casa} no incluye pilar del porche, no incluye papel fieltro para la techumbre, las planchas de zinc están cubicadas para que sean montadas a 1 onda con un alero de 20 cm.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 border-2 border-gray-400 rounded-lg p-4">
                  <p className="text-sm leading-6 text-gray-800 font-medium text-justify">
                    El Certificado de Entrega y Conformidad del Cliente debe ser firmado únicamente por El Comprador y en caso de que no pudiera estar presente al momento de la entrega y/o retiro de las especies, quien firme en su representación ya sea un familiar u otro, será el responsable del visto bueno y conformidad de lo entregado por El Vendedor. Chile Home no aceptará reclamos posteriores relacionados con la falta de material o mal estado de estos luego de su retiro o descarga del camión y posterior firma.
                  </p>
                </div>
              </div>
            </div>

            {/* SEGUNDO CLAUSE */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Segundo:
              </h3>
              <div className="text-gray-800 leading-7 print:text-sm print:leading-6 pl-4">
                <p className="mb-4 text-justify">
                  Los Kit Básicos no incluyen piso, vigas a la vista, cielo, lima hoyas, junquillos, marcos, chapas, bisagras, terminaciones tales como gasfitería, grifería ni electricidad de ningún tipo. Además, no contemplan el armado del kit en terreno el cual es de responsabilidad de El Comprador.
                </p>
              </div>
            </div>

            {/* TERCERO CLAUSE - Payment Terms */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Tercero:
              </h3>
              <div className="text-gray-800 leading-7 print:text-sm print:leading-6 pl-4">
                <div className="bg-green-50 p-6 mb-4 rounded-lg">
                  <div className="text-center mb-4">
                    <p className="text-sm text-green-700 font-medium mb-2 font-sans">Valor total del contrato</p>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-3xl font-bold text-green-800 mb-2 font-sans">
                        ${contrato.valor_total.toLocaleString('es-CL')}
                      </p>
                      <div className="border-t border-green-200 pt-2">
                        <p className="text-base text-green-700 font-medium capitalize font-sans">
                          ({numeroATexto(contrato.valor_total)} pesos chilenos)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 text-justify font-bold font-sans leading-normal">
                    <span className="text-green-700">El valor de la compraventa a pagar por parte de El Comprador</span> es el monto indicado anteriormente.
                  </p>
                </div>
                <p className="text-gray-800 text-justify">
                  El valor será pagado en su totalidad en <strong className="text-gray-900">{(contrato.forma_pago || 'Efectivo').charAt(0).toUpperCase() + (contrato.forma_pago || 'Efectivo').slice(1).toLowerCase()}</strong> directamente al chofer del camión en el momento de la entrega antes de la descarga de los bienes descritos en el punto Primero. Este valor incluye el valor del traslado.
                </p>
              </div>
            </div>

            {/* CUARTO CLAUSE - Delivery Terms */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Cuarto:
              </h3>
              <div className="text-base leading-7 print:text-sm print:leading-6 pl-4 space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-justify font-medium text-orange-900">
                    📅 <strong>Fecha de entrega:</strong> {
                    contrato.fecha_entrega && contrato.fecha_entrega !== '' ? 
                      (() => {
                        if (contrato.fecha_entrega.includes('-') && contrato.fecha_entrega.split('-')[0].length === 2) {
                          const [day, month, year] = contrato.fecha_entrega.split('-');
                          return new Date(`${year}-${month}-${day}`).toLocaleDateString('es-CL', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          });
                        }
                        return new Date(contrato.fecha_entrega).toLocaleDateString('es-CL', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        });
                      })() : 
                      'POR DEFINIR'
                  }
                  </p>
                  <p className="text-sm text-orange-700 font-medium mt-2">
                    📍 <strong>Lugar:</strong> {contrato.clientes.direccion_entrega?.split(',').pop()?.trim()}
                  </p>
                </div>
                
                <p className="text-gray-800 text-justify">
                  Chile Home hará entrega desde la fecha indicada, sin embargo, la entrega puede tener una demora de 1 o 2 días respecto a la fecha original estipulada debido a retrasos imprevistos producidos por las condiciones de tránsito en las carreteras, entregas a otros clientes, tiempo de carga del material en fábrica, entre otros. La empresa de transporte es externa a Chile Home y serán los encargados de ponerse en contacto con El Comprador para coordinar la llegada al terreno e indicar el horario de la entrega. Cualquier cambio de fecha de entrega solicitada por parte de El Comprador una vez que se ha confirmado la entrega a la empresa de transporte, estará sujeta a cobros de bodegaje y estadía del transportista.
                </p>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-medium text-red-900 text-justify">
                    ⚠️ <strong>Importante:</strong> Chile Home no se hace responsable de los deterioros o daños que pudieran afectar a los paneles y materiales una vez puestos a disposición de El Comprador y este haya firmado el certificado de conformidad respectivo.
                  </p>
                </div>
              </div>
            </div>

            {/* QUINTO CLAUSE */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Quinto:
              </h3>
              <div className="text-gray-800 leading-7 print:text-sm print:leading-6 pl-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-justify font-medium text-blue-900">
                    🔧 <strong>Instalación:</strong> Las cantidades de tablas en media luna van cubicadas para el metraje vendido y estipulado en el presente contrato de compraventa, por lo tanto, no se aceptará reclamo alguno en caso de que el profesional a cargo del armado no supiera instalar el kit, por lo que es responsabilidad de El Comprador tener un profesional capacitado para la instalación del mismo.
                  </p>
                </div>
              </div>
            </div>

            {/* SEXTO CLAUSE */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Sexto:
              </h3>
              <div className="text-gray-800 leading-7 print:text-sm print:leading-6 pl-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="font-bold text-purple-900 text-center text-lg mb-2">
                    👥 Requisito obligatorio para descarga
                  </p>
                  <p className="text-center font-medium text-purple-800">
                    El Comprador debe contar con <span className="text-xl font-bold">mínimo 4 personas</span> en el lugar de la entrega
                  </p>
                </div>
                
                <p className="text-gray-800 text-justify">
                  En caso de que el acceso al terreno no sea suficiente para la entrada del camión y/o camión y carro, la entrega será realizada lo más cerca del destino y hasta donde el camión pueda llegar con el fin de no poner en peligro la carga y al chofer.
                </p>
              </div>
            </div>

            {/* Observaciones */}
            {contrato.observaciones && (
              <div className="mb-6 bg-blue-50 p-4 border border-blue-200">
                <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase">Observaciones:</h4>
                <p className="text-sm text-gray-800">{contrato.observaciones}</p>
              </div>
            )}

            {/* SEPTIMO CLAUSE - Final Terms */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4 bg-gray-700 px-4 py-3 rounded shadow">
                Séptimo:
              </h3>
              <div className="text-gray-800 leading-7 print:text-sm print:leading-6 pl-4">
                <p className="text-gray-800 text-justify font-bold">
                  El presente instrumento se suscribe en dos ejemplares quedando uno en poder de El Comprador y otro en poder de El Vendedor.
                </p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-16 mb-8">
              <h3 className="text-center text-lg font-bold text-gray-900 mb-8">
                Firmas
              </h3>
              <div className="grid grid-cols-2 gap-32 text-center">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="border-b-2 border-gray-400 mb-4 h-40 flex items-center justify-center">
                    <img 
                      src="/firma-chilehome.png" 
                      alt="Firma Chile Home" 
                      className="h-32 max-w-full object-contain"
                      style={{
                        backgroundColor: 'transparent',
                        mixBlendMode: 'darken'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const span = document.createElement('span');
                        span.textContent = 'Firma del Vendedor';
                        span.className = 'text-gray-400 text-sm font-sans';
                        target.parentNode?.appendChild(span);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-900 font-sans">RUT: 77.930.819-7</p>
                    <p className="text-sm font-semibold text-gray-800 font-sans">Chile Home SPA</p>
                    <p className="text-xs text-gray-600 font-sans">El Vendedor</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="border-b-2 border-gray-400 mb-4 h-32 flex items-end justify-center">
                    <span className="text-gray-400 text-sm mb-2 font-sans">Firma del Comprador</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-900 font-sans">RUT: {contrato.clientes.rut}</p>
                    <p className="text-sm font-semibold text-gray-800 font-sans">{contrato.clientes.nombre}</p>
                    <p className="text-xs text-gray-600 font-sans">El Comprador</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Break Simulation for Plano - Improved Design */}
            <div className="mt-20 pt-8 border-t-4 border-orange-400">
              {/* Title at top */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 font-sans mb-2">PLANO ARQUITECTÓNICO</h2>
                <h3 className="text-xl font-bold text-orange-600 font-sans mb-1">Casa Modelo {contrato.modelo_casa}</h3>
                <p className="text-sm text-gray-600 font-sans">Versión zurda - Especificaciones técnicas</p>
              </div>
              
              {/* Enhanced Area for Blueprint with Drag & Drop */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 shadow-inner">
                {!planoPreview ? (
                  <div 
                    className={`text-center p-8 transition-all duration-200 ${
                      isDragging 
                        ? 'bg-gray-200 border-2 border-gray-400 rounded-lg' 
                        : 'hover:bg-gray-100 rounded-lg'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-gray-700">
                      <div className="mx-auto w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      <h4 className="text-lg font-bold text-gray-800 font-sans mb-2">
                        {isDragging ? 'Suelta el archivo aquí' : 'Adjuntar Plano Arquitectónico'}
                      </h4>
                      
                      <p className="text-sm text-gray-600 font-sans mb-6">
                        <span className="text-orange-400 font-semibold">Arrastra y suelta el archivo</span> <span className="text-orange-400 font-semibold">o</span> <span className="text-orange-400 font-semibold">haz click para seleccionar</span>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6 text-xs font-sans text-gray-600">
                        <div className="text-left">
                          • Planta arquitectónica<br/>
                          • Elevaciones frontales<br/>
                          • Detalles constructivos
                        </div>
                        <div className="text-left">
                          • Especificaciones técnicas<br/>
                          • Lista de materiales<br/>
                          • Instrucciones de montaje
                        </div>
                      </div>
                      
                      <input
                        type="file"
                        id="plano-upload"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileInputChange}
                      />
                      
                      <label
                        htmlFor="plano-upload"
                        className="inline-flex items-center px-6 py-3 border border-orange-400 text-base font-semibold rounded-lg text-orange-400 bg-white hover:bg-orange-50 transition-colors cursor-pointer font-sans shadow-sm"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Seleccionar Archivo
                      </label>
                      
                      <p className="text-xs text-gray-500 font-sans mt-4">
                        Formatos permitidos: PNG, JPG, JPEG, PDF (máx. 10MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-white rounded-lg p-4 shadow-md mb-4">
                      {planoFile?.type === 'application/pdf' ? (
                        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                          <div className="text-center">
                            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-600 font-sans font-medium">{planoFile?.name}</p>
                            <p className="text-sm text-gray-500 font-sans">Documento PDF</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={planoPreview}
                          alt="Vista previa del plano"
                          className="max-h-64 mx-auto object-contain rounded-lg"
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center gap-4">
                      <p className="text-green-600 font-sans font-medium">
                        ✓ Plano cargado: {planoFile?.name}
                      </p>
                      <button
                        onClick={removePlano}
                        className="text-red-600 hover:text-red-800 font-sans text-sm underline"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-8 py-4 text-center border-t">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src="/logo-chilehome.png" 
                alt="Chile Home Logo" 
                className="w-6 h-6 object-contain"
              />
              <p className="text-xs text-gray-600 font-sans font-medium">
                Chile Home SPA - RUT: 77.930.819-7 - Santiago, Chile
              </p>
            </div>
            <p className="text-xs text-gray-500 font-sans">www.chilehome.cl | contacto@chilehome.cl | +56 9 1234 5678</p>
          </div>
        </div>

        {/* Actions Section - Improved Design */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-5xl mx-auto mt-8">
          
          {/* Alert Messages */}
          {contrato.estado === 'borrador' && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
                <p className="font-medium text-yellow-800 font-sans text-center">
                  Este contrato está en borrador. <span className="text-sm text-yellow-700 font-normal">Completa la edición y valida para poder enviarlo al cliente.</span>
                </p>
              </div>
            </div>
          )}

          {contrato.estado === 'enviado' && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800 font-sans">
                    Contrato enviado exitosamente
                  </p>
                  <div className="text-sm text-green-700 font-sans mt-1 space-y-1">
                    <p>Enviado el: {contrato.fecha_envio ? new Date(contrato.fecha_envio).toLocaleString('es-CL') : 'Fecha no disponible'}</p>
                    <p>Cliente: {contrato.clientes.correo || 'Email no disponible'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              
              {/* Left side buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {canEdit && contrato.estado === 'borrador' && (
                  <button
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors font-sans"
                    onClick={() => router.push(`/editor/${contrato.id}`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Contrato
                  </button>
                )}

                <button
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md font-sans"
                  onClick={handleGenerarPDF}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </>
                  )}
                </button>
              </div>

              {/* Right side button */}
              {canSend && (
                <button
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md font-sans"
                  onClick={handleEnviarContrato}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar a Cliente
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}