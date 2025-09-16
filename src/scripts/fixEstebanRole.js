// Script para configurar a Esteban como developer usando la estructura real de la base de datos
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixEstebanRole() {
  console.log('🔧 Configurando rol de Esteban como Developer...')

  try {
    // 1. Buscar todos los usuarios
    console.log('1️⃣ Obteniendo todos los usuarios...')
    const { data: allUsers, error: getAllError } = await supabase
      .from('usuarios')
      .select('*')

    if (getAllError) {
      console.log('❌ Error obteniendo usuarios:', getAllError.message)
      return
    }

    console.log('👥 Usuarios encontrados:')
    allUsers.forEach(user => {
      console.log(`   - ID: ${user.id}, Nombre: ${user.nombre}, Rol: ${user.role}`)
    })

    // 2. Buscar usuario que se llame Esteban (o similar)
    const estebanUser = allUsers.find(user =>
      user.nombre && user.nombre.toLowerCase().includes('esteban')
    )

    if (estebanUser) {
      console.log('')
      console.log('2️⃣ Usuario Esteban encontrado:', estebanUser)

      // Actualizar su rol a developer
      const { data: updatedUser, error: updateError } = await supabase
        .from('usuarios')
        .update({
          role: 'developer'
        })
        .eq('id', estebanUser.id)
        .select()
        .single()

      if (updateError) {
        console.log('❌ Error actualizando usuario:', updateError.message)
      } else {
        console.log('✅ Usuario actualizado exitosamente:', updatedUser)
      }
    } else {
      console.log('')
      console.log('2️⃣ Usuario Esteban no encontrado, creando...')

      // Crear usuario Esteban
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert({
          nombre: 'Esteban',
          role: 'developer'
        })
        .select()
        .single()

      if (createError) {
        console.log('❌ Error creando usuario:', createError.message)
      } else {
        console.log('✅ Usuario Esteban creado como Developer:', newUser)
      }
    }

    // 3. Verificar resultado final
    console.log('')
    console.log('3️⃣ Verificando configuración final...')
    const { data: finalUsers, error: finalError } = await supabase
      .from('usuarios')
      .select('*')

    if (finalError) {
      console.log('❌ Error obteniendo usuarios finales:', finalError.message)
    } else {
      console.log('🎯 USUARIOS FINALES:')
      finalUsers.forEach(user => {
        console.log(`   - ${user.nombre}: ${user.role}`)
        if (user.nombre && user.nombre.toLowerCase().includes('esteban')) {
          if (user.role === 'developer') {
            console.log('     ✅ ¡ESTEBAN ESTÁ CONFIGURADO COMO DEVELOPER!')
          } else {
            console.log('     ⚠️ Esteban no tiene rol de developer')
          }
        }
      })
    }

  } catch (error) {
    console.error('❌ Error en la configuración:', error)
  }
}

fixEstebanRole()