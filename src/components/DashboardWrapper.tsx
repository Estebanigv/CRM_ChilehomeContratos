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

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Solo ejecutar en el cliente
        if (typeof window === 'undefined') {
          return
        }

        const supabase = createClient()
        
        // Verificar autenticación
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.log('Auth error:', authError.message)
          // Si hay error de autenticación, usar usuario de prueba
          setUser({
            id: '49586172-1688-464f-82c7-0f36966a4e6c',
            email: 'demo@chilehome.cl',
            role: 'developer',
            nombre: 'Esteban'
          })
          setContratos([])
          setLoading(false)
          return
        }

        if (!authUser) {
          // Si no hay usuario autenticado, usar usuario de prueba
          setUser({
            id: '49586172-1688-464f-82c7-0f36966a4e6c',
            email: 'demo@chilehome.cl',
            role: 'developer',
            nombre: 'Esteban'
          })
          setContratos([])
          setLoading(false)
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
          role: 'developer',
          nombre: authUser.email?.split('@')[0] || 'Usuario'
        })
        
        setContratos(contratos || [])
      } catch (error) {
        console.error('Error loading dashboard:', error)
        // En caso de error, usar usuario de prueba en lugar de redirigir
        setUser({
          id: 'demo-user',
          email: 'demo@chilehome.cl',
          role: 'ejecutivo',
          nombre: 'Esteban'
        })
        setContratos([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [router])

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