'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { Logo } from '@/components/logo'
import { SiteFooter } from '@/components/site-footer'

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (error) {
          setError(error.message)
        } else {
          router.push('/')
          router.refresh()
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        })

        if (error) {
          setError(error.message)
        } else if (data.session) {
          router.push('/')
          router.refresh()
        } else {
          setMessage(
            'Account created. Check your email to confirm your account, then log in.'
          )
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function google() {
    setGoogleLoading(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch {
      setError('Unable to connect to Google. Please try again.')
      setGoogleLoading(false)
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'login' ? 'signup' : 'login'))
    setError('')
    setMessage('')
  }

  return (
    <>
      <main className="flex min-h-screen items-center justify-center bg-black px-5 py-10">
        <form
          onSubmit={submit}
          className="glass pink-glow w-full max-w-md rounded-2xl p-7 sm:p-8"
        >
          <Logo />

          <h1 className="mt-8 text-2xl font-bold">
            {mode === 'login'
              ? 'Welcome back'
              : 'Create your LOVE6 account'}
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            {mode === 'login'
              ? 'Sign in to continue to LOVE6.'
              : 'Join LOVE6 and keep your account in one place.'}
          </p>

          <button
            type="button"
            onClick={google}
            disabled={googleLoading}
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg border border-[#303036] bg-[#101013] py-3 font-semibold transition hover:border-[#ff168a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon />
            {googleLoading
              ? 'Connecting...'
              : `${mode === 'login' ? 'Continue' : 'Sign up'} with Google`}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-zinc-600">
            <span className="h-px flex-1 bg-[#242429]" />
            <span>OR</span>
            <span className="h-px flex-1 bg-[#242429]" />
          </div>

          <div className="grid gap-4">
            {mode === 'signup' && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder="Display name"
                className="w-full rounded-lg border border-[#29292d] bg-black px-4 py-3 outline-none transition focus:border-[#ff168a]"
              />
            )}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              className="w-full rounded-lg border border-[#29292d] bg-black px-4 py-3 outline-none transition focus:border-[#ff168a]"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={6}
              required
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              placeholder="Password"
              className="w-full rounded-lg border border-[#29292d] bg-black px-4 py-3 outline-none transition focus:border-[#ff168a]"
            />

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            {message && (
              <p role="status" className="text-sm text-green-400">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#ff168a] py-3 font-bold text-black transition hover:bg-[#ff3b9e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </div>

          <button
            type="button"
            onClick={toggleMode}
            className="mt-6 w-full text-sm text-zinc-400 transition hover:text-[#ff168a]"
          >
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </form>
      </main>

      <SiteFooter />
    </>
  )
}