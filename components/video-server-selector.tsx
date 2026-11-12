'use client'

import { useState } from 'react'
import { VideoPlayer } from '@/components/video-player'

type VideoServer = {
  id: string
  server_name: string
  server_url: string
}

type Props = {
  videoId: string
  poster?: string | null
  servers: VideoServer[]
}

export function VideoServerSelector({
  videoId,
  poster,
  servers,
}: Props) {
  const [selectedServer, setSelectedServer] = useState(0)
  const currentServer = servers[selectedServer]

  if (!currentServer) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-[#25252b] bg-black text-sm text-zinc-500">
        Video server URL belum tersedia.
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {/* VIDEO PLAYER */}
      <div className="min-w-0 overflow-hidden rounded-xl">
        <VideoPlayer
          key={`${videoId}-${currentServer.id}`}
          videoId={videoId}
          url={currentServer.server_url}
          poster={poster}
        />
      </div>

      {/* PILIH SERVER */}
      {servers.length > 0 && (
        <div className="rounded-xl border border-[#242429] bg-[#090909] px-4 py-3 sm:px-5">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Pilih Server
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {servers.map((server, index) => {
              const active = index === selectedServer

              return (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => setSelectedServer(index)}
                  aria-pressed={active}
                  className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-5 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-[#ff168a] bg-[#ff168a]/10 text-[#ff168a] shadow-[0_0_15px_rgba(255,22,138,.08)]'
                      : 'border-[#292929] bg-[#111] text-zinc-400 hover:border-[#555] hover:text-white'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active ? 'bg-[#ff168a]' : 'border-2 border-zinc-600'
                    }`}
                  />
                  {server.server_name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}