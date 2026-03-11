/** eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient' // sesuaikan path
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Link2,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Reply,
  Send,
  Shield,
  Trash2,
  User2,
} from 'lucide-react'
import { COMMENT_RETURN_TO_KEY } from '@/constants/supabase-comments'
import { Button } from './ui/button'

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'moderator'
  is_blocked: boolean
}

type CommentItem = {
  id: string
  author: string
  content: string
  created_at: string
  slug?: string
  parent_id: string | null
  user_id: string | null
  profiles?: Profile | Profile[] | null
}

type CommentEmbedProps = {
  site: string
  slug: string
  title?: string
}

type SupabaseUser = {
  id: string
  email?: string | null
  user_metadata?: {
    full_name?: string | null
    avatar_url?: string | null
    picture?: string | null
    [key: string]: any
  }
  [key: string]: any
}

const PAGE_SIZE = 10

function getProfileValue(profile?: Profile | Profile[] | null): Profile | null {
  if (!profile) return null
  return Array.isArray(profile) ? profile[0] ?? null : profile
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function getInitials(name: string) {
  if (!name) return '?'
  const cleanName = name.trim()
  const parts = cleanName.split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return cleanName.substring(0, 2).toUpperCase()
}

function Avatar({ src, name, size = 'md' }: { src?: string | null; name: string; size?: 'sm' | 'md' }) {
  const [imgFailed, setImgFailed] = useState(false)
  const sizeClasses = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'

  if (src && !imgFailed) {
    return (
      <img src={src} alt={name} onError={() => setImgFailed(true)}
        className={`${sizeClasses} rounded-full object-cover border border-zinc-200 dark:border-zinc-800`}
        referrerPolicy="no-referrer" />
    )
  }
  return (
    <div className={`${sizeClasses} rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400`} title={name}>
      {getInitials(name)}
    </div>
  )
}

function Spoiler({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span onClick={() => setRevealed(!revealed)}
      className="inline-flex cursor-pointer rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300"
      title={revealed ? 'Klik untuk menyembunyikan' : 'Klik untuk melihat spoiler'}>
      <span className={`transition-all duration-300 ${revealed ? 'blur-none opacity-100' : 'blur-sm select-none opacity-60'}`}>{text}</span>
    </span>
  )
}

function renderInline(input: string): ReactNode[] {
  const parts = input.split(/(\|\|[^|]+\|\||!?\[[^\]]*\]\([^\)]+\)|https?:\/\/\S+)/g)
  return parts.filter(Boolean).map((part, index) => {
    if (/^\|\|[^|]+\|\|$/.test(part)) return <Spoiler key={index} text={part.slice(2, -2)} />
    const imageMatch = part.match(/^!\[([^\]]*)\]\(([^\)]+)\)$/)
    if (imageMatch) {
      const src = imageMatch[2].trim()
      if (isValidHttpUrl(src)) return <img key={index} src={src} alt={imageMatch[1] || 'gambar komentar'} className="my-3 max-h-72 w-auto rounded-xl border border-zinc-200 dark:border-zinc-800" loading="lazy" />
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
    if (linkMatch && isValidHttpUrl(linkMatch[2].trim())) {
      return <a key={index} href={linkMatch[2].trim()} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2">{linkMatch[1]}</a>
    }
    if (/^https?:\/\//.test(part) && isValidHttpUrl(part)) {
      return <a key={index} href={part} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2">{part}</a>
    }
    return <span key={index}>{part}</span>
  })
}

function renderCommentContent(content: string) {
  return content.split('\n').map((line, idx, arr) => (
    <div key={`${line}-${idx}`}>{renderInline(line)}{idx < arr.length - 1 ? <br /> : null}</div>
  ))
}

export default function SupabaseCommentEmbed({ site, slug, title = 'Komentar' }: CommentEmbedProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState('')
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({})
  const returnToKey = COMMENT_RETURN_TO_KEY

  // Tidak perlu useRef untuk client lagi — pakai shared singleton langsung
  const channelRef = useRef<RealtimeChannel | null>(null)

  async function fetchCurrentProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_blocked')
      .eq('id', userId)
      .maybeSingle()
    setCurrentProfile(data ?? null)
  }

  async function fetchComments() {
    const { data, error: fetchError } = await supabase
      .from('comments')
      .select('id, author, content, created_at, slug, parent_id, user_id, profiles(id, full_name, avatar_url, role, is_blocked)')
      .eq('site', site)
      .eq('slug', slug)
      .order('created_at', { ascending: true })
    if (fetchError) setError(fetchError.message)
    else setComments((data ?? []) as CommentItem[])
  }

  useEffect(() => {
    let mounted = true

    async function setup() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) fetchCurrentProfile(session.user.id)

      supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) fetchCurrentProfile(session.user.id)
        else setCurrentProfile(null)
      })

      await fetchComments()

      channelRef.current = supabase
        .channel(`comments:${site}:${slug}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `site=eq.${site}` }, async () => {
          await fetchComments()
        })
        .subscribe()
    }

    setup().catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat komentar'))

    return () => {
      mounted = false
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [site, slug])

  const googleDisplayName = user?.user_metadata?.full_name ?? user?.email ?? user?.id ?? ''
  const displayName = googleDisplayName || 'Pengguna'
  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
  const isModerator = currentProfile?.role === 'moderator'
  const isBlocked = currentProfile?.is_blocked === true

  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel = comments.filter((c) => !c.parent_id)
    const replies = comments.reduce<Record<string, CommentItem[]>>((acc, c) => {
      if (!c.parent_id) return acc
      acc[c.parent_id] ??= []
      acc[c.parent_id].push(c)
      return acc
    }, {})
    return { topLevelComments: topLevel, repliesByParent: replies }
  }, [comments])

  const totalReplies = comments.length - topLevelComments.length
  const visibleTopLevelComments = topLevelComments.slice(0, visibleCount)
  const hasMoreTopLevel = topLevelComments.length > visibleCount

  useEffect(() => {
    setAuthor(user ? googleDisplayName : '')
  }, [user, googleDisplayName])

  async function handleDelete(commentId: string) {
    if (!confirm('Hapus komentar ini?')) return
    const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId)
    if (deleteError) setError(deleteError.message)
    else setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  async function handleToggleBlock(userId: string, currentStatus: boolean) {
    if (!confirm(`${currentStatus ? 'Buka blokir' : 'Blokir'} pengguna ini?`)) return
    const { error: blockError } = await supabase.from('profiles').update({ is_blocked: !currentStatus }).eq('id', userId)
    if (blockError) {
      setError(blockError.message)
    } else {
      setComments((prev) => prev.map(c => {
        const pv = getProfileValue(c.profiles)
        if (c.user_id === userId && pv) return { ...c, profiles: { ...pv, is_blocked: !currentStatus } }
        return c
      }))
    }
  }

  async function handleSignIn() {
    setAuthError('')
    setAuthLoading(true)
    try { localStorage.setItem(returnToKey, window.location.href) } catch { }
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    setAuthLoading(false)
    if (signInError) setAuthError(signInError.message)
  }

  async function handleSignOut() {
    setAuthError('')
    await supabase.auth.signOut()
  }

  function insertAtCursor(before: string, after = '') {
    const textarea = document.getElementById('comment-editor') as HTMLTextAreaElement | null
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end)
    setContent(`${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selected.length
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) { setError('Silakan masuk terlebih dahulu.'); return }
    if (isBlocked) { setError('Akun kamu diblokir.'); return }
    if (!author.trim() || !content.trim()) return

    setLoading(true)
    setError('')

    const { error: insertError, data: insertedData } = await supabase
      .from('comments')
      .insert({ site, slug, author: author.trim(), user_id: user.id, content: content.trim(), parent_id: replyTarget?.id ?? null })
      .select('id, author, content, created_at, slug, parent_id, user_id, profiles(id, full_name, avatar_url, role, is_blocked)')
      .single()

    setLoading(false)
    if (insertError) { setError(insertError.message); return }
    if (insertedData) setComments((prev) => [...prev, insertedData as CommentItem])
    setContent('')
    setReplyTarget(null)
  }

  const canDeleteComment = (comment: CommentItem) =>
    (user && comment.user_id === user.id) || isModerator

  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-6 md:p-8 text-zinc-900 dark:text-zinc-100">
      <header className="flex items-center justify-between pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-2.5">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{comments.length} komentar • {totalReplies} balasan</p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono hidden md:block">{site}/{slug}</div>
      </header>

      <div className="py-5 border-b border-zinc-200 dark:border-zinc-800">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={userAvatarUrl} name={displayName} size="sm" />
              <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                Masuk sebagai <span className="font-medium text-zinc-900 dark:text-zinc-100">{displayName}</span>
                {isModerator && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">MOD</span>}
                {isBlocked && <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold">DIBLOKIR</span>}
              </div>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <button onClick={handleSignIn} disabled={authLoading} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-3 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-70">
            {authLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengarahkan...</> : <><LogIn className="h-4 w-4" /> Masuk dengan Google</>}
          </button>
        )}
        {authError && <p className="mt-2 text-xs text-red-500">{authError}</p>}
      </div>

      <form onSubmit={handleSubmit} className="pt-6 space-y-5">
        <div>
          <label className="block text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">Nama</label>
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3">
            <User2 className="h-4 w-4 text-zinc-400" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              placeholder="Nama kamu" required disabled={!user} readOnly={!!user} />
          </div>
        </div>

        {replyTarget && (
          <div className="flex items-center justify-between rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Membalas <span className="font-medium text-blue-600 dark:text-blue-400">{replyTarget.author}</span></span>
            <button type="button" onClick={() => setReplyTarget(null)} className="hover:text-zinc-900 dark:hover:text-zinc-100">Batal</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => insertAtCursor('||', '||')} disabled={!user || isBlocked} className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"><Shield className="h-3.5 w-3.5" /> Spoiler</button>
          <button type="button" onClick={() => insertAtCursor('[teks](', ')')} disabled={!user || isBlocked} className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"><Link2 className="h-3.5 w-3.5" /> Link</button>
          <button type="button" onClick={() => insertAtCursor('![alt](', ')')} disabled={!user || isBlocked} className="flex items-center gap-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"><ImageIcon className="h-3.5 w-3.5" /> Gambar</button>
        </div>

        <textarea id="comment-editor" value={content} onChange={(e) => setContent(e.target.value)}
          className="w-full resize-y min-h-[140px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 disabled:opacity-50"
          placeholder={isBlocked ? 'Akun Anda telah diblokir.' : 'Tulis komentar di sini...'} required disabled={!user || isBlocked} />

        <Button type="submit" disabled={loading || !user || isBlocked}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="h-4 w-4" /> {replyTarget ? 'Kirim Balasan' : 'Kirim Komentar'}</>}
        </Button>
      </form>
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

      <div className="mt-8">
        {comments.length === 0 ? (
          <p className="text-center text-zinc-400 py-8">Belum ada komentar</p>
        ) : (
          visibleTopLevelComments.map((comment) => {
            const replies = repliesByParent[comment.id] ?? []
            const isOpen = !!openReplies[comment.id]
            const commentProfile = getProfileValue(comment.profiles)
            const authorName = commentProfile?.full_name || comment.author
            const authorAvatar = commentProfile?.avatar_url ?? null
            const authorRole = commentProfile?.role ?? 'user'
            const isAuthorBlocked = commentProfile?.is_blocked ?? false

            return (
              <article key={comment.id} className="py-6 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={authorAvatar} name={authorName} />
                    <div className="flex items-center gap-2">
                      <strong className={`text-sm font-medium ${isAuthorBlocked ? 'line-through text-zinc-400' : ''}`}>{authorName}</strong>
                      {authorRole === 'moderator' && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">MOD</span>}
                      {isAuthorBlocked && <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold">DIBLOKIR</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <time className="text-xs text-zinc-500 dark:text-zinc-400">
                      {new Date(comment.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </time>
                    {isModerator && comment.user_id && comment.user_id !== user?.id && (
                      <button onClick={() => handleToggleBlock(comment.user_id!, isAuthorBlocked)}
                        className={`${isAuthorBlocked ? 'text-green-500 hover:text-green-600' : 'text-orange-500 hover:text-orange-600'}`}
                        title={isAuthorBlocked ? 'Buka Blokir' : 'Blokir'}>
                        {isAuthorBlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {canDeleteComment(comment) && (
                      <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Hapus komentar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-zinc-700 dark:text-zinc-200 text-[15px] leading-relaxed pl-11">
                  {renderCommentContent(comment.content)}
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <button onClick={() => setReplyTarget(comment)} className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                      <Reply className="h-3.5 w-3.5" /> Balas
                    </button>
                    {replies.length > 0 && (
                      <button onClick={() => setOpenReplies((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        {isOpen ? 'Sembunyikan' : `Lihat ${replies.length} balasan`}
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && replies.length > 0 && (
                  <div className="mt-4 space-y-4 pl-11">
                    {replies.map((reply) => {
                      const replyProfile = getProfileValue(reply.profiles)
                      const replyAuthorName = replyProfile?.full_name || reply.author
                      const replyAuthorAvatar = replyProfile?.avatar_url ?? null
                      const replyAuthorRole = replyProfile?.role ?? 'user'
                      const isReplyAuthorBlocked = replyProfile?.is_blocked ?? false
                      return (
                        <div key={reply.id} className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <Avatar src={replyAuthorAvatar} name={replyAuthorName} size="sm" />
                              <div className="flex items-center gap-2">
                                <strong className="text-sm font-medium">{replyAuthorName}</strong>
                                {replyAuthorRole === 'moderator' && <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold">MOD</span>}
                                {isReplyAuthorBlocked && <span className="bg-red-100 text-red-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold">DIBLOKIR</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <time className="text-xs text-zinc-500 dark:text-zinc-400">
                                {new Date(reply.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </time>
                              {isModerator && reply.user_id && reply.user_id !== user?.id && (
                                <button onClick={() => handleToggleBlock(reply.user_id!, isReplyAuthorBlocked)}
                                  className={`${isReplyAuthorBlocked ? 'text-green-500 hover:text-green-600' : 'text-orange-500 hover:text-orange-600'}`}>
                                  {isReplyAuthorBlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                                </button>
                              )}
                              {canDeleteComment(reply) && (
                                <button onClick={() => handleDelete(reply.id)} className="text-red-500 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed pl-[34px]">
                            {renderCommentContent(reply.content)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            )
          })
        )}
      </div>

      {hasMoreTopLevel && (
        <div className="mt-8 flex justify-center pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <button onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)} className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 px-6 py-2.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            <ChevronDown className="h-3.5 w-3.5" /> Tampilkan lebih banyak
          </button>
        </div>
      )}
    </section>
  )
}
