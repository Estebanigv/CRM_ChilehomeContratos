import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Verificar que estamos en el cliente y que las variables de entorno existen
  if (typeof window === 'undefined') {
    // Si estamos en el servidor, devolver un cliente mock para evitar errores
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Server side') })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Server side') })
          }),
          order: () => Promise.resolve({ data: [], error: new Error('Server side') })
        })
      })
    } as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    throw new Error('Missing Supabase configuration')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}