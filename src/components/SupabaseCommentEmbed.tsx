/** eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Music2,
  Play,
  Pause,
  Clock,
  ArrowUpCircleIcon,
  SortAsc,
} from 'lucide-react'
import { COMMENT_RETURN_TO_KEY } from '@/constants/supabase-comments'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

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

type Reaction = {
  id: string
  comment_id: string
  user_id: string
  emoji: string
}

type ReactionSummary = Record<string, { count: number; reacted: boolean }>

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡']

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

const PAGE_SIZE = 5

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
      <img
        src={src}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`${sizeClasses} rounded-full object-cover border border-zinc-200 dark:border-zinc-800`}
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div
      className={`${sizeClasses} rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400`}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}

function Spoiler({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className="inline-flex cursor-pointer rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300"
      title={revealed ? 'Klik untuk menyembunyikan' : 'Klik untuk melihat spoiler'}
    >
      <span className={`transition-all duration-300 ${revealed ? 'blur-none opacity-100' : 'blur-sm select-none opacity-60'}`}>
        {text}
      </span>
    </span>
  )
}

function extractYtUrlFromContent(content: string): string | null {
  const match = content.match(/\[yt\]\(([^)]+)\)/)
  return match ? match[1].trim() : null
}

function renderInline(input: string): ReactNode[] {
  // Skip [yt](...) blocks — rendered separately as music player
  const cleaned = input.replace(/\[yt\]\([^)]+\)/g, '')
  const parts = cleaned.split(/(\|\|[^|]+\|\||!?\[[^\]]*\]\([^\)]+\)|https?:\/\/\S+)/g)
  return parts.filter(Boolean).map((part, index) => {
    if (/^\|\|[^|]+\|\|$/.test(part)) return <Spoiler key={index} text={part.slice(2, -2)} />
    const imageMatch = part.match(/^!\[([^\]]*)\]\(([^\)]+)\)$/)
    if (imageMatch) {
      const src = imageMatch[2].trim()
      if (isValidHttpUrl(src))
        return (
          <img
            key={index}
            src={src}
            alt={imageMatch[1] || 'gambar komentar'}
            className="my-3 max-h-72 w-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
            loading="lazy"
          />
        )
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/)
    if (linkMatch && isValidHttpUrl(linkMatch[2].trim())) {
      return (
        <a
          key={index}
          href={linkMatch[2].trim()}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      )
    }
    if (/^https?:\/\//.test(part) && isValidHttpUrl(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2"
        >
          {part}
        </a>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function renderCommentContent(content: string) {
  return content.split('\n').map((line, idx, arr) => (
    <div key={`${line}-${idx}`}>
      {renderInline(line)}
      {idx < arr.length - 1 ? <br /> : null}
    </div>
  ))
}

/* ── YouTube helpers ── */
function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/)
      if (shorts) return shorts[1]
    }
  } catch { }
  return null
}

/* ── Inject YouTube IFrame API script once ── */
let ytApiLoaded = false
function ensureYtApi() {
  if (ytApiLoaded || typeof window === 'undefined') return
  if (document.getElementById('yt-iframe-api')) { ytApiLoaded = true; return }
  const tag = document.createElement('script')
  tag.id = 'yt-iframe-api'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
  ytApiLoaded = true
}

