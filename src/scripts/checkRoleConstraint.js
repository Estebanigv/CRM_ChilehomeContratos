// Script para verificar qué roles son válidos
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRoles() {
  console.log('🔍 Verificando roles válidos...')

  try {
    // Intentar con diferentes roles para ver cuáles son válidos
    const rolesToTest = ['admin', 'ejecutivo', 'supervisor', 'developer', 'user']

    for (const role of rolesToTest) {
      console.log(`\n🧪 Probando rol: ${role}`)

      const testId = `test-${role}-${Date.now()}`

      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: testId,
          nombre: `Test ${role}`,
          role: role
        })
        .select()

      if (error) {
        console.log(`❌ ${role}: ${error.message}`)
      } else {
        console.log(`✅ ${role}: VÁLIDO`)

        // Eliminar el usuario de prueba
        await supabase
          .from('usuarios')
          .delete()
          .eq('id', testId)
      }
    }

    // Ver qué roles existen actualmente
    console.log('\n📋 Roles existentes en la base de datos:')
    const { data: existingUsers, error: getUsersError } = await supabase
      .from('usuarios')
      .select('role')

    if (getUsersError) {
      console.log('❌ Error obteniendo usuarios:', getUsersError.message)
    } else {
      const uniqueRoles = [...new Set(existingUsers.map(u => u.role))]
      console.log('Roles únicos encontrados:', uniqueRoles)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

checkRoles()