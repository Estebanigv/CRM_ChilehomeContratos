'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  FileText, Plus, Settings, LogOut, Search, Filter, Download, Eye, Edit,
  Clock, CheckCircle, Send, Loader2, X, ChevronDown, AlertCircle,
  Phone, DollarSign, Calendar, MapPin, MessageSquare, User as UserIcon,
  BarChart3, Users, Truck, Home, TrendingUp, ArrowUpRight, ChevronRight,
  Mail, MoreVertical, Save, AlertTriangle, Upload, ArrowLeft, Edit3, Trash2,
  RefreshCw, Menu, ChevronLeft, FileSpreadsheet
} from 'lucide-react'
import ChileHomeLoader from './ChileHomeLoader'
import ContratoPrevisualizador from './ContratoPrevisualizador'
import CustomDatePicker from './CustomDatePicker'
import FichasEliminadas from './FichasEliminadas'
import ConfiguracionMensajes from './ConfiguracionMensajes'
import ListadoPlanos from './ListadoPlanos'
import CRMDashboard from './CRMDashboard'

import { safeParseJSON, formatCurrency as formatCurrencyUtil, formatRUT as formatRUTUtil } from '@/lib/utils'
import { fichasEliminadasStorage } from '@/lib/fichasEliminadasStorage'

interface Venta {
  id: string
  cliente_nombre: string
  cliente_rut: string
  cliente_telefono: string
  ejecutivo_nombre: string
  valor_total: number | string
  fecha_venta: string
  fecha_entrega: string
  direccion_entrega: string
  estado_crm: string
  observaciones_crm: string
  modelo_casa?: string
  supervisor_nombre?: string
  numero_contrato?: string
}

interface Cliente {
  id: string
  nombre: string
  email?: string
  estado: string
  fecha_ingreso: string
  telefono?: string
  rut?: string
  direccion?: string
  created_at: string
  updated_at: string
  crm_id?: string
  fecha_despacho?: string
}

interface TeamMember {
  id: string
  nombre: string
  iniciales: string
  cargo: string
  empresa?: string
  estado: 'Activo' | 'Ausente' | 'En Reunión'
  color: string
  ventasDelMes?: number
  montoTotal?: number
}

interface DashboardStats {
  totalVentas: number
  contratosListos: number
  ventasPendientes: number
  ventasRechazadas: number
  montoTotal: number
  ventasDelDia: number
  nuevosContratos: number
  tasaConversion: number
  tasaAprobacion: number
  ingresosRecurrentes: number
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const getRoleDisplay = (user: any): string => {
  if (!user?.role) return 'Usuario'

  // Caso especial: si es Esteban, siempre mostrar como Developer
  if (user.nombre && user.nombre.toLowerCase() === 'esteban') {
    return 'Desarrollador del Sistema'
  }

  switch (user.role) {
    case 'developer':
      return 'Desarrollador del Sistema'
    case 'admin':
      return 'Administrador'
    case 'supervisor':
      return 'Supervisor ChileHome'
    case 'ejecutivo':
      return 'Ejecutivo ChileHome'
    case 'transportista':
      return 'Transportista'
    default:
      return 'Usuario ChileHome'
  }
}

// Función para formatear fechas en formato DD/MM/YYYY (día/mes/año)
const formatDate = (dateString: string): string => {
  console.log(`🗓️ formatDate recibió:`, { dateString, tipo: typeof dateString, valor: dateString })
  
  if (!dateString || dateString === 'undefined' || dateString === 'null' || dateString === 'Por definir') {
    console.log(`🗓️ Fecha vacía o indefinida, retornando "Sin fecha"`)
    return 'Sin fecha'
  }
  
  try {
    // Limpiar fecha: remover espacios extra y texto adicional
    let cleanDateString = String(dateString).trim()
    
    // Si contiene fecha y hora, separar solo la fecha
    if (cleanDateString.includes(' ')) {
      const parts = cleanDateString.split(' ')
      // Tomar la primera parte que parezca una fecha (contiene guiones o barras)
      const datePart = parts.find(part => part.includes('-') || part.includes('/'))
      if (datePart) {
        cleanDateString = datePart
      }
    }
    
    console.log(`🗓️ Fecha limpia:`, cleanDateString)
    
    // Crear fecha y manejar diferentes formatos de entrada
    let date: Date
    
    // Formato DD/MM/YYYY o DD-MM-YYYY (formato chileno)
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(cleanDateString)) {
      const separator = cleanDateString.includes('/') ? '/' : '-'
      const [day, month, year] = cleanDateString.split(separator).map(Number)
      date = new Date(year, month - 1, day) // month es 0-indexed
      console.log(`🗓️ Procesando formato DD/MM/YYYY: ${day}/${month}/${year}`)
    }
    // Formato YYYY-MM-DD (formato ISO)
    else if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(cleanDateString)) {
      if (cleanDateString.includes('T')) {
        date = new Date(cleanDateString)
      } else {
        date = new Date(cleanDateString + 'T00:00:00')
      }
      console.log(`🗓️ Procesando formato YYYY-MM-DD:`, cleanDateString)
    }
    // Formato ISO completo
    else if (cleanDateString.includes('T')) {
      date = new Date(cleanDateString)
      console.log(`🗓️ Procesando formato ISO:`, cleanDateString)
    }
    // Intentar con Date constructor directo
    else {
      date = new Date(cleanDateString)
      console.log(`🗓️ Procesando con Date constructor:`, cleanDateString)
    }
    
    console.log(`🗓️ Fecha parseada:`, date, `isNaN:`, isNaN(date.getTime()))
    
    if (isNaN(date.getTime())) {
      console.log(`🚨 Fecha inválida después de parsear "${dateString}" -> "${cleanDateString}"`)
      return 'Fecha inválida'
    }
    
    // IMPORTANTE: Formatear explícitamente como DD/MM/YYYY (día/mes/año)
    const day = date.getDate().toString().padStart(2, '0')          // Día: 01-31
    const month = (date.getMonth() + 1).toString().padStart(2, '0') // Mes: 01-12 
    const year = date.getFullYear()                                 // Año: 2024
    
    // Retornar en formato DÍA/MES/AÑO
    const formatted = `${day}/${month}/${year}`
    console.log(`✅ Fecha formateada: "${dateString}" -> "${formatted}" (${day}/${month}/${year})`)
    return formatted
  } catch (error) {
    console.error('Error formateando fecha:', dateString, error)
    return 'Fecha inválida'
  }
}

