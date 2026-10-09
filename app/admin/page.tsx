import type { Metadata } from 'next'
import AdminShell from '@/components/admin/AdminShell'
import AdminDashboard from '@/components/admin/AdminDashboard'

export const metadata: Metadata = {
  title: 'لوحة الطلبات | Requests console',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <AdminShell>
      <AdminDashboard />
    </AdminShell>
  )
}
