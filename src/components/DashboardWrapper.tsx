'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardClient from './DashboardClient'
import ChileHomeLoader from './ChileHomeLoader'
import { User, Contrato } from '@/types'

export default function DashboardWrapper() {
  const [user, setUser] = useState<User | null>(null)
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Verificar autenticación
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push('/login')
          return
        }

        // Obtener perfil del usuario
        const { data: userProfile } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', authUser.id)
          .single()

        // Obtener contratos
        const { data: contratos } = await supabase
          .from('contratos')
          .select(`
            *,
            clientes (*)
          `)
          .order('created_at', { ascending: false })

        setUser(userProfile || {
          id: authUser.id,
          email: authUser.email || '',
          role: 'ejecutivo',
          nombre: authUser.email?.split('@')[0] || 'Usuario'
        })
        
        setContratos(contratos || [])
      } catch (error) {
        console.error('Error loading dashboard:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router, supabase])

  if (loading) {
    return (
      <ChileHomeLoader 
        isLoading={loading} 
        onComplete={() => setLoading(false)}
      />
    )
  }

  if (!user) {
    return null
  }

  return <DashboardClient user={user} contratos={contratos} />
}