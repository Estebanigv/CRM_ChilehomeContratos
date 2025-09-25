interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  /**
   * Obtiene datos del cache si están disponibles y no han expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Cache expirado, eliminar entrada
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Almacena datos en el cache
   */
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = ttlMinutes ? ttlMinutes * 60 * 1000 : this.DEFAULT_TTL

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Invalida una entrada específica del cache
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalida todas las entradas que coincidan con un patrón
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Limpia todo el cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Obtiene el tamaño actual del cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Helper para hacer fetch con cache
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMinutes?: number
  ): Promise<T> {
    // Intentar obtener del cache primero
    const cached = this.get<T>(key)
    if (cached !== null) {
      console.log(`📦 Cache HIT: ${key}`)
      return cached
    }

    console.log(`❌ Cache MISS: ${key}`)

    // Hacer fetch y guardar en cache
    const data = await fetcher()
    this.set(key, data, ttlMinutes)

    return data
  }
}

// Singleton instance
const cacheManager = new CacheManager()

// Auto-limpieza cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup()
    console.log(`🧹 Cache cleanup: ${cacheManager.size()} entries remaining`)
  }, 10 * 60 * 1000)
}

export { cacheManager, CacheManager }

// Helper hooks para React
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: any[] = [],
  ttlMinutes?: number
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        setLoading(true)
        const result = await cacheManager.fetchWithCache(key, fetcher, ttlMinutes)

        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Error desconocido'))
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, deps)

  return { data, loading, error, refetch: () => cacheManager.invalidate(key) }
}

import React from 'react'