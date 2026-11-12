
'use client'

import { useState } from 'react'

type Server = {
  id: string
  server_name: string
  server_url: string
  sort_order: number
  is_active: boolean
}

export function AdminServerFields({
  servers,
}: {
  servers: Server[]
}) {
  const [items, setItems] = useState(
    servers.map((server) => ({
      ...server,
      key: server.id,
    }))
  )

  function addServer() {
    setItems((current) => [
      ...current,
      {
        id: '',
        server_name: '',
        server_url: '',
        sort_order: current.length,
        is_active: true,
        key: `new-${Date.now()}-${current.length}`,
      },
    ])
  }

  function removeServer(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="grid gap-4">
      {items.map((server, index) => (
        <div
          key={server.key}
          className="grid gap-3 rounded-lg border border-[#29292d] p-4"
        >
          <input
            type="hidden"
            name="server_id"
            value={server.id}
          />

          <label className="grid gap-2 text-sm">
            <span>Server {index + 1} Name</span>
            <input
              name="server_name"
              defaultValue={server.server_name}
              placeholder="Contoh: Vidara atau LuluStream"
              className="rounded-lg border border-[#29292d] bg-black p-3 outline-none focus:border-[#ff168a]"
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span>Server URL</span>
            <input
              name="server_url"
              defaultValue={server.server_url}
              placeholder="https://..."
              className="rounded-lg border border-[#29292d] bg-black p-3 outline-none focus:border-[#ff168a]"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="server_active"
              value={String(index)}
              defaultChecked={server.is_active}
              className="accent-[#ff168a]"
            />
            Active
          </label>

          <button
            type="button"
            onClick={() => removeServer(index)}
            className="w-fit text-sm text-red-400 hover:text-red-300"
          >
            Remove Server
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addServer}
        className="w-fit rounded-lg border border-[#ff168a] px-4 py-2 text-sm font-semibold text-[#ff168a] hover:bg-[#ff168a]/10"
      >
        + Add Server
      </button>
    </div>
  )
}