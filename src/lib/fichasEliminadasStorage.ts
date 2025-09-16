// Almacenamiento persistente de fichas eliminadas usando localStorage
// Este servicio mantiene las fichas eliminadas incluso después de recargar o actualizar desde CRM

interface FichaEliminada {
  id: string
  venta_id: string
  datos_venta: any
  motivo_eliminacion: string
  fecha_eliminacion: string
  usuario?: string
}

class FichasEliminadasStorage {
  private storageKey = 'fichas_eliminadas_crm'
  
  // Obtener todas las fichas eliminadas
  getAllFichasEliminadas(): FichaEliminada[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const fichas = JSON.parse(stored)
      return Array.isArray(fichas) ? fichas : []
    } catch (error) {
      console.error('Error al leer fichas eliminadas:', error)
      return []
    }
  }
  
  // Agregar una ficha eliminada
  addFichaEliminada(ventaId: string, datosVenta: any, motivo: string = 'Eliminado desde dashboard'): string {
    try {
      const fichas = this.getAllFichasEliminadas()
      
      // Verificar si ya existe
      const existingIndex = fichas.findIndex(f => f.venta_id === ventaId)
      if (existingIndex !== -1) {
        // Actualizar la existente
        fichas[existingIndex] = {
          ...fichas[existingIndex],
          datos_venta: datosVenta,
          motivo_eliminacion: motivo,
          fecha_eliminacion: new Date().toISOString()
        }
      } else {
        // Agregar nueva
        const nuevaFicha: FichaEliminada = {
          id: `del_${Date.now()}_${ventaId}`,
          venta_id: ventaId,
          datos_venta: datosVenta,
          motivo_eliminacion: motivo,
          fecha_eliminacion: new Date().toISOString(),
          usuario: 'Usuario'
        }
        fichas.push(nuevaFicha)
      }
      
      // Guardar en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(fichas))
      }
      
      console.log(`✅ Ficha ${ventaId} agregada a eliminadas (total: ${fichas.length})`)
      return ventaId
      
    } catch (error) {
      console.error('Error al agregar ficha eliminada:', error)
      throw error
    }
  }
  
  // Restaurar una ficha eliminada
  restoreFicha(ventaId: string): boolean {
    try {
      const fichas = this.getAllFichasEliminadas()
      const fichasFiltradas = fichas.filter(f => f.venta_id !== ventaId)
      
      if (fichas.length === fichasFiltradas.length) {
        console.log(`⚠️ No se encontró la ficha ${ventaId} para restaurar`)
        return false
      }
      
      // Guardar las fichas filtradas
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(fichasFiltradas))
      }
      
      console.log(`✅ Ficha ${ventaId} restaurada (quedan: ${fichasFiltradas.length})`)
      return true
      
    } catch (error) {
      console.error('Error al restaurar ficha:', error)
      return false
    }
  }
  
  // Eliminar permanentemente una ficha
  deletePermanently(ventaId: string): boolean {
    try {
      const fichas = this.getAllFichasEliminadas()
      const fichasFiltradas = fichas.filter(f => f.venta_id !== ventaId)
      
      if (fichas.length === fichasFiltradas.length) {
        console.log(`⚠️ No se encontró la ficha ${ventaId} para eliminar permanentemente`)
        return false
      }
      
      // Guardar las fichas filtradas
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(fichasFiltradas))
      }
      
      console.log(`🗑️ Ficha ${ventaId} eliminada permanentemente (quedan: ${fichasFiltradas.length})`)
      return true
      
    } catch (error) {
      console.error('Error al eliminar ficha permanentemente:', error)
      return false
    }
  }
  
  // Verificar si una venta está eliminada
  isVentaEliminada(ventaId: string): boolean {
    const fichas = this.getAllFichasEliminadas()
    return fichas.some(f => f.venta_id === ventaId)
  }
  
  // Obtener los IDs de todas las ventas eliminadas
  getVentasEliminadasIds(): string[] {
    const fichas = this.getAllFichasEliminadas()
    return fichas.map(f => f.venta_id)
  }
  
  // Limpiar todas las fichas eliminadas (usar con cuidado)
  clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey)
      console.log('⚠️ Todas las fichas eliminadas han sido limpiadas')
    }
  }
}

// Exportar una instancia única
export const fichasEliminadasStorage = new FichasEliminadasStorage()