function formatTime(sec: number): string {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function MiniMusicPlayer({
  url,
  commentId,
  activePlayer,
  setActivePlayer,
}: {
  url: string
  commentId: string
  activePlayer: string | null
  setActivePlayer: (id: string | null) => void
}) {
  const videoId = extractYoutubeId(url)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [title, setTitle] = useState('')
  const [dragging, setDragging] = useState(false)
  const [dragVal, setDragVal] = useState(0)

  const isActive = activePlayer === commentId
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : ''

  // Load YT API + create player when first activated
  useEffect(() => {
    if (!isActive || !videoId || playerRef.current) return
    ensureYtApi()

    const containerId = `yt-player-${commentId}`

    function createPlayer() {
      setLoading(true)
      playerRef.current = new (window as any).YT.Player(containerId, {
        videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: any) => {
            setReady(true)
            setLoading(false)
            setDuration(e.target.getDuration())
            setTitle(e.target.getVideoData()?.title ?? '')
          },
          onStateChange: (e: any) => {
            if (e.data === 0) setActivePlayer(null)
          },
        },
      })
    }

    if ((window as any).YT?.Player) {
      createPlayer()
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady
        ; (window as any).onYouTubeIframeAPIReady = () => {
          prev?.()
          createPlayer()
        }
    }

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [isActive, videoId, commentId])

  useEffect(() => {
    if (!playerRef.current || !ready) return
    if (isActive) {
      playerRef.current.playVideo?.()
    } else {
      playerRef.current.pauseVideo?.()
    }
  }, [isActive, ready])

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!isActive || !ready) return
    tickRef.current = setInterval(() => {
      if (playerRef.current && !dragging) {
        setCurrentTime(playerRef.current.getCurrentTime?.() ?? 0)
        setDuration(playerRef.current.getDuration?.() ?? 0)
      }
    }, 500)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [isActive, ready, dragging])

  const progress = duration > 0 ? (dragging ? dragVal : currentTime) / duration : 0

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setDragVal(val)
    setCurrentTime(val)
    playerRef.current?.seekTo?.(val, true)
  }

  if (!videoId) return null

  return (
    <div className="mt-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 p-2.5">
        <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden">
          <img src={thumbnailUrl} alt="cover" className="w-full h-full object-cover" />
          <div
            id={`yt-player-${commentId}`}
            ref={containerRef}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', top: 0, left: 0 }}
          />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate leading-tight mb-1.5">
            {loading
              ? <span className="flex items-center gap-1.5 text-zinc-400"><Loader2 className="h-3 w-3 animate-spin" /> Memuat musik...</span>
              : title
                ? title
                : <span className="flex items-center gap-1 text-zinc-400"><Music2 className="h-3 w-3 text-red-500" /> Music terlampir</span>
            }
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 tabular-nums w-7 shrink-0">{formatTime(dragging ? dragVal : currentTime)}</span>
            <div className="relative flex-1 h-1 group">
              <div className={`absolute inset-y-0 w-full rounded-full ${loading ? 'bg-zinc-200 dark:bg-zinc-700 animate-pulse' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
              {!loading && (
                <div
                  className="absolute inset-y-0 left-0 bg-red-500 rounded-full transition-none"
                  style={{ width: `${progress * 100}%` }}
                />
              )}
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={dragging ? dragVal : currentTime}
                onChange={handleSeek}
                onMouseDown={() => { setDragging(true); setDragVal(currentTime) }}
                onMouseUp={() => setDragging(false)}
                onTouchStart={() => { setDragging(true); setDragVal(currentTime) }}
                onTouchEnd={() => setDragging(false)}
                disabled={!ready || loading}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full disabled:cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-zinc-400 tabular-nums w-7 shrink-0 text-right">{formatTime(duration)}</span>
          </div>
        </div>

        <button
          onClick={() => setActivePlayer(isActive ? null : commentId)}
          disabled={loading}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
            : isActive
              ? <Pause className="h-3.5 w-3.5 text-white" />
              : <Play className="h-3.5 w-3.5 text-white fill-white" />
          }
        </button>
      </div>
    </div>
  )
}

export default function SupabaseCommentEmbed({ site, slug, title = 'Komentar' }: CommentEmbedProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')
  const [authError, setAuthError] = useState('')
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openReplies, setOpenReplies] = useState<Record<string, boolean>>({})
  const [activePlayer, setActivePlayer] = useState<string | null>(null)
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [sortOrder, setSortOrder] = useState<'newest' | 'top'>('newest')

  const [_openReactionPicker, setOpenReactionPicker] = useState<string | null>(null)

  const returnToKey = COMMENT_RETURN_TO_KEY
  const channelRef = useRef<RealtimeChannel | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

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

  async function fetchReactions() {
    const { data } = await supabase
      .from('comment_reactions')
      .select('id, comment_id, user_id, emoji')
    setReactions((data ?? []) as Reaction[])
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
      await fetchReactions()

      channelRef.current = supabase
        .channel(`comments:${site}:${slug}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'comments', filter: `site=eq.${site}` },
          async () => {
            await fetchComments()
          }
        )
        .subscribe()
    }
    setup().catch((e) => setError(e instanceof Error ? e.message : 'Gagal memuat komentar'))

    return () => {
      mounted = false
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [site, slug])

  useEffect(() => {
    if (replyTarget) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => {
        const textarea = document.getElementById('comment-editor') as HTMLTextAreaElement | null
        textarea?.focus()
      }, 600)
    }
  }, [replyTarget])

  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel = comments.filter((c) => !c.parent_id)
    const replies = comments.reduce<Record<string, CommentItem[]>>((acc, c) => {
      if (!c.parent_id) return acc
      acc[c.parent_id] ??= []
      acc[c.parent_id].push(c)
      return acc
    }, {})
    const sorted = [...topLevel].sort((a, b) => {
      if (sortOrder === 'top') {
        const countA = reactions.filter(r => r.comment_id === a.id).length
        const countB = reactions.filter(r => r.comment_id === b.id).length
        return countB - countA
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return { topLevelComments: sorted, repliesByParent: replies }
  }, [comments, reactions, sortOrder])

  const totalReplies = comments.length - topLevelComments.length
  const commentsPerPage = PAGE_SIZE
  const totalPages = Math.ceil(topLevelComments.length / commentsPerPage) || 1

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const paginatedTopLevelComments = useMemo(() => {
    const startIndex = (currentPage - 1) * commentsPerPage
    return topLevelComments.slice(startIndex, startIndex + commentsPerPage)
  }, [topLevelComments, currentPage, commentsPerPage])

  const googleDisplayName = user?.user_metadata?.full_name ?? user?.email ?? user?.id ?? ''
  const displayName = googleDisplayName || 'Pengguna'
  const userAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null

  const isModerator = currentProfile?.role === 'moderator'
  const isBlocked = currentProfile?.is_blocked === true

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
      setComments((prev) =>
        prev.map((c) => {
          const pv = getProfileValue(c.profiles)
          if (c.user_id === userId && pv) return { ...c, profiles: { ...pv, is_blocked: !currentStatus } }
          return c
        })
      )
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
    if (!content.trim()) return

    setLoading(true)
    setError('')

    const { error: insertError, data: insertedData } = await supabase
      .from('comments')
      .insert({
        site, slug,
        user_id: user.id,
        content: content.trim(),
        parent_id: replyTarget?.id ?? null,
      })
      .select('id, author, content, created_at, slug, parent_id, user_id, profiles(id, full_name, avatar_url, role, is_blocked)')
      .single()

    setLoading(false)
    if (insertError) { setError(insertError.message); return }

    if (insertedData) {
      setComments((prev) => [...prev, insertedData as CommentItem])
      if (!replyTarget) {
        const newTotalTopLevel = topLevelComments.length + 1
        setCurrentPage(Math.ceil(newTotalTopLevel / commentsPerPage))
      }
    }

    setContent('')
    setReplyTarget(null)
  }

  function getReactionSummary(commentId: string): ReactionSummary {
    const commentReactions = reactions.filter(r => r.comment_id === commentId)
    const summary: ReactionSummary = {}
    for (const emoji of EMOJIS) {
      const matching = commentReactions.filter(r => r.emoji === emoji)
      summary[emoji] = {
        count: matching.length,
        reacted: !!user && matching.some(r => r.user_id === user.id),
      }
    }
    return summary
  }

  async function handleReaction(commentId: string, emoji: string) {
    if (!user) return
    const existing = reactions.find(
      r => r.comment_id === commentId && r.user_id === user.id && r.emoji === emoji
    )
    if (existing) {
      await supabase.from('comment_reactions').delete().eq('id', existing.id)
      setReactions(prev => prev.filter(r => r.id !== existing.id))
    } else {
      const { data } = await supabase
        .from('comment_reactions')
        .insert({ comment_id: commentId, user_id: user.id, emoji })
        .select('id, comment_id, user_id, emoji')
        .single()
      if (data) setReactions(prev => [...prev, data as Reaction])
    }
    setOpenReactionPicker(null)
  }

  const canDeleteComment = (comment: CommentItem) =>
    (user && comment.user_id === user.id) || isModerator

  return (
    <section className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 md:p-5 text-zinc-900 dark:text-zinc-100">

      {/* HEADER */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 p-2">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {comments.length} komentar • {totalReplies} balasan
            </p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono hidden md:block">{site}/{slug}</div>
      </header>

      {/* AUTH BAR */}
      <div className="py-3 border-b border-zinc-200 dark:border-zinc-800">
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
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 py-2.5 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-70"
          >
            {authLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengarahkan...</> : <><LogIn className="h-4 w-4" /> Masuk dengan Google</>}
          </button>
        )}
        {authError && <p className="mt-1.5 text-xs text-red-500">{authError}</p>}
      </div>

      {/* FORM KOMENTAR */}
      <form ref={formRef} onSubmit={handleSubmit} className="pt-4 space-y-3">
        {replyTarget && (
          <div className="flex items-center justify-between rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>Membalas <span className="font-medium text-blue-600 dark:text-blue-400">{replyTarget.author}</span></span>
            <button type="button" onClick={() => setReplyTarget(null)} className="hover:text-zinc-900 dark:hover:text-zinc-100">Batal</button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Spoiler', icon: Shield, action: () => insertAtCursor('||', '||') },
            { label: 'Link', icon: Link2, action: () => insertAtCursor('[teks](', ')') },
            { label: 'Gambar', icon: ImageIcon, action: () => insertAtCursor('![alt](', ')') },
          ].map(({ label, icon: Icon, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              disabled={!user || isBlocked}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 transition-colors"
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => insertAtCursor('[yt](', ')')}
            disabled={!user || isBlocked}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-500/50 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            <Music2 className="h-3.5 w-3.5" /> Music
          </button>
        </div>

        <textarea
          id="comment-editor"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-y min-h-[110px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 disabled:opacity-50 transition-colors"
          placeholder={isBlocked ? 'Akun Anda telah diblokir.' : 'Tulis komentar di sini...'}
          required
          disabled={!user || isBlocked}
        />

        <Button type="submit" disabled={loading || !user || isBlocked}>
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
            : <><Send className="h-4 w-4" /> {replyTarget ? 'Kirim Balasan' : 'Kirim Komentar'}</>
          }
        </Button>
      </form>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* SORT + COMMENT LIST */}
      <div className="mt-5">
        {topLevelComments.length > 1 && (
          <div className="flex items-center gap-1.5 mb-4">
            <span className="text-xs text-zinc-400 mr-1"><SortAsc /></span>
            {(['newest', 'top'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => { setSortOrder(opt); setCurrentPage(1) }}
                className={`px-3 py-1 flex items-center gap-1 rounded-lg text-xs font-medium transition-colors ${sortOrder === opt
                  ? 'bg-zinc-600 dark:bg-white text-white dark:text-zinc-900'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
              >
                {opt === 'newest' ? <Clock className='w-4 h-4' /> : <ArrowUpCircleIcon className='w-4 h-4' />}
                {opt === 'newest' ? 'Terbaru' : 'Terpopuler'}
              </button>
            ))}
          </div>
        )}
        {comments.length === 0 ? (
          <p className="text-center text-zinc-400 py-6 text-sm">Belum ada komentar</p>
        ) : (
          paginatedTopLevelComments.map((comment) => {
            const replies = repliesByParent[comment.id] ?? []
            const isOpen = !!openReplies[comment.id]
            const commentProfile = getProfileValue(comment.profiles)
            const authorName = commentProfile?.full_name || comment.author
            const authorAvatar = commentProfile?.avatar_url ?? null
            const authorRole = commentProfile?.role ?? 'user'
            const isAuthorBlocked = commentProfile?.is_blocked ?? false

            return (
              <article key={comment.id} className="py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
                {/* Comment header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={authorAvatar} name={authorName} />
                    <div className="flex items-center gap-1.5">
                      <strong className={`text-sm font-medium ${isAuthorBlocked ? 'line-through text-zinc-400' : ''}`}>
                        {authorName}
                      </strong>
                      {authorRole === 'moderator' && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">MOD</span>
                      )}
                      {isAuthorBlocked && (
                        <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">DIBLOKIR</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <time className="text-xs text-zinc-400">
                      {new Date(comment.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </time>
                    {isModerator && comment.user_id && comment.user_id !== user?.id && (
                      <button
                        onClick={() => handleToggleBlock(comment.user_id!, isAuthorBlocked)}
                        className={isAuthorBlocked ? 'text-green-500 hover:text-green-600' : 'text-orange-500 hover:text-orange-600'}
                        title={isAuthorBlocked ? 'Buka Blokir' : 'Blokir'}
                      >
                        {isAuthorBlocked ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    {canDeleteComment(comment) && (
                      <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Hapus">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment body */}
                <div className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed pl-[42px]">
                  {renderCommentContent(comment.content)}
                  {(() => {
                    const ytUrl = extractYtUrlFromContent(comment.content)
                    return ytUrl ? (
                      <MiniMusicPlayer
                        url={ytUrl}
                        commentId={comment.id}
                        activePlayer={activePlayer}
                        setActivePlayer={setActivePlayer}
                      />
                    ) : null
                  })()}
                  {(() => {
                    const summary = getReactionSummary(comment.id)
                    const active = EMOJIS.filter(e => summary[e].count > 0)
                    return (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {active.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => user && handleReaction(comment.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all ${summary[emoji].reacted
                              ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                              }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-medium tabular-nums">{summary[emoji].count}</span>
                          </button>
                        ))}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              disabled={!user}
                              title={user ? 'Tambah reaksi' : 'Login untuk bereaksi'}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span>＋</span><span>😊</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="top" align="start" className="w-fit p-1.5 rounded-2xl flex gap-1 flex-row shadow-lg">
                            {EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(comment.id, emoji)}
                                className={`text-lg leading-none p-1.5 rounded-xl transition-all hover:scale-125 ${summary[emoji].reacted ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    )
                  })()}
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setReplyTarget(comment)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                    >
                      <Reply className="h-3.5 w-3.5" /> Balas
                    </button>
                    {replies.length > 0 && (
                      <button
                        onClick={() => setOpenReplies((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        {isOpen ? 'Sembunyikan' : `${replies.length} balasan`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {isOpen && replies.length > 0 && (
                  <div className="mt-3 space-y-3 pl-[42px]">
                    {replies.map((reply) => {
                      const replyProfile = getProfileValue(reply.profiles)
                      const replyAuthorName = replyProfile?.full_name || reply.author
                      const replyAuthorAvatar = replyProfile?.avatar_url ?? null
                      const replyAuthorRole = replyProfile?.role ?? 'user'
                      const isReplyAuthorBlocked = replyProfile?.is_blocked ?? false

                      return (
                        <div key={reply.id} className="pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Avatar src={replyAuthorAvatar} name={replyAuthorName} size="sm" />
                              <div className="flex items-center gap-1.5">
                                <strong className="text-sm font-medium">{replyAuthorName}</strong>
                                {replyAuthorRole === 'moderator' && (
                                  <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold">MOD</span>
                                )}
                                {isReplyAuthorBlocked && (
                                  <span className="bg-red-100 text-red-700 text-[8px] px-1.5 py-0.5 rounded-full font-bold">DIBLOKIR</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <time className="text-xs text-zinc-400">
                                {new Date(reply.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </time>
                              {isModerator && reply.user_id && reply.user_id !== user?.id && (
                                <button
                                  onClick={() => handleToggleBlock(reply.user_id!, isReplyAuthorBlocked)}
                                  className={isReplyAuthorBlocked ? 'text-green-500 hover:text-green-600' : 'text-orange-500 hover:text-orange-600'}
                                >
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
                          <div className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed pl-8">
                            {renderCommentContent(reply.content)}
                            {(() => {
                              const ytUrl = extractYtUrlFromContent(reply.content)
                              return ytUrl ? (
                                <MiniMusicPlayer
                                  url={ytUrl}
                                  commentId={reply.id}
                                  activePlayer={activePlayer}
                                  setActivePlayer={setActivePlayer}
                                />
                              ) : null
                            })()}
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

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-5 flex justify-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 items-center gap-1 rounded-l-2xl border border-r-0 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`flex h-8 min-w-[32px] items-center justify-center border border-zinc-200 dark:border-zinc-700 px-3 text-xs font-medium transition-colors ${pageNum === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 items-center gap-1 rounded-r-2xl border border-l-0 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
