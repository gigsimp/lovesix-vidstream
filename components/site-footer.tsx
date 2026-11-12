 'use client'

import { Logo } from '@/components/logo'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[#222] bg-[#050505] px-5 py-6">
      <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-5 sm:flex-row">
        {/* Logo kiri */}
        <a href="/" aria-label="LOVE6 Home" className="shrink-0">
          <Logo small />
        </a>

        {/* Sosial media tengah */}
        <div className="flex items-center justify-center gap-5">
          <a
            href="https://www.instagram.com/love6.magz/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-zinc-500 transition hover:text-[#ff168a]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
            </svg>
          </a>

          <a
            href="https://x.com/lovesixvid"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="text-lg font-bold text-zinc-500 transition hover:text-[#ff168a]"
          >
            𝕏
          </a>
        </div>

        {/* Copyright kanan */}
        <p className="text-center text-xs text-zinc-500 sm:text-right">
          © {new Date().getFullYear()} LOVE6. All Rights Reserved.
        </p>
      </div>
    </footer>
  )
}