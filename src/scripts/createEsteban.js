// Script para crear usuario Esteban como developer
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

// Función simple para generar UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createEsteban() {
  console.log('🔧 Creando usuario Esteban como Developer...')

  try {
    // Usar ID específico para Esteban que coincida con DashboardWrapper
    const estebanId = '12345678-1234-5678-9abc-123456789012'

    console.log('1️⃣ Creando usuario Esteban con ID:', estebanId)

    const { data: newUser, error: createError } = await supabase
      .from('usuarios')
      .insert({
        id: estebanId,
        nombre: 'Esteban',
        role: 'developer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      if (createError.code === '23505') {
        console.log('ℹ️ Usuario ya existe, actualizando...')

        // Actualizar usuario existente
        const { data: updatedUser, error: updateError } = await supabase
          .from('usuarios')
          .update({
            nombre: 'Esteban',
            role: 'developer',
            updated_at: new Date().toISOString()
          })
          .eq('id', estebanId)
          .select()
          .single()

        if (updateError) {
          console.log('❌ Error actualizando usuario:', updateError.message)
        } else {
          console.log('✅ Usuario Esteban actualizado como Developer:', updatedUser)
        }
      } else {
        console.log('❌ Error creando usuario:', createError.message)
      }
    } else {
      console.log('✅ Usuario Esteban creado como Developer:', newUser)
    }

    // Verificar resultado final
    console.log('')
    console.log('2️⃣ Verificando usuario final...')
    const { data: finalUser, error: finalError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', estebanId)
      .single()

    if (finalError) {
      console.log('❌ Error obteniendo usuario final:', finalError.message)
    } else {
      console.log('🎯 USUARIO ESTEBAN CONFIGURADO:')
      console.log('   👤 ID:', finalUser.id)
      console.log('   📝 Nombre:', finalUser.nombre)
      console.log('   🔧 Rol:', finalUser.role)
      console.log('')

      if (finalUser.role === 'developer') {
        console.log('✅ ¡ÉXITO! Esteban está configurado como Developer')
        console.log('🚀 La interfaz ahora debería mostrar "Desarrollador del Sistema"')
      } else {
        console.log('⚠️ El rol no es developer. Rol actual:', finalUser.role)
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

createEsteban()