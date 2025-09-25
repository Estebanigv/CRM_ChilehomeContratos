// Utilidades de formateo centralizadas
// Extraído de DashboardClient.tsx para reducir el monolito

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  if (!dateString || dateString === 'undefined' || dateString === 'null' || dateString === 'Por definir') {
    return 'Sin fecha'
  }

  try {
    let cleanDateString = String(dateString).trim()

    if (cleanDateString.includes(' ')) {
      const parts = cleanDateString.split(' ')
      const datePart = parts.find(part => part.includes('-') || part.includes('/'))
      if (datePart) {
        cleanDateString = datePart
      }
    }

    let date: Date

    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(cleanDateString)) {
      const separator = cleanDateString.includes('/') ? '/' : '-'
      const [day, month, year] = cleanDateString.split(separator).map(Number)
      date = new Date(year, month - 1, day)
    } else if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(cleanDateString)) {
      if (cleanDateString.includes('T')) {
        date = new Date(cleanDateString)
      } else {
        date = new Date(cleanDateString + 'T00:00:00')
      }
    } else if (cleanDateString.includes('T')) {
      date = new Date(cleanDateString)
    } else {
      date = new Date(cleanDateString)
    }

    if (isNaN(date.getTime())) {
      return 'Fecha inválida'
    }

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error formateando fecha:', dateString, error)
    return 'Fecha inválida'
  }
}

export const formatProperCase = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  return text.toLowerCase()
    .split(' ')
    .map(word => {
      const exceptions = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e']

      if (exceptions.includes(word.toLowerCase())) {
        return word.toLowerCase()
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .trim()
}

export const formatRUT = (rut: string): string => {
  if (!rut || typeof rut !== 'string') return ''

  const cleanRUT = rut.replace(new RegExp('[^0-9kK]', 'g'), '')
  if (cleanRUT.length <= 1) return cleanRUT

  const body = cleanRUT.slice(0, -1)
  const dv = cleanRUT.slice(-1).toUpperCase()

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedBody}-${dv}`
}

export const formatPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''

  const cleanPhone = phone.replace(/[^\d]/g, '')

  if (cleanPhone.length === 8) {
    return `${cleanPhone.substring(0, 4)} ${cleanPhone.substring(4)}`
  } else if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
    return `+56 9 ${cleanPhone.substring(1, 5)} ${cleanPhone.substring(5)}`
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('569')) {
    return `+56 9 ${cleanPhone.substring(3, 7)} ${cleanPhone.substring(7)}`
  }

  return phone
}

export const formatClientName = (name: string): string => {
  if (!name || typeof name !== 'string') return ''

  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim()
}

export const formatExecutiveName = (name: string): string => {
  if (!name || typeof name !== 'string') return ''

  return name
    .replace(/\s*\(vendedor\)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const cleanVendorName = (name: string): string => {
  if (!name) return ''
  return name.replace(' (Vendedor)', '').replace(/\s+/g, ' ').trim()
}

export const formatNameProper = (name: string): string => {
  if (!name || typeof name !== 'string') return ''

  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word
    })
    .join(' ')
    .trim()
}

export const formatModeloCasa = (modelo: string | undefined, superficie: string | number | undefined): string => {
  const modeloText = modelo || 'Modelo no especificado'

  if (superficie) {
    const superficieNum = typeof superficie === 'string' ? parseFloat(superficie) : superficie
    if (!isNaN(superficieNum) && superficieNum > 0) {
      return `${modeloText} (${superficieNum}m²)`
    }
  }

  return modeloText
}

export const formatearNombreVendedor = (nombre: string) => {
  return nombre
    .replace(' (Vendedor)', '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ')
}