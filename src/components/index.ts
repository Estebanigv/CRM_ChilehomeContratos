// Exportación centralizada de componentes

// Componentes compartidos
export { default as ChileHomeLoader } from './shared/ChileHomeLoader'
export { default as DateRangeSelector } from './shared/DateRangeSelector'
export { default as CustomDatePicker } from './shared/CustomDatePicker'
export { LazyLoadWrapper, IntersectionLazyLoad } from './shared/LazyLoadWrapper'
export * from './shared'

// Componentes de dashboard
export { default as DashboardClient } from './dashboard/DashboardClient'
export * from './dashboard'

// Componentes de CRM
export { default as CRMDashboard } from './crm/CRMDashboard'
export * from './crm'

// Componentes de layout
export { default as Sidebar } from './layout/Sidebar'
export * from './layout'

// Componentes de formularios
export { default as ContratoEditor } from './ContratoEditor'
export { default as CrearContratoClient } from './CrearContratoClient'

// Otros componentes importantes
export { default as ContratoPrevisualizador } from './ContratoPrevisualizador'
export { default as ConfiguracionMensajes } from './ConfiguracionMensajes'
export { default as FichasEliminadas } from './FichasEliminadas'
export { default as ListadoPlanos } from './ListadoPlanos'