import { CRMVenta } from '@/types'

interface SmartCRMLoginResponse {
  err: boolean
  msg: string
  tot: number
  inf: {
    adm_id: string
    adm_usu: string
    adm_tok: string
    [key: string]: any
  }
}

interface SmartCRMVentasResponse {
  err: boolean
  msg: string
  tot: number
  lin: number
  totalPages: number
  totalrow: number
  inf: Array<{
    ref_id: string
    ref_cre_fec: string           // Fecha ingreso (fecha de venta)
    ref_cre_hor: string           // Hora de creación ⭐
    ref_mod_fec: string           // Fecha modificación ⭐
    ref_ins_fec_age: string       // Fecha de entrega
    ref_usu_nom: string           // Nombre Vendedor REAL ⭐
    ref_usu_per_nom: string       // Tipo vendedor
    ref_usu_sub_nom: string       // Subcategoría vendedor ⭐
    ref_usu_sup_nom: string       // Nombre Supervisor ⭐
    ref_tip_nom: string           // Tipo producto (Casa) ⭐
    ref_mar_nom: string           // Marca (ConstruMater) ⭐
    ref_run: string               // Cliente RUT
    ref_nom: string               // Cliente Nombre
    ref_fon: string               // Cliente teléfono
    ref_dir: string               // Dirección
    ref_reg: string               // Región nombre (con HTML entities)
    ref_com: string               // Comuna nombre
    ref_des_com_nom: string       // Comuna destino ⭐
    ref_met_pag: string           // Método de pago ⭐
    ref_pag_fin: string           // Pago final ⭐
    ref_pre_fin: string           // Precio final ⭐
    ref_ins_ord: string           // Número de orden ⭐
    ref_agendado: string          // Fecha agendada ⭐
    ref_est_nom: string           // Ultimo estado ⭐
    ref_est_col: string           // Color del estado ⭐
    ref_est_bit: string           // Observaciones de bitácora ⭐
    [key: string]: any            // Para otros campos adicionales
  }>
}

class CRMApi {
  private baseUrl: string = 'https://mater.smartcrm.cl/api/v1/index.php'
  private authKey: string = 'B~a2C0g53ux@'
  private accessToken: string = ''
  private loginCredentials: {
    usuario: string
    clave: string
  }

  constructor() {
    this.loginCredentials = {
      usuario: process.env.CRM_USUARIO || '',
      clave: process.env.CRM_CLAVE || ''
    }
    
    // Log para debug en desarrollo
    if (!this.loginCredentials.usuario || !this.loginCredentials.clave) {
      console.warn('⚠️ CRM credentials not configured, using mock data for development')
    }
  }

  private async login(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken
    }

    const formData = new FormData()
    formData.append('log_usu', this.loginCredentials.usuario)
    formData.append('log_cla', this.loginCredentials.clave)

