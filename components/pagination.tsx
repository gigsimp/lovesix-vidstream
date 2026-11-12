import Link from 'next/link'

export function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  const raw: number[] = []
  const add = (n: number) => { if (n >= 1 && n <= totalPages && !raw.includes(n)) raw.push(n) }
  for (let n = 1; n <= Math.min(4, totalPages); n++) add(n)
  for (let n = page - 2; n <= page + 2; n++) add(n)
  for (let n = Math.max(1, totalPages - 1); n <= totalPages; n++) add(n)
  raw.sort((a, b) => a - b)

  const items: (number | 'dots')[] = []
  raw.forEach((n, i) => {
    const prev = raw[i - 1]
    if (prev && n - prev > 1) items.push('dots')
    items.push(n)
  })

  return <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
    <Link aria-disabled={page <= 1} className={`rounded-lg border px-3 py-2 text-sm ${page <= 1 ? 'pointer-events-none border-[#202024] text-zinc-700' : 'border-[#303036] text-zinc-300 hover:border-[#ff168a]'}`} href={`${basePath}?page=${Math.max(1, page - 1)}`}>← PREV</Link>
    {items.map((n, i) => n === 'dots' ? <span key={`dots-${i}`} className="px-1 text-zinc-600">…</span> : <Link key={n} href={`${basePath}?page=${n}`} className={`min-w-9 rounded-lg border px-3 py-2 text-center text-sm ${n === page ? 'border-[#ff168a] bg-[#ff168a] font-bold text-black' : 'border-[#303036] text-zinc-300 hover:border-[#ff168a]'}`}>{n}</Link>)}
    <Link aria-disabled={page >= totalPages} className={`rounded-lg border px-3 py-2 text-sm ${page >= totalPages ? 'pointer-events-none border-[#202024] text-zinc-700' : 'border-[#303036] text-zinc-300 hover:border-[#ff168a]'}`} href={`${basePath}?page=${Math.min(totalPages, page + 1)}`}>NEXT →</Link>
  </nav>
}
