import { Suspense } from 'react'
import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'
import RequestsList from '@/components/admin/RequestsList'

export const metadata: Metadata = {
  title: 'طلبات التفصيل | Custom requests',
  robots: { index: false, follow: false },
}

export default function AdminRequestsPage() {
  return (
    <AdminShell>
      <Suspense fallback={null}>
        <RequestsList />
      </Suspense>
    </AdminShell>
  )
}