// Función para formatear nombres y direcciones con capitalización correcta
const formatProperCase = (text: string): string => {
  if (!text || typeof text !== 'string') return ''
  
  return text.toLowerCase()
    .split(' ')
    .map(word => {
      // Excepciones que no deben capitalizarse
      const exceptions = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e']
      
      if (exceptions.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }
      
      // Capitalizar primera letra
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .trim()
}

// Función para obtener el color de estado correcto según especificaciones
const getEstadoStyle = (estado: string) => {
  const estadoLower = estado?.toLowerCase() || ''
  
  // Estados según el flujo del proceso
  if (estadoLower.includes('preingreso') || estadoLower.includes('pre-ingreso') || estadoLower.includes('ingreso')) {
    return 'bg-purple-100 text-purple-800 border-purple-200' // Púrpura para preingreso
  }
  if (estadoLower.includes('validacion') || estadoLower.includes('validación')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200' // Amarillo para validación
  }
  if (estadoLower.includes('contrato') && !estadoLower.includes('confirmacion')) {
    return 'bg-blue-100 text-blue-700 border-blue-200' // Azul para contrato (diferente de entrega)
  }
  if (estadoLower.includes('confirmacion') || estadoLower.includes('confirmación') || estadoLower.includes('entrega') && !estadoLower.includes('ok')) {
    return 'bg-orange-100 text-orange-800 border-orange-200' // Naranja para confirmación entrega
  }
  if (estadoLower.includes('produccion') || estadoLower.includes('producción') || estadoLower.includes('fabrica')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200' // Índigo para producción
  }
  if (estadoLower.includes('entrega ok')) {
    return 'bg-green-600 text-white border-green-700' // Verde intenso para entrega OK (100% completado)
  }
  if (estadoLower.includes('completado') || estadoLower.includes('finalizado')) {
    return 'bg-green-500 text-white border-green-600' // Verde medio para otros completados
  }
  if (estadoLower.includes('rechaz') || estadoLower.includes('cancel')) {
    return 'bg-red-100 text-red-800 border-red-200' // Rojo para rechazados/cancelados
  }
  
  return 'bg-gray-100 text-gray-800 border-gray-200' // Gris por defecto
}

const formatRUT = (rut: string): string => {
  if (!rut || typeof rut !== 'string') return ''
  
  const cleanRUT = rut.replace(new RegExp('[^0-9kK]', 'g'), '')
  if (cleanRUT.length <= 1) return cleanRUT
  
  const dv = cleanRUT.slice(-1).toUpperCase()
  const numbers = cleanRUT.slice(0, -1)
  
  if (numbers.length === 0) return dv
  
  const formattedNumbers = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formattedNumbers}-${dv}`
}

const formatPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''
  
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `+56 ${cleanPhone}`
  } else if (cleanPhone.length === 8) {
    return `+56 2 ${cleanPhone}`
  }
  return phone
}

// Función para formatear nombres completos de clientes (nombre y apellido)
const formatClientName = (name: string): string => {
  if (!name || typeof name !== 'string') return ''

  // Limpiar el nombre de cualquier texto entre paréntesis
  const cleanedName = name.replace(/\s*\([^)]*\)/g, '').trim()

  return cleanedName
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Función para formatear nombres de ejecutivos (solo primer nombre o nombres compuestos)
const formatExecutiveName = (name: string): string => {
  if (!name || typeof name !== 'string') return ''

  // Limpiar el nombre de cualquier texto entre paréntesis
  const cleanedName = name.replace(/\s*\([^)]*\)/g, '').trim()

  // Obtener solo el primer nombre o nombres compuestos
  const words = cleanedName.toLowerCase().split(' ')

  // Nombres compuestos comunes que deben mantenerse juntos
  const compoundNames = [
    'ana maría', 'ana maria', 'ana cristina', 'ana carolina', 'ana lucia', 'ana sofía',
    'maría josé', 'maría elena', 'maría teresa', 'maría carolina', 'maría paz',
    'josé luis', 'josé antonio', 'josé miguel', 'josé manuel', 'josé maría',
    'juan carlos', 'juan pablo', 'juan manuel', 'juan josé', 'juan antonio',
    'luis fernando', 'luis carlos', 'luis alberto', 'luis antonio',
    'carlos alberto', 'carlos eduardo', 'carlos andrés',
    'francisco javier', 'francisco josé',
    'pedro pablo', 'pedro luis',
    'diego alejandro', 'diego fernando'
  ]

  // Verificar si el nombre completo coincide con algún nombre compuesto
  const fullName = words.join(' ')
  for (const compound of compoundNames) {
    if (fullName.startsWith(compound)) {
      return compound
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }
  }

  // Si no es un nombre compuesto, solo devolver la primera palabra
  return words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : ''
}

// Función legacy para compatibilidad
const formatName = formatClientName

// Función para limpiar el nombre del vendedor (quitar texto entre paréntesis)
const cleanVendorName = (name: string): string => {
  if (!name || typeof name !== 'string') return ''
  // Quitar cualquier texto entre paréntesis y espacios extras
  return name.replace(/\s*\([^)]*\)/g, '').trim()
}

// Función para formatear el modelo de casa con metraje
const formatModeloCasa = (modelo: string | undefined, superficie: string | number | undefined): string => {
  if (!modelo) return 'No especificado'
  
  // Si el modelo ya incluye "Casa de" y metros cuadrados, devolverlo tal como está
  if (modelo.toLowerCase().includes('casa de') && modelo.includes('m²')) {
    return modelo
  }
  
  // Extraer el número de metros del modelo si viene en el formato "Modelo 36m²"
  const metrosMatch = modelo.match(/(\d+)\s*m²/)
  
  if (metrosMatch) {
    const metros = metrosMatch[1]
    return `Casa de ${metros} m²`
  }
  
  // Si no tiene formato completo, agregarlo con superficie si está disponible
  if (superficie) {
    return `Casa de ${superficie} m²`
  }
  
  return `Casa ${modelo}`
}

// Función para validar si todos los campos requeridos están completos
const validateContractData = (venta: any): { isComplete: boolean, missingFields: string[] } => {
  // Check if venta is null or undefined
  if (!venta) {
    return {
      isComplete: false,
      missingFields: ['Datos de venta no disponibles']
    }
  }
  
  const requiredFields = [
    { field: 'cliente_nombre', label: 'Nombre del cliente' },
    { field: 'cliente_rut', label: 'RUT del cliente' },
    { field: 'cliente_telefono', label: 'Teléfono del cliente' },
    { field: 'direccion_entrega', label: 'Dirección de entrega' },
    { field: 'modelo_casa', label: 'Modelo de casa' },
    { field: 'valor_total', label: 'Valor total' },
    { field: 'ejecutivo_nombre', label: 'Ejecutivo de ventas' }
    // NOTA: numero_contrato no es requerido porque se genera automáticamente
  ]
  
  const missingFields = requiredFields.filter(({ field }) => 
    !venta[field] || venta[field].toString().trim() === ''
  ).map(({ label }) => label)
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}

// Función para generar el próximo número de contrato
const generateNextContractNumber = (ventas: any[]): string => {
  // Obtener todos los números de contratos existentes desde el CRM
  // IMPORTANTE: Filtrar solo contratos reales (no '0' que significa sin contrato)
  const existingNumbers = ventas
    .map(venta => venta.numero_contrato)
    .filter(num => num && typeof num === 'string' && num !== '0') // Excluir '0' = sin contrato
    .map(num => {
      // Buscar patrones: YYYY-XXX, CONT-YYYY-XXX, o simplemente números al final
      const match = num.match(/(\d+)$/)
      return match ? parseInt(match[1]) : 0
    })
    .filter(num => num > 0)
  
  console.log('📊 Números de contratos existentes encontrados:', existingNumbers)
  
  // Encontrar el número más alto y sumar 1
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
  const nextNumber = maxNumber + 1
  
  // Generar el formato: YYYY-XXX (año actual + número con 3 dígitos)
  const currentYear = new Date().getFullYear()
  const formattedNumber = nextNumber.toString().padStart(3, '0')
  
  const newContractNumber = `${currentYear}-${formattedNumber}`
  console.log('🆕 Próximo número de contrato generado:', newContractNumber)
  
  return newContractNumber
}

// Función para formatear nombres correctamente
const formatearNombreVendedor = (nombre: string) => {
  return nombre
    .replace(' (Vendedor)', '')  // Quitar etiqueta (Vendedor)
    .replace(/\s+/g, ' ')        // Normalizar espacios
    .trim()
    .toLowerCase()               // Todo en minúsculas
    .split(' ')                  // Dividir por espacios
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)) // Primera letra mayúscula
    .join(' ')                   // Unir de nuevo
}

// Función para obtener ejecutivos dinámicamente desde el CRM
const obtenerEjecutivosDesdeCRM = (ventas: any[]) => {
  // Obtener todos los vendedores únicos del CRM
  const vendedoresUnicos = [...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))]
  
  // Mapear vendedores a empresas
  const ejecutivosChileHome: any[] = []
  const ejecutivosConstrumatter: any[] = []
  
  vendedoresUnicos.forEach((vendedor, index) => {
    const nombreOriginalCRM = vendedor.trim()                    // Original del CRM para matching
    const nombreFormateado = formatearNombreVendedor(vendedor)   // Formateado para mostrar
    const nombreParaMatching = vendedor.trim().toLowerCase().replace(/\s+/g, ' ') // Para comparación
    const iniciales = nombreFormateado.split(' ').map((p: string) => p.charAt(0)).join('').substring(0, 2)
    
    const ejecutivo = {
      nombre: nombreParaMatching,           // Para matching en minúsculas
      nombreOriginal: nombreOriginalCRM,   // Original del CRM
      nombreDisplay: nombreFormateado,     // Formateado para mostrar
      telefono: `+56 9 ${Math.floor(Math.random() * 90000000) + 10000000}`,
      empresa: index % 2 === 0 ? 'ChileHome' : 'Construmatter',
      iniciales: iniciales.toUpperCase()
    }
    
    // Asignar a empresa (50% a cada una, o según otro criterio)
    if (index % 2 === 0) {
      ejecutivosChileHome.push(ejecutivo)
    } else {
      ejecutivosConstrumatter.push(ejecutivo)
    }
  })
  
  return { ejecutivosChileHome, ejecutivosConstrumatter }
}

// Por defecto, usar configuración estática (se actualiza dinámicamente)
let ejecutivosChileHome = [
  { nombre: 'JULIETA CARRASCO', telefono: '+56 9 4475 0786', empresa: 'ChileHome', iniciales: 'JU' },
  { nombre: 'ANA MARIA GONZALEZ', telefono: '+56 9 5700 2841', empresa: 'ChileHome', iniciales: 'AM' },
  { nombre: 'Johana Morales Ovalle', telefono: '+56 9 4431 8105', empresa: 'ChileHome', iniciales: 'JO' }
]

let ejecutivosConstruMater = [
  { nombre: 'Claudia Huenteo', telefono: '+56 9 5700 2339', empresa: 'Construmatter', iniciales: 'CL' },
  { nombre: 'MILENE SEPULVEDA', telefono: '+56 9 5700 2708', empresa: 'Construmatter', iniciales: 'ML' }
]

// Todos los ejecutivos combinados
const todosLosEjecutivos = [...ejecutivosChileHome, ...ejecutivosConstruMater]

// Función para obtener el color de la etiqueta de estado según especificación del usuario
const getEstadoColor = (estado: string) => {
  if (!estado) return 'bg-gray-100 text-gray-800 border-gray-200'

  const estadoLower = estado.toLowerCase().trim()

  // Entrega OK (verde intenso) - 100% completado
  if (estadoLower.includes('entrega ok')) {
    return 'bg-green-600 text-white border-green-700'
  }

  // Contratos (azul) - contratos armados
  if (estadoLower.includes('contrato') ||
      estadoLower.includes('listo') ||
      estadoLower.includes('activ') ||
      estadoLower.includes('aprob')) {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  // Completados/Finalizados (verde medio)
  if (estadoLower.includes('completado') ||
      estadoLower.includes('finalizado') ||
      estadoLower.includes('entregado')) {
    return 'bg-green-500 text-white border-green-600'
  }

  // Confirmación de entrega (naranja) - en proceso
  if (estadoLower.includes('confirmacion') || estadoLower.includes('confirmación')) {
    return 'bg-orange-100 text-orange-800 border-orange-200'
  }

  // Validación (amarillo) - estados en validación/proceso
  if (estadoLower.includes('validad') ||
      estadoLower.includes('validacion') ||
      estadoLower === 'validación' ||
      estadoLower === 'validacion' ||
      estadoLower.includes('proceso') ||
      estadoLower.includes('revision') ||
      estadoLower.includes('analisis') ||
      estadoLower.includes('evaluacion') ||
      estadoLower.includes('pendiente')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }

  // Pre-ingreso (púrpura) - estados iniciales
  if (estadoLower.includes('pre-ingreso') ||
      estadoLower.includes('preingreso') ||
      estadoLower.includes('ingreso') ||
      estadoLower.includes('nuevo') ||
      estadoLower.includes('inicial')) {
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }

  // Estados rechazados/cancelados (rojo)
  if (estadoLower.includes('rechazad') ||
      estadoLower.includes('cancelad') ||
      estadoLower.includes('anulad') ||
      estadoLower.includes('suspendid')) {
    return 'bg-red-100 text-red-800 border-red-200'
  }

  // Por defecto: azul (pre-ingreso)
  return 'bg-blue-100 text-blue-800 border-blue-200'
}

// Simulación de rendimiento de ejecutivos (se reemplazará con datos del CRM)
const rendimientoEjecutivos = todosLosEjecutivos.slice(0, 5).map((ejecutivo, index) => ({
  id: String(index + 1),
  nombre: ejecutivo.nombre,
  iniciales: ejecutivo.iniciales,
  cargo: 'Ejecutivo de Ventas',
  empresa: ejecutivo.empresa,
  estado: ['Activo', 'En Reunión', 'Activo', 'Ausente', 'Activo'][index] as 'Activo' | 'Ausente' | 'En Reunión',
  color: ejecutivo.empresa === 'ChileHome' ? 'bg-blue-500' : 'bg-purple-500',
  ventasDelMes: [12, 8, 15, 6, 10][index],
  montoTotal: [2850000, 1920000, 3600000, 1440000, 2400000][index]
}))

const ventasMensuales = [
  { mes: 'Ene', valor: 180000 },
  { mes: 'Feb', valor: 210000 },
  { mes: 'Mar', valor: 150000 },
  { mes: 'Abr', valor: 290000 },
  { mes: 'May', valor: 180000 },
  { mes: 'Jun', valor: 250000 }
]

const Sidebar = React.forwardRef<HTMLDivElement, {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  collapsed: boolean
  toggleSidebar: () => void
}>(({ activeSection, setActiveSection, user, collapsed, toggleSidebar }, ref) => (
  <div ref={ref} className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} bg-white shadow-lg border-r border-gray-200 z-30 transition-all duration-300`}>
    <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-6'} border-b border-gray-200`}>
      {!collapsed && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CH</span>
          </div>
          <span className="text-xl font-bold text-gray-900">ChileHome</span>
        </div>
      )}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={collapsed ? 'Expandir menú' : 'Contraer menú'}
      >
        {collapsed ? <Menu className="h-5 w-5 text-gray-600" /> : <ChevronLeft className="h-5 w-5 text-gray-600" />}
      </button>
    </div>
    
    <nav className="mt-6">
      <div className="px-3 space-y-1">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'dashboard'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Dashboard' : ''}
        >
          <BarChart3 className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Dashboard'}
        </button>

        <button
          onClick={() => setActiveSection('contratos')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'contratos'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Contratos' : ''}
        >
          <FileText className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Contratos'}
        </button>

        <button
          onClick={() => setActiveSection('planos')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'planos'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Planos' : ''}
        >
          <Home className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Planos'}
        </button>

        <button
          onClick={() => setActiveSection('logistica')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'logistica'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Logística CRM' : ''}
        >
          <Truck className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Logística CRM'}
        </button>

        <button
          onClick={() => setActiveSection('equipo')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'equipo'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Equipo' : ''}
        >
          <Users className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Equipo'}
        </button>

        <button
          onClick={() => setActiveSection('mensajes')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'mensajes'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Mensajes' : ''}
        >
          <MessageSquare className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Mensajes'}
        </button>

        <button
          onClick={() => setActiveSection('configuracion')}
          className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-3 py-2.5'} text-[14px] font-medium rounded-lg transition-colors duration-200 ${
            activeSection === 'configuracion'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
          title={collapsed ? 'Configuración' : ''}
        >
          <Settings className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Configuración'}
        </button>
      </div>
    </nav>

    <div className="absolute bottom-0 w-full border-t border-gray-200">
      {/* Usuario Conectado */}
      <div className={`${collapsed ? 'p-2' : 'p-4'} border-b border-gray-100`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center" title={collapsed ? user?.nombre || 'Usuario' : ''}>
            <span className="text-white font-semibold text-sm">{(user?.nombre || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}</span>
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user?.nombre || user?.email?.split('@')[0] || 'Usuario'}</div>
                <div className="text-xs text-gray-500 truncate">{getRoleDisplay(user)}</div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </>
          )}
        </div>
      </div>

      <div className={collapsed ? 'p-2' : 'p-4'}>
        <button className={`w-full flex items-center ${collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2'} text-[14px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200`} title={collapsed ? 'Cerrar Sesión' : ''}>
          <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
          {!collapsed && 'Cerrar Sesión'}
        </button>
      </div>
    </div>
  </div>
))
Sidebar.displayName = 'Sidebar'

// Componente para el Dashboard Overview Ejecutivo
const DashboardOverview = ({
  stats,
  ventas,
  user,
  clientes,
  clientesLoading,
  clientesError,
  fechaInicio,
  fechaFin,
  setFechaInicio,
  setFechaFin,
  fetchVentas,
  fechaInicioProyecto,
  fechaHoy,
  applyingFilter,
  resetting,
  soloValidados,
  setSoloValidados,
  paginaActualVentas,
  setPaginaActualVentas
}: {
  stats: DashboardStats,
  ventas: Venta[],
  user: any,
  clientes: Cliente[],
  clientesLoading: boolean,
  clientesError: string | null,
  fechaInicio: string,
  fechaFin: string,
  setFechaInicio: (fecha: string) => void,
  setFechaFin: (fecha: string) => void,
  fetchVentas: (fechaInicio?: string, fechaFin?: string, isInitialLoad?: boolean, buttonType?: 'apply' | 'reset') => void,
  fechaInicioProyecto: string,
  fechaHoy: string,
  applyingFilter: boolean,
  resetting: boolean,
  soloValidados: boolean,
  setSoloValidados: (value: boolean) => void,
  paginaActualVentas: number,
  setPaginaActualVentas: (page: number) => void
}) => {
  const mesActual = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  const diaActual = new Date().getDate()
  const periodoActivo = `${mesActual} - ${diaActual}`
  const diasTranscurridos = new Date().getDate() // Días transcurridos del mes actual

  // Estados para filtros de clientes
  const [filtros, setFiltros] = useState({
    id: '',
    nombre: '',
    ejecutivo: '',
    fecha: '',
    fechaInicio: '',
    fechaFin: '',
    estado: '' // Nuevo filtro para estado del CRM
  })

  // Estados únicos del CRM
  const [estadosUnicos, setEstadosUnicos] = useState<string[]>([])

  // Estados para paginación de clientes
  const [paginaActualClientes, setPaginaActualClientes] = useState(1)
  const [clientesPorPagina, setClientesPorPagina] = useState(5)
  const [mostrarInputPersonalizado, setMostrarInputPersonalizado] = useState(false)
  const [valorPersonalizado, setValorPersonalizado] = useState('')
  
  // Estados para paginación de ventas (usando el estado del componente padre)
  const ventasPorPagina = 5
  
  // Las estadísticas ya vienen calculadas desde el componente padre con los datos filtrados
  
  // Determinar qué ventas usar para filtrar clientes
  const ventasParaClientes = useMemo(() => {
    // IMPORTANTE: 'ventas' ya viene filtrado por el período principal del calendario
    // Si NO hay filtros locales, usar las ventas del período principal
    if (!filtros.fechaInicio && !filtros.fechaFin && !filtros.fecha) {
      console.log('📅 Usando período principal del calendario, ventas:', ventas.length)
      return ventas
    }

    // Si hay filtros locales de fecha, necesitamos filtrar desde TODAS las ventas
    // Pero aquí solo tenemos las ventas del período principal...
    // Para verdadera independencia, necesitaríamos acceso a todas las ventas
    console.log('🔍 Filtros locales activos (limitados al período principal):', {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      fecha: filtros.fecha,
      totalVentasDisponibles: ventas.length
    })

      return ventas.filter(venta => {
        if (!venta.fecha_venta) return false

        try {
          // Normalizar fechas para comparación (solo YYYY-MM-DD)
          const fechaVentaStr = venta.fecha_venta.split('T')[0] // En caso de que tenga timestamp

          // Validar formato de fecha antes de crear Date object
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVentaStr)) {
            console.warn('📅 Formato de fecha inválido:', fechaVentaStr)
            return false
          }

          const fechaVenta = new Date(fechaVentaStr + 'T12:00:00') // Usar mediodía para evitar timezone issues

          // Validar que la fecha sea válida
          if (isNaN(fechaVenta.getTime())) {
            console.warn('📅 Fecha inválida:', fechaVentaStr)
            return false
          }

          if (filtros.fecha) {
            const fechaEspecificaStr = filtros.fecha
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEspecificaStr)) return false

            const fechaEspecifica = new Date(fechaEspecificaStr + 'T12:00:00')
            if (isNaN(fechaEspecifica.getTime())) return false

            console.log('📅 Comparando fecha específica:', {
              venta: fechaVentaStr,
              filtro: fechaEspecificaStr,
              match: fechaVentaStr === fechaEspecificaStr
            })

            return fechaVentaStr === fechaEspecificaStr
          } else if (filtros.fechaInicio && filtros.fechaFin) {
            const fechaInicioStr = filtros.fechaInicio
            const fechaFinStr = filtros.fechaFin

            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicioStr) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaFinStr)) {
              return false
            }

            const fechaInicio = new Date(fechaInicioStr + 'T00:00:00')
            const fechaFin = new Date(fechaFinStr + 'T23:59:59')

            if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
              return false
            }

            const estaEnRango = fechaVenta >= fechaInicio && fechaVenta <= fechaFin

            console.log('📅 Comparando rango:', {
              venta: fechaVentaStr,
              inicio: fechaInicioStr,
              fin: fechaFinStr,
              enRango: estaEnRango
            })

            return estaEnRango
          } else if (filtros.fechaInicio) {
            const fechaInicioStr = filtros.fechaInicio
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicioStr)) return false

            const fechaInicio = new Date(fechaInicioStr + 'T00:00:00')
            if (isNaN(fechaInicio.getTime())) return false

            console.log('📅 Comparando desde fecha:', {
              venta: fechaVentaStr,
              inicio: fechaInicioStr,
              desdeFecha: fechaVenta >= fechaInicio
            })

            return fechaVenta >= fechaInicio
          }

          return true
        } catch (error) {
          console.error('📅 Error procesando fecha de venta:', venta.fecha_venta, error)
          return false
        }
      })
    // Aplicar filtros locales sobre las ventas del período principal disponible
    // NOTA: Para filtrado completamente independiente, necesitaríamos todas las ventas del sistema
  }, [ventas, filtros.fechaInicio, filtros.fechaFin, filtros.fecha])

  // Generar clientes basados en las ventas filtradas por período
  const clientesBasePeriodo = useMemo(() => {
    // Si NO hay filtros locales, usar los clientes del período principal
    if (!filtros.fechaInicio && !filtros.fechaFin && !filtros.fecha) {
      console.log('📊 Usando clientes del período principal:', clientes.length)
      return clientes
    }

    // Si hay filtros locales, generar clientes desde las ventas filtradas localmente
    console.log('📊 Generando clientes desde filtros locales, ventas filtradas:', ventasParaClientes.length)
    const clientesMap = new Map<string, any>()

    ventasParaClientes.forEach(venta => {
      try {
        const clienteKey = venta.cliente_nombre?.trim() || `cliente_${Date.now()}_${Math.random()}`

        if (!clientesMap.has(clienteKey)) {
          clientesMap.set(clienteKey, {
            id: venta.id,
            nombre: venta.cliente_nombre || 'Sin nombre',
            email: undefined,
            estado: venta.estado_crm || 'Ingreso',
            fecha_ingreso: venta.fecha_venta,
            fecha_despacho: venta.fecha_entrega,
            telefono: venta.cliente_telefono,
            rut: venta.cliente_rut,
            direccion: venta.direccion_entrega,
            created_at: venta.fecha_venta,
            updated_at: new Date().toISOString()
          })
        }
      } catch (ventaError) {
        console.error('Error processing venta:', ventaError)
      }
    })

    return Array.from(clientesMap.values())
      .sort((a, b) => {
        const dateA = new Date(b.fecha_ingreso || '1970-01-01').getTime()
        const dateB = new Date(a.fecha_ingreso || '1970-01-01').getTime()
        return dateA - dateB
      })
  }, [filtros.fechaInicio, filtros.fechaFin, filtros.fecha, clientes, ventasParaClientes])

  // Filtrado de clientes
  const clientesFiltrados = useMemo(() => {
    return clientesBasePeriodo.filter(cliente => {
      // Filtro por ID
      if (filtros.id && !cliente.id.toLowerCase().includes(filtros.id.toLowerCase())) {
        return false
      }

      // Filtro por nombre
      if (filtros.nombre && !cliente.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
        return false
      }

      // Filtro por ejecutivo
      if (filtros.ejecutivo) {
        const venta = ventasParaClientes.find(v => v.cliente_nombre === cliente.nombre)
        const ejecutivo = venta?.ejecutivo_nombre || ''
        if (!ejecutivo.toLowerCase().includes(filtros.ejecutivo.toLowerCase())) {
          return false
        }
      }

      // Filtro por estado
      if (filtros.estado && filtros.estado !== 'todos') {
        if (cliente.estado !== filtros.estado) {
          return false
        }
      }

      return true
    })
  }, [clientesBasePeriodo, filtros, ventasParaClientes])

  // Actualizar estados únicos cuando cambien las ventas
  useEffect(() => {
    if (ventas && ventas.length > 0) {
      console.log('🔍 ANALIZANDO ESTADOS DEL CRM:')
      console.log(`📊 Total de ventas: ${ventas.length}`)

      // Contar todos los estados
      const estadosCount = {}
      ventas.forEach(venta => {
        const estado = venta.estado_crm || 'SIN ESTADO'
        estadosCount[estado] = (estadosCount[estado] || 0) + 1
      })

      console.log('📈 CONTEO DE ESTADOS:')
      Object.entries(estadosCount).forEach(([estado, cantidad]) => {
        console.log(`  ${estado}: ${cantidad} casos`)
      })

      const estados = [...new Set(ventas.map(v => v.estado_crm).filter(Boolean))].sort()
      setEstadosUnicos(estados)

      console.log('🏷️ Estados únicos ordenados:', estados)
      console.log('🔍 VERIFICACIÓN DE DATOS PARA FILTROS:')
      console.log(`   - Total ventas procesadas: ${ventas.length}`)
      console.log(`   - Estados únicos detectados: ${estados.length}`)
      console.log('   - Lista completa de estados:', estados)

      // Debug específico para Entrega OK en los datos que se usan para filtros
      const entregaFilterData = ventas.filter(v =>
        v.estado_crm && (
          v.estado_crm.toLowerCase().includes('entrega') ||
          v.estado_crm.toLowerCase().includes('entrega ok') ||
          v.estado_crm === 'Entrega OK'
        )
      )
      console.log(`   ✅ Ventas con "Entrega" para filtros: ${entregaFilterData.length}`)
      if (entregaFilterData.length > 0) {
        console.log('   📋 Estados de entrega encontrados:', [...new Set(entregaFilterData.map(v => v.estado_crm))])
      }

      // Verificar específicamente "Entrega OK"
      const entregaOK = ventas.filter(v =>
        v.estado_crm && v.estado_crm.toLowerCase().includes('entrega')
      )
      console.log(`✅ CASAS CON "ENTREGA" EN ESTADO: ${entregaOK.length}`)
      if (entregaOK.length > 0) {
        console.log('Estados con "entrega":', entregaOK.map(v => v.estado_crm))
      }

      console.log('🔍 BÚSQUEDA DE "ENTREGA OK" EXPANDIDA:')
      console.log(`   - Período ampliado: ${fechaInicio || 'fecha inicio'} al ${fechaFin || 'fecha fin'}`)
      console.log('   - Ahora buscando en los últimos 3 meses para encontrar estados de entrega')
      if (entregaOK.length === 0) {
        console.log('   ⚠️  NO hay registros con "Entrega OK" en este período extendido')
        console.log('   💡 Considera revisar si el estado se llama diferente en el CRM')
      } else {
        console.log(`   ✅ ENCONTRADOS ${entregaOK.length} registros con estados de entrega`)
      }
    }
  }, [ventas])

  // Debug: Analizar discrepancia entre stats principales y gestión de clientes
  useEffect(() => {
    console.log('🔍 DEBUG - Análisis de datos:')
    console.log('📊 Stats principales (stats prop):', stats.totalVentas, 'ventas')
    console.log('📊 Ventas disponibles en componente:', ventas.length)
    console.log('📊 Clientes disponibles en componente:', clientes.length)

    // Debug: Mostrar rango de fechas reales en los datos
    const fechasVentas = ventas.map(v => v.fecha_venta).filter(Boolean).sort()
    console.log('📅 Rango de fechas en datos:', {
      primera: fechasVentas[0],
      ultima: fechasVentas[fechasVentas.length - 1],
      total: fechasVentas.length
    })

    // Debug: Filtros actuales
    console.log('🔧 Filtros actuales:', {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      fecha: filtros.fecha
    })
    console.log('📊 Ventas para clientes (filtradas):', ventasParaClientes.length)
    console.log('📊 Clientes base período:', clientesBasePeriodo.length)
    console.log('📊 Clientes filtrados finales:', clientesFiltrados.length)
    console.log('📊 Filtros activos:', {
      id: filtros.id,
      nombre: filtros.nombre,
      ejecutivo: filtros.ejecutivo,
      fecha: filtros.fecha,
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin
    })
  }, [stats, ventas, clientes, ventasParaClientes, clientesBasePeriodo, clientesFiltrados, filtros])

  // Calcular estadísticas locales basadas en los clientes filtrados
  const statsLocales = useMemo(() => {
    // Si NO hay filtros locales, usar las estadísticas principales para mantener sincronización
    if (!filtros.fechaInicio && !filtros.fechaFin && !filtros.fecha && !filtros.id && !filtros.nombre && !filtros.ejecutivo && !filtros.estado) {
      console.log('📊 Usando estadísticas principales para sincronización')
      return {
        totalVentas: stats.totalVentas,
        contratosListos: stats.contratosListos,
        ventasPendientes: stats.ventasPendientes,
        ventasRechazadas: stats.ventasRechazadas,
        montoTotal: stats.montoTotal,
        tasaAprobacion: stats.tasaAprobacion
      }
    }

    // Si hay filtros activos, calcular estadísticas desde los datos filtrados
    console.log('📊 Calculando estadísticas desde datos filtrados localmente')
    const ventasActuales = ventasParaClientes

    const contratosListos = ventasActuales.filter(v => {
      if (!v.estado_crm) return false
      const estadoLower = v.estado_crm.toLowerCase().trim()
      return estadoLower.includes('listo') ||
             estadoLower.includes('finalizado') ||
             estadoLower.includes('completado') ||
             estadoLower.includes('terminado') ||
             estadoLower.includes('entregado')
    }).length

    const ventasPendientes = ventasActuales.filter(v => {
      if (!v.estado_crm) return false
      const estadoLower = v.estado_crm.toLowerCase().trim()
      return estadoLower.includes('pendiente') ||
             estadoLower.includes('proceso') ||
             estadoLower.includes('revision') ||
             estadoLower.includes('validacion') ||
             estadoLower.includes('ingreso')
    }).length

    const ventasRechazadas = ventasActuales.filter(v => {
      if (!v.estado_crm) return false
      const estadoLower = v.estado_crm.toLowerCase().trim()
      return estadoLower.includes('rechazad') ||
             estadoLower.includes('cancelad') ||
             estadoLower.includes('anulad')
    }).length

    const montoTotal = ventasActuales.reduce((sum, v) =>
      sum + (typeof v.valor_total === 'number' ? v.valor_total : parseFloat(v.valor_total?.toString()) || 0), 0
    )

    return {
      totalVentas: ventasActuales.length,
      contratosListos,
      ventasPendientes,
      ventasRechazadas,
      montoTotal,
      tasaAprobacion: ventasActuales.length > 0 ? Math.round((contratosListos / ventasActuales.length) * 100) : 0
    }
  }, [ventasParaClientes, filtros, stats])

  // Paginación de clientes filtrados
  const indiceInicial = (paginaActualClientes - 1) * clientesPorPagina
  const indiceFinal = indiceInicial + clientesPorPagina
  const clientesPaginados = clientesFiltrados.slice(indiceInicial, indiceFinal)
  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina)

  // Función para descargar contratos en Excel
  const descargarExcelContratos = useCallback(() => {
    const datosContratos = clientesFiltrados.map(cliente => {
      const venta = ventas.find(v => v.cliente_nombre === cliente.nombre)
      return {
        ID: cliente.id,
        Cliente: formatClientName(cliente.nombre),
        Estado: cliente.estado,
        Ejecutivo: venta?.ejecutivo_nombre ? formatExecutiveName(cleanVendorName(venta.ejecutivo_nombre)) : 'Sin asignar',
        'Fecha Ingreso': formatDate(cliente.fecha_ingreso),
        'Valor Total': venta?.valor_total ? formatCurrency(venta.valor_total) : 'N/A',
        'Teléfono': cliente.telefono || 'N/A',
        'Email': cliente.email || 'N/A'
      }
    })

    const csv = [
      Object.keys(datosContratos[0] || {}).join(','),
      ...datosContratos.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contratos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [clientesFiltrados, ventas])

  // Función para descargar leads en Excel
  const descargarExcelLeads = useCallback(() => {
    const datosLeads = clientesFiltrados.filter(cliente =>
      cliente.estado.toLowerCase().includes('lead') ||
      cliente.estado.toLowerCase().includes('preingreso') ||
      cliente.estado.toLowerCase().includes('ingreso')
    ).map(cliente => {
      const venta = ventas.find(v => v.cliente_nombre === cliente.nombre)
      return {
        ID: cliente.id,
        Cliente: formatClientName(cliente.nombre),
        Estado: cliente.estado,
        Ejecutivo: venta?.ejecutivo_nombre ? formatExecutiveName(cleanVendorName(venta.ejecutivo_nombre)) : 'Sin asignar',
        'Fecha Ingreso': formatDate(cliente.fecha_ingreso),
        'Teléfono': cliente.telefono || 'N/A',
        'Email': cliente.email || 'N/A',
        'Fuente': venta?.fuente_lead || 'N/A'
      }
    })

    const csv = [
      Object.keys(datosLeads[0] || {}).join(','),
      ...datosLeads.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [clientesFiltrados, ventas])

  // Handler para cambiar el número de elementos por página
  const handleClientesPorPaginaChange = (nuevaCantidad: number | string) => {
    if (nuevaCantidad === 'personalizado') {
      setMostrarInputPersonalizado(true)
      return
    }
    setMostrarInputPersonalizado(false)
    setClientesPorPagina(Number(nuevaCantidad))
    setPaginaActualClientes(1) // Reset a la primera página
  }

  // Handler para aplicar valor personalizado
  const handleValorPersonalizadoSubmit = () => {
    const valor = parseInt(valorPersonalizado)
    if (valor && valor > 0 && valor <= 10000) { // Límite razonable
      setClientesPorPagina(valor)
      setPaginaActualClientes(1)
      setMostrarInputPersonalizado(false)
      setValorPersonalizado('')
    }
  }

  // Handler para cancelar input personalizado
  const handleCancelarPersonalizado = () => {
    setMostrarInputPersonalizado(false)
    setValorPersonalizado('')
  }

  // Función para generar números de página optimizada
  const generarNumerosPagina = () => {
    const maxPaginasVisibles = 7
    const numeros: (number | string)[] = []

    if (totalPaginas <= maxPaginasVisibles) {
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        numeros.push(i)
      }
    } else {
      // Lógica para páginas largas
      if (paginaActualClientes <= 4) {
        // Cerca del inicio
        for (let i = 1; i <= 5; i++) {
          numeros.push(i)
        }
        numeros.push('...')
        numeros.push(totalPaginas)
      } else if (paginaActualClientes >= totalPaginas - 3) {
        // Cerca del final
        numeros.push(1)
        numeros.push('...')
        for (let i = totalPaginas - 4; i <= totalPaginas; i++) {
          numeros.push(i)
        }
      } else {
        // En el medio
        numeros.push(1)
        numeros.push('...')
        for (let i = paginaActualClientes - 1; i <= paginaActualClientes + 1; i++) {
          numeros.push(i)
        }
        numeros.push('...')
        numeros.push(totalPaginas)
      }
    }

    return numeros
  }
  
  // Paginación de ventas - ventas ya viene filtrada desde el componente padre
  const ventasParaMostrar = ventas.filter((v: any) => !soloValidados || v.estado_crm?.toLowerCase().includes('validado') || v.estado_crm?.toLowerCase().includes('completado'))
  const indiceInicialVentas = (paginaActualVentas - 1) * ventasPorPagina
  const indiceFinalVentas = indiceInicialVentas + ventasPorPagina
  const ventasPaginadas = ventasParaMostrar.slice(indiceInicialVentas, indiceFinalVentas)
  const totalPaginasVentas = Math.ceil(ventasParaMostrar.length / ventasPorPagina)
  
  // Datos para los gráficos de ventas mensuales
  const ventasMensuales = [
    { mes: 'Ene', valor: 218 },
    { mes: 'Feb', valor: 318 },
    { mes: 'Mar', valor: 180 },
    { mes: 'Abr', valor: 270 },
    { mes: 'May', valor: 240 },
    { mes: 'Jun', valor: 290 }
  ]

  // Datos para nuevos clientes
  const nuevosClientes = [
    { mes: 'Ene', valor: 12 },
    { mes: 'Feb', valor: 19 },
    { mes: 'Mar', valor: 15 },
    { mes: 'Abr', valor: 25 },
    { mes: 'May', valor: 22 },
    { mes: 'Jun', valor: 28 }
  ]
  
  return (
    <div className="space-y-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Información General de ventas</h1>
          <p className="text-gray-600">Validación de contratos</p>
        </div>
        
        {/* Filtro de fechas con rango */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-fit">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Período:</span>
              <CustomDatePicker
                isRange={true}
                startDate={fechaInicio ? (() => {
                  const parts = fechaInicio.split('-');
                  if (parts.length === 3) {
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  }
                  return null;
                })() : null}
                endDate={fechaFin ? (() => {
                  const parts = fechaFin.split('-');
                  if (parts.length === 3) {
                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                  }
                  return null;
                })() : null}
                onRangeChange={(startDate, endDate) => {
                  if (!startDate || !endDate) return;

                  const startString = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`
                  const endString = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`

                  setFechaInicio(startString)
                  setFechaFin(endString)
                  // Ejecutar búsqueda automáticamente cuando se aplica la selección de fechas
                  fetchVentas(startString, endString, false, 'apply')
                }}
                minDate={new Date(fechaInicioProyecto)}
                maxDate={new Date()}
                placeholder="Seleccionar período"
                className="w-56"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  fetchVentas(fechaInicio, fechaFin, false, 'apply')
                }}
                disabled={applyingFilter}
                className={`px-3 py-1 text-white rounded text-sm transition-all duration-200 flex items-center gap-1 ${
                  applyingFilter 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                }`}
              >
                {applyingFilter && <Loader2 className="h-3 w-3 animate-spin" />}
                {applyingFilter ? 'Aplicando...' : 'Aplicar'}
              </button>
              
              <button
                onClick={() => {
                  // Restaurar a las fechas por defecto del proyecto (septiembre 2024)
                  setFechaInicio(fechaInicioDefecto)
                  setFechaFin(fechaFinDefecto)
                  fetchVentas(fechaInicioDefecto, fechaFinDefecto, false, 'reset')
                }}
                disabled={resetting}
                className={`p-2 rounded text-sm transition-all duration-200 flex items-center justify-center ${
                  resetting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                }`}
                title="Limpiar y restaurar al período actual"
              >
                {resetting ?
                  <Loader2 className="h-4 w-4 animate-spin" /> :
                  <RefreshCw className="h-4 w-4" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas principales CRM - Ancho total */}
      <div className="flex gap-4 w-full mb-8">
        {/* Ventas Totales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-gray-900">{statsLocales.totalVentas.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Ventas totales</p>
            </div>
          </div>
        </div>

        {/* Estados del CRM dinámicamente */}
        {(() => {
          // Agrupar ventas por estado
          const estadosMap = new Map()
          ventasParaClientes.forEach(venta => {
            const estado = venta.estado_crm || 'Sin estado'
            estadosMap.set(estado, (estadosMap.get(estado) || 0) + 1)
          })

          // Ordenar por cantidad de mayor a menor y tomar todos los estados
          const estadosOrdenados = Array.from(estadosMap.entries())
            .sort((a, b) => b[1] - a[1])

          return estadosOrdenados.map(([estado, cantidad]) => {
            // Asignar colores según el estado - COLORES ESPECÍFICOS
            let bgColor = 'bg-gray-500'
            let icon = Clock

            const estadoLower = estado.toLowerCase()

            // Verde intenso para Entrega OK (100% completado)
            if (estadoLower.includes('entrega ok')) {
              bgColor = 'bg-green-600'
              icon = CheckCircle
            }
            // Azul para Contratos (diferente de entrega)
            else if (estadoLower.includes('contrato') ||
                estadoLower.includes('listo') ||
                estadoLower.includes('activ') ||
                estadoLower.includes('aprob')) {
              bgColor = 'bg-blue-500'
              icon = CheckCircle
            }
            // Verde medio para Completados/Finalizados
            else if (estadoLower.includes('completado') ||
                estadoLower.includes('finalizado') ||
                estadoLower.includes('entregado') ||
                estadoLower.includes('terminado')) {
              bgColor = 'bg-green-500'
              icon = CheckCircle
            }
            // Naranja para Confirmación de entrega (en proceso)
            else if (estadoLower.includes('confirmacion') ||
                     estadoLower.includes('confirmación') ||
                     (estadoLower.includes('entrega') && !estadoLower.includes('ok'))) {
              bgColor = 'bg-orange-500'
              icon = Clock
            }
            // Amarillo para Validación
            else if (estadoLower.includes('validac') || estadoLower.includes('validando') || estadoLower.includes('revisión')) {
              bgColor = 'bg-yellow-500'
              icon = Clock
            }
            // Púrpura para Pre ingreso o Ingreso
            else if (estadoLower.includes('pre') || estadoLower.includes('ingreso')) {
              bgColor = 'bg-purple-500'
              icon = UserIcon
            }
            // Rojo para Rechazo
            else if (estadoLower.includes('rechaz') || estadoLower.includes('cancel') || estadoLower.includes('anulad')) {
              bgColor = 'bg-red-500'
              icon = X
            }
            // Otros estados
            else if (estadoLower.includes('proceso') || estadoLower.includes('tramite')) {
              bgColor = 'bg-purple-500'
              icon = Loader2
            }
            else if (estadoLower.includes('pendiente')) {
              bgColor = 'bg-orange-500'
              icon = AlertCircle
            }

            const IconComponent = icon

            return (
              <div key={estado} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-gray-900">{cantidad}</p>
                    <p className="text-sm text-gray-500 truncate" title={estado}>{estado}</p>
                  </div>
                </div>
              </div>
            )
          })
        })()}
      </div>

      {/* Resumen financiero */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Resumen Financiero del Período</h3>
            <p className="text-sm text-gray-600">Monto total de ventas en el rango seleccionado</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(statsLocales.montoTotal)}</p>
            <p className="text-sm text-gray-500">Tasa de aprobación: {statsLocales.tasaAprobacion}%</p>
          </div>
        </div>
      </div>

      {/* Gestión de Clientes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
              <p className="text-sm text-gray-500">Administra y monitorea todos tus clientes</p>
            </div>

            {/* Filtros en la misma línea */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex-wrap">
                <div className="relative w-32">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                  <input
                    type="text"
                    placeholder="ID..."
                    value={filtros.id}
                    onChange={(e) => setFiltros(prev => ({ ...prev, id: e.target.value }))}
                    className="pl-10 pr-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full bg-white shadow-sm"
                  />
                </div>

                <div className="relative w-40">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                  <input
                    type="text"
                    placeholder="Nombre..."
                    value={filtros.nombre}
                    onChange={(e) => setFiltros(prev => ({ ...prev, nombre: e.target.value }))}
                    className="pl-10 pr-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full bg-white shadow-sm"
                  />
                </div>

                <div className="relative w-36">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                  <input
                    type="text"
                    placeholder="Ejecutivo..."
                    value={filtros.ejecutivo}
                    onChange={(e) => setFiltros(prev => ({ ...prev, ejecutivo: e.target.value }))}
                    className="pl-10 pr-4 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full bg-white shadow-sm"
                  />
                </div>

                <div className="relative min-w-[200px]">
                  <Filter className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 z-10" />
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                    className="pl-10 pr-8 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full appearance-none bg-white hover:border-blue-400 transition-colors cursor-pointer shadow-sm text-gray-700"
                    style={{
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23007BFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.2em 1.2em'
                    }}
                  >
                    <option value="">Todos los estados</option>
                    {estadosUnicos.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                  {filtros.estado && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold pulse">
                      ✓
                    </span>
                  )}
                </div>


                <button
                  onClick={() => setFiltros({ id: '', nombre: '', ejecutivo: '', estado: '', fecha: '', fechaInicio: '', fechaFin: '' })}
                  className="p-2 text-gray-600 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                  title="Limpiar filtros"
                >
                  <X className="h-4 w-4" />
                </button>

                <button
                  onClick={() => descargarExcelContratos()}
                  className="p-2 text-green-600 bg-white hover:bg-green-50 border border-gray-300 rounded-lg transition-colors"
                  title="Descargar contratos en Excel"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() => descargarExcelLeads()}
                  className="p-2 text-blue-600 bg-white hover:bg-blue-50 border border-gray-300 rounded-lg transition-colors"
                  title="Descargar leads en Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>

                {(filtros.id || filtros.nombre || filtros.ejecutivo || filtros.estado || filtros.fecha || filtros.fechaInicio || filtros.fechaFin) && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''}
                  </span>
                )}
            </div>
          </div>

          <div className="overflow-x-auto bg-gray-50 rounded-lg p-1">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 rounded-lg">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 rounded-l-lg">Cliente</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ejecutivo</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fecha Ingreso</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 rounded-r-lg">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                        <span className="text-gray-500">Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : clientesError ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <div className="text-red-600">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                        <p>{clientesError}</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Recargar página
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : clientesPaginados.length > 0 ? (
                  clientesPaginados.map((cliente, index) => (
                    <tr key={cliente.id} className="bg-white hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              <span className="text-xs text-gray-500 font-normal">ID {cliente.crm_id || cliente.id}:</span> {formatClientName(cliente.nombre)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {cliente.rut ? `RUT: ${cliente.rut}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold border-2 ${getEstadoColor(cliente.estado)}`}>
                          {cliente.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">
                          {(() => {
                            const venta = ventas.find(v => v.cliente_nombre === cliente.nombre);
                            const ejecutivo = venta?.ejecutivo_nombre;
                            return ejecutivo ? formatExecutiveName(cleanVendorName(ejecutivo)) : 'Sin asignar';
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{formatDate(cliente.fecha_ingreso)}</span>
                          <span className="text-xs text-gray-500">
                            {(() => {
                              if (!cliente.fecha_ingreso) return '';

                              try {
                                // Si la fecha contiene hora (formato: "YYYY-MM-DD HH:MM:SS" o similar)
                                const fechaStr = String(cliente.fecha_ingreso);

                                // Si incluye espacio, probablemente tiene hora
                                if (fechaStr.includes(' ')) {
                                  const partes = fechaStr.split(' ');
                                  if (partes.length >= 2) {
                                    const hora = partes[1];
                                    // Si es formato HH:MM:SS, tomar solo HH:MM
                                    return hora.substring(0, 5);
                                  }
                                }

                                // Si es formato ISO con T
                                if (fechaStr.includes('T')) {
                                  const fecha = new Date(fechaStr);
                                  if (!isNaN(fecha.getTime())) {
                                    return fecha.toLocaleTimeString('es-CL', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                  }
                                }

                                return '';
                              } catch (e) {
                                return '';
                              }
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Ver detalles del cliente"
                            onClick={() => {
                              // Buscar el contrato asociado al cliente
                              const venta = ventas.find(v => v.cliente_nombre === cliente.nombre);
                              if (venta?.id) {
                                window.open(`/previsualizador/${venta.id}`, '_blank');
                              } else {
                                alert('No se encontró contrato asociado a este cliente');
                              }
                            }}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Enviar email al cliente"
                            onClick={() => {
                              if (cliente.email) {
                                window.open(`mailto:${cliente.email}?subject=Consulta sobre su proyecto`, '_blank');
                              } else {
                                alert('No hay email registrado para este cliente');
                              }
                            }}
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Editar información del cliente"
                            onClick={() => {
                              const venta = ventas.find(v => v.cliente_nombre === cliente.nombre);
                              if (venta?.id) {
                                window.open(`/editor/${venta.id}`, '_blank');
                              } else {
                                alert('No se puede editar: no se encontró contrato asociado');
                              }
                            }}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No hay clientes registrados este mes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Selector de elementos por página y paginación */}
          <div className="bg-gray-50 rounded-lg p-6 mt-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="text-sm text-gray-700 bg-white px-4 py-2 rounded-lg border border-gray-200">
                  Mostrando <span className="font-bold text-gray-900">{indiceInicial + 1}</span> a <span className="font-bold text-gray-900">{Math.min(indiceFinal, clientesFiltrados.length)}</span> de <span className="font-bold text-gray-900">{clientesFiltrados.length}</span> clientes
                  {clientesFiltrados.length !== clientes.length && (
                    <span className="text-gray-500 text-xs ml-2">({clientes.length} total)</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Mostrar:</label>
                  {!mostrarInputPersonalizado ? (
                    <>
                      <select
                        value={clientesPorPagina}
                        onChange={(e) => handleClientesPorPaginaChange(e.target.value)}
                        className="px-4 py-2 border-2 border-gray-300 bg-white text-gray-700 font-medium rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                      >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                      <option value="personalizado">Personalizado...</option>
                    </select>
                    <span className="text-sm font-medium text-gray-700">por página</span>
                  </>
                ) : (
                  <>
                    <input
                      type="number"
                      value={valorPersonalizado}
                      onChange={(e) => setValorPersonalizado(e.target.value)}
                      placeholder="Ingresa cantidad"
                      min="1"
                      max="10000"
                      className="px-3 py-2 border-2 border-blue-400 rounded-lg text-sm font-medium w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleValorPersonalizadoSubmit()}
                      autoFocus
                    />
                    <button
                      onClick={handleValorPersonalizadoSubmit}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancelarPersonalizado}
                      className="px-3 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium hover:bg-gray-500 transition-colors"
                    >
                      ✕
                    </button>
                    <span className="text-sm font-medium text-gray-700">por página</span>
                  </>
                )}
              </div>
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                <button
                  onClick={() => setPaginaActualClientes(prev => Math.max(1, prev - 1))}
                  disabled={paginaActualClientes === 1}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    paginaActualClientes === 1
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-blue-600 hover:bg-blue-100 hover:scale-105'
                  }`}
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>

                {generarNumerosPagina().map((item, index) => {
                  if (item === '...') {
                    return (
                      <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500 text-sm font-medium">
                        ...
                      </span>
                    )
                  }

                  const numeroPagina = item as number
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => setPaginaActualClientes(numeroPagina)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        paginaActualClientes === numeroPagina
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300 bg-white shadow-sm hover:border-gray-400'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setPaginaActualClientes(prev => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaActualClientes === totalPaginas}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    paginaActualClientes === totalPaginas
                      ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                      : 'text-blue-600 hover:bg-blue-100 hover:scale-105'
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Sección de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas Mensuales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Ventas Mensuales</h3>
          <div className="flex items-end justify-between h-48 gap-4">
            {ventasMensuales.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600 cursor-pointer relative group"
                  style={{ height: `${(item.valor / 350) * 100}%`, minHeight: '20px' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${item.valor}K
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 font-medium">{item.mes}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nuevos Clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Nuevos Clientes</h3>
          <div className="h-48 relative">
            <svg className="w-full h-full" viewBox="0 0 300 200">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
              
              {/* Líneas de grid */}
              {[0, 1, 2, 3, 4].map(i => (
                <line 
                  key={i}
                  x1="0" 
                  y1={40 * i + 20} 
                  x2="300" 
                  y2={40 * i + 20} 
                  stroke="#f3f4f6" 
                  strokeWidth="1"
                />
              ))}
              
              {/* Línea de datos */}
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={nuevosClientes.map((item, index) => 
                  `${(index * 50) + 25},${180 - (item.valor * 4)}`
                ).join(' ')}
              />
              
              {/* Puntos de datos */}
              {nuevosClientes.map((item, index) => (
                <circle
                  key={index}
                  cx={(index * 50) + 25}
                  cy={180 - (item.valor * 4)}
                  r="4"
                  fill="#8B5CF6"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
            </svg>
            
            {/* Etiquetas de meses */}
            <div className="flex justify-between mt-2">
              {nuevosClientes.map((item, index) => (
                <div key={index} className="text-xs text-gray-600 font-medium flex-1 text-center">
                  {item.mes}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Equipo de Trabajo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Equipo de Trabajo</h2>
          <button className="text-gray-500 hover:text-gray-700 flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200">
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['AM', 'RL', 'SF', 'MV', 'CP'].slice(0, 4).map((iniciales, index) => {
            const nombres = ['Ana Mendoza', 'Raúl López', 'Sofía Fernández', 'Miguel Vega', 'Carmen Ponce']
            const cargos = ['Gerente de Ventas', 'Ejecutivo de Cuentas', 'Atención al Cliente', 'Analista de Datos', 'Desarrolladora']
            const estados = ['Activo', 'Activo', 'En reunión', 'Ausente', 'Activo']
            const colores = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500']
            
            return (
              <div key={index} className="text-center p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div className={`w-16 h-16 ${colores[index]} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-white font-bold text-xl">{iniciales}</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{nombres[index]}</h4>
                <p className="text-sm text-gray-600 mb-2">{cargos[index]}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                  estados[index] === 'Activo'
                    ? 'bg-green-100 text-green-800'
                    : estados[index] === 'En reunión'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {estados[index]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  </div>
  )
}

// Componente para la sección de contratos
const ContratosSection = (props: any) => {
  const {
    ventas,
    setVentas,
    loading,
    filtering,
    setFiltering,
    error,
    fechaInicio,
    fechaFin,
    setFechaInicio,
    setFechaFin,
    fetchVentas,
    setShowValidationModal,
    setSelectedVenta,
    setShowDetallesModal,
    soloValidados,
    setSoloValidados,
    fechaInicioProyecto,
    fechaHoy,
    generatingContractId,
    handleGenerarContrato,
    contractFilters,
    setContractFilters,
    setShowContractPreview,
    paginaActualVentas,
    setPaginaActualVentas,
    setShowDeleteModal
  } = props
  // Estados para paginación de ventas (usando el estado del componente padre)
  const ventasPorPagina = 5
  
  // Función para aplicar todos los filtros
  const applyContractFilters = (ventas: any[]) => {
    return ventas.filter((v: any) => {
      // Filtro de validados (compatibilidad)
      if (soloValidados && !v.estado_crm?.toLowerCase().includes('validado') && !v.estado_crm?.toLowerCase().includes('completado')) {
        return false
      }
      
      // Filtro por estado
      if (contractFilters.status !== 'todos') {
        const estado = v.estado_crm?.toLowerCase() || 'preingreso'
        switch (contractFilters.status) {
          case 'preingreso':
            return estado.includes('preingreso') || estado.includes('pre-ingreso') || estado.includes('ingreso')
          case 'validacion':
            return estado.includes('validacion') || estado.includes('validación') || estado.includes('validation')
          case 'contrato':
            return estado.includes('contrato') || estado.includes('contract')
          case 'confirmacion_entrega':
            return estado.includes('confirmacion') || estado.includes('confirmación') || estado.includes('entrega') || estado.includes('delivery')
          case 'produccion':
            return estado.includes('produccion') || estado.includes('producción') || estado.includes('production') || estado.includes('fabrica')
          case 'entrega_ok':
            return estado.includes('entrega ok') || estado.includes('completado') || estado.includes('finalizado') || estado.includes('completed')
        }
      }
      
      // Filtro por ejecutivo
      if (contractFilters.ejecutivo !== 'todos') {
        const ejecutivoVenta = cleanVendorName(v.ejecutivo_nombre)
        if (ejecutivoVenta !== contractFilters.ejecutivo) {
          return false
        }
      }
      
      // Filtro por modelo
      if (contractFilters.modelo !== 'todos') {
        if (v.modelo_casa !== contractFilters.modelo) {
          return false
        }
      }
      
      return true
    })
  }

  // Paginación de ventas con filtros aplicados y ordenamiento por fecha más reciente
  const ventasParaMostrar = applyContractFilters(ventas)
    .sort((a: any, b: any) => {
      // Ordenar por fecha de venta más reciente primero
      const fechaA = new Date(a.fecha_venta || a.created_at || '1970-01-01').getTime()
      const fechaB = new Date(b.fecha_venta || b.created_at || '1970-01-01').getTime()
      return fechaB - fechaA // Más reciente primero
    })
  
  const indiceInicialVentas = (paginaActualVentas - 1) * ventasPorPagina
  const indiceFinalVentas = indiceInicialVentas + ventasPorPagina
  const ventasPaginadas = ventasParaMostrar.slice(indiceInicialVentas, indiceFinalVentas)
  const totalPaginasVentas = Math.ceil(ventasParaMostrar.length / ventasPorPagina)

  return (
    <div className="space-y-8">
    {/* Header Mejorado */}
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Línea superior: Título e indicadores */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validación de contratos</h1>
            <p className="text-gray-600 mt-1">Sistema de validación y gestión de contratos</p>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{ventas.length}</span>
              <span>contratos cargados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Conectado al CRM</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded-md">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium">Auto-sync cada 30min</span>
            </div>
          </div>
        </div>
        
        {/* Línea inferior: Controles distribuidos */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Lado izquierdo: Controles simplificados */}
          <div className="flex items-center gap-6">
            {/* Filtro de estado mejorado */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-semibold text-gray-800">Estado:</span>
              </div>
              
              <select
                value={contractFilters.status}
                onChange={(e) => setContractFilters({...contractFilters, status: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
              >
                <option value="todos">Todos los estados</option>
                <option value="preingreso">Preingreso</option>
                <option value="validacion">Validación</option>
                <option value="contrato">Contrato</option>
                <option value="confirmacion_entrega">Confirmación Entrega</option>
                <option value="produccion">Producción</option>
                <option value="entrega_ok">Entrega OK</option>
              </select>
            </div>
            
            {/* Botón de actualización CRM con mejor espacio */}
            <button
              onClick={() => fetchVentas(fechaInicio, fechaFin, false, 'force')}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-semibold text-sm shadow-sm"
              disabled={loading || filtering}
              title="Forzar actualización desde el CRM"
            >
              {loading || filtering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
              Actualizar CRM
            </button>
          </div>

          {/* Lado derecho: Calendario con controles asociados */}
          <div className="flex items-center gap-4">
            {/* Selector de período */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Período:</span>
              </div>
              <div className="flex items-center gap-2">
                <CustomDatePicker
                  isRange={true}
                  startDate={fechaInicio ? (() => {
                    const parts = fechaInicio.split('-');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    }
                    return null;
                  })() : null}
                  endDate={fechaFin ? (() => {
                    const parts = fechaFin.split('-');
                    if (parts.length === 3) {
                      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    }
                    return null;
                  })() : null}
                  onRangeChange={(startDate, endDate) => {
                    const startString = startDate ? (() => {
                      const year = startDate.getFullYear();
                      const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
                      const day = startDate.getDate().toString().padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })() : ''
                    
                    const endString = endDate ? (() => {
                      const year = endDate.getFullYear();
                      const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
                      const day = endDate.getDate().toString().padStart(2, '0');
                      return `${year}-${month}-${day}`;
                    })() : ''
                    
                    setFechaInicio(startString)
                    setFechaFin(endString)
                    // Ejecutar búsqueda automáticamente cuando se aplica la selección de fechas
                    fetchVentas(startString, endString, false, 'apply')
                  }}
                  minDate={new Date(fechaInicioProyecto)}
                  maxDate={new Date()}
                  placeholder="Seleccionar período"
                  className="w-64"
                />
              </div>
            </div>
            
            {/* Botones asociados al calendario */}
            <div className="flex items-center gap-2">
              {/* Botón Aplicar filtros (para forzar) */}
              <button
                onClick={() => fetchVentas(fechaInicio, fechaFin, false, 'apply')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium flex items-center gap-2"
                disabled={loading || filtering}
                title="Forzar aplicación de filtros"
              >
                {filtering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                Aplicar
              </button>
              
              {/* Botón Reset */}
              <button
                onClick={() => {
                  // Restaurar a las fechas por defecto del proyecto (septiembre 2024)
                  setFechaInicio(fechaInicioDefecto)
                  setFechaFin(fechaFinDefecto)
                  setSoloValidados(false)
                  fetchVentas(fechaInicioDefecto, fechaFinDefecto, false, 'reset')
                }}
                className="p-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium flex items-center justify-center"
                title="Limpiar y restaurar al período actual"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Contenido Principal */}
    {filtering ? (
      <div className="flex items-center justify-center py-12">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-blue-200 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="ml-3">
          <p className="text-gray-700 font-medium text-sm">Filtrando datos...</p>
        </div>
      </div>
    ) : error ? (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error de conexión</h3>
        <p className="text-red-600 mb-1">{error}</p>
        <p className="text-sm text-red-500 mb-4">Verifica la conexión con el servidor CRM</p>
        <button 
          onClick={() => fetchVentas(undefined, undefined, false)} // false = no mostrar cargador completo
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
        >
          Reintentar Conexión
        </button>
      </div>
    ) : ventasParaMostrar.length > 0 ? (
      <div className="space-y-4">
        {/* Tarjetas de Cliente Profesionales */}
        <div className="grid gap-4">
          {ventasPaginadas.map((venta: any) => (
            <div key={venta.id} className="group bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-5">
                {/* Línea superior: Nombre del cliente, ID y estado */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {formatProperCase(venta.cliente_nombre)}
                      </h3>
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        ID: {venta.id}
                      </span>
                    </div>
                    {/* Mostrar número de contrato debajo del nombre */}
                    {venta.numero_contrato && venta.numero_contrato !== '0' ? (
                      <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                        📋 Contrato: {venta.numero_contrato}
                      </p>
                    ) : venta.numero_contrato_temporal ? (
                      <p className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md inline-block">
                        📝 Generar contrato: {venta.numero_contrato_temporal}
                      </p>
                    ) : (
                      <p className="text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md inline-block">
                        📝 Pendiente de contrato
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border ${getEstadoStyle(venta.estado_crm || '')}`}>
                    {venta.estado_crm || 'Pendiente'}
                  </span>
                </div>
                
                {/* Primera fila: Datos del cliente y valor */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">RUT</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{formatRUT(venta.cliente_rut)}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Teléfono</p>
                    <p className="text-sm font-bold text-gray-900">{formatPhone(venta.cliente_telefono)}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Vendedor</p>
                    <p className="text-sm font-bold text-gray-900">{formatProperCase(cleanVendorName(venta.ejecutivo_nombre))}</p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs font-medium text-green-600 mb-1">Valor</p>
                    <p className="text-sm font-bold text-green-700">
                      {typeof venta.valor_total === 'number' 
                        ? formatCurrency(venta.valor_total)
                        : formatCurrency(parseFloat(venta.valor_total?.toString() || '0') || 0)
                      }
                    </p>
                  </div>
                </div>
                
                {/* Segunda fila: Fechas, ejecutivo y dirección */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">Ingreso:</span> {formatDate(venta.fecha_venta)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium">Despacho:</span> {formatDate(venta.fecha_entrega)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 lg:col-span-1">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Dirección:</span>
                      <span className="text-xs">{formatProperCase(venta.direccion_entrega)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedVenta(venta)
                        setShowDetallesModal(true)
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                      title="Ver detalles completos"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detalles
                    </button>
                    
                    {(!venta.estado_crm || venta.estado_crm?.toLowerCase().includes('proceso') || venta.estado_crm?.toLowerCase().includes('pendiente')) && (
                      <button
                        onClick={() => {
                          setSelectedVenta(venta)
                          setShowValidationModal(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                        title="Validar contrato"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Validar
                      </button>
                    )}
                    
                    {/* Botón principal: Vista previa del contrato */}
                    <button
                      onClick={() => {
                        setSelectedVenta(venta)
                        setShowContractPreview(true)
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm"
                      title="Revisar y generar contrato - Recomendado"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Revisar Contrato
                    </button>
                    
                    {/* Botón secundario: Generación rápida para casos urgentes */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm('¿Generar contrato sin revisión previa? Se recomienda usar "Revisar Contrato" primero.')) {
                          await handleGenerarContrato(venta)
                        }
                      }}
                      disabled={generatingContractId === venta.id}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-medium border ${
                        generatingContractId === venta.id
                          ? 'bg-purple-100 text-purple-600 border-purple-200 animate-pulse' 
                          : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
                      }`}
                      title={generatingContractId === venta.id ? "Generando contrato..." : "Generación rápida (sin revisión)"}
                    >
                      {generatingContractId === venta.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5" />
                          Rápido
                        </>
                      )}
                    </button>
                    
                    {/* Botón de eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedVenta(venta)
                        setShowDeleteModal(true)
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium border border-red-200"
                      title="Eliminar contrato"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </div>
                  
                  {venta.cliente_telefono && (
                    <a
                      href={`tel:${venta.cliente_telefono}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium"
                      title="Llamar cliente"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      Llamar
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer con estadísticas */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">
                  {ventasParaMostrar.length}
                </p>
                <p className="text-sm text-slate-600">
                  {soloValidados ? 'Contratos validados' : 'Ventas mostradas'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  de {ventas.length} total CRM
                </p>
              </div>
              
              <div className="w-px h-12 bg-slate-300"></div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(ventasParaMostrar.reduce((sum: number, v: any) => {
                    const valor = typeof v.valor_total === 'number' ? v.valor_total : parseFloat(v.valor_total?.toString() || '0') || 0;
                    return sum + valor;
                  }, 0))}
                </p>
                <p className="text-sm text-slate-600">Valor filtrado</p>
                <p className="text-xs text-slate-500 mt-1">
                  de {formatCurrency(ventas.reduce((sum: number, v: any) => {
                    const valor = typeof v.valor_total === 'number' ? v.valor_total : parseFloat(v.valor_total?.toString() || '0') || 0;
                    return sum + valor;
                  }, 0))} total
                </p>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-slate-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>Última actualización: {new Date().toLocaleTimeString('es-CL')}</span>
            </div>
          </div>
        </div>
        
        {/* Controles de Paginación para Ventas */}
        {totalPaginasVentas > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicialVentas + 1} a {Math.min(indiceFinalVentas, ventasParaMostrar.length)} de {ventasParaMostrar.length} ventas filtradas ({ventas.length} total del CRM)
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPaginaActualVentas(prev => Math.max(1, prev - 1))}
                disabled={paginaActualVentas === 1}
                className={`p-2 rounded-lg border border-gray-300 transition-colors ${
                  paginaActualVentas === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              
              {Array.from({ length: totalPaginasVentas }, (_, i) => i + 1).map(numeroPagina => (
                <button
                  key={numeroPagina}
                  onClick={() => setPaginaActualVentas(numeroPagina)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    paginaActualVentas === numeroPagina 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {numeroPagina}
                </button>
              ))}
              
              <button 
                onClick={() => setPaginaActualVentas(prev => Math.min(totalPaginasVentas, prev + 1))}
                disabled={paginaActualVentas === totalPaginasVentas}
                className={`p-2 rounded-lg border border-gray-300 transition-colors ${
                  paginaActualVentas === totalPaginasVentas 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay datos disponibles</h3>
        <p className="text-slate-600 mb-1">No se encontraron ventas en el rango seleccionado</p>
        <p className="text-sm text-slate-500 mb-6">Ajusta los filtros de fecha o verifica la conexión con el CRM</p>
        <button 
          onClick={() => fetchVentas(undefined, undefined, false)} // false = no mostrar cargador completo
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg"
        >
          Cargar Datos del CRM
        </button>
      </div>
    )}
  </div>
)
}

export default function DashboardClient({ user, contratos }: { user: any, contratos: any[] }) {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [contratosSubsection, setContratosSubsection] = useState('activos')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [showContractPreview, setShowContractPreview] = useState(false)
  const [contractFilters, setContractFilters] = useState({
    status: 'todos', // todos, borrador, validado, enviado, generado
    ejecutivo: 'todos',
    modelo: 'todos'
  })
  const [paginaActualVentas, setPaginaActualVentas] = useState(1)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesLoading, setClientesLoading] = useState(false)
  const [clientesError, setClientesError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalVentas: 0,
    contratosListos: 0,
    ventasPendientes: 0,
    ventasRechazadas: 0,
    montoTotal: 0,
    ventasDelDia: 0,
    nuevosContratos: 0,
    tasaConversion: 0,
    tasaAprobacion: 0,
    ingresosRecurrentes: 0
  })
  const [loading, setLoading] = useState(false) // Para carga inicial completa (con cargador)
  const [filtering, setFiltering] = useState(false) // Para filtros (sin cargador)
  const [applyingFilter, setApplyingFilter] = useState(false) // Para botón Aplicar
  const [resetting, setResetting] = useState(false) // Para botón Reset
  const [error, setError] = useState<string | null>(null)
  // Define las fechas por defecto: Usar datos del 2024 que es donde están las ventas del CRM
  const ahora = new Date()

  // Para compatibilidad con el resto del código que usa fechaHoy
  const fechaHoy = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000)).toISOString().split('T')[0]

  // Para mostrar datos reales del CRM, usar fechas del 2024
  // Septiembre 2024 tiene datos disponibles según el proyecto
  const fechaInicioDefecto = '2024-09-01'  // Inicio de datos disponibles
  const fechaFinDefecto = '2024-09-30'     // Fin de septiembre 2024

  // Fecha de inicio del proyecto (para rangos expandidos cuando sea necesario)
  const fechaInicioProyecto = '2024-09-01'

  const [fechaInicio, setFechaInicio] = useState(fechaInicioDefecto) // Septiembre 2024
  const [fechaFin, setFechaFin] = useState(fechaFinDefecto) // Hasta fin de septiembre 2024
  
  // Estados para el selector de fechas del equipo - usar la misma lógica que contratos
  const [fechaInicioEquipo, setFechaInicioEquipo] = useState(fechaInicioProyecto)
  const [fechaFinEquipo, setFechaFinEquipo] = useState(fechaFinDefecto)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null)
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('todos')
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [generatingContractId, setGeneratingContractId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [soloValidados, setSoloValidados] = useState(false)
  const [showDetallesModal, setShowDetallesModal] = useState(false)
  const [isEditingFields, setIsEditingFields] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editedVenta, setEditedVenta] = useState<any>(null)
  const [showContractConfirmation, setShowContractConfirmation] = useState(false)
  const [contractEditableData, setContractEditableData] = useState<any>(null)
  const [showMissingFieldsEditor, setShowMissingFieldsEditor] = useState(false)
  
  // Estados para eliminar contratos
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Estados para autocompletado de email
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false)
  const [emailInputValue, setEmailInputValue] = useState('')

  // Los datos ya vienen filtrados del API cuando se aplican fechas
  // Solo usar filtrado cliente cuando no hay fechas (para datos iniciales sin filtro)
  const ventasFiltradas = ventas

  // Debug: Log para verificar que los datos están llegando
  console.log('🔍 Debug Dashboard - Datos recibidos:', {
    totalVentas: ventas.length,
    fechaInicio,
    fechaFin,
    primerasVentas: ventas.slice(0, 2)
  })

  // Debug: Ver todos los estados únicos del CRM
  const estadosUnicos = [...new Set(ventas.map(v => v.estado_crm))].filter(Boolean)
  console.log('📋 Estados CRM únicos encontrados:', estadosUnicos)
  
  // Función para guardar campos editados
  const handleSaveEditedFields = async () => {
    if (!editedVenta || !selectedVenta) return
    
    try {
      // Aquí iría la lógica para guardar en el CRM/backend
      // Por ahora solo actualizamos localmente
      const updatedVenta = { ...selectedVenta, ...editedVenta }
      
      setVentas(prevVentas => 
        prevVentas.map(v => 
          v.id === selectedVenta.id ? updatedVenta : v
        )
      )
      
      setSelectedVenta(updatedVenta)
      
      // Sincronizar contractEditableData con los cambios realizados
      setContractEditableData(prevData => ({
        ...prevData,
        ...updatedVenta,
        cliente_telefono: editedVenta.cliente_telefono || updatedVenta.cliente_telefono,
        cliente_correo: editedVenta.cliente_email || editedVenta.cliente_correo || updatedVenta.cliente_email || updatedVenta.cliente_correo,
        direccion_entrega: editedVenta.direccion_entrega || updatedVenta.direccion_entrega,
        forma_pago: editedVenta.forma_pago || updatedVenta.forma_pago
      }))
      
      console.log('✅ ContractEditableData sincronizado:', {
        cliente_telefono: editedVenta.cliente_telefono || updatedVenta.cliente_telefono,
        cliente_correo: editedVenta.cliente_email || editedVenta.cliente_correo || updatedVenta.cliente_email || updatedVenta.cliente_correo,
        direccion_entrega: editedVenta.direccion_entrega || updatedVenta.direccion_entrega,
        forma_pago: editedVenta.forma_pago || updatedVenta.forma_pago
      })
      
      setIsEditingFields(false)
      setNotification({
        type: 'success',
        message: 'Información actualizada correctamente'
      })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error guardando campos:', error)
      setNotification({
        type: 'error',
        message: 'Error al guardar la información'
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Función para inicializar edición global
  const handleStartEditing = () => {
    if (selectedVenta) {
      setEditedVenta({ ...selectedVenta })
      setIsEditingFields(true)
      setEditingSection('all')
    }
  }

  // Función para inicializar edición por sección
  const handleStartEditingSection = (section: string) => {
    if (selectedVenta) {
      setEditedVenta({ ...selectedVenta })
      setEditingSection(section)
    }
  }

  // Función para guardar una sección específica
  const handleSaveSectionFields = async () => {
    if (!editedVenta || !selectedVenta) return
    
    try {
      // Aquí iría la lógica para guardar en el CRM/backend
      // Por ahora solo actualizamos localmente
      const updatedVenta = { ...selectedVenta, ...editedVenta }
      
      setVentas(prevVentas => 
        prevVentas.map(v => 
          v.id === selectedVenta.id ? updatedVenta : v
        )
      )
      
      setSelectedVenta(updatedVenta)
      
      // Sincronizar contractEditableData con los cambios realizados
      setContractEditableData(prevData => ({
        ...prevData,
        ...updatedVenta,
        cliente_telefono: editedVenta.cliente_telefono || updatedVenta.cliente_telefono,
        cliente_correo: editedVenta.cliente_email || editedVenta.cliente_correo || updatedVenta.cliente_email || updatedVenta.cliente_correo,
        direccion_entrega: editedVenta.direccion_entrega || updatedVenta.direccion_entrega,
        forma_pago: editedVenta.forma_pago || updatedVenta.forma_pago
      }))
      
      setEditingSection(null)
      setNotification({
        type: 'success',
        message: 'Sección actualizada correctamente'
      })
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error guardando sección:', error)
      setNotification({
        type: 'error',
        message: 'Error al guardar la información'
      })
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Validación memoizada para optimizar renderizado
  const currentValidation = useMemo(() => {
    const venta = editedVenta || selectedVenta
    if (!venta) {
      return { isComplete: false, missingFields: ['No hay datos de venta seleccionados'] }
    }
    return validateContractData(venta)
  }, [editedVenta, selectedVenta])

  // Función simplificada para manejar cambios en campos
  const handleFieldChange = useCallback((field: string, value: string) => {
    setEditedVenta((prev: any) => ({ ...prev, [field]: value }))
  }, [])

  // Dominios de email populares para autocompletado
  const popularEmailDomains = [
    '@gmail.com',
    '@yahoo.com', 
    '@hotmail.com',
    '@outlook.com',
    '@yahoo.es',
    '@hotmail.es',
    '@live.com',
    '@icloud.com',
    '@protonmail.com',
    '@zoho.com'
  ]

  // Función para manejar cambios en campo de email con autocompletado
  const handleEmailChange = useCallback((field: string, value: string) => {
    setEditedVenta((prev: any) => ({ ...prev, [field]: value }))
    setEmailInputValue(value)
    
    // Mostrar sugerencias solo si hay @ y no hay dominio completo
    if (value.includes('@') && !value.includes('.')) {
      const [username, domain] = value.split('@')
      if (domain && domain.length > 0) {
        const suggestions = popularEmailDomains
          .filter(d => d.toLowerCase().includes(domain.toLowerCase()))
          .map(d => username + d)
          .slice(0, 5)
        
        setEmailSuggestions(suggestions)
        setShowEmailSuggestions(suggestions.length > 0)
      } else if (value.endsWith('@')) {
        // Si solo escribió @, mostrar todos los dominios
        const suggestions = popularEmailDomains
          .map(d => value.slice(0, -1) + d)
          .slice(0, 5)
        
        setEmailSuggestions(suggestions)
        setShowEmailSuggestions(true)
      } else {
        setShowEmailSuggestions(false)
      }
    } else {
      setShowEmailSuggestions(false)
    }
  }, [])

  // Función para seleccionar una sugerencia
  const selectEmailSuggestion = useCallback((suggestion: string, field: string) => {
    setEditedVenta((prev: any) => ({ ...prev, [field]: suggestion }))
    setEmailInputValue(suggestion)
    setShowEmailSuggestions(false)
  }, [])

  // Función auxiliar para renderizar campo editable
  const renderEditableField = useCallback((
    label: string, 
    field: string, 
    currentValue: any, 
    section: string,
    type: 'text' | 'email' | 'tel' | 'date' | 'number' = 'text',
    formatter?: (value: any) => string
  ) => {
    const displayValue = editedVenta ? editedVenta[field] : currentValue
    const formattedValue = formatter ? formatter(displayValue) : displayValue
    const isEditing = (isEditingFields && editingSection === 'all') || editingSection === section
    
    return (
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        {isEditing ? (
          <input
            type={type}
            value={editedVenta?.[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Ingrese ${label.toLowerCase()}`}
          />
        ) : (
          <p className="text-sm font-medium text-gray-900">
            {formattedValue || <span className="text-orange-600">⚠ Sin información</span>}
          </p>
        )}
      </div>
    )
  }, [editedVenta, isEditingFields, editingSection, handleFieldChange])

  // Componente especializado para campo de email con autocompletado
  const renderEmailField = useCallback((
    label: string,
    field: string,
    currentValue: any,
    section: string
  ) => {
    const displayValue = editedVenta ? editedVenta[field] : currentValue
    const isEditing = (isEditingFields && editingSection === 'all') || editingSection === section
    
    return (
      <div className="relative">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        {isEditing ? (
          <div className="relative">
            <input
              type="email"
              value={displayValue || ''}
              onChange={(e) => handleEmailChange(field, e.target.value)}
              onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
              onFocus={() => {
                if (displayValue && displayValue.includes('@') && !displayValue.includes('.')) {
                  const [username, domain] = displayValue.split('@')
                  if (domain) {
                    const suggestions = popularEmailDomains
                      .filter(d => d.toLowerCase().includes(domain.toLowerCase()))
                      .map(d => username + d)
                      .slice(0, 5)
                    
                    setEmailSuggestions(suggestions)
                    setShowEmailSuggestions(suggestions.length > 0)
                  }
                }
              }}
              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ingrese ${label.toLowerCase()}`}
            />
            
            {/* Lista de sugerencias */}
            {showEmailSuggestions && emailSuggestions.length > 0 && (
              <div 
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                onWheel={(e) => {
                  e.stopPropagation();
                  const target = e.currentTarget;
                  const { scrollTop, scrollHeight, clientHeight } = target;
                  
                  // Si el scroll llega al tope y se intenta seguir haciendo scroll hacia arriba
                  if (scrollTop === 0 && e.deltaY < 0) {
                    e.preventDefault();
                  }
                  // Si el scroll llega al final y se intenta seguir haciendo scroll hacia abajo
                  else if (scrollTop + clientHeight >= scrollHeight && e.deltaY > 0) {
                    e.preventDefault();
                  }
                }}
              >
                {emailSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectEmailSuggestion(suggestion, field)}
                    className="px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-900">
            {displayValue || <span className="text-orange-600">⚠ Sin información</span>}
          </p>
        )}
      </div>
    )
  }, [editedVenta, isEditingFields, editingSection, handleEmailChange, showEmailSuggestions, emailSuggestions, selectEmailSuggestion, popularEmailDomains])

  // Función para renderizar header de sección con botón editar
  const renderSectionHeader = (title: string, icon: any, sectionKey: string) => {
    const IconComponent = icon
    const isEditing = editingSection === sectionKey
    
    return (
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-gray-600" />
          {title}
        </h4>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setEditingSection(null)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              >
                <X className="h-3 w-3" />
              </button>
              <button
                onClick={handleSaveSectionFields}
                className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-1"
              >
                <Save className="h-3 w-3" />
                Guardar
              </button>
            </>
          ) : (
            <button
              onClick={() => handleStartEditingSection(sectionKey)}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Editar
            </button>
          )}
        </div>
      </div>
    )
  }

  // Debug: Ver distribución de estados
  ventas.forEach((v, index) => {
    if (index < 5) { // Solo mostrar primeros 5
      console.log(`🔸 Venta ${index + 1}: estado="${v.estado_crm}", cliente="${v.cliente_nombre}"`)
    }
  })

  // Calcular estadísticas filtradas basadas en datos del período seleccionado
  const totalVentasFiltradas = ventasFiltradas.length
  
  const contratosListosFiltrados = ventasFiltradas.filter(v => {
    if (!v.estado_crm) return false
    const estadoLower = v.estado_crm.toLowerCase().trim()
    return estadoLower.includes('listo') || 
           estadoLower.includes('completado') ||
           estadoLower.includes('finalizado') ||
           estadoLower.includes('validado') ||
           estadoLower.includes('aprobado') ||
           estadoLower.includes('entregado')
  }).length
  
  const ventasRechazadasFiltradas = ventasFiltradas.filter(v => {
    if (!v.estado_crm) return false
    const estadoLower = v.estado_crm.toLowerCase().trim()
    return estadoLower.includes('rechazad') || 
           estadoLower.includes('cancelad') ||
           estadoLower.includes('anulad') ||
           estadoLower.includes('descartad')
  }).length
  
  // Pendientes = Total - Listos - Rechazados
  const ventasPendientesFiltradas = totalVentasFiltradas - contratosListosFiltrados - ventasRechazadasFiltradas
  
  console.log('🎨 ESTADÍSTICAS FILTRADAS PARA EL DASHBOARD:', {
    totalVentasFiltradas,
    contratosListosFiltrados,
    ventasPendientesFiltradas,
    ventasRechazadasFiltradas,
    verificacion: contratosListosFiltrados + ventasPendientesFiltradas + ventasRechazadasFiltradas,
    primerosEstados: ventasFiltradas.slice(0, 5).map(v => v.estado_crm || 'SIN ESTADO')
  })
  
  const statsFiltradas = {
    totalVentas: totalVentasFiltradas,
    contratosListos: contratosListosFiltrados,
    ventasPendientes: ventasPendientesFiltradas,
    ventasRechazadas: ventasRechazadasFiltradas,
    montoTotal: ventasFiltradas.reduce((sum, v) => sum + (typeof v.valor_total === 'number' ? v.valor_total : parseFloat(v.valor_total.toString()) || 0), 0),
    ventasDelDia: ventasFiltradas.filter(v => {
      const hoy = new Date()
      const fechaVenta = new Date(v.fecha_venta)
      return fechaVenta.toDateString() === hoy.toDateString()
    }).length,
    nuevosContratos: ventasFiltradas.filter(v => 
      v.estado_crm?.toLowerCase().includes('nuevo') || 
      v.estado_crm?.toLowerCase().includes('reciente')
    ).length,
    tasaConversion: ventasFiltradas.length > 0 ? Math.round((ventasFiltradas.filter(v => 
      v.estado_crm?.toLowerCase().includes('validado') || 
      v.estado_crm?.toLowerCase().includes('aprobado')
    ).length / ventasFiltradas.length) * 100) : 0,
    tasaAprobacion: ventasFiltradas.length > 0 ? Math.round((ventasFiltradas.filter(v => 
      v.estado_crm?.toLowerCase().includes('validado') || 
      v.estado_crm?.toLowerCase().includes('aprobado')
    ).length / ventasFiltradas.length) * 100) : 0,
    ingresosRecurrentes: ventasFiltradas.reduce((sum, v) => {
      const esActivo = v.estado_crm?.toLowerCase().includes('activo') || 
                      v.estado_crm?.toLowerCase().includes('completado');
      return esActivo ? sum + (typeof v.valor_total === 'number' ? v.valor_total : parseFloat(v.valor_total.toString()) || 0) : sum;
    }, 0)
  }

  // Función para convertir datos de ventas del CRM a clientes
  const convertVentasToClientes = (ventasData: Venta[]): Cliente[] => {
    try {
      if (!ventasData || !Array.isArray(ventasData)) {
        console.warn('convertVentasToClientes: ventasData is not a valid array')
        return []
      }

      // NO agrupar por cliente - cada venta es una entrada separada
      const clientesList: Cliente[] = []

      ventasData.forEach(venta => {
        try {
          if (!venta) return

          // Crear una entrada por cada venta
          clientesList.push({
            id: venta.id,
            nombre: venta.cliente_nombre || 'Sin nombre',
            email: undefined, // CRM no tiene email
            estado: venta.estado_crm || 'Ingreso', // Usar estado real del CRM
            fecha_ingreso: venta.fecha_venta,
            fecha_despacho: venta.fecha_entrega,
            telefono: venta.cliente_telefono,
            rut: venta.cliente_rut,
            direccion: venta.direccion_entrega,
            created_at: venta.fecha_venta,
            updated_at: new Date().toISOString(),
            crm_id: venta.id // Agregar ID del CRM
          })
        } catch (ventaError) {
          console.error('Error processing individual venta in convertVentasToClientes:', ventaError)
          // Continue with next venta
        }
      })

      // Ordenar por fecha más reciente - MOSTRAR TODOS LOS CONTRATOS
      try {
        return clientesList
          .sort((a, b) => {
            try {
              const dateA = new Date(b.fecha_ingreso || '1970-01-01').getTime()
              const dateB = new Date(a.fecha_ingreso || '1970-01-01').getTime()
              return dateA - dateB
            } catch (sortError) {
              return 0
            }
          })
      } catch (sortError) {
        console.error('Error sorting clients:', sortError)
        return clientesList
      }
    } catch (error) {
      console.error('Error in convertVentasToClientes:', error)
      return []
    }
  }

  // Función para cargar clientes del CRM (ahora usa datos del CRM en lugar de Supabase)
  const fetchClientes = async () => {
    try {
      setClientesLoading(true)
      setClientesError(null)
      
      // Si ya tenemos datos de ventas del CRM, usar esos en lugar de la API de clientes
      if (ventas && ventas.length > 0) {
        const clientesFromCRM = convertVentasToClientes(ventas)
        setClientes(clientesFromCRM)
        setClientesLoading(false)
        return
      }
      
      // Fallback a API de clientes si no hay datos de ventas
      const response = await fetch('/api/clientes?del_mes=true&limit=5')
      const data = await safeParseJSON(response)
      
      if (data.success && data.clientes) {
        setClientes(data.clientes)
      } else {
        setClientesError(data.error || 'Error al cargar clientes')
      }
    } catch (err) {
      setClientesError('Error de conexión al cargar clientes')
      console.error('Error fetching clientes:', err)
    } finally {
      setClientesLoading(false)
    }
  }

  const handleGenerarContrato = async (venta: Venta) => {
    try {
      setGeneratingContractId(venta.id)
      setError(null)
      
      // Generar número de contrato automáticamente si no existe
      const numeroContrato = venta.numero_contrato || generateNextContractNumber(ventas)
      
      // PRIMERO: Asignar el número correlativamente en el estado local (antes de generar)
      // Esto hace que aparezca inmediatamente como "Pendiente de generar" (naranja)
      if (!venta.numero_contrato) {
        setVentas(prevVentas => 
          prevVentas.map(v => 
            v.id === venta.id 
              ? { ...v, numero_contrato: numeroContrato }
              : v
          )
        )

        // Actualizar también la venta seleccionada si coincide
        if (selectedVenta && selectedVenta.id === venta.id) {
          setSelectedVenta({ ...selectedVenta, numero_contrato: numeroContrato })
        }
      }
      
      const response = await fetch('/api/crm/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'crear_contrato',
          ventaId: venta.id,
          numeroContrato, // Enviar el número generado
          clienteData: {
            nombre: venta.cliente_nombre,
            rut: venta.cliente_rut,
            telefono: venta.cliente_telefono,
            direccion: venta.direccion_entrega
          },
          contratoData: {
            numeroContrato,
            valor: venta.valor_total,
            vendedor: cleanVendorName(venta.ejecutivo_nombre),
            modelo: venta.modelo_casa,
            fechaCreacion: venta.fecha_venta,
            observaciones: venta.observaciones_crm
          }
        })
      })
      
      const result = await safeParseJSON(response)
      
      if (result.success) {
        // Actualizar la venta local con el número de contrato generado
        setVentas(prevVentas => 
          prevVentas.map(v => 
            v.id === venta.id 
              ? { ...v, numero_contrato: numeroContrato, estado_crm: 'Contrato Generado' }
              : v
          )
        )

        // Si hay una venta seleccionada, también actualizarla
        if (selectedVenta && selectedVenta.id === venta.id) {
          setSelectedVenta({ ...selectedVenta, numero_contrato: numeroContrato, estado_crm: 'Contrato Generado' })
        }
        
        // Actualizar stats
        setStats(prev => ({
          ...prev,
          nuevosContratos: prev.nuevosContratos + 1
        }))
        
        // Mostrar notificación de éxito con el número de contrato
        setNotification({
          type: 'success',
          message: `¡Contrato ${numeroContrato} creado exitosamente para ${venta.cliente_nombre}!`
        })
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000)
        
        setGeneratingContractId(null)
      } else {
        throw new Error(result.error || 'Error al crear contrato')
      }
    } catch (error) {
      console.error('Error generando contrato:', error)
      setError('Error al generar el contrato')
      setGeneratingContractId(null)
    }
  }

  // Función para eliminar contratos/ventas
  const handleEliminarContrato = async (venta: Venta) => {
    if (!venta) return
    
    setDeletingId(venta.id)
    
    try {
      // Guardar en almacenamiento persistente local
      fichasEliminadasStorage.addFichaEliminada(
        venta.id,
        venta,
        'Eliminado desde dashboard'
      )
      
      // Intentar guardar en el servidor (opcional, puede fallar)
      try {
        const response = await fetch(`/api/crm/ventas/${venta.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            datosVenta: venta,
            motivoEliminacion: 'Eliminado desde dashboard'
          })
        })
        
        if (!response.ok) {
          console.warn('El servidor no pudo procesar la eliminación, pero se guardó localmente')
        }
      } catch (fetchError) {
        console.warn('Error al comunicar con el servidor, ficha guardada localmente:', fetchError)
      }
      
      // Eliminar de la lista local
      setVentas(prev => prev.filter((v: any) => v.id !== venta.id))
      setClientes(prev => prev.filter((c: any) => c.id !== venta.id))
      
      // Mostrar notificación de éxito
      setNotification({
        type: 'success',
        message: `Contrato de ${venta.cliente_nombre} eliminado exitosamente`
      })
      
      // Cerrar modales
      setShowDeleteModal(false)
      setSelectedVenta(null)
      
      // Limpiar notificación después de 3 segundos
      setTimeout(() => {
        setNotification(null)
      }, 3000)
      
    } catch (error) {
      console.error('Error eliminando contrato:', error)
      setNotification({
        type: 'error',
        message: 'Error al eliminar el contrato. Inténtalo de nuevo.'
      })
      setTimeout(() => {
        setNotification(null)
      }, 5000)
    } finally {
      setDeletingId(null)
    }
  }

  const fetchVentas = async (fechaInicio?: string, fechaFin?: string, isInitialLoad: boolean = false, buttonType?: 'apply' | 'reset') => {
    try {
      console.log('🔥 fetchVentas llamada con:', {
        fechaInicio,
        fechaFin,
        buttonType,
        isInitialLoad
      })

      if (isInitialLoad) {
        setLoading(true) // Mostrar cargador completo solo en carga inicial
      } else if (buttonType === 'apply') {
        setApplyingFilter(true) // Indicador para botón Aplicar
      } else if (buttonType === 'reset') {
        setResetting(true) // Indicador para botón Reset
      } else {
        setFiltering(true) // Solo mostrar indicador de filtrado general
      }
      setError(null)

      let url = '/api/crm/ventas'
      const params = new URLSearchParams()

      if (fechaInicio) params.append('fecha_inicio', fechaInicio)
      if (fechaFin) params.append('fecha_fin', fechaFin)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      // Configurar timeout para evitar que se cuelgue
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minutos timeout

      try {
        console.log('🌐 Llamando API:', url)
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        let data;
        try {
          data = await safeParseJSON(response)
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError)
          throw new Error('Error procesando respuesta del servidor')
        }

      if (data && data.success && data.ventas && Array.isArray(data.ventas)) {
        // Debug detallado de estados
        const estadosUnicos = [...new Set(data.ventas.map((v: Venta) => v.estado_crm || 'Sin estado'))]
        console.log('🎯 API Response - Datos recibidos del CRM:', {
          total: data.ventas.length,
          success: data.success,
          filtros: { fechaInicio, fechaFin },
          estadosUnicos: estadosUnicos,
          conteoPorEstado: estadosUnicos.map(estado => ({
            estado: estado || 'Sin estado',
            cantidad: (data.ventas || []).filter((v: Venta) => v.estado_crm === estado).length
          })),
          todosLosEstados: (data.ventas || []).map((v: any) => ({
            cliente: v.cliente_nombre || 'Sin nombre',
            estado: v.estado_crm || 'SIN ESTADO'
          }))
        })
        console.log('🔍 TODOS LOS DATOS:', data.ventas)
        
        // Filtrar las ventas que están marcadas como eliminadas
        let ventasActivas;
        let ventasEliminadasIds = [];
        try {
          ventasEliminadasIds = fichasEliminadasStorage.getVentasEliminadasIds()
          ventasActivas = data.ventas.filter((v: Venta) => v && v.id && !ventasEliminadasIds.includes(v.id))
        } catch (filterError) {
          console.error('Error filtering ventas:', filterError)
          ventasEliminadasIds = []
          ventasActivas = data.ventas || []
        }

        console.log(`📊 Ventas totales: ${data.ventas.length}, Eliminadas: ${ventasEliminadasIds.length}, Activas: ${ventasActivas.length}`)
        
        setVentas(ventasActivas)
        
        const totalVentas = ventasActivas.length
        
        // Debug: Estados únicos recibidos del CRM
        let estadosRecibidos = []
        try {
          estadosRecibidos = [...new Set(data.ventas.map((v: Venta) => v && v.estado_crm ? v.estado_crm : 'SIN ESTADO'))]
          console.log('🔍 Estados únicos recibidos en Dashboard:', estadosRecibidos)
        } catch (estadosError) {
          console.error('Error processing estados:', estadosError)
          estadosRecibidos = ['SIN ESTADO']
        }
        
        // Calcular contratos listos (completados, validados, etc.)
        let contratosListos = 0
        try {
          contratosListos = data.ventas.filter((v: Venta) => {
            if (!v || !v.estado_crm) return false
            try {
              const estadoLower = v.estado_crm.toLowerCase().trim()
              const esListo = estadoLower.includes('listo') ||
                     estadoLower.includes('completado') ||
                     estadoLower.includes('finalizado') ||
                     estadoLower.includes('validado') ||
                     estadoLower.includes('aprobado') ||
                     estadoLower.includes('entregado')

              // Debug de categorización
              if (esListo) {
                console.log(`✅ LISTO: "${v.estado_crm}" (${v.cliente_nombre || 'Sin nombre'})`)
              }

              return esListo
            } catch (itemError) {
              console.error('Error processing individual venta:', itemError)
              return false
            }
          }).length
        } catch (contratosError) {
          console.error('Error calculating contratos listos:', contratosError)
          contratosListos = 0
        }
        
        // Calcular ventas rechazadas
        let ventasRechazadas = 0
        try {
          ventasRechazadas = data.ventas.filter((v: Venta) => {
            if (!v || !v.estado_crm) return false
            try {
              const estadoLower = v.estado_crm.toLowerCase().trim()
              const esRechazado = estadoLower.includes('rechazad') || // rechazado, rechazada
                     estadoLower.includes('cancelad') || // cancelado, cancelada
                     estadoLower.includes('anulad') ||   // anulado, anulada
                     estadoLower.includes('descartad')   // descartado, descartada

              // Debug de categorización
              if (esRechazado) {
                console.log(`❌ RECHAZADO: "${v.estado_crm}" (${v.cliente_nombre || 'Sin nombre'})`)
              }

              return esRechazado
            } catch (itemError) {
              console.error('Error processing individual venta for rechazadas:', itemError)
              return false
            }
          }).length
        } catch (rechazadasError) {
          console.error('Error calculating ventas rechazadas:', rechazadasError)
          ventasRechazadas = 0
        }
        
        // Calcular pendientes (todo lo que no está listo ni rechazado)
        const ventasPendientes = totalVentas - contratosListos - ventasRechazadas
        
        // Debug: Estados que quedan como pendientes
        const estadosPendientes = data.ventas.filter((v: Venta) => {
          if (!v.estado_crm) return true // Sin estado = pendiente
          const estadoLower = v.estado_crm.toLowerCase().trim()
          
          const esListo = estadoLower.includes('listo') || 
                 estadoLower.includes('completado') ||
                 estadoLower.includes('finalizado') ||
                 estadoLower.includes('validado') ||
                 estadoLower.includes('aprobado') ||
                 estadoLower.includes('entregado')
          
          const esRechazado = estadoLower.includes('rechazad') ||
                 estadoLower.includes('cancelad') ||
                 estadoLower.includes('anulad') ||
                 estadoLower.includes('descartad')
          
          const esPendiente = !esListo && !esRechazado
          
          if (esPendiente) {
            console.log(`⏳ PENDIENTE: "${v.estado_crm}" (${v.cliente_nombre})`)
          }
          
          return esPendiente
        })
        console.log(`🔄 Total pendientes calculados: ${ventasPendientes} (por resta) vs ${estadosPendientes.length} (por filtro)`)
        
        console.log('📋 Debug de cálculo de estados:', {
          totalVentas,
          contratosListos,
          ventasPendientes,
          ventasRechazadas,
          suma: contratosListos + ventasPendientes + ventasRechazadas,
          ejemplosEstados: data.ventas.slice(0, 5).map((v: Venta) => ({
            cliente: v.cliente_nombre,
            estado: v.estado_crm || 'SIN ESTADO',
            categorizado: v.estado_crm ? (
              v.estado_crm.toLowerCase().includes('listo') || 
              v.estado_crm.toLowerCase().includes('completado') ||
              v.estado_crm.toLowerCase().includes('validado') ? 'LISTO' :
              v.estado_crm.toLowerCase().includes('rechazad') ||
              v.estado_crm.toLowerCase().includes('cancelad') ? 'RECHAZADO' : 'PENDIENTE'
            ) : 'PENDIENTE'
          }))
        });
        let montoTotal = 0
        try {
          montoTotal = data.ventas.reduce((sum: number, v: Venta) => {
            if (!v) return sum
            try {
              const valor = typeof v.valor_total === 'number' ? v.valor_total : (typeof v.valor_total === 'string' ? parseFloat(v.valor_total) : 0)
              return sum + (isNaN(valor) ? 0 : valor)
            } catch (itemError) {
              console.error('Error processing valor_total for venta:', itemError)
              return sum
            }
          }, 0)
        } catch (montoError) {
          console.error('Error calculating monto total:', montoError)
          montoTotal = 0
        }
        
        const today = new Date().toISOString().split('T')[0]
        const ventasDelDia = data.ventas.filter((v: Venta) => 
          v.fecha_venta && v.fecha_venta.split('T')[0] === today
        ).length
        
        // Calcular nuevos contratos del mes actual
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        const nuevosContratos = data.ventas.filter((v: Venta) => {
          if (!v.fecha_venta) return false
          const fechaVenta = new Date(v.fecha_venta)
          return fechaVenta.getMonth() === currentMonth && fechaVenta.getFullYear() === currentYear
        }).length
        
        // Calcular tasa de conversión (ventas validadas / total ventas * 100)
        const tasaConversion = totalVentas > 0 ? ((contratosListos / totalVentas) * 100) : 0
        // Calcular tasa de aprobación (no rechazadas / total ventas * 100)
        const tasaAprobacion = totalVentas > 0 ? (((totalVentas - ventasRechazadas) / totalVentas) * 100) : 0
        
        // Debug de estadísticas calculadas
        console.log('📊 Estadísticas calculadas:', {
          totalVentas,
          contratosListos,
          ventasPendientes,
          ventasRechazadas,
          verificacion: contratosListos + ventasPendientes + ventasRechazadas,
          montoTotal: formatCurrency(montoTotal),
          tasaConversion: `${Math.round(tasaConversion * 10) / 10}%`,
          tasaAprobacion: `${Math.round(tasaAprobacion * 10) / 10}%`
        })
        
        const newStats = { 
          totalVentas, 
          contratosListos,
          ventasPendientes,
          ventasRechazadas, 
          montoTotal, 
          ventasDelDia,
          nuevosContratos,
          tasaConversion: Math.round(tasaConversion * 10) / 10, // Redondear a 1 decimal
          tasaAprobacion: Math.round(tasaAprobacion * 10) / 10, // Redondear a 1 decimal
          ingresosRecurrentes: montoTotal
        }
        
        console.log('📈 ACTUALIZANDO STATS CON:', newStats)
        setStats(newStats)
        
        // Actualizar clientes automáticamente con datos del CRM
        try {
          const clientesFromCRM = convertVentasToClientes(data.ventas || [])
          setClientes(clientesFromCRM)
        } catch (clientesError) {
          console.error('Error converting ventas to clientes:', clientesError)
          // No lanzar error, continuar con funcionalidad principal
        }
      } else {
        setError(data.error || 'Error al cargar ventas')
      }

      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (err) {
      console.error('Error fetching ventas:', err)
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Timeout: La carga de datos está tardando demasiado. El servidor CRM puede estar lento. Intente nuevamente.')
        } else if (err.message.includes('Failed to fetch')) {
          setError('Error de conexión: No se pudo conectar al servidor. Verifique su conexión a internet.')
        } else if (err.message.includes('HTTP error')) {
          setError(`Error del servidor: ${err.message}`)
        } else if (err.message.includes('NetworkError')) {
          setError('Error de red: Problema de conectividad. Verifique su conexión.')
        } else {
          setError(`Error: ${err.message}`)
        }
      } else {
        setError('Error desconocido al cargar ventas')
      }
    } finally {
      setLoading(false)
      setFiltering(false)
      setApplyingFilter(false)
      setResetting(false)
    }
  }

  // Cargar datos automáticamente al inicializar el componente
  useEffect(() => {
    fetchVentas(fechaInicio, fechaFin, true) // Cargar inmediatamente con fechas por defecto
  }, []) // Solo se ejecuta una vez al montar el componente

  // Funcionalidad click-outside para cerrar sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarCollapsed) return // No hacer nada si ya está colapsado

      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarCollapsed(true)
      }
    }

    // Agregar listener solo si el sidebar está expandido
    if (!sidebarCollapsed) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarCollapsed])

  // Los clientes ahora se calculan dinámicamente con useMemo, no necesitamos este useEffect

  // Debug: Detectar cuando el usuario navega a la sección Equipo
  useEffect(() => {
    if (activeSection === 'equipo') {
      console.log(`🎯 ===== DETECTADO: NAVEGANDO A SECCIÓN EQUIPO =====`);
      console.log(`📊 Ventas disponibles: ${ventas.length}`);
      console.log(`📅 Fecha equipo: ${fechaInicioEquipo} - ${fechaFinEquipo}`);
      if (ventas.length > 0) {
        const vendedores = [...new Set(ventas.map(v => v.ejecutivo_nombre).filter(Boolean))];
        console.log(`👥 Vendedores únicos encontrados: ${vendedores.length}`, vendedores);
      }
    }
  }, [activeSection, ventas, fechaInicioEquipo, fechaFinEquipo])

  // Controlar scroll de la página cuando el modal está abierto
  useEffect(() => {
    if (showDetallesModal) {
      // Bloquear scroll del body
      document.body.style.overflow = 'hidden'
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = 'unset'
    }

    // Cleanup: restaurar scroll cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDetallesModal])

  // Función helper para calcular estadísticas de ejecutivos del CRM
  const calcularEstadisticasEjecutivo = useCallback((nombreEjecutivo: string, fechaInicioEquipo: string, fechaFinEquipo: string) => {
    console.log(`🔎 Calculando stats para: "${nombreEjecutivo}"`);
    
    // Usar las fechas seleccionadas
    const fechaInicio = new Date(fechaInicioEquipo);
    const fechaFin = new Date(fechaFinEquipo);
    fechaFin.setHours(23, 59, 59, 999);
    
    const contratosEjecutivo = ventas.filter((venta: Venta) => {
      // Normalizar nombres del CRM (quitar etiqueta (Vendedor) case-insensitive)
      const vendedorCRM = (venta.ejecutivo_nombre || '')
        .replace(/ \(Vendedor\)/gi, '')  // Quitar etiqueta case-insensitive
        .replace(/\s+/g, ' ')           // Normalizar espacios
        .trim()
        .toLowerCase();
      
      // Normalizar nombre del ejecutivo (quitar etiqueta (vendedor) case-insensitive)
      const nombreEjecutivoNormalizado = nombreEjecutivo
        .replace(/ \(vendedor\)/gi, '')  // Quitar etiqueta case-insensitive
        .replace(/\s+/g, ' ')           // Normalizar espacios
        .trim()
        .toLowerCase();
      
      const match = vendedorCRM === nombreEjecutivoNormalizado;
      
      // Debug simple
      if (match && venta.ejecutivo_nombre && venta.ejecutivo_nombre.includes('ANA')) {
        console.log(`  🎯 Match encontrado:`, {
          original: venta.ejecutivo_nombre,
          normalizado: vendedorCRM,
          buscando: nombreEjecutivoNormalizado
        });
      }
      
      return match;
    });
    
    const contratosDelPeriodo = contratosEjecutivo.filter((venta: Venta) => {
      if (!venta.fecha_venta) return false;
      const fechaVenta = new Date(venta.fecha_venta);
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
    });
    
    // Contar por estado
    const conteoPorEstado: Record<string, number> = {
      'Preingreso': 0,
      'Validación': 0,
      'Contrato': 0,
      'Confirmación Entrega': 0,
      'Producción': 0,
      'Entrega OK': 0
    };
    
    // Mapear estados del CRM a nuestras categorías
    contratosDelPeriodo.forEach((venta: Venta) => {
      const estadoCrm = venta.estado_crm || '';
      const estadoLower = estadoCrm.toLowerCase().trim();
      
      let estadoMapeado = false;
      
      // 1. Entrega OK (más específico primero)
      if (estadoLower.includes('entrega ok') || 
          estadoLower.includes('entregado') || 
          estadoLower.includes('delivered') ||
          estadoLower.includes('finalizado') ||
          estadoLower.includes('completado')) {
        conteoPorEstado['Entrega OK']++;
        estadoMapeado = true;
      }
      // 2. Producción
      else if (estadoLower.includes('producci') || 
               estadoLower.includes('production') ||
               estadoLower.includes('fabricaci')) {
        conteoPorEstado['Producción']++;
        estadoMapeado = true;
      }
      // 3. Confirmación Entrega
      else if ((estadoLower.includes('confirmaci') && estadoLower.includes('entrega')) ||
               estadoLower.includes('confirmación entrega') ||
               estadoLower.includes('delivery confirmation')) {
        conteoPorEstado['Confirmación Entrega']++;
        estadoMapeado = true;
      }
      // 4. Contrato
      else if (estadoLower.includes('contrato') || 
               estadoLower.includes('contract') ||
               estadoLower.includes('firmado') ||
               estadoLower.includes('signed')) {
        conteoPorEstado['Contrato']++;
        estadoMapeado = true;
      }
      // 5. Validación
      else if (estadoLower.includes('validaci') || 
               estadoLower.includes('validado') || 
               estadoLower.includes('validation') ||
               estadoLower.includes('aprobado') ||
               estadoLower.includes('approved')) {
        conteoPorEstado['Validación']++;
        estadoMapeado = true;
      }
      // 6. Preingreso (menos específico al final)
      else if (estadoLower.includes('preingreso') || 
               estadoLower.includes('pre-ingreso') || 
               estadoLower.includes('ingreso') ||
               estadoLower.includes('inicial') ||
               estadoLower.includes('nuevo') ||
               estadoLower === '' || 
               estadoLower === 'sin estado') {
        conteoPorEstado['Preingreso']++;
        estadoMapeado = true;
      }
      
      // Si no se mapea a ningún estado conocido, contar como Preingreso por defecto
      if (!estadoMapeado) {
        conteoPorEstado['Preingreso']++;
      }
    });
    
    // Calcular total y cerrados
    const totalContratos = contratosDelPeriodo.length;
    const contratosCerrados = contratosDelPeriodo.filter((venta: Venta) => {
      const estado = venta.estado_crm?.toLowerCase() || '';
      return estado.includes('entrega ok') || 
             estado.includes('completado') || 
             estado.includes('finalizado') ||
             estado.includes('entregado');
    }).length;
    
    console.log(`📊 "${nombreEjecutivo}": ${totalContratos} contratos en período | ${contratosEjecutivo.length} totales`);
    
    return {
      ...conteoPorEstado,
      total: totalContratos,
      cerrados: contratosCerrados
    };
  }, [ventas])

  // Actualizar ejecutivos dinámicamente desde el CRM
  React.useEffect(() => {
    const { ejecutivosChileHome: chileHomeActualizado, ejecutivosConstrumatter: construmatterActualizado } = obtenerEjecutivosDesdeCRM(ventas);
    
    // Actualizar arrays de ejecutivos con datos del CRM
    ejecutivosChileHome.length = 0;
    ejecutivosChileHome.push(...chileHomeActualizado);
    ejecutivosConstruMater.length = 0;
    ejecutivosConstruMater.push(...construmatterActualizado);
    
    // Debug básico
    console.log(`🎯 VENDEDORES EN CRM: ${[...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))].length}`);
    console.log(`📊 Período: ${fechaInicioEquipo} - ${fechaFinEquipo}`);
  }, [ventas, fechaInicioEquipo, fechaFinEquipo]);

  return (
    <>
      {loading && (
        <ChileHomeLoader 
          isLoading={loading} 
          onComplete={() => setLoading(false)}
        />
      )}
      
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          ref={sidebarRef}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          user={user}
          collapsed={sidebarCollapsed}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300`}>
          <main className="p-6">
          {activeSection === 'dashboard' && (
            <DashboardOverview 
              stats={statsFiltradas} 
              ventas={ventasFiltradas} 
              user={user}
              clientes={convertVentasToClientes(ventasFiltradas)}
              clientesLoading={clientesLoading}
              clientesError={clientesError}
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              setFechaInicio={setFechaInicio}
              setFechaFin={setFechaFin}
              fetchVentas={fetchVentas}
              fechaInicioProyecto={fechaInicioProyecto}
              fechaHoy={fechaHoy}
              applyingFilter={applyingFilter}
              resetting={resetting}
              soloValidados={soloValidados}
              setSoloValidados={setSoloValidados}
              paginaActualVentas={paginaActualVentas}
              setPaginaActualVentas={setPaginaActualVentas}
            />
          )}
          {activeSection === 'contratos' && (
            <div className="space-y-6">
              {/* Submenú de contratos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setContratosSubsection('activos')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      contratosSubsection === 'activos'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Contratos Activos
                  </button>
                  <button
                    onClick={() => setContratosSubsection('eliminados')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      contratosSubsection === 'eliminados'
                        ? 'bg-red-600 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Fichas Eliminadas
                  </button>
                </div>
              </div>

              {/* Contenido según subsección */}
              {contratosSubsection === 'activos' ? (
                <ContratosSection 
                  ventas={ventasFiltradas}
                  setVentas={setVentas}
                  loading={loading}
                  filtering={filtering}
                  setFiltering={setFiltering}
                  error={error}
                  fechaInicio={fechaInicio}
                  fechaFin={fechaFin}
                  setFechaInicio={setFechaInicio}
                  setFechaFin={setFechaFin}
                  fetchVentas={fetchVentas}
                  setShowValidationModal={setShowValidationModal}
                  setSelectedVenta={setSelectedVenta}
                  setShowDetallesModal={setShowDetallesModal}
                  soloValidados={soloValidados}
                  setSoloValidados={setSoloValidados}
                  fechaInicioProyecto={fechaInicioProyecto}
                  fechaHoy={fechaHoy}
                  generatingContractId={generatingContractId}
                  handleGenerarContrato={handleGenerarContrato}
                  contractFilters={contractFilters}
                  setContractFilters={setContractFilters}
                  setShowContractPreview={setShowContractPreview}
                  paginaActualVentas={paginaActualVentas}
                  setPaginaActualVentas={setPaginaActualVentas}
                  setShowDeleteModal={setShowDeleteModal}
                />
              ) : (
                <FichasEliminadas onRestoreFicha={() => fetchVentas(fechaInicio, fechaFin, false, 'force')} />
              )}
            </div>
          )}
          {activeSection === 'planos' && (
            <ListadoPlanos />
          )}
          {activeSection === 'logistica' && (
            <CRMDashboard />
          )}
          {activeSection === 'equipo' && (
            <div className="space-y-6">
              {(() => {
                console.log(`🎯 ====== USUARIO EN SECCIÓN EQUIPO ======`);
                console.log(`📊 Datos CRM disponibles: ${ventas.length} ventas`);
                return null;
              })()}
              {/* Header con título y calendario en la misma línea */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Equipo de Trabajo</h1>
                    <p className="text-gray-600">
                      Gestión y supervisión del equipo - Contratos por período
                    </p>
                  </div>

                  {/* Selector de fechas */}
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Período:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CustomDatePicker
                        isRange={true}
                        startDate={fechaInicioEquipo ? (() => {
                          const parts = fechaInicioEquipo.split('-');
                          if (parts.length === 3) {
                            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                          }
                          return null;
                        })() : null}
                        endDate={fechaFinEquipo ? (() => {
                          const parts = fechaFinEquipo.split('-');
                          if (parts.length === 3) {
                            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                          }
                          return null;
                        })() : null}
                        onRangeChange={(startDate, endDate) => {
                          const startString = startDate ? (() => {
                            const year = startDate.getFullYear();
                            const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
                            const day = startDate.getDate().toString().padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })() : '';
                          
                          const endString = endDate ? (() => {
                            const year = endDate.getFullYear();
                            const month = (endDate.getMonth() + 1).toString().padStart(2, '0');
                            const day = endDate.getDate().toString().padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })() : '';
                          
                          if (startString) setFechaInicioEquipo(startString);
                          if (endString) setFechaFinEquipo(endString);
                        }}
                        minDate={new Date(fechaInicioProyecto)}
                        maxDate={new Date()}
                        placeholder="Seleccionar período"
                        className="w-64"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  Período seleccionado: <span className="font-medium text-blue-600">{(() => {
                    const fecha = new Date(fechaInicioEquipo + 'T00:00:00');
                    return fecha.toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    });
                  })()}</span> hasta <span className="font-medium text-blue-600">{(() => {
                    const fecha = new Date(fechaFinEquipo + 'T00:00:00');
                    return fecha.toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    });
                  })()}</span>
                </div>
                
                {/* Panel de resumen CRM */}
                <div className="mt-3 text-xs bg-green-50 border border-green-200 rounded p-2">
                  <span className="text-green-700 font-medium">✅ CRM Conectado:</span> 
                  <span className="text-green-600"> {ventas.length} ventas cargadas | {[...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))].length} vendedores encontrados</span>
                </div>
                
                {/* Dropdown personalizado de vendedores del CRM */}
                <div className="mt-2 text-sm bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <strong className="text-blue-800">👥 Vendedores CRM ({[...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))].length})</strong>
                    
                    {/* Dropdown personalizado */}
                    <div className="relative ml-4">
                      <button
                        className="px-4 py-2 bg-white border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 min-w-48"
                        onClick={() => setDropdownAbierto(!dropdownAbierto)}
                      >
                        <span className="flex-1 text-left">
                          {vendedorSeleccionado === 'todos' 
                            ? '📊 Ver todos los vendedores' 
                            : `👤 ${formatearNombreVendedor(vendedorSeleccionado)}`}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${dropdownAbierto ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {dropdownAbierto && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-blue-300 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto min-w-48">
                          <div 
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100"
                            onClick={() => {
                              setVendedorSeleccionado('todos');
                              setDropdownAbierto(false);
                              console.log('📊 Mostrando todos los vendedores');
                            }}
                          >
                            📊 Ver todos los vendedores
                          </div>
                          {[...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))].map((vendedor, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                              onClick={() => {
                                setVendedorSeleccionado(vendedor);
                                setDropdownAbierto(false);
                                console.log(`👤 Vendedor seleccionado: ${formatearNombreVendedor(vendedor)}`);
                              }}
                            >
                              👤 {formatearNombreVendedor(vendedor)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Lista compacta de vendedores */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {[...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))]
                      .map(vendedor => formatearNombreVendedor(vendedor))
                      .map((vendedor, index) => (
                        <div key={index} className="bg-white px-2 py-1 rounded border border-blue-200 text-xs">
                          <span className="font-medium text-blue-600">{vendedor}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>



              {/* Layout en dos columnas paralelas - Tablas profesionales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Tabla ChileHome */}
                <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                  {/* Header de la tabla */}
                  <div className="bg-gray-800 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">CH</span>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">ChileHome</h2>
                          <p className="text-gray-300 text-xs">Empresa Matriz</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{ejecutivosChileHome.length}</p>
                        <p className="text-gray-300 text-xs">Ejecutivos</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="text-left px-2 py-2 font-semibold text-gray-700 text-xs">Ejecutivo</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Preingreso">Pre</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Validación">Val</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Contrato">Con</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Confirmación Entrega">Conf</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Producción">Prod</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Entrega OK">OK</th>
                          <th className="text-center px-1 py-2 font-bold text-blue-700 text-xs bg-blue-50">Total</th>
                          <th className="text-center px-1 py-2 font-bold text-green-700 text-xs bg-green-50" title="Cerrados">Cerr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ejecutivosChileHome.map((ejecutivo, index) => {
                          // DEBUG: Log del ejecutivo que se está procesando
                          console.log(`🔍 ===== PROCESANDO EJECUTIVO CHILEHOME ${index + 1} =====`);
                          console.log(`Índice: ${index}, Nombre para matching: "${ejecutivo.nombre}", Display: "${ejecutivo.nombreDisplay}"`);
                          
                          // Calcular estadísticas usando función helper
                          const stats = calcularEstadisticasEjecutivo(ejecutivo.nombre, fechaInicioEquipo, fechaFinEquipo);
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-gray-600 rounded flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">{ejecutivo.iniciales}</span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-xs">{ejecutivo.nombreDisplay || ejecutivo.nombre}</p>
                                    <p className="text-gray-500 text-xs">{ejecutivo.telefono}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Preingreso'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Validación'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Contrato'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Confirmación Entrega'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Producción'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Entrega OK'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs font-bold text-blue-700">{stats.total || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs font-bold text-green-700">{stats.cerrados || 0}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla Construmatter */}
                <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                  {/* Header de la tabla */}
                  <div className="bg-gray-800 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">CM</span>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Construmatter</h2>
                          <p className="text-gray-300 text-xs">Empresa Filial</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{ejecutivosConstruMater.length}</p>
                        <p className="text-gray-300 text-xs">Ejecutivos</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="text-left px-2 py-2 font-semibold text-gray-700 text-xs">Ejecutivo</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Preingreso">Pre</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Validación">Val</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Contrato">Con</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Confirmación Entrega">Conf</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Producción">Prod</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Entrega OK">OK</th>
                          <th className="text-center px-1 py-2 font-bold text-blue-700 text-xs bg-blue-50">Total</th>
                          <th className="text-center px-1 py-2 font-bold text-green-700 text-xs bg-green-50" title="Cerrados">Cerr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ejecutivosConstruMater.map((ejecutivo, index) => {
                          const stats = calcularEstadisticasEjecutivo(ejecutivo.nombre, fechaInicioEquipo, fechaFinEquipo);
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-gray-600 rounded flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">{ejecutivo.iniciales}</span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-xs">{ejecutivo.nombreDisplay || ejecutivo.nombre}</p>
                                    <p className="text-gray-500 text-xs">{ejecutivo.telefono}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Preingreso'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Validación'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Contrato'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Confirmación Entrega'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Producción'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Entrega OK'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs font-bold text-blue-700">{stats.total || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs font-bold text-green-700">{stats.cerrados || 0}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla Construmatter */}
                <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden">
                  {/* Header de la tabla */}
                  <div className="bg-gray-800 text-white px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">CM</span>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold">Construmatter</h2>
                          <p className="text-gray-300 text-xs">Empresa Filial</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{ejecutivosConstruMater.length}</p>
                        <p className="text-gray-300 text-xs">Ejecutivos</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200">
                          <th className="text-left px-2 py-2 font-semibold text-gray-700 text-xs">Ejecutivo</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Preingreso">Pre</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Validación">Val</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Contrato">Con</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Confirmación Entrega">Conf</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Producción">Prod</th>
                          <th className="text-center px-1 py-2 font-semibold text-gray-700 text-xs" title="Entrega OK">OK</th>
                          <th className="text-center px-1 py-2 font-bold text-blue-700 text-xs bg-blue-50">Total</th>
                          <th className="text-center px-1 py-2 font-bold text-green-700 text-xs bg-green-50" title="Cerrados">Cerr</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ejecutivosConstruMater.map((ejecutivo, index) => {
                          // Calcular estadísticas usando función helper
                          const stats = calcularEstadisticasEjecutivo(ejecutivo.nombre, fechaInicioEquipo, fechaFinEquipo);
                          
                          return (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 bg-gray-600 rounded flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">{ejecutivo.iniciales}</span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 text-xs">{ejecutivo.nombreDisplay || ejecutivo.nombre}</p>
                                    <p className="text-gray-500 text-xs">{ejecutivo.telefono}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Preingreso'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Validación'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Contrato'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Confirmación Entrega'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Producción'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center">
                                <span className="text-xs text-gray-700">{stats['Entrega OK'] || 0}</span>
                              </td>
                              <td className="px-1 py-2 text-center bg-blue-50">
                                <span className="font-bold text-xs text-blue-700">{stats.total}</span>
                              </td>
                              <td className="px-1 py-2 text-center bg-green-50">
                                <span className="font-bold text-xs text-green-700">{stats.cerrados}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Calendario de contratos por ejecutivo - Vista horizontal simplificada */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-900">Calendario de Contratos por Ejecutivo</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Actividad diaria de contratos por ejecutivo
                  </p>
                </div>
                
                {/* Calendario horizontal compacto */}
                <div className="p-6">
                  {(() => {
                    // Generar días del período seleccionado (no mostrar días futuros)
                    const fechaInicio = new Date(fechaInicioEquipo)
                    const fechaFin = new Date(fechaFinEquipo)
                    const hoy = new Date()
                    hoy.setHours(23, 59, 59, 999) // Incluir todo el día de hoy
                    
                    // No mostrar días futuros
                    const fechaFinReal = fechaFin > hoy ? hoy : fechaFin
                    
                    const diasDelPeriodo = []
                    
                    for (let d = new Date(fechaInicio); d <= fechaFinReal; d.setDate(d.getDate() + 1)) {
                      diasDelPeriodo.push(new Date(d))
                    }
                    
                    // Filtrar contratos por día y ejecutivo
                    const contratosPorDia = diasDelPeriodo.map(dia => {
                      const diaStr = dia.toISOString().split('T')[0]
                      const contratosDelDia = ventas.filter((venta: Venta) => {
                        if (!venta.fecha_venta) return false
                        const fechaVenta = venta.fecha_venta.split('T')[0]
                        return fechaVenta === diaStr
                      })
                      
                      // Agrupar por ejecutivo con información clara
                      const porEjecutivo: Record<string, { total: number, estados: Record<string, number> }> = {}
                      
                      contratosDelDia.forEach((venta: Venta) => {
                        const ejecutivoNombre = venta.ejecutivo_nombre?.trim() || 'Sin asignar'
                        let estadoSimplificado = 'Otros'
                        
                        const estadoCrm = venta.estado_crm?.toLowerCase() || ''
                        
                        // Debug logs temporarily disabled to prevent Event object errors
                        
                        // Mapear estados a categorías claras (más amplio para capturar variaciones)
                        if (estadoCrm.includes('preingreso') || estadoCrm.includes('pre-ingreso') || estadoCrm.includes('ingreso')) {
                          estadoSimplificado = 'Preingreso'
                        } else if (estadoCrm.includes('validaci') || estadoCrm.includes('validado') || estadoCrm.includes('validation')) {
                          estadoSimplificado = 'Validación'
                        } else if (estadoCrm.includes('contrato') && !estadoCrm.includes('pre')) {
                          estadoSimplificado = 'Contrato'
                        } else if (estadoCrm.includes('confirmaci') || estadoCrm.includes('confirmación')) {
                          estadoSimplificado = 'Confirmación'
                        } else if (estadoCrm.includes('producci') || estadoCrm.includes('fabricaci') || estadoCrm.includes('manufactura')) {
                          estadoSimplificado = 'Producción'
                        } else if (estadoCrm.includes('entrega ok') || estadoCrm.includes('completado') || estadoCrm.includes('finalizado') || estadoCrm.includes('entregado')) {
                          estadoSimplificado = 'Entregado'
                        } else if (estadoCrm) {
                          // Si tiene un estado pero no coincide con ninguno, usar el estado original
                          estadoSimplificado = venta.estado_crm
                        }
                        
                        if (!porEjecutivo[ejecutivoNombre]) {
                          porEjecutivo[ejecutivoNombre] = { total: 0, estados: {} }
                        }
                        
                        porEjecutivo[ejecutivoNombre].total++
                        
                        if (!porEjecutivo[ejecutivoNombre].estados[estadoSimplificado]) {
                          porEjecutivo[ejecutivoNombre].estados[estadoSimplificado] = 0
                        }
                        porEjecutivo[ejecutivoNombre].estados[estadoSimplificado]++
                      })
                      
                      return {
                        dia,
                        diaNumero: dia.getDate(),
                        diaNombre: dia.toLocaleDateString('es-ES', { weekday: 'short' }),
                        esHoy: dia.toDateString() === new Date().toDateString(),
                        totalContratos: contratosDelDia.length,
                        ejecutivos: porEjecutivo
                      }
                    })
                    
                    // Debug: Resumen de datos del CRM
                    const totalContratosEnPeriodo = ventas.filter((venta: Venta) => {
                      if (!venta.fecha_venta) return false
                      const fechaVenta = new Date(venta.fecha_venta)
                      const fechaInicio = new Date(fechaInicioEquipo)
                      const fechaFinReal = fechaFin > hoy ? hoy : fechaFin
                      return fechaVenta >= fechaInicio && fechaVenta <= fechaFinReal
                    })
                    
                    // Variables de debug para el panel
                    const vendedoresEnCRM = [...new Set(ventas.map((v: Venta) => v.ejecutivo_nombre).filter(Boolean))]
                    
                    // Debug logs temporarily disabled to prevent Event object errors
                    
                    return (
                      <div className="space-y-4">
                        {/* Panel de Debug removido - confirmamos que el CRM funciona correctamente */}
                        
                        {/* Vista horizontal de días */}
                        <div className="overflow-x-auto">
                          <div className="flex gap-1 min-w-max pb-4">
                            {contratosPorDia.map((diaData, index) => (
                              <div
                                key={index}
                                className={`flex-shrink-0 w-20 p-2 rounded-lg border text-center text-xs ${
                                  diaData.esHoy 
                                    ? 'bg-blue-100 border-blue-300' 
                                    : diaData.totalContratos > 0 
                                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                                      : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className={`font-semibold ${diaData.esHoy ? 'text-blue-700' : 'text-gray-700'}`}>
                                  {diaData.diaNumero}
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                  {diaData.diaNombre}
                                </div>
                                {diaData.totalContratos > 0 ? (
                                  <div className="space-y-1">
                                    <div className="font-bold text-green-600">
                                      {diaData.totalContratos} contratos
                                    </div>
                                    {Object.entries(diaData.ejecutivos).slice(0, 2).map(([ejecutivo, data]) => {
                                      const nombreCorto = ejecutivo.split(' ')[0]
                                      const estadoPrincipal = Object.entries(data.estados)
                                        .sort(([,a], [,b]) => b - a)[0]
                                      
                                      return (
                                        <div key={ejecutivo} className="text-xs bg-white rounded px-1 py-0.5">
                                          <div className="font-medium text-gray-700">{nombreCorto}</div>
                                          <div className="text-blue-600">{data.total} - {estadoPrincipal?.[0] || 'N/A'}</div>
                                        </div>
                                      )
                                    })}
                                    {Object.keys(diaData.ejecutivos).length > 2 && (
                                      <div className="text-xs text-gray-500">
                                        +{Object.keys(diaData.ejecutivos).length - 2} más
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-xs">
                                    Sin actividad
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

            </div>
          )}
          {activeSection === 'mensajes' && (
            <ConfiguracionMensajes />
          )}
          {activeSection === 'configuracion' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuración</h2>
              <p className="text-gray-600">Panel de configuración en desarrollo</p>
              <p className="text-sm text-gray-500 mt-2">Próximamente: configuración de API, usuarios y sistema</p>
            </div>
          )}
          </main>
        </div>
      </div>
      
      {/* Modal de Validación de Contrato */}
      {showValidationModal && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Validar Contrato</h3>
                <button
                  onClick={() => {
                    setShowValidationModal(false)
                    setSelectedVenta(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Nombre:</span> {selectedVenta.cliente_nombre}</p>
                    <p><span className="font-medium">RUT:</span> {formatRUT(selectedVenta.cliente_rut)}</p>
                    <p><span className="font-medium">Teléfono:</span> {formatPhone(selectedVenta.cliente_telefono)}</p>
                    <p><span className="font-medium">Dirección:</span> {selectedVenta.direccion_entrega}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Detalles de la Venta</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Vendedor:</span> {formatProperCase(cleanVendorName(selectedVenta.ejecutivo_nombre))}</p>
                    <p><span className="font-medium">Valor:</span> {
                      typeof selectedVenta.valor_total === 'number' 
                        ? formatCurrency(selectedVenta.valor_total)
                        : formatCurrency(parseFloat(selectedVenta.valor_total?.toString() || '0') || 0)
                    }</p>
                    <p><span className="font-medium">Modelo:</span> {formatModeloCasa(selectedVenta.modelo_casa, selectedVenta.superficie)}</p>
                    <p><span className="font-medium">Fecha:</span> {formatDate(selectedVenta.fecha_venta)}</p>
                  </div>
                </div>
                
                {selectedVenta.observaciones_crm && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Observaciones</h4>
                    <p className="text-sm text-gray-600">{selectedVenta.observaciones_crm}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowValidationModal(false)
                    setSelectedVenta(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      setValidatingId(selectedVenta.id)
                      
                      const response = await fetch('/api/crm/ventas', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          action: 'validar_contrato',
                          ventaId: selectedVenta.id,
                          observaciones: ''
                        })
                      })
                      
                      const result = await safeParseJSON(response)
                      
                      if (result.success) {
                        // Actualizar el estado local de la venta
                        setVentas(prevVentas => 
                          prevVentas.map(v => 
                            v.id === selectedVenta.id 
                              ? { ...v, estado_crm: 'Validado' }
                              : v
                          )
                        )
                        
                        // Actualizar stats
                        setStats(prev => ({
                          ...prev,
                          contratosListos: prev.contratosListos + 1
                        }))
                        
                        // Mostrar notificación de éxito
                        setNotification({
                          type: 'success',
                          message: `¡Contrato de ${selectedVenta.cliente_nombre} validado exitosamente!`
                        })
                        
                        // Auto-hide notification after 5 seconds
                        setTimeout(() => setNotification(null), 5000)
                        
                        setValidatingId(null)
                        setShowValidationModal(false)
                        setSelectedVenta(null)
                      } else {
                        throw new Error(result.error || 'Error al validar contrato')
                      }
                    } catch (error) {
                      console.error('Error validando contrato:', error)
                      setError('Error al validar el contrato')
                      setValidatingId(null)
                    }
                  }}
                  disabled={validatingId === selectedVenta.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {validatingId === selectedVenta.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Validar Contrato
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar contrato - Diseño minimalista */}
      {showDeleteModal && selectedVenta && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
            {/* Icon at top */}
            <div className="pt-8 pb-4 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
            </div>
            
            {/* Content */}
            <div className="px-8 pb-8">
              {/* Title */}
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-2 font-sans">
                ¿Estás seguro que deseas<br />eliminar este contrato?
              </h2>
              
              {/* Subtitle */}
              <p className="text-gray-500 text-sm text-center mb-6 font-sans">
                ID: {selectedVenta.id} • {selectedVenta.cliente_nombre}
              </p>
              
              {/* Info boxes */}
              <div className="space-y-3 mb-6">
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-sans">Cliente:</span>
                    <span className="text-sm font-medium text-gray-900 font-sans">{selectedVenta.cliente_nombre}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-sans">ID CRM:</span>
                    <span className="text-sm font-medium text-gray-900 font-sans">{selectedVenta.id}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-sans">Valor del contrato:</span>
                    <span className="text-sm font-medium text-gray-900 font-sans">
                      {typeof selectedVenta.valor_total === 'number' 
                        ? formatCurrency(selectedVenta.valor_total)
                        : formatCurrency(parseFloat(selectedVenta.valor_total?.toString() || '0') || 0)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-sans">Estado actual:</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getEstadoStyle(selectedVenta.estado_crm || '')}`}>
                      {selectedVenta.estado_crm || 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Warning message */}
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 font-sans">
                    Toda la información relacionada con este contrato será eliminada permanentemente del sistema. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedVenta(null)
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium font-sans text-sm"
                  disabled={deletingId === selectedVenta.id}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEliminarContrato(selectedVenta)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium font-sans text-sm"
                  disabled={deletingId === selectedVenta.id}
                >
                  {deletingId === selectedVenta.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Eliminando...
                    </span>
                  ) : (
                    'Eliminar contrato'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Detalles Completos - Rediseñado */}
      {showDetallesModal && selectedVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Información Completa del Contrato</h3>
                  <p className="text-slate-300 text-sm mt-1">ID: #{selectedVenta.id} | Estado: {selectedVenta.estado_crm || 'Pendiente'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetallesModal(false)
                    setSelectedVenta(null)
                  }}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              {/* Grid de información */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Columna 1: Datos del Cliente */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Datos del Cliente", UserIcon, "cliente")}
                    <div className="p-4 space-y-3">
                      {renderEditableField("Nombre Completo", "cliente_nombre", selectedVenta.cliente_nombre, "cliente")}
                      {renderEditableField("RUT", "cliente_rut", selectedVenta.cliente_rut, "cliente", "text", (value) => value ? formatRUT(value) : value)}
                      {renderEditableField("Teléfono", "cliente_telefono", selectedVenta.cliente_telefono, "cliente", "tel", (value) => value ? formatPhone(value) : value)}
                      {renderEmailField("Email", "cliente_email", selectedVenta.cliente_email, "cliente")}
                      {renderEditableField("Dirección de Entrega", "direccion_entrega", selectedVenta.direccion_entrega, "cliente")}
                      {renderEditableField("Comuna", "comuna", selectedVenta.comuna, "cliente")}
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Documentación", FileText, "documentacion")}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Número de Contrato</p>
                        {(() => {
                          // Si ya tiene número de contrato Y el estado indica que el contrato físico fue generado
                          if (selectedVenta.numero_contrato && selectedVenta.numero_contrato !== '0' && (
                            selectedVenta.estado_crm?.toLowerCase().includes('contrato generado') ||
                            selectedVenta.estado_crm?.toLowerCase().includes('entrega ok') ||
                            selectedVenta.estado_crm?.toLowerCase().includes('completado')
                          )) {
                            return (
                              <p className="text-sm font-bold text-green-600 font-mono bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                ✓ {selectedVenta.numero_contrato}
                              </p>
                            )
                          }
                          // Si ya tiene número asignado PERO el contrato físico aún no se ha generado
                          else if (selectedVenta.numero_contrato && selectedVenta.numero_contrato !== '0') {
                            return (
                              <p className="text-sm font-bold text-orange-600 font-mono bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {selectedVenta.numero_contrato} (Pendiente de generar)
                              </p>
                            )
                          }
                          // Si no tiene número, mostrar que aún no se ha asignado
                          else {
                            return (
                              <p className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Sin asignar
                              </p>
                            )
                          }
                        })()}
                      </div>
                      {/* Selector de Forma de Pago personalizado */}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Forma de Pago</p>
                        {((isEditingFields && editingSection === 'all') || editingSection === 'documentacion') ? (
                          <select
                            value={editedVenta?.forma_pago || selectedVenta.forma_pago || ""}
                            onChange={(e) => handleFieldChange('forma_pago', e.target.value)}
                            className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="" disabled className="text-gray-500">Seleccionar forma de pago</option>
                            <option value="efectivo" className="text-gray-900">Efectivo</option>
                            <option value="transferencia" className="text-gray-900">Transferencia</option>
                          </select>
                        ) : (
                          <p className="text-sm font-medium text-gray-900">
                            {selectedVenta.forma_pago ? (
                              <span className="capitalize">{selectedVenta.forma_pago}</span>
                            ) : (
                              <span className="text-orange-600">⚠ Sin información</span>
                            )}
                          </p>
                        )}
                      </div>
                      {renderEditableField("Descuento Aplicado (%)", "descuento", selectedVenta.descuento, "documentacion", "number")}
                    </div>
                  </div>
                </div>

                {/* Columna 2: Información de la Venta */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Detalles del Producto", Home, "producto")}
                    <div className="p-4 space-y-3">
                      {renderEditableField("Modelo de Casa", "modelo_casa", selectedVenta.modelo_casa, "producto")}
                      {renderEditableField("Superficie Total (m²)", "superficie", selectedVenta.superficie, "producto", "number")}
                      {renderEditableField("Valor Total", "valor_total", selectedVenta.valor_total, "producto", "number", (value) => value ? formatCurrency(parseFloat(value)) : value)}
                      {renderEditableField("Valor UF", "valor_uf", selectedVenta.valor_uf, "producto", "number")}
                    </div>
                  </div>

                  {/* Fechas Importantes */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Fechas Importantes", Calendar, "fechas")}
                    <div className="p-4 space-y-3">
                      {renderEditableField("Fecha de Venta", "fecha_venta", selectedVenta.fecha_venta, "fechas", "date", (value) => value ? formatDate(value) : value)}
                      {renderEditableField("Fecha de Entrega", "fecha_entrega", selectedVenta.fecha_entrega, "fechas", "date", (value) => value ? formatDate(value) : value)}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Última Actualización</p>
                        <p className="text-sm font-medium text-gray-500">{selectedVenta.fecha_actualizacion ? formatDate(selectedVenta.fecha_actualizacion) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna 3: Equipo y Observaciones */}
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Equipo Responsable", Users, "equipo")}
                    <div className="p-4 space-y-3">
                      {renderEditableField("Ejecutivo de Ventas", "ejecutivo_nombre", selectedVenta.ejecutivo_nombre, "equipo", "text", (value) => value ? cleanVendorName(value) : value)}
                      {renderEditableField("Supervisor", "supervisor_nombre", selectedVenta.supervisor_nombre, "equipo")}
                      {renderEditableField("Empresa", "empresa", selectedVenta.empresa || 'ChileHome', "equipo")}
                      {renderEditableField("Sucursal", "sucursal", selectedVenta.sucursal, "equipo")}
                    </div>
                  </div>

                  {/* Estado y Seguimiento */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Estado y Seguimiento", TrendingUp, "estado")}
                    <div className="p-4 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado Actual</p>
                        {editingSection === "estado" ? (
                          <select
                            value={editedVenta?.estado_crm || ''}
                            onChange={(e) => handleFieldChange('estado_crm', e.target.value)}
                            className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleccione estado</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En proceso">En proceso</option>
                            <option value="Producción">Producción</option>
                            <option value="Contrato">Contrato</option>
                            <option value="Validación">Validación</option>
                            <option value="Entrega OK">Entrega OK</option>
                            <option value="Completado">Completado</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getEstadoStyle(selectedVenta.estado_crm || '')}`}>
                            {selectedVenta.estado_crm || 'Pendiente'}
                          </span>
                        )}
                      </div>
                      {renderEditableField("Prioridad", "prioridad", selectedVenta.prioridad || 'Normal', "estado")}
                      {renderEditableField("Origen", "origen", selectedVenta.origen || 'CRM', "estado")}
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    {renderSectionHeader("Observaciones", MessageSquare, "observaciones")}
                    <div className="p-4">
                      {editingSection === "observaciones" ? (
                        <textarea
                          value={editedVenta?.observaciones_crm || ''}
                          onChange={(e) => handleFieldChange('observaciones_crm', e.target.value)}
                          className="w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-lg p-3 min-h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ingrese observaciones..."
                        />
                      ) : (
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg min-h-[80px]">
                          {selectedVenta.observaciones_crm || <span className="text-gray-400 ">Sin observaciones registradas</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de validación */}
            {selectedVenta && (() => {
              const validation = currentValidation
              return (
                <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {validation.isComplete ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                      <span className={`font-medium text-sm ${validation.isComplete ? 'text-green-700' : 'text-orange-700'}`}>
                        {validation.isComplete 
                          ? 'Todos los campos obligatorios están completos' 
                          : `Faltan ${validation.missingFields.length} campos obligatorios`
                        }
                      </span>
                    </div>
                    
                    {!isEditingFields && (
                      <button
                        onClick={handleStartEditing}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="h-3 w-3" />
                        Editar información
                      </button>
                    )}
                    
                    {isEditingFields && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditingFields(false)
                            setEditedVenta(null)
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEditedFields}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Save className="h-3 w-3" />
                          Guardar cambios
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {!validation.isComplete && (
                    <div className="text-xs text-orange-600">
                      <span className="font-medium">Campos faltantes: </span>
                      {validation.missingFields.join(', ')}
                    </div>
                  )}
                </div>
              )
            })()}
            
            {/* Footer con acciones mejorado */}
            <div className="flex-shrink-0 bg-white px-6 py-4 border-t border-gray-200">
              {selectedVenta && (() => {
                const validation = currentValidation
                return (
                  <div className="flex flex-wrap gap-3">
                    {/* Botón llamar cliente - siempre visible */}
                    {selectedVenta.cliente_telefono && (
                      <a
                        href={`tel:${selectedVenta.cliente_telefono}`}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
                      >
                        <Phone className="h-4 w-4" />
                        Llamar Cliente
                      </a>
                    )}

                    {/* Botón principal basado en estado */}
                    {validation.isComplete ? (
                      <button
                        onClick={() => {
                          setContractEditableData(selectedVenta)
                          setShowMissingFieldsEditor(false)
                          setShowContractConfirmation(true)
                        }}
                        disabled={generatingContractId === selectedVenta.id}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                          generatingContractId === selectedVenta.id
                            ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm hover:shadow'
                        }`}
                      >
                        {generatingContractId === selectedVenta.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Revisar y Generar Contrato
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex-1 px-4 py-2.5 bg-orange-100 border border-orange-300 rounded-lg flex items-center justify-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-800 font-medium">Faltan {validation.missingFields.length} campos obligatorios</span>
                      </div>
                    )}
                    
                    {/* Botón cerrar */}
                    <button
                      onClick={() => {
                        setShowDetallesModal(false)
                        setSelectedVenta(null)
                        setIsEditingFields(false)
                        setEditingSection(null)
                        setEditedVenta(null)
                      }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Contrato */}
      {showContractConfirmation && selectedVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Confirmar Generación de Contrato</h3>
                  <p className="text-slate-200 text-sm mt-1">Último paso antes de generar el documento</p>
                </div>
                <button
                  onClick={() => setShowContractConfirmation(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {/* Resumen de información clave */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Información del Contrato Validada
                </h4>
                {/* Información principal siempre visible y limpia */}
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedVenta.cliente_nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">RUT:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatRUT(selectedVenta.cliente_rut)}</span>
                  </div>
                  
                  {/* Solo mostrar campos existentes */}
                  {(contractEditableData?.cliente_telefono || selectedVenta.cliente_telefono) && (
                    <div>
                      <span className="text-gray-600">Teléfono:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatPhone(contractEditableData?.cliente_telefono || selectedVenta.cliente_telefono)}
                      </span>
                    </div>
                  )}
                  
                  {(contractEditableData?.cliente_correo || selectedVenta.cliente_correo || selectedVenta.cliente_email) && (
                    <div>
                      <span className="text-gray-600">Correo:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {contractEditableData?.cliente_correo || selectedVenta.cliente_correo || selectedVenta.cliente_email}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600">Modelo:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatModeloCasa(selectedVenta.modelo_casa, selectedVenta.superficie)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {typeof selectedVenta.valor_total === 'number' 
                        ? formatCurrency(selectedVenta.valor_total)
                        : formatCurrency(parseFloat(selectedVenta.valor_total?.toString() || '0') || 0)
                      }
                    </span>
                  </div>
                  
                  {(contractEditableData?.forma_pago || selectedVenta.forma_pago) && (
                    <div>
                      <span className="text-gray-600">Forma de Pago:</span>
                      <span className="ml-2 font-medium text-gray-900 capitalize">
                        {contractEditableData?.forma_pago || selectedVenta.forma_pago}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-gray-600">Ejecutivo:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatProperCase(cleanVendorName(selectedVenta.ejecutivo_nombre))}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Fecha de Entrega:</span>
                    <span className="ml-2 font-medium text-blue-600">{formatDate(selectedVenta.fecha_entrega)}</span>
                  </div>
                  
                  {selectedVenta.direccion_entrega && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Dirección de Entrega:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatProperCase(selectedVenta.direccion_entrega)}</span>
                    </div>
                  )}
                </div>

                {/* Botón para completar datos faltantes */}
                {(() => {
                  // Usar los datos más actualizados (combinando contractEditableData y selectedVenta)
                  const datosActuales = {
                    cliente_telefono: contractEditableData?.cliente_telefono || selectedVenta.cliente_telefono,
                    cliente_correo: contractEditableData?.cliente_correo || selectedVenta.cliente_correo || selectedVenta.cliente_email,
                    forma_pago: contractEditableData?.forma_pago || selectedVenta.forma_pago,
                    direccion_entrega: contractEditableData?.direccion_entrega || selectedVenta.direccion_entrega
                  }
                  
                  const faltanDatos = !datosActuales.cliente_telefono || 
                                     !datosActuales.cliente_correo || 
                                     !datosActuales.forma_pago ||
                                     !datosActuales.direccion_entrega
                  
                  if (!faltanDatos) return null
                  
                  return (
                    <div className="border-t border-gray-200 pt-4">
                      {!showMissingFieldsEditor ? (
                        <button
                          onClick={() => {
                            setContractEditableData(selectedVenta)
                            setShowMissingFieldsEditor(true)
                          }}
                          className="w-full px-4 py-3 border-2 border-dashed border-amber-300 text-amber-700 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-all text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Completar información faltante
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-semibold text-gray-900">Completar datos:</h5>
                            <button
                              onClick={() => setShowMissingFieldsEditor(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {!selectedVenta.cliente_telefono && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
                              <input
                                type="tel"
                                placeholder="+56 9 1234 5678"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onChange={(e) => setContractEditableData({...contractEditableData || selectedVenta, cliente_telefono: e.target.value})}
                              />
                            </div>
                          )}
                          
                          {!(selectedVenta.cliente_correo || selectedVenta.cliente_email) && (
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Correo electrónico</label>
                              <input
                                type="email"
                                placeholder="cliente@ejemplo.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onChange={(e) => setContractEditableData({...contractEditableData || selectedVenta, cliente_correo: e.target.value})}
                              />
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Forma de pago</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onChange={(e) => setContractEditableData({...contractEditableData || selectedVenta, forma_pago: e.target.value})}
                              value={contractEditableData?.forma_pago || selectedVenta.forma_pago || ""}
                            >
                              <option value="" disabled className="text-gray-500">Seleccionar forma de pago</option>
                              <option value="efectivo" className="text-gray-900">Efectivo</option>
                              <option value="transferencia" className="text-gray-900">Transferencia</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
                

                {/* Observaciones del CRM si existen */}
                {selectedVenta.observaciones_crm && selectedVenta.observaciones_crm.trim() !== '' && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="text-sm font-semibold text-blue-900 mb-2">Observaciones del CRM:</h5>
                    <p className="text-sm text-blue-800">{selectedVenta.observaciones_crm}</p>
                  </div>
                )}
                
              </div>

              {/* Opciones de envío */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-500" />
                  Opciones de Envío
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500" 
                    />
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">Enviar por correo electrónico</span>
                      <span className="text-xs text-gray-700">
                        {selectedVenta.cliente_email || 'Email no disponible'}
                      </span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500" 
                    />
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">Enviar por WhatsApp</span>
                      <span className="text-xs text-gray-700">
                        {formatPhone(selectedVenta.cliente_telefono)}
                      </span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded border-gray-300 text-slate-600 focus:ring-slate-500" 
                    />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-900">Notificar al ejecutivo</span>
                      <span className="text-xs text-gray-700">
                        {formatProperCase(cleanVendorName(selectedVenta.ejecutivo_nombre))}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Mensaje de confirmación */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      ¿Confirma que toda la información es correcta?
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Al confirmar, se generará el contrato y se enviará a las opciones seleccionadas. 
                      Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
              {/* Primera fila de botones - Acciones principales */}
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setShowContractConfirmation(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all"
                >
                  ← Volver a Editar
                </button>
                
                <button
                  onClick={() => {
                    setShowContractPreview(true)
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Vista Previa
                </button>
                
                <button
                  onClick={async () => {
                    setShowContractConfirmation(false)
                    
                    // Combinar datos originales con datos editables
                    const datosFinales = {
                      ...selectedVenta,
                      cliente_telefono: contractEditableData?.cliente_telefono || selectedVenta.cliente_telefono,
                      cliente_correo: contractEditableData?.cliente_correo || selectedVenta.cliente_correo || selectedVenta.cliente_email,
                      forma_pago: contractEditableData?.forma_pago || selectedVenta.forma_pago,
                    }
                    
                    // Generar número de contrato y preparar información
                    const numeroContrato = datosFinales.numero_contrato || generateNextContractNumber(ventas)
                    const fileName = `Contrato_${numeroContrato}_${datosFinales.cliente_nombre.replace(/\s/g, '_')}.pdf`
                    setNotification({
                      type: 'success',
                      message: `Generando contrato ${numeroContrato}...\nSe guardará como: ${fileName}`
                    })
                    
                    await handleGenerarContrato(selectedVenta)
                    setShowDetallesModal(false)
                    
                    // Actualizar notificación cuando termine
                    setTimeout(() => {
                      setNotification({
                        type: 'success',
                        message: `Contrato generado exitosamente!\n📁 Guardado en: /contratos/${fileName}\n📧 Enviado por: Email, WhatsApp\n👨‍💼 Notificado: ${cleanVendorName(datosFinales.ejecutivo_nombre)}`
                      })
                    }, 2000)
                  }}
                  disabled={generatingContractId === selectedVenta.id}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    generatingContractId === selectedVenta.id
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                      : 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm hover:shadow'
                  }`}
                >
                  {generatingContractId === selectedVenta.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando y enviando...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generar y Enviar
                    </>
                  )}
                </button>
              </div>

              {/* Segunda fila - Opciones de edición */}
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-600 mb-2">¿Necesitas editar el contrato?</p>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      // Generar y descargar contrato editable
                      const numeroContrato = selectedVenta.numero_contrato || generateNextContractNumber(ventas)
                      const fileName = `Contrato_${numeroContrato}_${selectedVenta.cliente_nombre.replace(/\s/g, '_')}_EDITABLE.docx`
                      
                      // Simular descarga del archivo editable
                      setNotification({
                        type: 'info',
                        message: `Descargando contrato editable...\n📄 ${fileName}\n\nEdita el archivo y súbelo cuando esté listo.`
                      })
                      
                      // Aquí iría la lógica real para generar el documento editable
                      // Por ahora es solo una simulación
                      setTimeout(() => {
                        const blob = new Blob(['Contrato editable simulado'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 1000)
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Descargar Editable
                  </button>
                  
                  <button
                    onClick={() => {
                      setNotification({
                        type: 'info',
                        message: 'Editor en línea próximamente disponible'
                      })
                    }}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-xs font-medium transition-all flex items-center justify-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Editor en Línea
                  </button>
                  
                  <label className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNotification({
                            type: 'success',
                            message: `Archivo subido: ${file.name}\n\nPróximamente se integrará al flujo de contratos.`
                          })
                        }
                      }}
                    />
                    <div className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer">
                      <Upload className="h-3 w-3" />
                      Subir Editado
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa del Contrato */}
      {showContractPreview && selectedVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]">
          <div className="h-full flex flex-col">
            {/* Header Fijo del Modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 shadow-lg flex-shrink-0">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div>
                  <h2 className="text-xl font-bold mb-1">Vista Previa del Contrato</h2>
                  <p className="text-blue-100 text-sm">
                    Cliente: {formatProperCase(selectedVenta.cliente_nombre)} | 
                    Valor: {formatCurrency(typeof selectedVenta.valor_total === 'number' 
                      ? selectedVenta.valor_total 
                      : parseFloat(selectedVenta.valor_total?.toString() || '0') || 0)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowContractPreview(false)
                    setSelectedVenta(null)
                  }}
                  className="text-white hover:text-blue-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-10"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Contenido del Modal - Scrolleable */}
            <div className="flex-1 overflow-y-auto bg-gray-100">
              <div className="max-w-5xl mx-auto p-8">
                <ContratoPrevisualizador
                  contrato={{
                    id: selectedVenta.id,
                    numero: selectedVenta.numero_contrato || generateNextContractNumber(ventas),
                    cliente_id: selectedVenta.id,
                    clientes: {
                      id: selectedVenta.id,
                      nombre: selectedVenta.cliente_nombre,
                      rut: selectedVenta.cliente_rut,
                      telefono: contractEditableData?.cliente_telefono || selectedVenta.cliente_telefono,
                      correo: contractEditableData?.cliente_correo || selectedVenta.cliente_correo || selectedVenta.cliente_email || '',
                      direccion_entrega: contractEditableData?.direccion_entrega || selectedVenta.direccion_entrega,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    },
                    ejecutivo_id: selectedVenta.ejecutivo_id,
                    ejecutivo_nombre: formatProperCase(cleanVendorName(selectedVenta.ejecutivo_nombre)),
                    fecha_creacion: new Date().toISOString(),
                    fecha_entrega: selectedVenta.fecha_entrega,
                    valor_total: typeof selectedVenta.valor_total === 'string' 
                      ? parseInt(selectedVenta.valor_total.replace(/\D/g, '')) 
                      : selectedVenta.valor_total,
                    modelo_casa: formatModeloCasa(selectedVenta.modelo_casa, undefined),
                    detalle_materiales: selectedVenta.detalle_materiales || '',
                    observaciones: selectedVenta.observaciones_crm || '',
                    forma_pago: contractEditableData?.forma_pago || selectedVenta.forma_pago || 'efectivo',
                    estado: 'borrador',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }}
                  user={user}
                />
              </div>
            </div>
            
            {/* Footer con botones */}
            <div className="bg-white border-t border-gray-200 p-6 flex-shrink-0">
              <div className="max-w-5xl mx-auto flex justify-between items-center gap-4">
                <button
                  onClick={() => {
                    setShowContractPreview(false)
                    setSelectedVenta(null)
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowContractPreview(false)
                      setContractEditableData(selectedVenta)
                      handleStartEditing()
                    }}
                    className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-all flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Editar Datos
                  </button>
                  
                  <button
                    onClick={() => handleGenerarContrato(selectedVenta)}
                    disabled={generatingContractId === selectedVenta.id}
                    className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      generatingContractId === selectedVenta.id
                        ? 'bg-blue-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                    }`}
                  >
                    {generatingContractId === selectedVenta.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generar Contrato Final
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <div className={`rounded-lg shadow-lg p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 ${
                    notification.type === 'success' 
                      ? 'text-green-400 hover:bg-green-100' 
                      : 'text-red-400 hover:bg-red-100'
                  } transition-colors`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}