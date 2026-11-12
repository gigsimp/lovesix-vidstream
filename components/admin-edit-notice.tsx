'use client'

import { useRouter } from 'next/navigation'
import AdminNotice from '@/components/admin-notice'

export function AdminEditNotice({ saved }: { saved: boolean }) {
  const router = useRouter()
  if (!saved) return null
  return <AdminNotice open type="success" title="Video Berhasil Diupdate" message="Perubahan video berhasil disimpan." onClose={() => router.push('/admin/videos')} />
}
