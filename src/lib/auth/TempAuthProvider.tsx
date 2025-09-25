'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
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

// Usuario temporal que simula a Esteban
const TEMP_USER: AppUser = {
  id: '49586172-1688-464f-82c7-0f36966a4e6c',
  email: 'esteban@chilehome.cl',
  role: 'developer',
  nombre: 'Esteban',
  created_at: new Date().toISOString(),
  can_edit_after_validation: true
}

export function TempAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    // Simular carga y setear usuario temporal
    setTimeout(() => {
      setUser(TEMP_USER)
      setSupabaseUser({
        id: TEMP_USER.id,
        email: TEMP_USER.email,
      } as User)
      setLoading(false)
    }, 500)
  }

  const signIn = async (email: string, password: string) => {
    // Simular login exitoso
    setUser(TEMP_USER)
    setSupabaseUser({
      id: TEMP_USER.id,
      email: TEMP_USER.email,
    } as User)
    return {}
  }

  const signOut = async () => {
    setUser(null)
    setSupabaseUser(null)
  }

  useEffect(() => {
    refreshUser()
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
    throw new Error('useAuth must be used within a TempAuthProvider')
  }
  return context
}