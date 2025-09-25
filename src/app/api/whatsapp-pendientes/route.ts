import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  WhatsAppService,
  generarMensajeClientePendiente,
  generarMensajeSeguimientoPendientes,
  calcularDiasPendiente
} from '@/lib/whatsappService'
import { isEstadoPendiente } from '@/utils/contractHelpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ventaId, phoneNumber, customMessage } = body

    // Crear cliente de Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            for (const cookie of cookies) {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            }
          }
        }
      }
    )

    const whatsapp = new WhatsAppService()

    switch (action) {
      case 'enviar-recordatorio-individual': {
        // Enviar recordatorio para un cliente específico
        const { data: venta, error } = await supabase
          .from('ventas')
          .select('*')
          .eq('id', ventaId)
          .single()

        if (error || !venta) {
          return NextResponse.json(
            { error: 'Venta no encontrada' },
            { status: 404 }
          )
        }

        const diasPendiente = calcularDiasPendiente(venta.fecha_venta)
        const mensaje = generarMensajeClientePendiente({
          ...venta,
          dias_pendiente: diasPendiente,
          estado_actual: venta.estado_crm || 'Pendiente',
          accion_requerida: customMessage || undefined
        })

        const result = await whatsapp.sendTextMessage(
          phoneNumber || venta.cliente_telefono,
          mensaje
        )

        // Registrar la acción
        await supabase.from('actividad_whatsapp').insert({
          tipo: 'recordatorio_pendiente',
          venta_id: ventaId,
          telefono: phoneNumber || venta.cliente_telefono,
          mensaje: mensaje,
          estado: result.success ? 'enviado' : 'error',
          error: result.error,
          fecha_envio: new Date().toISOString()
        })

        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Recordatorio enviado' : 'Error al enviar',
          error: result.error
        })
      }

      case 'enviar-resumen-pendientes': {
        // Obtener todos los contratos pendientes
        const { data: pendientes, error } = await supabase
          .from('ventas')
          .select('*')
          .order('fecha_venta', { ascending: true })

        if (error) {
          return NextResponse.json(
            { error: 'Error al obtener pendientes' },
            { status: 500 }
          )
        }

        // Filtrar solo los que están pendientes
        const ventasPendientes = pendientes?.filter(v =>
          isEstadoPendiente(v.estado_crm)
        ).map(v => ({
          ...v,
          dias_pendiente: calcularDiasPendiente(v.fecha_venta)
        }))

        if (!ventasPendientes || ventasPendientes.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No hay contratos pendientes'
          })
        }

        const mensaje = generarMensajeSeguimientoPendientes(ventasPendientes)
        const result = await whatsapp.sendTextMessage(phoneNumber, mensaje)

        // Registrar la acción
        await supabase.from('actividad_whatsapp').insert({
          tipo: 'resumen_pendientes',
          telefono: phoneNumber,
          mensaje: mensaje,
          total_pendientes: ventasPendientes.length,
          estado: result.success ? 'enviado' : 'error',
          error: result.error,
          fecha_envio: new Date().toISOString()
        })

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? `Resumen de ${ventasPendientes.length} pendientes enviado`
            : 'Error al enviar resumen',
          totalPendientes: ventasPendientes.length,
          error: result.error
        })
      }

      case 'notificar-pendientes-criticos': {
        // Obtener contratos pendientes por más de 3 días
        const { data: pendientes, error } = await supabase
          .from('ventas')
          .select('*')
          .order('fecha_venta', { ascending: true })

        if (error) {
          return NextResponse.json(
            { error: 'Error al obtener pendientes' },
            { status: 500 }
          )
        }

        const criticos = pendientes?.filter(v => {
          if (!isEstadoPendiente(v.estado_crm)) return false
          const dias = calcularDiasPendiente(v.fecha_venta)
          return dias >= 3
        })

        if (!criticos || criticos.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No hay casos críticos'
          })
        }

        let enviados = 0
        let errores = 0

        for (const venta of criticos) {
          const dias = calcularDiasPendiente(venta.fecha_venta)
          const mensaje = `⚠️ URGENTE: El contrato de ${venta.cliente_nombre} lleva ${dias} días pendiente. Requiere atención inmediata.`

          const result = await whatsapp.sendTextMessage(
            phoneNumber || venta.ejecutivo_telefono,
            mensaje
          )

          if (result.success) {
            enviados++
          } else {
            errores++
          }

          // Delay para no saturar la API
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        return NextResponse.json({
          success: true,
          message: `Notificaciones críticas: ${enviados} enviadas, ${errores} errores`,
          totalCriticos: criticos.length,
          enviados,
          errores
        })
      }

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error en WhatsApp pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obtener estadísticas de pendientes
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookies) {
            for (const cookie of cookies) {
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            }
          }
        }
      }
    )

    const { data: ventas, error } = await supabase
      .from('ventas')
      .select('*')

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener ventas' },
        { status: 500 }
      )
    }

    const pendientes = ventas?.filter(v => isEstadoPendiente(v.estado_crm)) || []
    const criticos = pendientes.filter(v => {
      const dias = calcularDiasPendiente(v.fecha_venta)
      return dias >= 3
    })

    const stats = {
      totalPendientes: pendientes.length,
      criticos: criticos.length,
      porEjecutivo: pendientes.reduce((acc: any, v) => {
        const ejecutivo = v.ejecutivo_nombre || 'Sin asignar'
        acc[ejecutivo] = (acc[ejecutivo] || 0) + 1
        return acc
      }, {}),
      porDias: {
        hoy: pendientes.filter(v => calcularDiasPendiente(v.fecha_venta) === 0).length,
        ayer: pendientes.filter(v => calcularDiasPendiente(v.fecha_venta) === 1).length,
        dosDias: pendientes.filter(v => calcularDiasPendiente(v.fecha_venta) === 2).length,
        tresDiasMas: criticos.length
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      pendientes: pendientes.slice(0, 10).map(v => ({
        id: v.id,
        cliente: v.cliente_nombre,
        ejecutivo: v.ejecutivo_nombre,
        dias: calcularDiasPendiente(v.fecha_venta),
        estado: v.estado_crm || 'Pendiente'
      }))
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}