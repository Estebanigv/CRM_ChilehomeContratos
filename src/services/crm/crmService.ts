import { Venta, ApiResponse, PaginatedResponse, FilterOptions } from '@/types'
import { createClient } from '@/lib/supabase/client'

export class CRMService {
  private supabase = createClient()

  /**
   * Obtiene ventas del CRM con filtros
   */
  async getVentas(filters?: FilterOptions): Promise<ApiResponse<Venta[]>> {
    try {
      let query = this.supabase
        .from('ventas')
        .select('*')
        .order('fecha_venta', { ascending: false })

      // Aplicar filtros
      if (filters?.fechas) {
        query = query
          .gte('fecha_venta', filters.fechas.inicio)
          .lte('fecha_venta', filters.fechas.fin)
      }

      if (filters?.ejecutivos?.length) {
        query = query.in('ejecutivo_nombre', filters.ejecutivos)
      }

      if (filters?.estados?.length) {
        query = query.in('estado_crm', filters.estados)
      }

      if (filters?.busqueda) {
        query = query.or(`cliente_nombre.ilike.%${filters.busqueda}%,cliente_rut.ilike.%${filters.busqueda}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error obteniendo ventas:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }

    } catch (error) {
      console.error('Error en CRMService.getVentas:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Obtiene una venta específica
   */
  async getVenta(id: string): Promise<ApiResponse<Venta>> {
    try {
      const { data, error } = await this.supabase
        .from('ventas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Actualiza una venta
   */
  async updateVenta(id: string, updates: Partial<Venta>): Promise<ApiResponse<Venta>> {
    try {
      const { data, error } = await this.supabase
        .from('ventas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Crea una nueva venta
   */
  async createVenta(venta: Omit<Venta, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Venta>> {
    try {
      const { data, error } = await this.supabase
        .from('ventas')
        .insert({
          ...venta,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Elimina una venta
   */
  async deleteVenta(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('ventas')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  /**
   * Obtiene estadísticas generales
   */
  async getEstadisticas(): Promise<ApiResponse<any>> {
    try {
      const { data: ventas, error } = await this.supabase
        .from('ventas')
        .select('estado_crm, valor_total, fecha_venta')

      if (error) {
        return { success: false, error: error.message }
      }

      // Calcular estadísticas básicas
      const stats = {
        total: ventas?.length || 0,
        montoTotal: ventas?.reduce((sum, v) => {
          const valor = typeof v.valor_total === 'number'
            ? v.valor_total
            : parseFloat(v.valor_total?.toString() || '0')
          return sum + valor
        }, 0) || 0,
        porEstado: {}
      }

      // Agrupar por estado
      ventas?.forEach(v => {
        const estado = v.estado_crm || 'Sin estado'
        stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1
      })

      return { success: true, data: stats }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }
}

// Instancia singleton
export const crmService = new CRMService()