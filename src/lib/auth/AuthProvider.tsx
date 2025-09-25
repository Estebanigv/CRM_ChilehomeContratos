'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User as AppUser } from '@/types'

interface AuthContextType {
  user: AppUser | null
  supabaseUser: User | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchUserProfile = async (authUser: User): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role,
        nombre: data.nombre,
        created_at: data.created_at,
        can_edit_after_validation: data.can_edit_after_validation
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      return null
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setSupabaseUser(authUser)

      if (authUser) {
        const userProfile = await fetchUserProfile(authUser)
        setUser(userProfile)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      setSupabaseUser(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user)
        setUser(userProfile)
        setSupabaseUser(data.user)
      }

      return {}
    } catch (error) {
      return { error: 'Error interno del servidor' }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSupabaseUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  useEffect(() => {
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true)

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user)
          setUser(userProfile)
          setSupabaseUser(session.user)
        } else {
          setUser(null)
          setSupabaseUser(null)
        }

        setLoading(false)
      }
    )

    // Verificar sesión inicial
    refreshUser().finally(() => setLoading(false))

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      loading,
      signOut,
      signIn,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}