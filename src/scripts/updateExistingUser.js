// Script para actualizar usuario existente
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateUser() {
  console.log('🔧 Actualizando usuario existente...')

  try {
    // Obtener usuarios existentes
    const { data: users, error: getUsersError } = await supabase
      .from('usuarios')
      .select('*')

    if (getUsersError) {
      console.log('❌ Error obteniendo usuarios:', getUsersError.message)
      return
    }

    console.log('👥 Usuarios encontrados:')
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Nombre: ${user.nombre}, Rol: ${user.role}`)
    })

    // Actualizar el usuario admin a Esteban developer
    const adminUser = users.find(u => u.nombre === 'admin')

    if (adminUser) {
      console.log('\n🔄 Actualizando usuario admin a Esteban developer...')

      const { data: updatedUser, error: updateError } = await supabase
        .from('usuarios')
        .update({
          nombre: 'Esteban'
          // Mantener el mismo rol por ahora ya que developer no está permitido
        })
        .eq('id', adminUser.id)
        .select()
        .single()

      if (updateError) {
        console.log('❌ Error actualizando usuario:', updateError.message)
      } else {
        console.log('✅ Usuario actualizado:', updatedUser)
      }
    }

    // Intentar agregar nueva columna role con más opciones
    console.log('\n🔧 Intentando actualizar estructura de la tabla...')

    // Primero, crear un nuevo usuario con nombre Esteban usando el ID específico
    const estebanId = '12345678-1234-5678-9abc-123456789012'

    // Eliminar usuario si existe
    await supabase
      .from('usuarios')
      .delete()
      .eq('id', estebanId)

    // Crear usuario Esteban con rol ejecutivo (el único permitido por ahora)
    const { data: newEsteban, error: createError } = await supabase
      .from('usuarios')
      .insert({
        id: estebanId,
        nombre: 'Esteban',
        role: 'ejecutivo'  // Usar el rol válido existente
      })
      .select()
      .single()

    if (createError) {
      console.log('❌ Error creando Esteban:', createError.message)
    } else {
      console.log('✅ Usuario Esteban creado:', newEsteban)
    }

    // Verificar resultado final
    console.log('\n🎯 USUARIOS FINALES:')
    const { data: finalUsers, error: finalError } = await supabase
      .from('usuarios')
      .select('*')

    if (finalError) {
      console.log('❌ Error obteniendo usuarios finales:', finalError.message)
    } else {
      finalUsers.forEach(user => {
        console.log(`   - ${user.nombre}: ${user.role} (ID: ${user.id})`)
      })
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

updateUser()