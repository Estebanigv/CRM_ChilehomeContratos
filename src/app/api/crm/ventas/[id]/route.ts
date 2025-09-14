import { NextRequest, NextResponse } from 'next/server'
import { tempStorage } from '@/lib/tempStorage'

interface Params {
  params: { id: string }
}

// DELETE - Marcar venta como eliminada (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    console.log('🧪 DELETE /api/crm/ventas/[id] - Usando tempStorage para soft delete')
    
    const resolvedParams = await params
    const ventaId = resolvedParams.id
    
    if (!ventaId) {
      return NextResponse.json({ error: 'ID de venta requerido' }, { status: 400 })
    }

    try {
      // Obtener datos adicionales del request body si están disponibles
      let datosVenta = { id: ventaId }
      let motivo = 'Eliminado desde dashboard'
      
      try {
        const body = await request.json()
        datosVenta = { id: ventaId, ...body.datosVenta } || { id: ventaId }
        motivo = body.motivoEliminacion || motivo
      } catch {
        // Si no hay body válido, usar valores por defecto
        console.log('No hay datos adicionales en el request body, usando valores por defecto')
      }

      // Agregar al almacén temporal
      const tempId = tempStorage.addFichaEliminada(ventaId, datosVenta, motivo)
      
      console.log(`🗑️ Venta ID: ${ventaId} marcada como eliminada (tempId: ${tempId})`)

      return NextResponse.json({
        success: true,
        message: 'Venta marcada como eliminada exitosamente',
        ventaId,
        tempId,
        fechaEliminacion: new Date().toISOString(),
        type: 'soft_delete_temp'
      })

    } catch (error) {
      console.error('Error en soft delete:', error)
      return NextResponse.json({
        success: false,
        error: `Error marcando venta como eliminada: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error en DELETE /api/crm/ventas/[id]:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}