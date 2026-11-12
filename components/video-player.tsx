'use client'

import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'

function getPlayerUrl(rawUrl: string) {
  const value = rawUrl.trim()

  if (!value) return ''

  try {
    const parsed = new URL(value)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }

    const host = parsed.hostname.toLowerCase()
    const path = parsed.pathname

    // Vidara: ubah URL video ke URL player.
    if (
      ['vidara.to', 'www.vidara.to'].includes(host) &&
      /^\/v\/[^/]+\/?$/.test(path)
    ) {
      const id = path.split('/').filter(Boolean).pop()
      return id ? `https://vidara.to/${id}` : ''
    }

    // LuluStream: ubah URL download ke URL embed.
    if (
      ['lulust.com', 'www.lulust.com'].includes(host) &&
      /^\/d\/[^/]+\/?$/.test(path)
    ) {
      const id = path.split('/').filter(Boolean).pop()
      return id ? `https://lulust.com/e/${id}` : ''
    }

    // URL provider lainnya digunakan apa adanya.
    return value
  } catch {
    return ''
  }
}

function isDirectMedia(url: string) {
  try {
    const parsed = new URL(url)

    return /\.(mp4|webm|ogg)$/i.test(parsed.pathname)
  } catch {
    return false
  }
}

export function VideoPlayer({
  videoId,
  url,
  poster,
}: {
  videoId: string
  url: string
  poster?: string | null
}) {
  const [started, setStarted] = useState(false)

  const playerUrl = useMemo(() => getPlayerUrl(url), [url])
  const direct = useMemo(
    () => (playerUrl ? isDirectMedia(playerUrl) : false),
    [playerUrl],
  )

  useEffect(() => {
    setStarted(false)
  }, [videoId, playerUrl])

  if (!playerUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-[#25252b] bg-black p-6 text-center text-sm text-zinc-400">
        URL video tidak valid. Periksa Server URL di Admin.
      </div>
    )
  }

  return (
    <div className="relative min-w-0 overflow-hidden rounded-xl border border-[#25252b] bg-black shadow-[0_15px_45px_rgba(0,0,0,.3)]">
      {direct ? (
        <div className="relative">
          <video
            controls
            playsInline
            poster={poster || undefined}
            className="block aspect-video w-full bg-black object-contain"
            src={playerUrl}
            preload="metadata"
            onPlay={() => setStarted(true)}
          />

          {!started && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#ff168a] bg-black/60 text-[#ff168a] shadow-[0_0_30px_rgba(255,22,138,.2)] sm:h-16 sm:w-16">
                <Play
                  size={25}
                  fill="currentColor"
                  className="ml-1"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <iframe
          key={`${videoId}-${playerUrl}`}
          src={playerUrl}
          title="LOVE6 video player"
          className="block aspect-video w-full border-0 bg-black"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  )
}