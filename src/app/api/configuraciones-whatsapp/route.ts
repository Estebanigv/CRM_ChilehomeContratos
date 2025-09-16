import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ConfiguracionWhatsApp {
  id?: string
  destinatario: string
  destinatario_nombre: string
  rol: string
  activo: boolean
  tipos_notificacion: string[]
  configuracion: {
    incluir_detalles: boolean
    incluir_metricas: boolean
    incluir_links: boolean
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticación (opcional para configuraciones)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Si no hay usuario autenticado, devolver configuraciones vacías
      return NextResponse.json({
        success: true,
        configuraciones: []
      })
    }

    const { data, error } = await supabase
      .from('configuraciones_whatsapp')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching configuraciones:', error)
      // Si la tabla no existe, devolver un array vacío en lugar de error
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('Table configuraciones_whatsapp does not exist, returning empty array')
        return NextResponse.json({
          success: true,
          configuraciones: []
        })
      }
      return NextResponse.json({
        success: false,
        error: 'Error al obtener configuraciones'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      configuraciones: data || []
    })

  } catch (error) {
    console.error('Error in GET /api/configuraciones-whatsapp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación (opcional para crear configuración inicial)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Si no hay usuario autenticado, crear configuración sin vincular a usuario
      const body = await request.json()
      const { configuracion }: { configuracion: ConfiguracionWhatsApp } = body

      if (!configuracion) {
        return NextResponse.json({
          success: false,
          error: 'Configuración requerida'
        }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('configuraciones_whatsapp')
        .insert({
          destinatario: configuracion.destinatario,
          destinatario_nombre: configuracion.destinatario_nombre,
          rol: configuracion.rol,
          activo: configuracion.activo,
          tipos_notificacion: configuracion.tipos_notificacion,
          configuracion: configuracion.configuracion,
          created_by: null // Sin usuario autenticado
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating configuracion without user:', error)
        return NextResponse.json({
          success: false,
          error: 'Error al crear configuración'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        configuracion: data
      })
    }

    const body = await request.json()
    const { configuracion }: { configuracion: ConfiguracionWhatsApp } = body

    if (!configuracion) {
      return NextResponse.json({
        success: false,
        error: 'Configuración requerida'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('configuraciones_whatsapp')
      .insert({
        destinatario: configuracion.destinatario,
        destinatario_nombre: configuracion.destinatario_nombre,
        rol: configuracion.rol,
        activo: configuracion.activo,
        tipos_notificacion: configuracion.tipos_notificacion,
        configuracion: configuracion.configuracion,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating configuracion:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al crear configuración'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      configuracion: data
    })

  } catch (error) {
    console.error('Error in POST /api/configuraciones-whatsapp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, configuracion }: { id: string, configuracion: ConfiguracionWhatsApp } = body

    if (!id || !configuracion) {
      return NextResponse.json({
        success: false,
        error: 'ID y configuración requeridos'
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('configuraciones_whatsapp')
      .update({
        destinatario: configuracion.destinatario,
        destinatario_nombre: configuracion.destinatario_nombre,
        rol: configuracion.rol,
        activo: configuracion.activo,
        tipos_notificacion: configuracion.tipos_notificacion,
        configuracion: configuracion.configuracion,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating configuracion:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al actualizar configuración'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      configuracion: data
    })

  } catch (error) {
    console.error('Error in PUT /api/configuraciones-whatsapp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID requerido'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('configuraciones_whatsapp')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting configuracion:', error)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar configuración'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada correctamente'
    })

  } catch (error) {
    console.error('Error in DELETE /api/configuraciones-whatsapp:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}