'use client'

import { useAuth } from '@/lib/auth/TempAuthProvider'
import DashboardClient from './DashboardClient'
import ChileHomeLoader from './ChileHomeLoader'

export default function DashboardWrapper() {
  const { user, loading } = useAuth()

  if (loading) {
    return <ChileHomeLoader />
  }

  if (!user) {
    return <ChileHomeLoader />
  }

  return (
    <DashboardClient
      user={user}
      contratos={[]}
      loading={false}
      onRefresh={() => window.location.reload()}
    />
  )
}