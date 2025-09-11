import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContratoPrevisualizador from '@/components/ContratoPrevisualizador'

interface Props {
  params: { id: string }
}

export default async function PrevisualizadorPage({ params }: Props) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener el contrato con información del cliente
  const { data: contrato } = await supabase
    .from('contratos')
    .select(`
      *,
      clientes (*)
    `)
    .eq('id', params.id)
    .single()

  if (!contrato) {
    redirect('/dashboard')
  }

  // Obtener información del usuario
  const { data: userProfile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ContratoPrevisualizador 
      contrato={contrato}
      user={userProfile || { 
        id: user.id, 
        email: user.email || '', 
        role: 'ejecutivo',
        nombre: user.email?.split('@')[0] || 'Usuario'
      }}
    />
  )
}