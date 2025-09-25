// SmartCRM API integration
interface SmartCRMLoginResponse {
  err: boolean
  msg: string
  tot: number
  inf: {
    adm_id: string
    adm_usu: string
    adm_per_id: string
    adm_sub_id: string
    adm_sup_id: string
    adm_est_cu: string
    adm_sup: string
    adm_is_dea: string
    adm_mar_id: string
    adm_est: string
    adm_tok: string
  }
  ses: any
}

interface SmartCRMVenta {
  ref_id: string
  ref_cre_fec: string // Fecha ingreso
  ref_ins_fec_age: string // Fecha de entrega
  ref_usu_nom: string // Nombre Vendedor
  ref_usu_per_nom: string // Vendedor
  ref_usu_sup_nom: string // Nombre Supervisor
  ref_run: string // Cliente RUT
  ref_nom: string // Cliente Nombre
  ref_fon: string // Cliente teléfono
  ref_dir: string // Dirección
  ref_reg: string // Región nombre (requiere parseo HTML entity)
  ref_com: string // Comuna nombre
  ref_est_nom: string // Ultima bitacora Nombre estado
  ref_est_bit: string // Ultima bitacora Observacion
}

interface SmartCRMVentasResponse {
  err: boolean
  msg: string
  tot: number
  lin: number
  totalPages: number
  totalrow: number
  inf: SmartCRMVenta[]
}

const SMARTCRM_BASE_URL = 'https://mater.smartcrm.cl/api/v1/index.php'
const CLIENT_SERVICE = 'Smart-Sales'
const AUTH_KEY = 'B~a2C0g53ux@'

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

export class SmartCRMAPI {
  private accessToken: string | null = null

  async login(username: string, password: string): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('log_usu', username)
      formData.append('log_cla', password)

      const response = await fetch(`${SMARTCRM_BASE_URL}/Auth/Login/`, {
        method: 'POST',
        headers: {
          'Client-Service': CLIENT_SERVICE,
          'Auth-Key': AUTH_KEY,
        },
        body: formData,
      })

      const data: SmartCRMLoginResponse = await response.json()

      if (!data.err && data.inf?.adm_tok) {
        this.accessToken = data.inf.adm_tok
        return true
      }

      console.error('SmartCRM Login failed:', data.msg)
      return false
    } catch (error) {
      console.error('SmartCRM Login error:', error)
      return false
    }
  }

  async getVentas(options: {
    page?: number
    fechaDesde?: string // YYYY-MM-DD
    fechaHasta?: string // YYYY-MM-DD
    ultimaSemana?: 'validacion' | string
  } = {}): Promise<SmartCRMVenta[]> {
    if (!this.accessToken) {
      throw new Error('No authenticated. Please login first.')
    }

    try {
      const params = new URLSearchParams({
        sel_fil: '1',
        page: (options.page || 1).toString(),
      })

      if (options.fechaDesde) {
        params.append('sel_ini_des', options.fechaDesde)
      }

      if (options.fechaHasta) {
        params.append('sel_ini_has', options.fechaHasta)
      }

      if (options.ultimaSemana) {
        params.append('ultima_semana', options.ultimaSemana)
      }

      const response = await fetch(`${SMARTCRM_BASE_URL}/Admin/Referido/?${params}`, {
        method: 'GET',
        headers: {
          'Client-Service': CLIENT_SERVICE,
          'Auth-Key': this.accessToken,
        },
      })

      const data: SmartCRMVentasResponse = await response.json()

      if (!data.err && data.inf) {
        // Decode HTML entities in region names
        return data.inf.map(venta => ({
          ...venta,
          ref_reg: decodeHtmlEntities(venta.ref_reg)
        }))
      }

      console.error('SmartCRM Ventas failed:', data.msg)
      return []
    } catch (error) {
      console.error('SmartCRM Ventas error:', error)
      return []
    }
  }

  async getVentasPorPeriodo(periodo: 'diario' | 'semanal' | 'mensual'): Promise<SmartCRMVenta[]> {
    const now = new Date()
    let fechaDesde: string
    let fechaHasta: string = now.toISOString().split('T')[0]

    switch (periodo) {
      case 'diario':
        fechaDesde = fechaHasta // Solo hoy
        break
      case 'semanal':
        const inicioSemana = new Date(now)
        inicioSemana.setDate(now.getDate() - 7)
        fechaDesde = inicioSemana.toISOString().split('T')[0]
        break
      case 'mensual':
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
        fechaDesde = inicioMes.toISOString().split('T')[0]
        break
      default:
        fechaDesde = fechaHasta
    }

    return this.getVentas({ fechaDesde, fechaHasta })
  }

  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  logout(): void {
    this.accessToken = null
  }
}

// Singleton instance
export const smartCRMAPI = new SmartCRMAPI()