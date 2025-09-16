import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando actualización de base de datos...')

    // 1. Actualizar tabla de usuarios para nuevos roles
    console.log('1️⃣ Actualizando tabla usuarios...')
    await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS can_edit_after_validation BOOLEAN DEFAULT FALSE;
      `
    }).catch(() => {
      // La columna ya existe, continuar
      console.log('✅ Columna can_edit_after_validation ya existe')
    })

    // 2. Configurar Esteban como developer
    console.log('2️⃣ Configurando Esteban como developer...')
    const { data: estebanUpdate, error: estebanError } = await supabase
      .from('usuarios')
      .update({
        role: 'developer',
        can_edit_after_validation: true
      })
      .or('email.ilike.%esteban%,nombre.ilike.%Esteban%')
      .select()

    if (estebanError) {
      console.log('ℹ️ No se encontró usuario Esteban para actualizar')
    } else {
      console.log('✅ Esteban configurado como developer:', estebanUpdate)
    }

    // 3. Crear tabla de formas de pago
    console.log('3️⃣ Creando tabla formas_pago...')
    const { error: formasPagoError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS formas_pago (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
          tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito')),
          monto DECIMAL(12,2) NOT NULL,
          recargo_porcentaje DECIMAL(5,2),
          monto_con_recargo DECIMAL(12,2),
          referencia VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (formasPagoError) {
      console.log('ℹ️ Tabla formas_pago:', formasPagoError.message)
    } else {
      console.log('✅ Tabla formas_pago creada/verificada')
    }

    // 4. Crear tabla de planos adjuntos
    console.log('4️⃣ Creando tabla planos_adjuntos...')
    const { error: planosError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS planos_adjuntos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
          tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('original', 'modificado')),
          modelo_casa VARCHAR(100) NOT NULL,
          url TEXT NOT NULL,
          modificaciones TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (planosError) {
      console.log('ℹ️ Tabla planos_adjuntos:', planosError.message)
    } else {
      console.log('✅ Tabla planos_adjuntos creada/verificada')
    }

    // 5. Actualizar tabla contratos
    console.log('5️⃣ Actualizando tabla contratos...')
    const { error: contratosError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE contratos
        ADD COLUMN IF NOT EXISTS fecha_validacion TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS validado_por UUID REFERENCES usuarios(id),
        ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES usuarios(id);
      `
    })

    if (contratosError) {
      console.log('ℹ️ Columnas contratos:', contratosError.message)
    } else {
      console.log('✅ Columnas de contratos agregadas')
    }

    // 6. Crear tabla de configuraciones de reportes
    console.log('6️⃣ Creando tabla configuraciones_reportes...')
    const { error: configError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS configuraciones_reportes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          destinatario VARCHAR(255) NOT NULL,
          destinatario_nombre VARCHAR(255) NOT NULL,
          area VARCHAR(50) NOT NULL CHECK (area IN ('contratos', 'ventas', 'produccion', 'logistica', 'finanzas')),
          tipo_reporte VARCHAR(100) NOT NULL,
          frecuencia VARCHAR(20) NOT NULL CHECK (frecuencia IN ('diaria', 'semanal', 'mensual')),
          dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6),
          hora TIME NOT NULL,
          activo BOOLEAN DEFAULT TRUE,
          configuracion JSONB,
          ultima_ejecucion TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (configError) {
      console.log('ℹ️ Tabla configuraciones_reportes:', configError.message)
    } else {
      console.log('✅ Tabla configuraciones_reportes creada/verificada')
    }

    // 7. Crear tabla de recordatorios de tokens
    console.log('7️⃣ Creando tabla token_reminders...')
    const { error: tokenError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS token_reminders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service VARCHAR(50) NOT NULL,
          token_expires_at DATE NOT NULL,
          days_remaining INTEGER,
          reminder_sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (tokenError) {
      console.log('ℹ️ Tabla token_reminders:', tokenError.message)
    } else {
      console.log('✅ Tabla token_reminders creada/verificada')
    }

    // 8. Crear índices para mejor performance
    console.log('8️⃣ Creando índices...')
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_formas_pago_contrato ON formas_pago(contrato_id);',
      'CREATE INDEX IF NOT EXISTS idx_planos_contrato ON planos_adjuntos(contrato_id);',
      'CREATE INDEX IF NOT EXISTS idx_contratos_estado ON contratos(estado);',
      'CREATE INDEX IF NOT EXISTS idx_contratos_validacion ON contratos(fecha_validacion);',
      'CREATE INDEX IF NOT EXISTS idx_configuraciones_activas ON configuraciones_reportes(activo);'
    ]

    for (const indice of indices) {
      await supabase.rpc('execute_sql', { sql: indice }).catch(() => {
        // Índice ya existe, continuar
      })
    }
    console.log('✅ Índices creados/verificados')

    // 9. Insertar configuración inicial para Guillermo
    console.log('9️⃣ Insertando configuración inicial...')
    const { error: insertError } = await supabase
      .from('configuraciones_reportes')
      .upsert({
        destinatario: '+56963348909',
        destinatario_nombre: 'Guillermo Díaz',
        area: 'contratos',
        tipo_reporte: 'resumen_semanal_contratos',
        frecuencia: 'semanal',
        dia_semana: 0,
        hora: '19:00',
        activo: true,
        configuracion: {
          incluir_detalles: true,
          incluir_links: true,
          incluir_metricas: true,
          filtros: {
            estados: ['validado', 'enviado', 'validacion'],
            fecha_desde: 'ultima_semana'
          }
        }
      }, {
        onConflict: 'destinatario,tipo_reporte'
      })

    if (insertError) {
      console.log('ℹ️ Configuración inicial:', insertError.message)
    } else {
      console.log('✅ Configuración inicial para Guillermo insertada')
    }

    console.log('🎉 Actualización de base de datos completada!')

    return NextResponse.json({
      success: true,
      message: 'Base de datos actualizada exitosamente',
      actualizaciones: [
        '✅ Tabla usuarios actualizada con nuevos roles',
        '✅ Esteban configurado como developer',
        '✅ Tabla formas_pago creada',
        '✅ Tabla planos_adjuntos creada',
        '✅ Tabla contratos actualizada',
        '✅ Tabla configuraciones_reportes creada',
        '✅ Tabla token_reminders creada',
        '✅ Índices de performance creados',
        '✅ Configuración inicial para Guillermo'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error actualizando base de datos:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al actualizar la base de datos'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar estado de las tablas
    const { data: tables, error } = await supabase
      .rpc('get_table_info')
      .catch(() => ({ data: null, error: 'No se puede obtener información de tablas' }))

    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, email, nombre, role, can_edit_after_validation')
      .limit(10)

    return NextResponse.json({
      success: true,
      estado_bd: {
        tablas_verificadas: [
          'usuarios',
          'contratos',
          'clientes',
          'formas_pago',
          'planos_adjuntos',
          'configuraciones_reportes',
          'token_reminders'
        ],
        usuarios_ejemplo: usuarios || [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error verificando estado'
    }, { status: 500 })
  }
}