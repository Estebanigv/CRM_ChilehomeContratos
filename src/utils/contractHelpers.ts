// Utilidades para manejo de contratos y validaciones
// Extraído de DashboardClient.tsx para reducir el monolito

export const getEstadoStyle = (estado: string) => {
  const estadoLower = estado?.toLowerCase() || ''

  if (estadoLower.includes('pendiente')) {
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }
  if (estadoLower.includes('proceso') || estadoLower.includes('procesando')) {
    return 'bg-cyan-100 text-cyan-800 border-cyan-200'
  }
  if (estadoLower.includes('preingreso') || estadoLower.includes('pre-ingreso') || estadoLower.includes('ingreso')) {
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }
  if (estadoLower.includes('validacion') || estadoLower.includes('validación')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
  if (estadoLower.includes('contrato') && !estadoLower.includes('confirmacion')) {
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }
  if (estadoLower.includes('confirmacion') || estadoLower.includes('confirmación') || estadoLower.includes('entrega') && !estadoLower.includes('ok')) {
    return 'bg-orange-100 text-orange-800 border-orange-200'
  }
  if (estadoLower.includes('produccion') || estadoLower.includes('producción') || estadoLower.includes('fabrica')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
  if (estadoLower.includes('entrega ok')) {
    return 'bg-green-600 text-white border-green-700'
  }
  if (estadoLower.includes('completado') || estadoLower.includes('finalizado')) {
    return 'bg-green-500 text-white border-green-600'
  }
  if (estadoLower.includes('rechaz') || estadoLower.includes('rechazo') || estadoLower.includes('cancel')) {
    return 'bg-red-600 text-white border-red-700'
  }

  return 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getEstadoColor = (estado: string) => {
  const estadoLower = estado?.toLowerCase() || ''

  if (estadoLower.includes('pendiente')) {
    return '#fbbf24' // amarillo ámbar
  }
  if (estadoLower.includes('proceso') || estadoLower.includes('procesando')) {
    return '#06b6d4' // cian
  }
  if (estadoLower.includes('entrega ok') || estadoLower.includes('completado')) {
    return '#10b981' // verde
  }
  if (estadoLower.includes('produccion') || estadoLower.includes('producción')) {
    return '#3b82f6' // azul
  }
  if (estadoLower.includes('contrato')) {
    return '#8b5cf6' // púrpura
  }
  if (estadoLower.includes('validacion') || estadoLower.includes('validación')) {
    return '#f59e0b' // amarillo
  }
  if (estadoLower.includes('preingreso') || estadoLower.includes('ingreso')) {
    return '#6b7280' // gris
  }
  if (estadoLower.includes('rechaz') || estadoLower.includes('cancel')) {
    return '#ef4444' // rojo
  }

  return '#9ca3af' // gris por defecto
}

export const validateContractData = (venta: any): { isComplete: boolean, missingFields: string[] } => {
  const requiredFields = [
    { key: 'cliente_nombre', label: 'Nombre del cliente' },
    { key: 'cliente_rut', label: 'RUT del cliente' },
    { key: 'cliente_telefono', label: 'Teléfono del cliente' },
    { key: 'direccion_entrega', label: 'Dirección de entrega' },
    { key: 'valor_total', label: 'Valor total' },
    { key: 'fecha_venta', label: 'Fecha de venta' },
    { key: 'ejecutivo_nombre', label: 'Nombre del ejecutivo' }
  ]

  const missingFields = requiredFields.filter(({ key }) =>
    !venta[key] || venta[key].toString().trim() === ''
  ).map(({ label }) => label)

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}

export const generateNextContractNumber = (ventas: any[]): string => {
  const existingNumbers = ventas
    .map(venta => venta.numero_contrato)
    .filter(num => num && typeof num === 'string' && num !== '0')
    .map(num => {
      const match = num.match(/(\d+)$/)
      return match ? parseInt(match[1]) : 0
    })
    .filter(num => num > 0)

  console.log('📊 Números de contratos existentes encontrados:', existingNumbers)

  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
  const nextNumber = maxNumber + 1

  const currentYear = new Date().getFullYear()
  const formattedNumber = nextNumber.toString().padStart(3, '0')

  const newContractNumber = `${currentYear}-${formattedNumber}`
  console.log('🆕 Próximo número de contrato generado:', newContractNumber)

  return newContractNumber
}

export const obtenerEjecutivosDesdeCRM = (ventas: any[]) => {
  const vendedoresUnicos = [...new Set(ventas.map((v: any) => v.ejecutivo_nombre).filter(Boolean))]

  const ejecutivosChileHome: any[] = []
  const ejecutivosConstrumatter: any[] = []

  vendedoresUnicos.forEach((vendedor, index) => {
    const nombreOriginalCRM = vendedor.trim()
    const nombreFormateado = vendedor
      .replace(' (Vendedor)', '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .split(' ')
      .map((palabra: string) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ')
    const nombreParaMatching = vendedor.trim().toLowerCase().replace(/\s+/g, ' ')
    const iniciales = nombreFormateado.split(' ').map((p: string) => p.charAt(0)).join('').substring(0, 2)

    const ejecutivo = {
      nombre: nombreParaMatching,
      nombreOriginal: nombreOriginalCRM,
      nombreDisplay: nombreFormateado,
      telefono: `+56 9 ${Math.floor(Math.random() * 90000000) + 10000000}`,
      empresa: index % 2 === 0 ? 'ChileHome' : 'Construmatter',
      iniciales: iniciales.toUpperCase()
    }

    if (index % 2 === 0) {
      ejecutivosChileHome.push(ejecutivo)
    } else {
      ejecutivosConstrumatter.push(ejecutivo)
    }
  })

  return { ejecutivosChileHome, ejecutivosConstrumatter }
}

export const isEstadoPendiente = (estado: string): boolean => {
  const estadoLower = estado?.toLowerCase() || ''
  return estadoLower.includes('pendiente') ||
         estadoLower.includes('proceso') ||
         estadoLower.includes('procesando') ||
         (!estado || estado.trim() === '')
}

export const getEstadoPrioridad = (estado: string): number => {
  const estadoLower = estado?.toLowerCase() || ''

  if (estadoLower.includes('rechaz') || estadoLower.includes('cancel')) return 0
  if (estadoLower.includes('pendiente')) return 1
  if (estadoLower.includes('proceso')) return 2
  if (estadoLower.includes('preingreso')) return 3
  if (estadoLower.includes('validacion')) return 4
  if (estadoLower.includes('contrato')) return 5
  if (estadoLower.includes('confirmacion')) return 6
  if (estadoLower.includes('produccion')) return 7
  if (estadoLower.includes('entrega ok')) return 8
  if (estadoLower.includes('completado')) return 9

  return -1
}

export const getEstadoLabel = (estado: string): string => {
  const estadoLower = estado?.toLowerCase() || ''

  if (!estado || estado.trim() === '') return 'Pendiente'
  if (estadoLower.includes('pendiente')) return 'Pendiente'
  if (estadoLower.includes('proceso')) return 'En Proceso'
  if (estadoLower.includes('preingreso')) return 'Pre-ingreso'
  if (estadoLower.includes('validacion')) return 'Validación'
  if (estadoLower.includes('contrato')) return 'Contrato'
  if (estadoLower.includes('confirmacion')) return 'Confirmación'
  if (estadoLower.includes('produccion')) return 'Producción'
  if (estadoLower.includes('entrega ok')) return 'Entrega OK'
  if (estadoLower.includes('completado')) return 'Completado'
  if (estadoLower.includes('rechaz')) return 'Rechazado'
  if (estadoLower.includes('cancel')) return 'Cancelado'

  return estado
}

export const getRoleDisplay = (user: any): string => {
  if (!user?.role) return 'Usuario'

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