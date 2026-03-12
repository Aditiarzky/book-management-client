import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { COMMENT_RETURN_TO_KEY } from '@/constants/supabase-comments'

// Komponen ini sekarang hanya bertugas redirect balik.
// Token sudah di-exchange SEBELUM router mount (di main.tsx),
// jadi di sini tinggal verifikasi session sudah ada lalu redirect.
function AuthCallback() {
  const [message, setMessage] = useState('Menyelesaikan login...')
  const isError = message.toLowerCase().includes('gagal') || message.toLowerCase().includes('tidak ditemukan')

  useEffect(() => {
    let cancelled = false
    async function finalize() {
      const { data } = await supabase.auth.getSession()
      if (cancelled) return
      if (!data.session) {
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
    <main className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isError ? (
            /* Error state */
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          ) : (
            /* Loading state */
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center relative">
              {/* Spinner ring */}
              <svg className="w-8 h-8 text-red-500 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white/80 mb-2">
          {isError ? 'Login Gagal' : 'Sedang Masuk...'}
        </h1>

        {/* Message */}
        <p className="text-sm text-gray-400 dark:text-white/30 leading-relaxed">
          {message}
        </p>

        {/* Error action */}
        {isError && (
          <button
            onClick={() => window.location.replace('/')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/50 text-sm font-medium transition-all"
          >
            Kembali ke Beranda
          </button>
        )}
      </div>
    </main>
  )
}

export default AuthCallback