    const response = await fetch(`${this.baseUrl}/Auth/Login/`, {
      method: 'POST',
      headers: {
        'Client-Service': 'Smart-Sales',
        'Auth-Key': this.authKey,
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`)
    }

    const data: SmartCRMLoginResponse = await response.json()
    
    console.log('🔍 Login response completa:', JSON.stringify(data, null, 2)) // Debug detallado
    
    if (data.err) {
      throw new Error(`Login error: ${data.msg}`)
    }

    this.accessToken = data.inf.adm_tok
    console.log('👤 Usuario info:', {
      id: data.inf.adm_id,
      usuario: data.inf.adm_usu,
      perfil_id: data.inf.adm_per_id,
      supervisor: data.inf.adm_sup,
      estado: data.inf.adm_est
    }) // Debug info del usuario
    
    return this.accessToken
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    // Renovar el login en cada petición para evitar sesiones inválidas
    this.accessToken = ''
    const token = await this.login()
    const url = `${this.baseUrl}${endpoint}`
    
    console.log('Making request to:', url)
    console.log('Using token:', token.substring(0, 20) + '...')
    
    const response = await fetch(url, {
      ...options,
      method: options.method || 'GET', // Permitir override del método
      headers: {
        'Client-Service': 'Smart-Sales',
        'Auth-Key': token, // Usar el token obtenido del login como Auth-Key
        ...options.headers,
      },
    })

    if (!response.ok) {
      // Si el token expiró, intentar login nuevamente
      if (response.status === 401) {
        this.accessToken = ''
        const newToken = await this.login()
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            'Client-Service': 'Smart-Sales',
            'Auth-Key': newToken, // Usar el nuevo token como Auth-Key
            ...options.headers,
          },
        })
        
        if (!retryResponse.ok) {
          // Log respuesta para debug cuando falle
          const responseText = await retryResponse.text()
          console.error('🚨 CRM API Error Response:', responseText)
          throw new Error(`CRM API Error: ${retryResponse.status} ${retryResponse.statusText}`)
        }
        
        // Verificar que la respuesta retry sea JSON válido
        const retryResponseText = await retryResponse.text()
        
        // Verificar si la respuesta es HTML (error común)
        if (retryResponseText.trim().startsWith('<!DOCTYPE') || retryResponseText.trim().startsWith('<html')) {
          console.error('🚨 Retry response is HTML instead of JSON:', retryResponseText.substring(0, 200) + '...')
          throw new Error('Server returned HTML instead of JSON on retry - authentication still failing')
        }
        
        try {
          return JSON.parse(retryResponseText)
        } catch (parseError) {
          console.error('🚨 JSON Parse Error on retry:', parseError)
          console.error('🚨 Retry response text:', retryResponseText.substring(0, 500) + '...')
          throw new Error(`Invalid JSON response on retry: ${parseError}`)
        }
      }
      
      // Log respuesta para debug cuando falle la primera vez
      const responseText = await response.text()
      console.error('🚨 CRM API Error Response:', responseText)
      throw new Error(`CRM API Error: ${response.status} ${response.statusText}`)
    }

    // Verificar que la respuesta sea JSON válido
    const responseText = await response.text()
    
    // Verificar si la respuesta es HTML (error común)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('🚨 Server returned HTML instead of JSON:', responseText.substring(0, 200) + '...')
      throw new Error('Server returned HTML instead of JSON - possible authentication error')
    }
    
    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      console.error('🚨 JSON Parse Error:', parseError)
      console.error('🚨 Response text:', responseText.substring(0, 500) + '...')
      throw new Error(`Invalid JSON response: ${parseError}`)
    }
  }

  async obtenerVentas(ejecutivoId?: string, fechaInicio?: string, fechaFin?: string): Promise<CRMVenta[]> {
    console.log('🔥 CRM API - Obteniendo ventas desde septiembre 2024 en adelante') // Debug
    
    // Si no hay credenciales, usar datos mock directamente
    if (!this.loginCredentials.usuario || !this.loginCredentials.clave) {
      console.log('📝 Using mock data (no CRM credentials)')
      return this.getMockVentasExpandido()
    }
    
    try {
      // Usar el endpoint correcto según la documentación
      let endpoint = '/Admin/Referido/?sel_fil=1&page=1'
      
      // Si no se proporcionan fechas, usar desde septiembre 2025 hasta hoy
      if (!fechaInicio && !fechaFin) {
        const hoy = new Date()
        const fechaDesde = '2025-09-01' // Desde 1 de septiembre 2025
        const fechaHasta = hoy.toISOString().split('T')[0] // Hasta hoy
        endpoint += `&sel_ini_des=${fechaDesde}&sel_ini_has=${fechaHasta}`
        console.log('📅 Aplicando filtro dinámico: desde septiembre 2025 hasta hoy')
      } else if (fechaInicio && fechaFin) {
        endpoint += `&sel_ini_des=${fechaInicio}&sel_ini_has=${fechaFin}`
        console.log('📅 Usando filtro de fechas personalizado:', fechaInicio, 'hasta', fechaFin)
      } else {
        // Para obtener ventas validadas de la última semana
        endpoint += '&ultima_semana=validacion'
        console.log('📅 Obteniendo ventas validadas de la última semana')
      }
      
      console.log('🔗 CRM Endpoint:', endpoint) // Debug
      
      // Probemos tanto GET como POST
      console.log('🚀 Intentando con GET...') // Debug
      let data: SmartCRMVentasResponse
      
      try {
        data = await this.makeRequest<SmartCRMVentasResponse>(endpoint, { method: 'GET' })
      } catch (error) {
        console.log('❌ GET falló, intentando con POST...') // Debug
        data = await this.makeRequest<SmartCRMVentasResponse>(endpoint, { method: 'POST' })
      }
      
      if (!data.err && data.inf && data.inf.length > 0) {
        console.log('✅ CRM Response SUCCESS - Ventas encontradas:', data.inf.length)
        
        // Mapear datos del CRM a nuestro formato
        const ventas = data.inf.map(venta => this.mapearVentaCRM(venta))
          .filter(venta => !ejecutivoId || venta.ejecutivo_id === ejecutivoId)
        
        // Debug: Estados únicos del CRM
        const estadosUnicos = [...new Set(ventas.map(v => v.estado_crm))]
        console.log('🔍 Estados únicos encontrados en CRM:', estadosUnicos)
        
        // Debug: Distribución de estados
        const distribucionEstados = estadosUnicos.map(estado => ({
          estado,
          cantidad: ventas.filter(v => v.estado_crm === estado).length
        }))
        console.log('📊 Distribución de estados:', distribucionEstados)
        
        console.log('📊 Ventas mapeadas exitosamente:', ventas.length)
        return ventas
      } else if (!data.err && data.inf && data.inf.length === 0) {
        console.log('📭 No se encontraron ventas para el periodo especificado')
        return []
      } else {
        console.log('❌ CRM Response ERROR:', data.msg)
        throw new Error(`CRM Error: ${data.msg}`)
      }
    } catch (error) {
      console.error('Error al obtener ventas del CRM:', error)
      
      // Si hay credenciales pero falla la conexión, lanzar error
      if (this.loginCredentials.usuario && this.loginCredentials.clave) {
        throw new Error(`No se pudo conectar con el CRM: ${error}`)
      }
      
      // Solo usar mock si NO hay credenciales
      console.log('📝 Using mock data (CRM connection failed, no credentials)')
      const mockVentas = this.getMockVentasExpandido()
      
      // Filtrar mock por fechas si se proporcionan
      if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio)
        const fin = new Date(fechaFin)
        return mockVentas.filter(venta => {
          const fechaVenta = new Date(venta.fecha_venta)
          return fechaVenta >= inicio && fechaVenta <= fin
        })
      }
      
      return mockVentas
    }
  }

  private mapearVentaCRM(ventaCRM: any): CRMVenta {
    // Función para determinar metros cuadrados basado en el valor del contrato
    const determinarMetrosCuadrados = (valor: number, numeroContrato: string): string => {
      // Rangos de precios para diferentes modelos (valores aproximados en CLP)
      if (valor <= 2000000) return '36m²'      // Modelo básico
      if (valor <= 3000000) return '54m²'      // Modelo intermedio  
      if (valor <= 4000000) return '72m²'      // Modelo amplio
      if (valor <= 5000000) return '90m²'      // Modelo grande
      return '108m²'                           // Modelo premium
    }
    
    // Limpiar HTML entities de la región
    const limpiarHTMLEntities = (texto: string) => {
      if (!texto) return texto
      return texto
        .replace(/&aacute;/g, 'á')
        .replace(/&eacute;/g, 'é')
        .replace(/&iacute;/g, 'í')
        .replace(/&oacute;/g, 'ó')
        .replace(/&uacute;/g, 'ú')
        .replace(/&ntilde;/g, 'ñ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&ordf;/g, 'ª')  // Agregado para ordinales femeninos
        .replace(/&ordm;/g, 'º')  // Agregado para ordinales masculinos
    }

    return {
      id: ventaCRM.ref_id,
      cliente_nombre: ventaCRM.ref_nom,
      cliente_rut: ventaCRM.ref_run,
      cliente_telefono: ventaCRM.ref_fon,
      cliente_correo: '', // El CRM no proporciona email en este endpoint
      direccion_entrega: `${ventaCRM.ref_dir}, ${ventaCRM.ref_com}, ${limpiarHTMLEntities(ventaCRM.ref_reg)}`,
      valor_total: (() => {
        const pagFin = parseInt(ventaCRM.ref_pag_fin) || 0
        const preFin = parseInt(ventaCRM.ref_pre_fin) || 0
        const valor = pagFin || preFin || 0
        return isNaN(valor) ? 0 : valor
      })(), // ⭐ PRECIO REAL del CRM
      modelo_casa: (() => {
        const pagFin = parseInt(ventaCRM.ref_pag_fin) || 0
        const preFin = parseInt(ventaCRM.ref_pre_fin) || 0
        const valor = pagFin || preFin || 0
        const valorLimpio = isNaN(valor) ? 0 : valor
        const metraje = determinarMetrosCuadrados(valorLimpio, ventaCRM.ref_ins_ord || '0')
        const marca = ventaCRM.ref_mar_nom || 'ConstruMaker'
        return `Casa ${marca} ${metraje}` // Formato: Casa ConstruMaker 36m²
      })(), // ⭐ MODELO - formato completo como en CRM
      detalle_materiales: `${ventaCRM.ref_est_bit || 'Sin detalle'} | Método pago: ${ventaCRM.ref_met_pag} | Subcategoría: ${ventaCRM.ref_usu_sub_nom}`, // ⭐ DETALLES COMPLETOS
      fecha_venta: (() => {
        const fechaFinal = `${ventaCRM.ref_cre_fec} ${ventaCRM.ref_cre_hor || ''}`.trim()
        if (ventaCRM.ref_nom?.toLowerCase().includes('alejandra')) {
          console.log(`🗓️ RAW CRM dates for ${ventaCRM.ref_nom}:`, {
            ref_cre_fec: ventaCRM.ref_cre_fec,
            ref_cre_hor: ventaCRM.ref_cre_hor,
            ref_ins_fec_age: ventaCRM.ref_ins_fec_age,
            ref_agendado: ventaCRM.ref_agendado,
            fecha_venta_final: fechaFinal,
            fecha_entrega_final: ventaCRM.ref_ins_fec_age || ventaCRM.ref_agendado || 'Por definir'
          })
        }
        return fechaFinal
      })(),
      fecha_entrega: ventaCRM.ref_ins_fec_age || ventaCRM.ref_agendado || 'Por definir',
      ejecutivo_id: ventaCRM.ref_usu_nom, // ⭐ NOMBRE REAL del vendedor
      ejecutivo_nombre: `${ventaCRM.ref_usu_nom} (${ventaCRM.ref_usu_per_nom || 'Vendedor'})`, // ⭐ VENDEDOR COMPLETO
      supervisor_nombre: ventaCRM.ref_usu_sup_nom || 'Sin supervisor',
      estado_crm: ventaCRM.ref_est_nom || 'Sin estado',
      observaciones_crm: ventaCRM.ref_est_bit || 'Sin observaciones',
      numero_contrato: ventaCRM.ref_ins_ord || '0' // ⭐ NÚMERO DE CONTRATO (0 = sin contrato generado)
    }
  }

  async obtenerVentaPorId(ventaId: string): Promise<CRMVenta | null> {
    try {
      // Primero obtener todas las ventas y buscar por ID
      const ventas = await this.obtenerVentas()
      return ventas.find(v => v.id === ventaId) || null
    } catch (error) {
      console.error('Error al obtener venta del CRM:', error)
      return this.getMockVentas().find(v => v.id === ventaId) || null
    }
  }

  async marcarVentaComoProcesada(ventaId: string): Promise<void> {
    try {
      await this.makeRequest(`/ventas/${ventaId}/procesar`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Error al marcar venta como procesada:', error)
      // En desarrollo, simplemente logueamos el error
    }
  }

  async obtenerEjecutivos(): Promise<Array<{id: string, nombre: string}>> {
    try {
      const data = await this.makeRequest<Array<{id: string, nombre: string}>>('/ejecutivos')
      return data
    } catch (error) {
      console.error('Error al obtener ejecutivos:', error)
      return [
        { id: '1', nombre: 'Juan Pérez' },
        { id: '2', nombre: 'María González' },
        { id: '3', nombre: 'Carlos Rodríguez' }
      ]
    }
  }

  // Datos mock expandidos para desarrollo y testing
  private getMockVentasExpandido(): CRMVenta[] {
    const ventasBase = this.getMockVentas()
    const ventasExpandidas = []
    
    // Generar 32 ventas para septiembre 2024 (como indica el usuario)
    for (let i = 0; i < 29; i++) {  // 29 + 3 de ventasBase = 32 total
      // Generar fechas aleatorias dentro de septiembre 2024
      const dia = Math.floor(Math.random() * 30) + 1 // Día 1-30 de septiembre
      const fecha = new Date(2024, 8, dia) // Mes 8 = septiembre (0-indexed)
      
      // Estados variados para simular casos reales
      const estados = ['Validado', 'En proceso', 'Pendiente', 'Completado', 'Listo', 'Rechazado', 'Sin estado']
      const estadoIndex = i % estados.length
      
      ventasExpandidas.push({
        id: `mock_${i + 4}`,
        cliente_nombre: `Cliente Septiembre ${i + 4}`,
        cliente_rut: `${12000000 + i * 100}-${Math.floor(Math.random() * 9)}`,
        cliente_telefono: `+5691${1000000 + i}`,
        cliente_correo: `cliente${i + 4}@email.com`,
        direccion_entrega: `Dirección ${i + 4}, Comuna ${i % 5 + 1}, Santiago`,
        valor_total: Math.floor(Math.random() * 50000000) + 50000000, // Entre 50M y 100M
        modelo_casa: `Modelo Casa ${i % 8 + 1} - ${60 + i * 5}m²`,
        detalle_materiales: `Casa prefabricada, detalles del modelo ${i + 1}`,
        fecha_venta: fecha.toISOString(),
        fecha_entrega: new Date(fecha.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días después
        ejecutivo_id: `${i % 3 + 1}`,
        ejecutivo_nombre: ['Juan Pérez', 'María González', 'Carlos Rodríguez', 'Ana Torres', 'Luis Martínez'][i % 5],
        supervisor_nombre: ['Ana Supervisor', 'Luis Supervisor', 'Carmen Supervisor'][i % 3],
        estado_crm: estados[estadoIndex],
        observaciones_crm: `Observación mock ${i + 1} - Cliente requiere seguimiento`,
        numero_contrato: estadoIndex < 3 ? `CONT-2024-${1000 + i}` : '0'
      })
    }
    
    return [...ventasBase, ...ventasExpandidas]
  }

  // Datos mock para desarrollo y testing
  private getMockVentas(): CRMVenta[] {
    // Primeras 3 ventas de septiembre 2024
    return [
      {
        id: '1',
        cliente_nombre: 'Juan Pérez González',
        cliente_rut: '12345678-9',
        cliente_telefono: '+56912345678',
        cliente_correo: 'juan.perez@email.com',
        direccion_entrega: 'Av. Los Pinos 123, Las Condes, Santiago',
        valor_total: 85000000,
        modelo_casa: 'Modelo Araucaria - 120m²',
        detalle_materiales: 'Casa prefabricada de madera, 3 dormitorios, 2 baños, cocina americana, living-comedor, terraza 20m²',
        fecha_venta: new Date(2024, 8, 1).toISOString(), // 1 de septiembre 2024
        fecha_entrega: new Date(2024, 9, 1).toISOString().split('T')[0],
        ejecutivo_id: '1',
        ejecutivo_nombre: 'Juan Pérez',
        supervisor_nombre: 'Ana Supervisor',
        estado_crm: 'Validado',
        observaciones_crm: 'Cliente confirmó especificaciones',
        numero_contrato: 'CONT-2024-001'
      },
      {
        id: '2',
        cliente_nombre: 'María Fernanda Silva',
        cliente_rut: '98765432-1',
        cliente_telefono: '+56987654321',
        cliente_correo: 'maria.silva@email.com',
        direccion_entrega: 'Camino Rural 456, Puente Alto, Santiago',
        valor_total: 62000000,
        modelo_casa: 'Modelo Copihue - 85m²',
        detalle_materiales: 'Casa prefabricada de madera, 2 dormitorios, 1 baño, cocina, living-comedor, terraza 15m²',
        fecha_venta: new Date(2024, 8, 2).toISOString(), // 2 de septiembre 2024
        fecha_entrega: new Date(2024, 9, 2).toISOString().split('T')[0],
        ejecutivo_id: '2',
        ejecutivo_nombre: 'María González',
        supervisor_nombre: 'Luis Supervisor',
        estado_crm: 'En proceso',
        observaciones_crm: 'Pendiente modificación de planos',
        numero_contrato: '0'
      },
      {
        id: '3',
        cliente_nombre: 'Carlos Eduardo Morales',
        cliente_rut: '11223344-5',
        cliente_telefono: '+56911223344',
        cliente_correo: 'carlos.morales@email.com',
        direccion_entrega: 'Parcela 15, Lote 8, Melipilla, Santiago',
        valor_total: 95000000,
        modelo_casa: 'Modelo Roble - 140m²',
        detalle_materiales: 'Casa prefabricada de madera, 4 dormitorios, 3 baños, cocina isla, living-comedor, estudio, terraza 25m²',
        fecha_venta: new Date(2024, 8, 3).toISOString(), // 3 de septiembre 2024
        fecha_entrega: new Date(2024, 9, 3).toISOString().split('T')[0],
        ejecutivo_id: '3',
        ejecutivo_nombre: 'Carlos Rodríguez',
        supervisor_nombre: 'Carmen Supervisor',
        estado_crm: 'Completado',
        observaciones_crm: 'Cliente satisfecho, listo para entrega',
        numero_contrato: 'CONT-2024-002'
      }
    ]
  }

  async validarConexion(): Promise<boolean> {
    try {
      await this.makeRequest('/health')
      return true
    } catch (error) {
      console.warn('CRM API no disponible, usando datos mock')
      return false
    }
  }
}

export const crmApi = new CRMApi()