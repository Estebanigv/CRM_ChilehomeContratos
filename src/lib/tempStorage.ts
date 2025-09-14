// Almacenamiento temporal en memoria para fichas eliminadas
// Esto se reemplazará con Supabase cuando se cree la tabla

interface FichaEliminadaTemporal {
  id: string
  venta_id: string
  datos_originales: any
  motivo_eliminacion: string
  fecha_eliminacion: string
}

// Almacén en memoria (se perderá al reiniciar servidor)
let fichasEliminadasMemoria: FichaEliminadaTemporal[] = []

export const tempStorage = {
  // Obtener todas las fichas eliminadas
  getAllFichasEliminadas(): FichaEliminadaTemporal[] {
    return fichasEliminadasMemoria
  },

  // Agregar una ficha eliminada
  addFichaEliminada(ventaId: string, datosOriginales: any, motivo?: string): string {
    const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const fichaEliminada: FichaEliminadaTemporal = {
      id,
      venta_id: ventaId,
      datos_originales: datosOriginales,
      motivo_eliminacion: motivo || 'Sin motivo especificado',
      fecha_eliminacion: new Date().toISOString()
    }

    fichasEliminadasMemoria.push(fichaEliminada)
    console.log(`📝 Ficha agregada al almacén temporal - ID: ${ventaId}`)
    return id
  },

  // Obtener IDs de fichas eliminadas para filtrado
  getEliminatedIds(): string[] {
    return fichasEliminadasMemoria.map(f => f.venta_id)
  },

  // Restaurar una ficha (eliminarla del almacén temporal)
  restoreFicha(ventaId: string): boolean {
    const initialLength = fichasEliminadasMemoria.length
    fichasEliminadasMemoria = fichasEliminadasMemoria.filter(f => f.venta_id !== ventaId)
    
    const wasRestored = fichasEliminadasMemoria.length < initialLength
    if (wasRestored) {
      console.log(`🔄 Ficha restaurada del almacén temporal - ID: ${ventaId}`)
    }
    return wasRestored
  },

  // Verificar si una ficha está eliminada
  isFichaEliminada(ventaId: string): boolean {
    return fichasEliminadasMemoria.some(f => f.venta_id === ventaId)
  },

  // Limpiar todo (para desarrollo/testing)
  clearAll(): void {
    fichasEliminadasMemoria = []
    console.log('🧹 Almacén temporal limpiado')
  },

  // Obtener estadísticas
  getStats() {
    return {
      total: fichasEliminadasMemoria.length,
      ultimaEliminacion: fichasEliminadasMemoria.length > 0 
        ? fichasEliminadasMemoria[fichasEliminadasMemoria.length - 1].fecha_eliminacion 
        : null
    }
  }
}