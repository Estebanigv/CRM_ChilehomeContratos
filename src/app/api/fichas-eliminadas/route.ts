import { NextRequest, NextResponse } from 'next/server'
import { tempStorage } from '@/lib/tempStorage'

// GET - Obtener fichas eliminadas (modo temporal sin Supabase)
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 GET /api/fichas-eliminadas - Usando tempStorage')
    
    // Obtener fichas eliminadas del almacén temporal
    const fichasEliminadas = tempStorage.getAllFichasEliminadas()
    
    console.log(`📋 Fichas eliminadas encontradas: ${fichasEliminadas.length}`)

    return NextResponse.json({
      success: true,
      fichas: fichasEliminadas,
      message: fichasEliminadas.length === 0 ? 'No hay fichas eliminadas' : `${fichasEliminadas.length} fichas eliminadas encontradas`
    })

  } catch (error) {
    console.error('Error en GET /api/fichas-eliminadas:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor',
      fichas: []
    }, { status: 500 })
  }
}

// POST - Marcar ficha como eliminada (modo temporal)
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 POST /api/fichas-eliminadas - Modo temporal sin Supabase')

    const body = await request.json()
    const { ventaId, datosVenta, motivoEliminacion } = body

    console.log(`📝 Eliminación temporal - ID: ${ventaId}, Motivo: ${motivoEliminacion || 'Sin motivo'}`)

    return NextResponse.json({
      success: true,
      message: 'Ficha marcada como eliminada (temporal)',
      ventaId,
      fecha: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error en POST /api/fichas-eliminadas:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// DELETE - Restaurar ficha (modo temporal)
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧪 DELETE /api/fichas-eliminadas - Restaurar usando tempStorage')

    const { searchParams } = new URL(request.url)
    const ventaId = searchParams.get('venta_id')

    if (!ventaId) {
      return NextResponse.json({ 
        success: false,
        error: 'ID de venta requerido' 
      }, { status: 400 })
    }

    // Restaurar ficha eliminada del almacén temporal
    const wasRestored = tempStorage.restoreFicha(ventaId)

    if (wasRestored) {
      console.log(`🔄 Ficha restaurada exitosamente - ID: ${ventaId}`)
      return NextResponse.json({
        success: true,
        message: 'Ficha restaurada exitosamente',
        ventaId
      })
    } else {
      console.log(`⚠️ No se encontró la ficha para restaurar - ID: ${ventaId}`)
      return NextResponse.json({
        success: false,
        message: 'No se encontró la ficha para restaurar',
        ventaId
      }, { status: 404 })
    }

  } catch (error) {
    console.error('Error en DELETE /api/fichas-eliminadas:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}