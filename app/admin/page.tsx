import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { formatViews } from '@/lib/utils'
import { Plus, Eye, Video as VideoIcon, Users } from 'lucide-react'

export default async function Admin() {
  const s = await createClient()
  const [{ count: videos }, { data: views }, { count: users }, { count: published }, { data: recent }] = await Promise.all([
    s.from('videos').select('*', { count: 'exact', head: true }),
    s.from('videos').select('views'),
    s.from('profiles').select('*', { count: 'exact', head: true }),
    s.from('videos').select('*', { count: 'exact', head: true }).eq('is_published', true),
    s.from('videos').select('id,title,thumbnail_url,views,is_published,created_at').order('created_at', { ascending: false }).limit(8),
  ])
  const totalViews = (views || []).reduce((a: number, v: any) => a + Number(v.views || 0), 0)
  return <div><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-zinc-500">Manage your LOVE6 content.</p></div><Link href="/admin/new" className="flex items-center gap-2 rounded-lg bg-[#ff168a] px-4 py-2.5 text-sm font-bold text-black"><Plus size={17}/>Add Video</Link></div><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<VideoIcon/>} label="Total Videos" value={videos || 0}/><Stat icon={<Eye/>} label="Total Views" value={formatViews(totalViews)}/><Stat icon={<Plus/>} label="Published" value={published || 0}/><Stat icon={<Users/>} label="Creators" value={users || 0}/></div><section className="glass mt-7 rounded-xl p-5"><h2 className="text-xl font-bold">Recent Videos</h2><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-[#29292d] text-zinc-500"><tr><th className="p-3">Video</th><th>Views</th><th>Status</th><th>Date</th><th/></tr></thead><tbody>{(recent || []).map(v => <tr key={v.id} className="border-b border-[#19191c]"><td className="p-3"><div className="flex items-center gap-3"><img src={v.thumbnail_url || '/placeholder.svg'} className="h-12 w-20 rounded object-cover"/><span>{v.title}</span></div></td><td>{formatViews(v.views)}</td><td><span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">{v.is_published ? 'Published' : 'Draft'}</span></td><td className="text-zinc-500">{new Date(v.created_at).toLocaleDateString()}</td><td><Link href={`/admin/edit/${v.id}`} className="text-[#ff168a]">Edit</Link></td></tr>)}</tbody></table>{!recent?.length && <p className="py-10 text-center text-sm text-zinc-600">No videos yet. Add your first Vidara video.</p>}</div></section></div>
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) { return <div className="glass rounded-xl p-5"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#ff168a]/10 text-[#ff168a]">{icon}</div><p className="text-sm text-zinc-500">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div> }
