import CRMSyncManager from '@/components/crm/CRMSyncManager'

export default function CRMSyncPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <CRMSyncManager />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Sincronización CRM - ChileHome',
  description: 'Gestión de sincronización de datos con SmartCRM'
}