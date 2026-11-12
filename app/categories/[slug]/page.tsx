import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { SiteHeader } from '@/components/site-header'
import { VideoCard } from '@/components/video-card'
import { Pagination } from '@/components/pagination'
import type { Video } from '@/lib/types'
import { SiteFooter } from '@/components/site-footer'

const PAGE_SIZE = 32
export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params
  const page = Math.max(1, Number((await searchParams).page || '1') || 1)
  const s = await createClient()
  const { data: category } = await s.from('categories').select('id,name,slug,description').eq('slug', slug).single()
  if (!category) notFound()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data, count } = await s.from('videos').select('*,profiles!videos_creator_id_fkey(display_name,avatar_url),categories!videos_category_id_fkey(name)', { count: 'exact' }).eq('is_published', true).eq('category_id', category.id).order('created_at', { ascending: false }).range(from, to)
  const videos = (data || []).map((v: any) => ({ ...v, creator_name: v.profiles?.display_name, creator_avatar: v.profiles?.avatar_url, category_name: v.categories?.name })) as Video[]
  return <><SiteHeader/><main className="mx-auto max-w-[1500px] px-5 py-8"><h1 className="text-3xl font-bold">{category.name}</h1><p className="mt-2 text-sm text-zinc-500">{category.description || `Videos in ${category.name}.`}</p><div className="mt-7 grid grid-cols-1 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-7 md:grid-cols-2 lg:grid-cols-4">{videos.map(v => <VideoCard key={v.id} video={v}/>)}</div>{!videos.length && <p className="py-20 text-center text-zinc-500">Video Not Found</p>}<Pagination page={page} totalPages={Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))} basePath={`/categories/${category.slug}`}/></main><SiteFooter/></>
}
