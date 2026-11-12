'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, notFound, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { VideoServerSelector } from '@/components/video-server-selector'
import {
  Calendar,
  ChevronLeft,
  Hash,
  Share2,
  UserRound,
  Check,
  Heart,
} from 'lucide-react'
import type { Video } from '@/lib/types'

type VideoData = {
  id: string
  title: string
  slug: string | null
  description: string | null
  category: string | null
  thumbnail_url: string | null
  duration: string | null
  tags: string[] | null
  is_published: boolean
  created_at: string
  views: number
}

const countedVisits = new Set<string>()

export default function VideoPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  const [v, setVideo] = useState<VideoData | null>(null)
  const [servers, setServers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [missing, setMissing] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadVideo() {
      setLoading(true)
      setMissing(false)

      const { data: video, error } = await supabase
        .from('videos')
        .select(
          'id, title, slug, description, category, thumbnail_url, duration, tags, is_published, created_at, views',
        )
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (cancelled) return

      if (error || !video) {
        setMissing(true)
        setLoading(false)
        return
      }

      setVideo(video as VideoData)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      setUserId(user?.id ?? null)

      if (user) {
        const { data: favorite, error: favoriteLoadError } =
          await supabase
            .from('video_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('video_id', video.id)
            .maybeSingle()

        if (!cancelled) {
          if (favoriteLoadError) {
            console.error(
              'Gagal memuat status favorite:',
              favoriteLoadError.message,
            )
          }
          setIsFavorite(Boolean(favorite))
        }
      } else {
        setIsFavorite(false)
      }

      if (!countedVisits.has(video.id)) {
        countedVisits.add(video.id)

        const { data: newViews, error: viewsError } =
          await supabase.rpc('increment_video_views', {
            p_video_id: video.id,
          })

        if (viewsError) {
          countedVisits.delete(video.id)
          console.error('Gagal menambah views:', viewsError.message)
        } else if (!cancelled && newViews != null) {
          setVideo((current) =>
            current
              ? { ...current, views: Number(newViews) }
              : current,
          )
        }
      }

      const { data: videoServers, error: serversError } =
        await supabase
          .from('video_servers')
          .select('id, server_name, server_url, sort_order, is_active')
          .eq('video_id', video.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })

      if (cancelled) return

      if (serversError) {
        console.error(
          'Gagal mengambil server video:',
          serversError.message,
        )
      }

      setServers(videoServers ?? [])
      setLoading(false)
    }

    void loadVideo()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      setUserId(nextUserId)

      if (!nextUserId) {
        setIsFavorite(false)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [slug])

  async function handleFavorite() {
    if (!v || favoriteLoading) return

    if (!userId) {
      router.push(`/auth/login?next=${encodeURIComponent(`/video/${slug}`)}`)
      return
    }

    setFavoriteLoading(true)
    setFavoriteError('')

    const supabase = createClient()

    if (isFavorite) {
      const { error } = await supabase
        .from('video_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('video_id', v.id)

      if (error) {
        setFavoriteError('Gagal menghapus favorite. Coba lagi.')
        console.error('Gagal menghapus favorite:', error.message)
      } else {
        setIsFavorite(false)
      }
    } else {
      const { error } = await supabase
        .from('video_favorites')
        .insert({
          user_id: userId,
          video_id: v.id,
        })

      if (error) {
        // Jika sudah ada, sinkronkan status tanpa membuat duplikat.
        if (error.code === '23505') {
          setIsFavorite(true)
        } else {
          setFavoriteError('Gagal menyimpan favorite. Coba lagi.')
          console.error('Gagal menyimpan favorite:', error.message)
        }
      } else {
        setIsFavorite(true)
      }
    }

    setFavoriteLoading(false)
  }

  async function handleShare() {
    const url = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: v?.title ?? document.title,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        window.prompt('Salin link video ini:', url)
      }
    }
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="flex min-h-[60vh] items-center justify-center text-sm text-zinc-400">
          Memuat video...
        </main>
        <SiteFooter />
      </>
    )
  }

  if (missing || !v) notFound()

  const date = new Date(v.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const currentVideo: Video = {
    id: v.id,
    title: v.title,
    slug: v.slug ?? '',
    description: v.description ?? null,
    video_url: servers[0]?.server_url || '',
    thumbnail_url: v.thumbnail_url ?? null,
    duration: v.duration == null ? '' : String(v.duration),
    views: Number(v.views ?? 0),
    created_at: v.created_at,
    category_id: null,
    creator_name: null,
    creator_avatar: null,
    category_name: v.category ?? null,
    is_published: v.is_published,
    tags: Array.isArray(v.tags) ? v.tags : [],
  }

  const tags = [
    ...new Set(
      (Array.isArray(v.tags) ? v.tags : [])
        .filter(
          (tag): tag is string =>
            typeof tag === 'string' && tag.trim().length > 0,
        )
        .map((tag) => tag.trim()),
    ),
  ]

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 pt-4 sm:px-5 lg:px-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ChevronLeft size={16} />
          Kembali
        </Link>

        <section className="grid min-w-0 items-stretch gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.9fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            {servers.length > 0 ? (
              <VideoServerSelector
                videoId={currentVideo.id}
                poster={currentVideo.thumbnail_url}
                servers={servers}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-[#25252b] bg-black text-sm text-zinc-500">
                Video server URL belum tersedia.
              </div>
            )}
          </div>

          <aside className="flex min-w-0 flex-col rounded-xl border border-[#242429] bg-[#090909] p-4 sm:p-5">
            <span className="inline-flex w-fit rounded-full border border-[#4a1235] bg-[#210817] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#ff168a]">
              {v.category || 'Video'}
            </span>

            <h1 className="mt-4 break-words text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              {v.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#260b1b] text-[#ff168a]">
                  <UserRound size={17} />
                </span>
                LOVE6
              </span>

              <span className="text-zinc-700">·</span>

              <span className="flex items-center gap-1.5">
                <Calendar size={15} />
                {date}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleFavorite}
                disabled={favoriteLoading}
                aria-pressed={isFavorite}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
                  isFavorite
                    ? 'border-[#ff168a] bg-[#ff168a]/10 text-[#ff4eaa]'
                    : 'border-[#29292f] text-zinc-300 hover:border-[#ff168a] hover:text-[#ff4eaa]'
                }`}
              >
                <Heart
                  size={17}
                  className={isFavorite ? 'fill-[#ff168a] text-[#ff168a]' : ''}
                />
                {favoriteLoading
                  ? 'Menyimpan...'
                  : isFavorite
                    ? 'Favorited'
                    : 'Favorite'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#29292f] px-4 py-2 text-sm text-zinc-300 transition hover:border-[#ff168a] hover:text-[#ff168a]"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Link tersalin!' : 'Share'}
              </button>
            </div>

            {favoriteError && (
              <p role="alert" className="mt-2 text-sm text-red-400">
                {favoriteError}
              </p>
            )}

            {!userId && (
              <p className="mt-2 text-xs text-zinc-500">
                Login untuk menyimpan video ke favorit.
              </p>
            )}

            {v.description && (
              <>
                <div className="my-4 border-t border-[#26262b]" />
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">
                  {v.description}
                </p>
              </>
            )}

            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.toLowerCase()}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    aria-label={`Cari video dengan tag ${tag}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#29292f] bg-[#111114] px-3 py-1.5 text-xs text-zinc-300 transition hover:border-[#ff168a] hover:bg-[#ff168a]/10 hover:text-[#ff4eaa]"
                  >
                    <Hash size={12} className="text-[#ff168a]" />
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}