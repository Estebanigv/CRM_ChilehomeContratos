// Script para verificar la estructura de la base de datos
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Verificando estructura de la base de datos...')

  try {
    // Verificar tablas existentes
    console.log('1️⃣ Verificando tabla usuarios...')
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)

    if (usuariosError) {
      console.log('❌ Error con tabla usuarios:', usuariosError.message)
    } else {
      console.log('✅ Tabla usuarios existe')
      if (usuarios.length > 0) {
        console.log('📋 Estructura de usuarios:', Object.keys(usuarios[0]))
        console.log('👤 Usuario ejemplo:', usuarios[0])
      }
    }

    console.log('')
    console.log('2️⃣ Verificando tabla contratos...')
    const { data: contratos, error: contratosError } = await supabase
      .from('contratos')
      .select('*')
      .limit(1)

    if (contratosError) {
      console.log('❌ Error con tabla contratos:', contratosError.message)
    } else {
      console.log('✅ Tabla contratos existe')
      if (contratos.length > 0) {
        console.log('📋 Estructura de contratos:', Object.keys(contratos[0]))
      }
    }

    console.log('')
    console.log('3️⃣ Verificando otras tablas...')

    const tablesToCheck = ['clientes', 'formas_pago', 'planos_adjuntos', 'configuraciones_reportes']

    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: existe`)
        if (data.length > 0) {
          console.log(`   📋 Columnas: ${Object.keys(data[0]).join(', ')}`)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkDatabase()