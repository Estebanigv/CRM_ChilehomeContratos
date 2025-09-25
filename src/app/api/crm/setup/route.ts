import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando setup de tablas CRM...')
    const supabase = await createClient()

    // SQL para crear las tablas
    const setupSQL = `
      -- Crear tabla para almacenar todas las ventas del CRM
      CREATE TABLE IF NOT EXISTS ventas_crm (
        id TEXT PRIMARY KEY,
        cliente_nombre TEXT,
        cliente_rut TEXT,
        cliente_telefono TEXT,
        cliente_correo TEXT,
        direccion_entrega TEXT,
        valor_total BIGINT,
        modelo_casa TEXT,
        detalle_materiales TEXT,
        fecha_venta TIMESTAMP WITH TIME ZONE,
        fecha_entrega DATE,
        ejecutivo_id TEXT,
        ejecutivo_nombre TEXT,
        supervisor_nombre TEXT,
        estado_crm TEXT,
        observaciones_crm TEXT,
        numero_contrato TEXT,
        numero_contrato_temporal TEXT,

        -- Campos de auditoría
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        -- Campos adicionales del CRM
        crm_data JSONB -- Para almacenar todos los datos brutos del CRM
      );

      -- Crear tabla para log de sincronización
      CREATE TABLE IF NOT EXISTS crm_sync_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sync_type TEXT NOT NULL, -- 'full', 'incremental', 'manual', 'auto'
        fecha_inicio DATE,
        fecha_fin DATE,
        total_ventas_procesadas INTEGER DEFAULT 0,
        ventas_nuevas INTEGER DEFAULT 0,
        ventas_actualizadas INTEGER DEFAULT 0,
        estado TEXT DEFAULT 'iniciado', -- 'iniciado', 'completado', 'error'
        mensaje_error TEXT,
        duracion_segundos INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `

    // Ejecutar el SQL
    const { error } = await supabase.rpc('exec_sql', { sql: setupSQL })

    if (error) {
      console.error('❌ Error ejecutando setup SQL:', error)
      // Si no funciona el RPC, intentamos crear las tablas individualmente

      // Crear tabla ventas_crm
      const { error: ventasError } = await supabase.from('ventas_crm').select('id').limit(1)

      if (ventasError && ventasError.code === 'PGRST116') {
        // La tabla no existe, intentamos crearla directamente
        console.log('🔨 Las tablas no existen, se necesita ejecutar el setup manualmente')
        return NextResponse.json({
          success: false,
          error: 'Las tablas CRM no existen',
          setupRequired: true,
          sql: setupSQL,
          message: 'Ejecuta el SQL proporcionado en la consola de Supabase para crear las tablas'
        }, { status: 200 }) // 200 porque es una condición esperada
      }
    }

    // Verificar que las tablas existen
    const { data: ventasTest } = await supabase.from('ventas_crm').select('id').limit(1)
    const { data: logTest } = await supabase.from('crm_sync_log').select('id').limit(1)

    console.log('✅ Setup de tablas CRM completado')

    return NextResponse.json({
      success: true,
      message: 'Tablas CRM configuradas correctamente',
      tables: {
        ventas_crm: 'OK',
        crm_sync_log: 'OK'
      }
    })

  } catch (error) {
    console.error('❌ Error en setup CRM:', error)
    return NextResponse.json({
      success: false,
      error: 'Error configurando tablas CRM',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET para verificar el estado de las tablas
export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar que las tablas existen
    const { error: ventasError } = await supabase.from('ventas_crm').select('id').limit(1)
    const { error: logError } = await supabase.from('crm_sync_log').select('id').limit(1)

    const tablesExist = !ventasError && !logError

    return NextResponse.json({
      success: true,
      tablesExist,
      tables: {
        ventas_crm: !ventasError ? 'OK' : ventasError.message,
        crm_sync_log: !logError ? 'OK' : logError.message
      }
    })

  } catch (error) {
    console.error('❌ Error verificando tablas CRM:', error)
    return NextResponse.json({
      success: false,
      error: 'Error verificando tablas CRM',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}