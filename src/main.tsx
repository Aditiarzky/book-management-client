import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import './index.css'
import { supabase } from './lib/supabaseClient'

async function captureAuthTokenBeforeRouter() {
  const url = window.location.href
  const hash = window.location.hash        // "#access_token=..."
  const search = window.location.search    // "?code=..."

  const hasCode = new URLSearchParams(search).has('code')
  const hasAccessToken = hash.includes('access_token=')

  // Hanya jalankan kalau ini memang halaman callback OAuth
  if (!url.includes('/auth/callback')) return

  if (hasCode) {
    // PKCE flow
    await supabase.auth.exchangeCodeForSession(url)
  } else if (hasAccessToken) {
    // Implicit flow — parse hash manual lalu setSession
    const params = new URLSearchParams(hash.replace('#', ''))
    const access_token = params.get('access_token')
    const refresh_token = params.get('refresh_token')
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token })
    }
  }
  // Setelah session tersimpan, bersihkan hash dari URL tanpa reload
  // agar router tidak bingung dengan fragment
  if (hasAccessToken) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

// Panggil dan tunggu sebelum router dibuat
captureAuthTokenBeforeRouter().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  )
})
