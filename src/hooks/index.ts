// Exportación centralizada de hooks

// Hooks de dashboard
export { useDateFilter, useMultipleDateFilters } from './dashboard/useDateFilter'

// Hooks de validación
export { useValidation } from '@/lib/validators'

// Hooks de autenticación
export { useAuth } from '@/contexts/AuthContext'
export { usePermissions } from '@/lib/permissions'

// Hooks de servicios
export { useCachedData } from '@/lib/cacheManager'