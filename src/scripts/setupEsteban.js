// Script para configurar a Esteban como developer en la base de datos
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://tueohomkpzjvojjwwydo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZW9ob21rcHpqdm9qand3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM4MDc1NSwiZXhwIjoyMDcyOTU2NzU1fQ.tkw1xaIlE3nhqALZqeR6X_n3-kOZQpCME2XouoKogJI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupEsteban() {
  console.log('🔧 Configurando a Esteban como Developer del Sistema...')

  try {
    // 1. Buscar si ya existe Esteban
    console.log('1️⃣ Buscando usuario Esteban...')
    const { data: existingUser, error: searchError } = await supabase
      .from('usuarios')
      .select('*')
      .or('email.ilike.%esteban%,nombre.ilike.%Esteban%')
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      console.log('ℹ️ Error buscando usuario:', searchError.message)
    }

    if (existingUser) {
      console.log('✅ Usuario encontrado:', existingUser)

      // Actualizar rol a developer
      const { data: updatedUser, error: updateError } = await supabase
        .from('usuarios')
        .update({
          role: 'developer',
          can_edit_after_validation: true
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.log('❌ Error actualizando usuario:', updateError.message)
      } else {
        console.log('✅ Usuario actualizado a Developer:', updatedUser)
      }
    } else {
      console.log('2️⃣ Usuario no encontrado, creando usuario Esteban...')

      // Crear usuario Esteban
      const { data: newUser, error: createError } = await supabase
        .from('usuarios')
        .insert({
          id: 'demo-user',
          email: 'esteban@chilehome.cl',
          nombre: 'Esteban',
          role: 'developer',
          can_edit_after_validation: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.log('❌ Error creando usuario:', createError.message)
      } else {
        console.log('✅ Usuario Esteban creado como Developer:', newUser)
      }
    }

    // 3. Verificar configuración final
    console.log('3️⃣ Verificando configuración final...')
    const { data: finalUser, error: finalError } = await supabase
      .from('usuarios')
      .select('*')
      .or('email.ilike.%esteban%,nombre.ilike.%Esteban%')
      .single()

    if (finalError) {
      console.log('❌ Error verificando usuario final:', finalError.message)
    } else {
      console.log('🎯 CONFIGURACIÓN FINAL:')
      console.log('   👤 Nombre:', finalUser.nombre)
      console.log('   📧 Email:', finalUser.email)
      console.log('   🔧 Rol:', finalUser.role)
      console.log('   ✏️ Puede editar después de validación:', finalUser.can_edit_after_validation)
      console.log('')

      if (finalUser.role === 'developer') {
        console.log('✅ ¡ÉXITO! Esteban está configurado como Developer del Sistema')
        console.log('🚀 Ahora debería mostrarse como "Desarrollador del Sistema" en la interfaz')
      } else {
        console.log('⚠️ El usuario no tiene rol de developer. Rol actual:', finalUser.role)
      }
    }

  } catch (error) {
    console.error('❌ Error en la configuración:', error)
  }
}

setupEsteban()