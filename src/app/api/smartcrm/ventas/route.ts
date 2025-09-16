import { NextRequest, NextResponse } from 'next/server'

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
  ref_cre_fec: string
  ref_ins_fec_age: string
  ref_usu_nom: string
  ref_usu_per_nom: string
  ref_usu_sup_nom: string
  ref_run: string
  ref_nom: string
  ref_fon: string
  ref_dir: string
  ref_reg: string
  ref_com: string
  ref_est_nom: string
  ref_est_bit: string
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

// Credenciales por defecto para demo
const DEFAULT_USERNAME = process.env.SMARTCRM_USERNAME || 'demo@chilehome.cl'
const DEFAULT_PASSWORD = process.env.SMARTCRM_PASSWORD || 'demo123'

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Ntilde;/g, 'Ñ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

async function loginToSmartCRM(): Promise<string | null> {
  try {
    const formData = new FormData()
    formData.append('log_usu', DEFAULT_USERNAME)
    formData.append('log_cla', DEFAULT_PASSWORD)

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
      return data.inf.adm_tok
    }

    console.error('SmartCRM Login failed:', data.msg)
    return null
  } catch (error) {
    console.error('SmartCRM Login error:', error)
    return null
  }
}

async function getVentasFromSmartCRM(
  accessToken: string,
  options: {
    page?: number
    fechaDesde?: string
    fechaHasta?: string
    ultimaSemana?: string
  } = {}
): Promise<SmartCRMVenta[]> {
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
        'Auth-Key': accessToken,
      },
    })

    const data: SmartCRMVentasResponse = await response.json()

    if (!data.err && data.inf) {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || 'mensual'

    // Login to SmartCRM
    const accessToken = await loginToSmartCRM()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with SmartCRM' },
        { status: 401 }
      )
    }

    // Calculate date range based on period
    const now = new Date()
    let fechaDesde: string
    let fechaHasta: string = now.toISOString().split('T')[0]

    switch (periodo) {
      case 'diario':
        fechaDesde = fechaHasta
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

    // Get sales data
    const ventas = await getVentasFromSmartCRM(accessToken, {
      fechaDesde,
      fechaHasta,
    })

    // Transform data to match our interface
    const ventasTransformadas = ventas.map(venta => ({
      id: venta.ref_id,
      cliente_nombre: venta.ref_nom,
      cliente_rut: venta.ref_run,
      cliente_telefono: venta.ref_fon,
      cliente_correo: '', // No disponible en la API
      valor_total: 0, // No disponible en la API, se podría estimar
      modelo_casa: '', // No disponible en la API
      fecha_venta: venta.ref_cre_fec,
      fecha_entrega: venta.ref_ins_fec_age,
      ejecutivo_nombre: venta.ref_usu_nom,
      estado_crm: venta.ref_est_nom,
      direccion_entrega: `${venta.ref_dir}, ${venta.ref_com}, ${venta.ref_reg}`,
      numero_contrato: venta.ref_id,
    }))

    return NextResponse.json({
      success: true,
      ventas: ventasTransformadas,
      total: ventas.length,
    })
  } catch (error) {
    console.error('Error getting SmartCRM ventas:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}