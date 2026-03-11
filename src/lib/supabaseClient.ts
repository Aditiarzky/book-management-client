import { createClient } from '@supabase/supabase-js'

// Satu instance yang dipakai di SELURUH aplikasi — callback, komponen komentar, dll.
// Ini kunci agar session yang di-exchange di /auth/callback langsung terbaca
// oleh komponen lain tanpa perlu redirect ulang atau reload.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Wajib: baca token dari URL saat redirect balik dari OAuth
    flowType: 'pkce',
  },
})
