// Tipos comunes para toda la aplicación

export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

export interface User extends BaseEntity {
  email: string
  nombre?: string
  role?: Role
  empresa?: string
  telefono?: string
  last_login?: string
}

export type Role = 'developer' | 'admin' | 'supervisor' | 'ejecutivo' | 'transportista' | 'viewer'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DateRange {
  inicio: string
  fin: string
}

export interface FilterOptions {
  fechas?: DateRange
  ejecutivos?: string[]
  estados?: string[]
  busqueda?: string
  soloValidados?: boolean
}