import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CrearContratoClient from '@/components/CrearContratoClient'

export const metadata = {
  title: 'Crear Nuevo Contrato - ChileHome',
}

export default async function CrearContratoPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener información del usuario desde la base de datos
  const { data: userProfile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <CrearContratoClient 
      user={userProfile || { 
        id: user.id, 
        email: user.email || '', 
        role: 'ejecutivo',
        nombre: user.email?.split('@')[0] || 'Usuario'
      }} 
    />
  )
}