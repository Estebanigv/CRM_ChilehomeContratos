// Exportación centralizada de servicios
export { crmService, CRMService } from './crm/crmService'
export { whatsappService, WhatsAppService } from './whatsapp/whatsappService'

// Re-exportar utilidades de servicios
export { cacheManager } from '@/lib/cacheManager'
export { ExcelExporter } from '@/lib/excelExporter'
export { ReportGenerator } from '@/lib/reportGenerator'
export { CRMMetrics } from '@/lib/crmMetrics'
export { ChileanValidators } from '@/lib/validators'