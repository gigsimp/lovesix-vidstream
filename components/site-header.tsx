'use client'

import Link from 'next/link'
import {
  Search,
  Home,
  Flame,
  Grid2X2,
  Newspaper,
  UserCircle,
  Menu,
  X,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { Logo } from './logo'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('admin_users')
          .select('role,is_active')
          .eq('id', user.id)
          .maybeSingle()

        if (mounted) setIsAdmin(Boolean(data?.is_active))
      } else {
        setIsAdmin(false)
      }
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null

      setUser(nextUser)
      setAvatarFailed(false)

      if (!nextUser) {
        setIsAdmin(false)
        return
      }

      setIsAdmin(false)

      // Jalankan query setelah callback auth selesai.
      setTimeout(async () => {
        if (!mounted) return

        const { data } = await supabase
          .from('admin_users')
          .select('role,is_active')
          .eq('id', nextUser.id)
          .maybeSingle()

        if (mounted) {
          setIsAdmin(Boolean(data?.is_active))
        }
      }, 0)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function close(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false)
      }
    }

    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const metadata = user?.user_metadata ?? {}

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.photo_url ||
    metadata.picture_url ||
    null

  const displayName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    user?.email?.split('@')[0] ||
    'Account'

  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'U'

  function Avatar() {
    if (avatar && !avatarFailed) {
      return (
        <img
          key={avatar}
          src={avatar}
          alt="Foto profil"
          referrerPolicy="no-referrer"
          onError={() => setAvatarFailed(true)}
          className="h-8 w-8 shrink-0 rounded-full border border-[#303036] bg-[#111113] object-cover"
        />
      )
    }

    return (
      <span
        aria-label="Foto profil"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#4a1235] bg-[#260b1b] text-sm font-bold text-[#ff168a]"
      >
        {initial}
      </span>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#26262a] bg-black/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-5 px-5">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 text-sm text-zinc-300 lg:flex xl:gap-5">
          <Link className="flex items-center gap-2 hover:text-[#ff168a]" href="/">
            <Home size={17} /> Home
          </Link>
          <Link className="flex items-center gap-2 hover:text-[#ff168a]" href="/trending">
            <Flame size={17} /> Trending
          </Link>
          <Link className="flex items-center gap-2 hover:text-[#ff168a]" href="/categories">
            <Grid2X2 size={17} /> Categories
          </Link>
          <Link className="flex items-center gap-2 hover:text-[#ff168a]" href="/magazine">
            <Newspaper size={17} /> Magazine
          </Link>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            className="rounded-full border border-transparent p-2 text-zinc-300 transition hover:border-[#303036] hover:text-[#ff168a]"
          >
            <Search size={21} />
          </button>
        </div>

        <div className="relative hidden md:block" ref={accountRef}>
          {!user ? (
            <Link
              href="/auth/login"
              className="rounded-full border border-[#34343a] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#ff168a] hover:text-[#ff168a]"
            >
              Login
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-[#2d2d32] p-1 pr-2 transition hover:border-[#ff168a]"
                aria-expanded={accountOpen}
              >
                <Avatar />
                <ChevronDown
                  size={15}
                  className={`text-zinc-500 transition ${
                    accountOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[#2b2b30] bg-[#0b0b0d] shadow-2xl">
                  <div className="border-b border-[#242429] px-4 py-3">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/settings"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-[#171116] hover:text-[#ff168a]"
                    >
                      <Settings size={17} /> Settings
                    </Link>

                    <Link
                      href={isAdmin ? '/admin' : '/dashboard'}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 hover:bg-[#171116] hover:text-[#ff168a]"
                    >
                      <LayoutDashboard size={17} />
                      {isAdmin ? 'Dashboard' : 'My Dashboard'}
                    </Link>

                    <form action="/auth/logout" method="post">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-300 hover:bg-[#171116] hover:text-[#ff168a]"
                      >
                        <LogOut size={17} /> Logout
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-1 rounded-lg p-2 text-zinc-200 transition duration-200 hover:bg-white/10 hover:text-[#ff168a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff168a] lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false)
          }}
        >
          <div className="mx-auto mt-20 w-full max-w-2xl rounded-2xl border border-[#29292d] bg-[#0b0b0d] p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Search</h2>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="rounded-lg p-1 text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form
              action="/search"
              className="flex items-center rounded-xl border border-[#303036] bg-[#111113] px-4 focus-within:border-[#ff168a]"
            >
              <Search size={17} className="shrink-0 text-zinc-500" />
              <input
                ref={searchInputRef}
                name="q"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-zinc-600"
                placeholder="Search videos, tag, or categories..."
              />
            </form>
          </div>
        </div>
      )}

      <div
        aria-hidden={!open}
        className={`absolute inset-x-0 top-full z-40 overflow-hidden border-b border-[#26262a] bg-[#050505]/[.98] shadow-2xl backdrop-blur-xl transition-[max-height,opacity,transform] duration-300 ease-out lg:hidden ${
          open
            ? 'max-h-[calc(100dvh-4rem)] translate-y-0 opacity-100'
            : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
        }`}
      >
        <nav className="max-h-[calc(100dvh-4rem)] overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-1 text-sm">
            {[
              { href: '/', label: 'Home' },
              { href: '/trending', label: 'Trending' },
              { href: '/categories', label: 'Categories' },
              { href: '/magazine', label: 'Magazine' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="rounded-lg px-3 py-3 text-zinc-100 transition-colors duration-150 hover:bg-[#171116] hover:text-[#ff168a]"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <>
                <div className="my-2 flex min-w-0 items-center gap-3 border-y border-[#242429] px-3 py-3">
                  <Avatar />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-zinc-100">{displayName}</p>
                    <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <Link href="/settings" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className="rounded-lg px-3 py-3 text-zinc-100 transition-colors hover:bg-[#171116] hover:text-[#ff168a]">Settings</Link>
                <Link href={isAdmin ? '/admin' : '/dashboard'} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className="rounded-lg px-3 py-3 text-zinc-100 transition-colors hover:bg-[#171116] hover:text-[#ff168a]">{isAdmin ? 'Dashboard' : 'My Dashboard'}</Link>
                <form action="/auth/logout" method="post" className="px-3 py-2">
                  <button type="submit" tabIndex={open ? 0 : -1} className="flex w-full items-center gap-2 py-2 text-left text-zinc-300 transition-colors hover:text-[#ff168a]">
                    <LogOut size={17} /> Logout
                  </button>
                </form>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1} className="rounded-lg px-3 py-3 text-zinc-100 transition-colors hover:bg-[#171116] hover:text-[#ff168a]">Login</Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}