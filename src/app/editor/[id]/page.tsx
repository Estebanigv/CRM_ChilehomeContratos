import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContratoEditor from '@/components/ContratoEditor'

interface Props {
  params: { id: string }
}

export default async function EditorPage({ params }: Props) {
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

  // Verificar que el usuario pueda editar este contrato
  const { data: userProfile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  const canEdit = userProfile?.role === 'admin' || contrato.ejecutivo_id === user.id
  
  if (!canEdit) {
    redirect('/dashboard')
  }

  return (
    <ContratoEditor 
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