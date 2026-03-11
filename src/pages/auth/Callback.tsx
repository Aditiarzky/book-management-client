import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { COMMENT_RETURN_TO_KEY } from '@/constants/supabase-comments'

// Komponen ini sekarang hanya bertugas redirect balik.
// Token sudah di-exchange SEBELUM router mount (di main.tsx),
// jadi di sini tinggal verifikasi session sudah ada lalu redirect.

function AuthCallback() {
  const [message, setMessage] = useState('Menyelesaikan login...')

  useEffect(() => {
    let cancelled = false

    async function finalize() {
      // Tunggu sebentar kalau exchangeCodeForSession di main.tsx masih jalan
      // (race condition kecil saat code flow)
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (!data.session) {
        // Fallback: coba sekali lagi setelah delay kecil
        await new Promise((r) => setTimeout(r, 500))
        const { data: retry } = await supabase.auth.getSession()
        if (cancelled) return
        if (!retry.session) {
          setMessage('Login gagal: session tidak ditemukan setelah redirect.')
          return
        }
      }

      const returnTo = localStorage.getItem(COMMENT_RETURN_TO_KEY) ?? '/'
      localStorage.removeItem(COMMENT_RETURN_TO_KEY)
      window.location.replace(returnTo)
    }

    finalize().catch((err) => {
      if (cancelled) return
      setMessage(err instanceof Error ? err.message : 'Gagal menyelesaikan login.')
    })

    return () => { cancelled = true }
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-slate-300">{message}</p>
      </div>
    </main>
  )
}

export default AuthCallback
