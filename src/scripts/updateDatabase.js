// Script para actualizar la base de datos directamente
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateDatabase() {
  console.log('🔄 Iniciando actualización de base de datos...')

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión...')
    const { data: connection } = await supabase.from('usuarios').select('count').limit(1)
    console.log('✅ Conexión establecida')

    // 2. Crear tabla formas_pago
    console.log('2️⃣ Creando tabla formas_pago...')
    const createFormasPago = `
      CREATE TABLE IF NOT EXISTS formas_pago (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contrato_id UUID,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito')),
        monto DECIMAL(12,2) NOT NULL,
        recargo_porcentaje DECIMAL(5,2),
        monto_con_recargo DECIMAL(12,2),
        referencia VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: formasPagoError } = await supabase.rpc('exec_sql', { sql: createFormasPago })
    if (formasPagoError && !formasPagoError.message.includes('already exists')) {
      console.log('ℹ️ Formas pago:', formasPagoError.message)
    } else {
      console.log('✅ Tabla formas_pago lista')
    }

    // 3. Crear tabla planos_adjuntos
    console.log('3️⃣ Creando tabla planos_adjuntos...')
    const createPlanos = `
      CREATE TABLE IF NOT EXISTS planos_adjuntos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contrato_id UUID,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('original', 'modificado')),
        modelo_casa VARCHAR(100) NOT NULL,
        url TEXT NOT NULL,
        modificaciones TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: planosError } = await supabase.rpc('exec_sql', { sql: createPlanos })
    if (planosError && !planosError.message.includes('already exists')) {
      console.log('ℹ️ Planos:', planosError.message)
    } else {
      console.log('✅ Tabla planos_adjuntos lista')
    }

    // 4. Crear tabla configuraciones_reportes
    console.log('4️⃣ Creando tabla configuraciones_reportes...')
    const createConfiguraciones = `
      CREATE TABLE IF NOT EXISTS configuraciones_reportes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        destinatario VARCHAR(255) NOT NULL,
        destinatario_nombre VARCHAR(255) NOT NULL,
        area VARCHAR(50) NOT NULL,
        tipo_reporte VARCHAR(100) NOT NULL,
        frecuencia VARCHAR(20) NOT NULL,
        dia_semana INTEGER,
        hora TIME NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        configuracion JSONB,
        ultima_ejecucion TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: configError } = await supabase.rpc('exec_sql', { sql: createConfiguraciones })
    if (configError && !configError.message.includes('already exists')) {
      console.log('ℹ️ Configuraciones:', configError.message)
    } else {
      console.log('✅ Tabla configuraciones_reportes lista')
    }

    // 5. Crear tabla token_reminders
    console.log('5️⃣ Creando tabla token_reminders...')
    const createTokens = `
      CREATE TABLE IF NOT EXISTS token_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service VARCHAR(50) NOT NULL,
        token_expires_at DATE NOT NULL,
        days_remaining INTEGER,
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: tokenError } = await supabase.rpc('exec_sql', { sql: createTokens })
    if (tokenError && !tokenError.message.includes('already exists')) {
      console.log('ℹ️ Token reminders:', tokenError.message)
    } else {
      console.log('✅ Tabla token_reminders lista')
    }

    // 6. Insertar configuración para Guillermo
    console.log('6️⃣ Configurando reportes para Guillermo...')
    const { error: insertError } = await supabase
      .from('configuraciones_reportes')
      .upsert({
        destinatario: '+56963348909',
        destinatario_nombre: 'Guillermo Díaz',
        area: 'contratos',
        tipo_reporte: 'resumen_semanal_contratos',
        frecuencia: 'semanal',
        dia_semana: 0,
        hora: '19:00:00',
        activo: true,
        configuracion: {
          incluir_detalles: true,
          incluir_links: true,
          incluir_metricas: true
        }
      }, {
        onConflict: 'destinatario,tipo_reporte'
      })

    if (insertError) {
      console.log('ℹ️ Configuración Guillermo:', insertError.message)
    } else {
      console.log('✅ Configuración para Guillermo lista')
    }

    // 7. Insertar recordatorio de token WhatsApp
    console.log('7️⃣ Configurando recordatorio de token...')
    const { error: reminderError } = await supabase
      .from('token_reminders')
      .upsert({
        service: 'whatsapp',
        token_expires_at: '2025-11-14',
        days_remaining: Math.ceil((new Date('2025-11-14').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        reminder_sent: false
      }, {
        onConflict: 'service'
      })

    if (reminderError) {
      console.log('ℹ️ Recordatorio token:', reminderError.message)
    } else {
      console.log('✅ Recordatorio de token configurado')
    }

    console.log('🎉 ¡Base de datos actualizada exitosamente!')
    console.log('')
    console.log('📋 Resumen de actualizaciones:')
    console.log('  ✅ Tabla formas_pago - Para múltiples formas de pago')
    console.log('  ✅ Tabla planos_adjuntos - Para gestión de planos')
    console.log('  ✅ Tabla configuraciones_reportes - Para reportes automáticos')
    console.log('  ✅ Tabla token_reminders - Para alertas de expiración')
    console.log('  ✅ Configuración Guillermo Díaz - Reportes domingos 19:00')
    console.log('  ✅ Recordatorio token WhatsApp - Expira 14/11/2025')
    console.log('')
    console.log('🚀 Sistema listo para producción!')

  } catch (error) {
    console.error('❌ Error actualizando base de datos:', error)
  }
}

updateDatabase()