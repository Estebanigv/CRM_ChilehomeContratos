// Validadores para datos de Chile y ChileHome

export class ChileanValidators {
  /**
   * Valida RUT chileno con dígito verificador
   */
  static validateRUT(rut: string): { isValid: boolean; formatted?: string; error?: string } {
    if (!rut) {
      return { isValid: false, error: 'RUT es requerido' }
    }

    // Limpiar RUT (quitar puntos, guiones y espacios)
    const cleanRUT = rut.toString().replace(/[^0-9kK]/g, '').toUpperCase()

    if (cleanRUT.length < 2) {
      return { isValid: false, error: 'RUT demasiado corto' }
    }

    // Separar número y dígito verificador
    const rutNumber = cleanRUT.slice(0, -1)
    const checkDigit = cleanRUT.slice(-1)

    if (!/^\d+$/.test(rutNumber)) {
      return { isValid: false, error: 'RUT debe contener solo números y dígito verificador' }
    }

    if (rutNumber.length < 7 || rutNumber.length > 8) {
      return { isValid: false, error: 'RUT debe tener entre 7 y 8 dígitos' }
    }

    // Calcular dígito verificador
    let sum = 0
    let multiplier = 2

    for (let i = rutNumber.length - 1; i >= 0; i--) {
      sum += parseInt(rutNumber[i]) * multiplier
      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    const remainder = sum % 11
    const calculatedDigit = remainder === 0 ? '0' :
                           remainder === 1 ? 'K' :
                           (11 - remainder).toString()

    if (checkDigit !== calculatedDigit) {
      return { isValid: false, error: 'Dígito verificador incorrecto' }
    }

    // Formatear RUT
    const formattedNumber = rutNumber.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
    const formatted = `${formattedNumber}-${checkDigit}`

    return { isValid: true, formatted }
  }

  /**
   * Valida número de teléfono chileno
   */
  static validatePhone(phone: string): { isValid: boolean; formatted?: string; type?: string; error?: string } {
    if (!phone) {
      return { isValid: false, error: 'Teléfono es requerido' }
    }

    // Limpiar teléfono
    const cleanPhone = phone.replace(/[^\d+]/g, '')

    // Patrones para diferentes tipos de teléfono chileno
    const patterns = {
      mobile: {
        regex: /^(\+56)?9\d{8}$/,
        format: (num: string) => {
          const digits = num.replace(/^\+56/, '')
          return `+56 9 ${digits.slice(1, 5)} ${digits.slice(5)}`
        }
      },
      landline_santiago: {
        regex: /^(\+56)?2\d{8}$/,
        format: (num: string) => {
          const digits = num.replace(/^\+56/, '')
          return `+56 2 ${digits.slice(1, 5)} ${digits.slice(5)}`
        }
      },
      landline_regional: {
        regex: /^(\+56)?(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9])\d{7}$/,
        format: (num: string) => {
          const digits = num.replace(/^\+56/, '')
          return `+56 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
        }
      }
    }

    // Verificar cada patrón
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.regex.test(cleanPhone)) {
        return {
          isValid: true,
          formatted: pattern.format(cleanPhone),
          type: type === 'mobile' ? 'Móvil' :
                type === 'landline_santiago' ? 'Fijo Santiago' : 'Fijo Regional'
        }
      }
    }

    return { isValid: false, error: 'Formato de teléfono chileno inválido' }
  }

  /**
   * Valida dirección chilena
   */
  static validateAddress(address: string): { isValid: boolean; formatted?: string; components?: any; error?: string } {
    if (!address) {
      return { isValid: false, error: 'Dirección es requerida' }
    }

    const cleanAddress = address.trim()

    if (cleanAddress.length < 10) {
      return { isValid: false, error: 'Dirección demasiado corta' }
    }

    if (cleanAddress.length > 200) {
      return { isValid: false, error: 'Dirección demasiado larga' }
    }

    // Patrones comunes de direcciones chilenas
    const patterns = {
      street_number: /^(.+?)\s*#?\s*(\d+)(.*)$/,
      avenue: /(avenida|av\.|avda\.|av)/i,
      street: /(calle|pasaje|psje\.|villa)/i,
      apartment: /(depto\.|departamento|apt\.|oficina|of\.)\s*(\d+[a-z]?)/i
    }

    const components: any = {
      original: cleanAddress,
      type: 'calle'
    }

    // Detectar tipo de vía
    if (patterns.avenue.test(cleanAddress)) {
      components.type = 'avenida'
    }

    // Extraer número
    const numberMatch = cleanAddress.match(patterns.street_number)
    if (numberMatch) {
      components.street_name = numberMatch[1].trim()
      components.number = numberMatch[2]
      components.additional = numberMatch[3].trim()
    }

    // Detectar departamento/oficina
    const apartmentMatch = cleanAddress.match(patterns.apartment)
    if (apartmentMatch) {
      components.apartment = apartmentMatch[2]
    }

    // Formatear dirección
    let formatted = cleanAddress
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim()

    // Capitalizar primera letra de cada palabra importante
    formatted = formatted.replace(/\b\w+/g, word => {
      const lowerWord = word.toLowerCase()
      if (['de', 'del', 'la', 'el', 'y', 'con'].includes(lowerWord)) {
        return lowerWord
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })

    return {
      isValid: true,
      formatted,
      components
    }
  }

  /**
   * Valida comuna chilena
   */
  static validateComuna(comuna: string): { isValid: boolean; formatted?: string; region?: string; error?: string } {
    if (!comuna) {
      return { isValid: false, error: 'Comuna es requerida' }
    }

    // Lista simplificada de comunas chilenas más comunes
    const comunasChile = new Map([
      // Región Metropolitana
      ['santiago', { name: 'Santiago', region: 'Metropolitana' }],
      ['las condes', { name: 'Las Condes', region: 'Metropolitana' }],
      ['providencia', { name: 'Providencia', region: 'Metropolitana' }],
      ['ñuñoa', { name: 'Ñuñoa', region: 'Metropolitana' }],
      ['la florida', { name: 'La Florida', region: 'Metropolitana' }],
      ['maipú', { name: 'Maipú', region: 'Metropolitana' }],
      ['puente alto', { name: 'Puente Alto', region: 'Metropolitana' }],
      ['san bernardo', { name: 'San Bernardo', region: 'Metropolitana' }],

      // Valparaíso
      ['valparaíso', { name: 'Valparaíso', region: 'Valparaíso' }],
      ['viña del mar', { name: 'Viña del Mar', region: 'Valparaíso' }],
      ['quilpué', { name: 'Quilpué', region: 'Valparaíso' }],
      ['villa alemana', { name: 'Villa Alemana', region: 'Valparaíso' }],

      // Bío Bío
      ['concepción', { name: 'Concepción', region: 'Bío Bío' }],
      ['talcahuano', { name: 'Talcahuano', region: 'Bío Bío' }],
      ['chillán', { name: 'Chillán', region: 'Bío Bío' }],

      // La Araucanía
      ['temuco', { name: 'Temuco', region: 'La Araucanía' }],

      // Los Lagos
      ['puerto montt', { name: 'Puerto Montt', region: 'Los Lagos' }],
      ['osorno', { name: 'Osorno', region: 'Los Lagos' }],

      // Antofagasta
      ['antofagasta', { name: 'Antofagasta', region: 'Antofagasta' }],
      ['calama', { name: 'Calama', region: 'Antofagasta' }],

      // Tarapacá
      ['iquique', { name: 'Iquique', region: 'Tarapacá' }],

      // Magallanes
      ['punta arenas', { name: 'Punta Arenas', region: 'Magallanes' }]
    ])

    const normalizedComuna = comuna.toLowerCase().trim()
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'ñ')

    // Buscar coincidencia exacta
    const comunaData = comunasChile.get(normalizedComuna)
    if (comunaData) {
      return {
        isValid: true,
        formatted: comunaData.name,
        region: comunaData.region
      }
    }

    // Buscar coincidencia parcial
    for (const [key, value] of comunasChile.entries()) {
      if (key.includes(normalizedComuna) || normalizedComuna.includes(key)) {
        return {
          isValid: true,
          formatted: value.name,
          region: value.region
        }
      }
    }

    // Si no se encuentra, aceptar pero sin región
    const formatted = comuna.replace(/\b\w/g, l => l.toUpperCase())
    return {
      isValid: true,
      formatted,
      region: 'No identificada'
    }
  }

  /**
   * Valida email
   */
  static validateEmail(email: string): { isValid: boolean; formatted?: string; error?: string } {
    if (!email) {
      return { isValid: false, error: 'Email es requerido' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const cleanEmail = email.trim().toLowerCase()

    if (!emailRegex.test(cleanEmail)) {
      return { isValid: false, error: 'Formato de email inválido' }
    }

    // Verificar dominios chilenos comunes
    const chileanDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'live.cl', 'vtr.net', 'entel.cl', 'movistar.cl',
      'uc.cl', 'udp.cl', 'usach.cl', 'uchile.cl'
    ]

    const domain = cleanEmail.split('@')[1]
    const isChileanDomain = chileanDomains.includes(domain)

    return {
      isValid: true,
      formatted: cleanEmail
    }
  }

  /**
   * Valida monto en pesos chilenos
   */
  static validateAmount(amount: string | number): { isValid: boolean; value?: number; formatted?: string; error?: string } {
    if (!amount && amount !== 0) {
      return { isValid: false, error: 'Monto es requerido' }
    }

    let numericValue: number

    if (typeof amount === 'string') {
      // Limpiar string (quitar $ . , espacios)
      const cleanAmount = amount.replace(/[\$\.\s]/g, '').replace(/,/g, '.')
      numericValue = parseFloat(cleanAmount)
    } else {
      numericValue = amount
    }

    if (isNaN(numericValue)) {
      return { isValid: false, error: 'Monto debe ser un número válido' }
    }

    if (numericValue < 0) {
      return { isValid: false, error: 'Monto no puede ser negativo' }
    }

    if (numericValue > 999999999) {
      return { isValid: false, error: 'Monto demasiado grande' }
    }

    // Formatear en pesos chilenos
    const formatted = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(numericValue)

    return {
      isValid: true,
      value: numericValue,
      formatted
    }
  }

  /**
   * Valida nombre de persona
   */
  static validatePersonName(name: string): { isValid: boolean; formatted?: string; components?: any; error?: string } {
    if (!name) {
      return { isValid: false, error: 'Nombre es requerido' }
    }

    const cleanName = name.trim()

    if (cleanName.length < 2) {
      return { isValid: false, error: 'Nombre demasiado corto' }
    }

    if (cleanName.length > 100) {
      return { isValid: false, error: 'Nombre demasiado largo' }
    }

    // Solo letras, espacios, guiones y acentos
    if (!/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s\-']+$/.test(cleanName)) {
      return { isValid: false, error: 'Nombre contiene caracteres no válidos' }
    }

    // Formatear nombre propio
    const formatted = cleanName
      .toLowerCase()
      .split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
      .replace(/\s+/g, ' ')

    const parts = formatted.split(' ')
    const components = {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || '',
      fullName: formatted
    }

    return {
      isValid: true,
      formatted,
      components
    }
  }
}

// Hook para usar validadores en React
export function useValidation() {
  const validateRUT = (rut: string) => ChileanValidators.validateRUT(rut)
  const validatePhone = (phone: string) => ChileanValidators.validatePhone(phone)
  const validateAddress = (address: string) => ChileanValidators.validateAddress(address)
  const validateComuna = (comuna: string) => ChileanValidators.validateComuna(comuna)
  const validateEmail = (email: string) => ChileanValidators.validateEmail(email)
  const validateAmount = (amount: string | number) => ChileanValidators.validateAmount(amount)
  const validatePersonName = (name: string) => ChileanValidators.validatePersonName(name)

  const validateContract = (data: any) => {
    const errors: Record<string, string> = {}

    // Validar datos del cliente
    const rutValidation = validateRUT(data.cliente_rut)
    if (!rutValidation.isValid) {
      errors.cliente_rut = rutValidation.error!
    }

    const nameValidation = validatePersonName(data.cliente_nombre)
    if (!nameValidation.isValid) {
      errors.cliente_nombre = nameValidation.error!
    }

    const phoneValidation = validatePhone(data.cliente_telefono)
    if (!phoneValidation.isValid) {
      errors.cliente_telefono = phoneValidation.error!
    }

    const addressValidation = validateAddress(data.direccion_entrega)
    if (!addressValidation.isValid) {
      errors.direccion_entrega = addressValidation.error!
    }

    const amountValidation = validateAmount(data.valor_total)
    if (!amountValidation.isValid) {
      errors.valor_total = amountValidation.error!
    }

    if (data.cliente_correo) {
      const emailValidation = validateEmail(data.cliente_correo)
      if (!emailValidation.isValid) {
        errors.cliente_correo = emailValidation.error!
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      formatted: {
        cliente_rut: rutValidation.formatted,
        cliente_nombre: nameValidation.formatted,
        cliente_telefono: phoneValidation.formatted,
        direccion_entrega: addressValidation.formatted,
        valor_total: amountValidation.formatted,
        cliente_correo: data.cliente_correo ? ChileanValidators.validateEmail(data.cliente_correo).formatted : undefined
      }
    }
  }

  return {
    validateRUT,
    validatePhone,
    validateAddress,
    validateComuna,
    validateEmail,
    validateAmount,
    validatePersonName,
    validateContract
  }
}