/** eslint-disable no-useless-escape */
/** eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Link2,
  Loader2,
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
  Quote,
  SmilePlus,
  Eye,
} from "lucide-react";
import { COMMENT_RETURN_TO_KEY } from "@/constants/supabase-comments";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "moderator";
  is_blocked: boolean;
};

type CommentItem = {
  id: string;
  author: string;
  content: string;
  created_at: string;
  slug?: string;
  parent_id: string | null;
  user_id: string | null;
  anonymous_id?: string | null;
  profiles?: Profile | Profile[] | null;
};

type Reaction = {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  profiles?: { full_name: string | null } | null;
};

type ReactionSummary = Record<
  string,
  { count: number; reacted: boolean; names: string[] }
>;

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

type CommentEmbedProps = {
  site: string;
  slug: string;
  title?: string;
};

type SupabaseUser = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string | null;
    avatar_url?: string | null;
    picture?: string | null;
    [key: string]: any;
  };
  [key: string]: any;
};

const PAGE_SIZE = 10;
const ANONYMOUS_NAME_KEY = "anonymous_commenter_name";
const ANON_DELETE_TOKENS_KEY = "anon_delete_tokens";

function generateAnonymousId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto) {
    if (typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
      return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
    }
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getProfileValue(profile?: Profile | Profile[] | null): Profile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? (profile[0] ?? null) : profile;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getInitials(name: string) {
  if (!name) return "?";
  const cleanName = name.trim();
  const parts = cleanName.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return cleanName.substring(0, 2).toUpperCase();
}

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const sizeClasses = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgFailed(true)}
        className={`${sizeClasses} rounded-full object-cover border border-zinc-200 dark:border-zinc-800`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`${sizeClasses} rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-semibold text-blue-600 dark:text-blue-400`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

function Spoiler({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onClick={() => setRevealed(!revealed)}
      className="inline-flex cursor-pointer rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300"
      title={
        revealed ? "Klik untuk menyembunyikan" : "Klik untuk melihat spoiler"
      }
    >
      <span
        className={`transition-all duration-300 ${revealed ? "blur-none opacity-100" : "blur-sm select-none opacity-60"}`}
      >
        {text}
      </span>
    </span>
  );
}

function extractYtUrlFromContent(content: string): string | null {
  const match = content.match(/\[yt\]\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

function renderInline(input: string): ReactNode[] {
  const cleaned = input.replace(/\[yt\]\([^)]+\)/g, "");
  const parts = cleaned.split(
    /(\|\|[^|]+\|\||!?\[[^\]]*\]\([^\)]+\)|https?:\/\/\S+)/g,
  );
  return parts.filter(Boolean).map((part, index) => {
    if (/^\|\|[^|]+\|\|$/.test(part))
      return <Spoiler key={index} text={part.slice(2, -2)} />;
    const imageMatch = part.match(/^!\[([^\]]*)\]\(([^\)]+)\)$/);
    if (imageMatch) {
      const src = imageMatch[2].trim();
      if (isValidHttpUrl(src))
        return (
          <img
            key={index}
            src={src}
            alt={imageMatch[1] || "gambar komentar"}
            className="my-3 max-h-72 w-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
            loading="lazy"
          />
        );
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
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
      );
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
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function renderCommentContent(content: string) {
  return content.split("\n").map((line, idx, arr) => (
    <div key={`${line}-${idx}`}>
      {renderInline(line)}
      {idx < arr.length - 1 ? <br /> : null}
    </div>
  ));
}

function stripMarkup(content: string): string {
  return content
    .replace(/\[yt\]\([^)]+\)/g, "[musik]")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "[gambar]")
    .replace(/\[[^\]]+\]\([^)]+\)/g, (m) => {
      const label = m.match(/^\[([^\]]+)\]/)?.[1];
      return label ?? m;
    })
    .replace(/\|\|([^|]+)\|\|/g, "[spoiler]")
    .replace(/\n+/g, " ")
    .trim();
}

/* ── Reactor names tooltip ── */
function ReactorTooltip({
  names,
  currentUserId,
  reactorUserIds,
}: {
  names: string[];
  currentUserId?: string | null;
  reactorUserIds: string[];
}) {
  if (names.length === 0) return null;

  const meIndex = reactorUserIds.indexOf(currentUserId ?? "");
  const reordered =
    meIndex !== -1 ? ["Kamu", ...names.filter((_, i) => i !== meIndex)] : names;

  let label = "";
  if (reordered.length === 1) {
    label = reordered[0];
  } else if (reordered.length === 2) {
    label = `${reordered[0]} dan ${reordered[1]}`;
  } else if (reordered.length <= 4) {
    label = `${reordered.slice(0, -1).join(", ")}, dan ${reordered[reordered.length - 1]}`;
  } else {
    label = `${reordered.slice(0, 3).join(", ")}, dan ${reordered.length - 3} lainnya`;
  }

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none">
      <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-[200px] text-center leading-snug shadow-lg">
        {label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
      </div>
    </div>
  );
}

/* ── YouTube helpers ── */
function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return shorts[1];
    }
  } catch {
    /* empty */
  }
  return null;
}

let ytApiLoaded = false;
function ensureYtApi() {
  if (ytApiLoaded || typeof window === "undefined") return;
  if (document.getElementById("yt-iframe-api")) {
    ytApiLoaded = true;
    return;
  }
  const tag = document.createElement("script");
  tag.id = "yt-iframe-api";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  ytApiLoaded = true;
}

function formatTime(sec: number): string {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MiniMusicPlayer({
  url,
  commentId,
  activePlayer,
  setActivePlayer,
}: {
  url: string;
  commentId: string;
  activePlayer: string | null;
  setActivePlayer: (id: string | null) => void;
}) {
  const videoId = extractYoutubeId(url);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [dragVal, setDragVal] = useState(0);

  const isActive = activePlayer === commentId;
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : "";

  useEffect(() => {
    if (!isActive || !videoId || playerRef.current) return;
    ensureYtApi();
    const containerId = `yt-player-${commentId}`;
    function createPlayer() {
      setLoading(true);
      playerRef.current = new (window as any).YT.Player(containerId, {
        videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: any) => {
            setReady(true);
            setLoading(false);
            setDuration(e.target.getDuration());
            setTitle(e.target.getVideoData()?.title ?? "");
          },
          onStateChange: (e: any) => {
            if (e.data === 0) setActivePlayer(null);
          },
        },
      });
    }
    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isActive, videoId, commentId, setActivePlayer]);

  useEffect(() => {
    if (!playerRef.current || !ready) return;
    if (isActive) playerRef.current.playVideo?.();
    else playerRef.current.pauseVideo?.();
  }, [isActive, ready]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!isActive || !ready) return;
    tickRef.current = setInterval(() => {
      if (playerRef.current && !dragging) {
        setCurrentTime(playerRef.current.getCurrentTime?.() ?? 0);
        setDuration(playerRef.current.getDuration?.() ?? 0);
      }
    }, 500);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isActive, ready, dragging]);

  const progress =
    duration > 0 ? (dragging ? dragVal : currentTime) / duration : 0;
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDragVal(val);
    setCurrentTime(val);
    playerRef.current?.seekTo?.(val, true);
  };

  if (!videoId) return null;

  return (
    <div className="mt-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 p-2.5">
        <div className="relative shrink-0 w-10 h-10 rounded-xl overflow-hidden">
          <img
            src={thumbnailUrl}
            alt="cover"
            className="w-full h-full object-cover"
          />
          <div
            id={`yt-player-${commentId}`}
            ref={containerRef}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
              top: 0,
              left: 0,
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 truncate leading-tight mb-1.5">
            {loading ? (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Memuat musik...
              </span>
            ) : title ? (
              title
            ) : (
              <span className="flex items-center gap-1 text-zinc-400">
                <Music2 className="h-3 w-3 text-red-500" /> Music terlampir
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 tabular-nums w-7 shrink-0">
              {formatTime(dragging ? dragVal : currentTime)}
            </span>
            <div className="relative flex-1 h-1 group">
              <div
                className={`absolute inset-y-0 w-full rounded-full ${loading ? "bg-zinc-200 dark:bg-zinc-700 animate-pulse" : "bg-zinc-200 dark:bg-zinc-700"}`}
              />
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
                onMouseDown={() => {
                  setDragging(true);
                  setDragVal(currentTime);
                }}
                onMouseUp={() => setDragging(false)}
                onTouchStart={() => {
                  setDragging(true);
                  setDragVal(currentTime);
                }}
                onTouchEnd={() => setDragging(false)}
                disabled={!ready || loading}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full disabled:cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-zinc-400 tabular-nums w-7 shrink-0 text-right">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setActivePlayer(isActive ? null : commentId)}
          disabled={loading}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
          ) : isActive ? (
            <Pause className="h-3.5 w-3.5 text-white" />
          ) : (
            <Play className="h-3.5 w-3.5 text-white fill-white" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Quote Block Component ── */
function QuoteBlock({
  comment,
  onClick,
}: {
  comment: CommentItem;
  onClick: () => void;
}) {
  const profile = getProfileValue(comment.profiles);
  const authorName = profile?.full_name || comment.author;
  const preview = stripMarkup(comment.content);

  return (
    <button
      onClick={onClick}
      className="w-full text-left mb-3 group"
      title="Klik untuk melihat komentar asli"
    >
      <div className="flex gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all">
        <div className="shrink-0 w-0.5 rounded-full bg-blue-400 dark:bg-blue-500 self-stretch" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Quote className="h-3 w-3 text-blue-400 dark:text-blue-500 shrink-0" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate">
              {authorName}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {preview || "..."}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function SupabaseCommentEmbed({
  site,
  slug,
  title = "Komentar",
}: CommentEmbedProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommentItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [sortOrder, setSortOrder] = useState<"newest" | "top">("newest");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  // ── State untuk anonim ──
  const [anonymousId] = useState(() => {
    const key = "anonymous_commenter_id";
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateAnonymousId();
      localStorage.setItem(key, id);
    }
    return id;
  });
  const [anonName, setAnonName] = useState(() => {
    const savedName = localStorage.getItem(ANONYMOUS_NAME_KEY);
    return savedName?.trim() ?? "";
  });
  const [isAnonBlocked, setIsAnonBlocked] = useState(false);
  const [anonDeleteTokens, setAnonDeleteTokens] = useState<
    Record<string, string>
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem(ANON_DELETE_TOKENS_KEY) || "{}",
      ) as Record<string, string>;
    } catch {
      return {};
    }
  });

  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const returnToKey = COMMENT_RETURN_TO_KEY;
  const channelRef = useRef<RealtimeChannel | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const commentRefs = useRef<Record<string, HTMLElement | null>>({});

  async function fetchCurrentProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, is_blocked")
      .eq("id", userId)
      .maybeSingle();
    setCurrentProfile(data ?? null);
  }

  // Cek blokir untuk anonim
  useEffect(() => {
    if (!user) {
      supabase
        .from("blocked_anonymous")
        .select("anonymous_id")
        .eq("anonymous_id", anonymousId)
        .maybeSingle()
        .then(({ data }) => setIsAnonBlocked(!!data));
    }
  }, [user, anonymousId]);

  async function fetchComments() {
    const { data, error: fetchError } = await supabase
      .from("comments")
      .select(
        "id, author, content, created_at, slug, parent_id, user_id, anonymous_id, profiles(id, full_name, avatar_url, role, is_blocked)",
      )
      .eq("site", site)
      .eq("slug", slug)
      .order("created_at", { ascending: true });
    if (fetchError) setError(fetchError.message);
    else setComments((data ?? []) as CommentItem[]);
  }

  async function fetchReactions() {
    const { data: reactionData } = await supabase
      .from("comment_reactions")
      .select("id, comment_id, user_id, emoji");

    if (!reactionData) {
      setReactions([]);
      return;
    }

    const userIds = [
      ...new Set(reactionData.map((r) => r.user_id).filter(Boolean)),
    ];
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds as string[]);

    const profileMap: Record<string, string> = {};
    for (const p of profileData ?? []) {
      profileMap[p.id] = p.full_name ?? "Pengguna";
    }

    const enriched = reactionData.map((r) => ({
      ...r,
      profiles: { full_name: profileMap[r.user_id] ?? "Pengguna" },
    }));

    setReactions(enriched as Reaction[]);
  }

  useEffect(() => {
    let mounted = true;
    async function setup() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) fetchCurrentProfile(session.user.id);
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) fetchCurrentProfile(session.user.id);
        else setCurrentProfile(null);
      });
      await fetchComments();
      await fetchReactions();
      channelRef.current = supabase
        .channel(`comments:${site}:${slug}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `site=eq.${site}`,
          },
          async () => {
            await fetchComments();
          },
        )
        .subscribe();
    }
    setup().catch((e) =>
      setError(e instanceof Error ? e.message : "Gagal memuat komentar"),
    );
    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [site, slug]);

  useEffect(() => {
    if (replyTarget) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        const textarea = document.getElementById(
          "comment-editor",
        ) as HTMLTextAreaElement | null;
        textarea?.focus();
      }, 600);
    }
  }, [replyTarget]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (sortOrder === "top") {
        const countA = reactions.filter((r) => r.comment_id === a.id).length;
        const countB = reactions.filter((r) => r.comment_id === b.id).length;
        if (countB !== countA) return countB - countA;
      }
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [comments, reactions, sortOrder]);

  const commentMap = useMemo(() => {
    const map: Record<string, CommentItem> = {};
    for (const c of comments) map[c.id] = c;
    return map;
  }, [comments]);

  const commentsPerPage = PAGE_SIZE;
  const totalPages = Math.ceil(sortedComments.length / commentsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedComments = useMemo(() => {
    const start = (currentPage - 1) * commentsPerPage;
    return sortedComments.slice(start, start + commentsPerPage);
  }, [sortedComments, currentPage, commentsPerPage]);

  function navigateToComment(commentId: string) {
    const idx = sortedComments.findIndex((c) => c.id === commentId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / commentsPerPage) + 1;
    setHighlightId(commentId);
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      setTimeout(() => {
        commentRefs.current[commentId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 80);
    } else {
      commentRefs.current[commentId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    setTimeout(() => setHighlightId(null), 2000);
  }

  const googleDisplayName =
    user?.user_metadata?.full_name ?? user?.email ?? user?.id ?? "";
  const displayName = googleDisplayName || "Pengguna";
  const userAvatarUrl =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const isModerator = currentProfile?.role === "moderator";
  const isBlocked = currentProfile?.is_blocked === true;

  async function handleDelete(comment: CommentItem) {
    if (!confirm("Hapus komentar ini?")) return;

    const isOwnerUser = !!user && comment.user_id === user.id;
    const isAnonOwner =
      !user &&
      !!comment.anonymous_id &&
      comment.anonymous_id === anonymousId &&
      !comment.user_id;

    let query = supabase.from("comments").delete().eq("id", comment.id);

    if (!isModerator && isOwnerUser) {
      query = query.eq("user_id", user!.id);
    } else if (!isModerator && isAnonOwner) {
      let tokens: Record<string, string> = {};
      tokens = anonDeleteTokens;
      const token = tokens[comment.id];
      if (!token) {
        setError("Token hapus anonim tidak ditemukan untuk komentar ini.");
        return;
      }
      query = query.eq("anonymous_id", anonymousId).eq("delete_token", token);
    }

    const { error: deleteError, data: deletedRows } = await query.select("id");
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    if (
      !isModerator &&
      isAnonOwner &&
      (!deletedRows || deletedRows.length === 0)
    ) {
      setError("Gagal menghapus komentar anonim. Token tidak valid.");
      return;
    }

    if (isAnonOwner) {
      const nextTokens = { ...anonDeleteTokens };
      delete nextTokens[comment.id];
      setAnonDeleteTokens(nextTokens);
      localStorage.setItem(ANON_DELETE_TOKENS_KEY, JSON.stringify(nextTokens));
    }
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  }

  async function handleToggleBlock(userId: string, currentStatus: boolean) {
    if (!confirm(`${currentStatus ? "Buka blokir" : "Blokir"} pengguna ini?`))
      return;
    const { error: blockError } = await supabase
      .from("profiles")
      .update({ is_blocked: !currentStatus })
      .eq("id", userId);
    if (blockError) {
      setError(blockError.message);
    } else {
      setComments((prev) =>
        prev.map((c) => {
          const pv = getProfileValue(c.profiles);
          if (c.user_id === userId && pv)
            return { ...c, profiles: { ...pv, is_blocked: !currentStatus } };
          return c;
        }),
      );
    }
  }

  const [blockedAnonymousIds, setBlockedAnonymousIds] = useState<Set<string>>(
    new Set(),
  );

  // Fungsi untuk mengambil daftar blocked anonymous
  const fetchBlockedAnonymous = async () => {
    const { data } = await supabase
      .from("blocked_anonymous")
      .select("anonymous_id");
    if (data) {
      setBlockedAnonymousIds(new Set(data.map((item) => item.anonymous_id)));
    }
  };

  // Panggil saat mount dan saat ada perubahan (misalnya setelah blokir)
  useEffect(() => {
    fetchBlockedAnonymous();
  }, []);

  async function handleBlockAnonymous(id: string) {
    if (
      !confirm(
        "Blokir pengguna anonim ini? Semua komentarnya akan disembunyikan.",
      )
    )
      return;

    const { error: blockError } = await supabase
      .from("blocked_anonymous")
      .upsert(
        { anonymous_id: id, blocked_at: new Date().toISOString() },
        { onConflict: "anonymous_id" },
      );

    if (blockError) {
      setError(blockError.message);
    } else {
      // Refresh daftar blokir
      await fetchBlockedAnonymous();
      // Refresh komentar (untuk memperbarui tampilan placeholder)
      fetchComments();
    }
  }
  async function handleSignIn() {
    setAuthError("");
    setAuthLoading(true);
    try {
      localStorage.setItem(returnToKey, window.location.href);
    } catch {}
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
    setAuthLoading(false);
    if (signInError) setAuthError(signInError.message);
  }

  async function handleSignOut() {
    setAuthError("");
    await supabase.auth.signOut();
  }

  function insertAtCursor(before: string, after = "") {
    const textarea = document.getElementById(
      "comment-editor",
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    setContent(
      `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`,
    );
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selected.length;
    });
  }

  function insertSnippet(snippet: string) {
    const textarea = document.getElementById(
      "comment-editor",
    ) as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent(`${content.slice(0, start)}${snippet}${content.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
    });
  }

  function handleInsertLink() {
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) return;
    const label = linkLabel.trim() || trimmedUrl;
    insertSnippet(`[${label}](${trimmedUrl})`);
    setLinkLabel("");
    setLinkUrl("");
  }

  function handleInsertImage() {
    const trimmedUrl = imageUrl.trim();
    if (!trimmedUrl) return;
    const alt = imageAlt.trim() || "gambar";
    insertSnippet(`![${alt}](${trimmedUrl})`);
    setImageAlt("");
    setImageUrl("");
  }

  function handleInsertMusic() {
    const trimmedUrl = musicUrl.trim();
    if (!trimmedUrl) return;
    insertSnippet(`[yt](${trimmedUrl})`);
    setMusicUrl("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 1. Tentukan author dengan validasi ketat
    let author = "";
    if (user) {
      // User login – pastikan displayName benar-benar string
      author = (displayName || "Pengguna").trim();
      if (!author) author = "Pengguna"; // fallback akhir
    } else {
      // Anonim – wajib isi nama
      if (!anonName || !anonName.trim()) {
        setError("Nama diperlukan untuk komentar anonim.");
        return;
      }
      author = anonName.trim();
      if (isAnonBlocked) {
        setError("Kamu telah diblokir.");
        return;
      }
    }

    if (!content.trim()) return;

    setLoading(true);
    setError("");

    // Bangun payload tanpa spread, semua properti eksplisit
    const payload = {
      site,
      slug,
      author, // sudah terjamin string
      content: content.trim(),
      parent_id: replyTarget?.id ?? null,
      user_id: user ? user.id : null,
      delete_token: user ? null : generateAnonymousId(),
      anonymous_id: user ? null : anonymousId,
    };

    const { error: insertError, data: insertedData } = await supabase
      .from("comments")
      .insert(payload)
      .select(
        "id, author, content, created_at, slug, parent_id, user_id, anonymous_id, profiles(id, full_name, avatar_url, role, is_blocked)",
      )
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (insertedData) {
      setComments((prev) => [...prev, insertedData as CommentItem]);
      const newTotal = sortedComments.length + 1;
      setCurrentPage(Math.ceil(newTotal / PAGE_SIZE));
      if (!user) {
        localStorage.setItem(ANONYMOUS_NAME_KEY, author);
      }
    }

    if (insertedData && !user) {
      // Simpan token agar bisa digunakan nanti
      const deleteToken =
        typeof payload.delete_token === "string" ? payload.delete_token : "";
      if (deleteToken) {
        const nextTokens = {
          ...anonDeleteTokens,
          [insertedData.id]: deleteToken,
        };
        setAnonDeleteTokens(nextTokens);
        localStorage.setItem(
          ANON_DELETE_TOKENS_KEY,
          JSON.stringify(nextTokens),
        );
      }
    }

    setContent("");
    setReplyTarget(null);
  }

  function getReactionSummary(commentId: string): ReactionSummary {
    const commentReactions = reactions.filter(
      (r) => r.comment_id === commentId,
    );
    const summary: ReactionSummary = {};
    for (const emoji of EMOJIS) {
      const matching = commentReactions.filter((r) => r.emoji === emoji);
      summary[emoji] = {
        count: matching.length,
        reacted: !!user && matching.some((r) => r.user_id === user.id),
        names: matching.map(
          (r) => (r.profiles as any)?.full_name || "Pengguna",
        ),
      };
    }
    return summary;
  }

  function getReactorUserIds(commentId: string, emoji: string): string[] {
    return reactions
      .filter((r) => r.comment_id === commentId && r.emoji === emoji)
      .map((r) => r.user_id);
  }

  async function handleReaction(commentId: string, emoji: string) {
    if (!user) return;
    const existing = reactions.find(
      (r) =>
        r.comment_id === commentId &&
        r.user_id === user.id &&
        r.emoji === emoji,
    );
    if (existing) {
      await supabase.from("comment_reactions").delete().eq("id", existing.id);
      setReactions((prev) => prev.filter((r) => r.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("comment_reactions")
        .insert({ comment_id: commentId, user_id: user.id, emoji })
        .select("id, comment_id, user_id, emoji")
        .single();
      if (data) {
        setReactions((prev) => [
          ...prev,
          { ...data, profiles: { full_name: displayName } } as Reaction,
        ]);
      }
    }
  }

  const canDeleteComment = (comment: CommentItem) =>
    isModerator ||
    (user && comment.user_id === user.id) ||
    (!user &&
      !!comment.anonymous_id &&
      comment.anonymous_id === anonymousId &&
      !!anonDeleteTokens[comment.id] &&
      !comment.user_id);

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
              {comments.length} komentar
            </p>
          </div>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono hidden md:block">
          {site}/{slug}
        </div>
      </header>

      {/* AUTH BAR */}
      <div className="py-3 border-b border-zinc-200 dark:border-zinc-800">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar src={userAvatarUrl} name={displayName} size="sm" />
              <div className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                Masuk sebagai{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {displayName}
                </span>
                {isModerator && (
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    MOD
                  </span>
                )}
                {isBlocked && (
                  <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    DIBLOKIR
                  </span>
                )}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-zinc-100 dark:border-zinc-800/60">
            {/* Bagian Status Anonim */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-pulse" />
              <span className="text-xs md:text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400/80">
                Berkomentar sebagai anonim
              </span>
            </div>

            {/* Tombol Masuk dengan Google */}
            <button
              onClick={handleSignIn}
              disabled={authLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 px-4 py-2 text-xs md:text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                  <span className="animate-pulse">Mengarahkan...</span>
                </>
              ) : (
                <>
                  {/* Menggunakan Google Icon SVG bawaan agar lebih otentik & elegan dibanding icon standar */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  Masuk dengan Google
                </>
              )}
            </button>
          </div>
        )}
        {authError && (
          <p className="mt-1.5 text-xs text-red-500">{authError}</p>
        )}
      </div>

      {/* FORM KOMENTAR */}
      <form ref={formRef} onSubmit={handleSubmit} className="pt-4 space-y-3">
        {replyTarget && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Membalas {replyTarget.author}
              </span>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                Batal
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
              {stripMarkup(replyTarget.content)}
            </p>
          </div>
        )}

        {/* Input nama untuk anonim */}
        {!user && (
          <input
            type="text"
            value={anonName}
            onChange={(e) => setAnonName(e.target.value)}
            placeholder="Nama kamu (wajib)"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 disabled:opacity-50"
            required
            disabled={isAnonBlocked}
          />
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => insertAtCursor("||", "||")}
              disabled={
                (!user && isAnonBlocked) || (user && isBlocked) || undefined
              }
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 transition-colors"
            >
              <Shield className="h-3.5 w-3.5" /> Spoiler
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={
                    (!user && isAnonBlocked) || (user && isBlocked) || undefined
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" /> Link
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Tambah Link
                </p>
                <input
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Teks link (opsional)"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleInsertLink}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 transition-colors"
                >
                  Sisipkan Link
                </button>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={
                    (!user && isAnonBlocked) || (user && isBlocked) || undefined
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50 transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Gambar
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Tambah Gambar
                </p>
                <input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Alt text (opsional)"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="URL gambar: https://..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  URL gambar harus direct link dan memiliki ekstensi file
                  (contoh: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`). Link
                  halaman lihat gambar biasanya tidak bisa ditampilkan. Upload
                  gambar dulu ke hosting, lalu tempel direct URL-nya.
                  Rekomendasi:
                  <span className="ml-1 inline-flex flex-wrap gap-1.5">
                    <a
                      href="https://imgbox.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Buka Imgbox"
                    >
                      Imgbox
                    </a>
                    <a
                      href="https://postimages.org/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Buka Postimages"
                    >
                      Postimages
                    </a>
                    <a
                      href="https://freeimage.host/"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Buka FreeImage.host"
                    >
                      FreeImage.host
                    </a>
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleInsertImage}
                  className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 transition-colors"
                >
                  Sisipkan Gambar
                </button>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={
                    (!user && isAnonBlocked) || (user && isBlocked) || undefined
                  }
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:border-red-300 dark:hover:border-red-500/50 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  <Music2 className="h-3.5 w-3.5" /> Music
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-2xl p-3 space-y-2">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                  Tambah Music YouTube
                </p>
                <input
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="URL YouTube: https://..."
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleInsertMusic}
                  className="w-full rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-2 transition-colors"
                >
                  Sisipkan Music
                </button>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              onClick={() => setShowPreview((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors ${
                showPreview
                  ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> {showPreview ? "Edit" : "Preview"}
            </button>
          </div>

          {showPreview ? (
            <div className="min-h-[110px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
              {content.trim() ? (
                renderCommentContent(content)
              ) : (
                <p className="text-zinc-400">Belum ada isi untuk dipreview.</p>
              )}
            </div>
          ) : (
            <textarea
              id="comment-editor"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full resize-y min-h-[110px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 disabled:opacity-50 transition-colors"
              placeholder={
                isBlocked
                  ? "Akun Anda telah diblokir."
                  : isAnonBlocked
                    ? "Kamu telah diblokir."
                    : "Tulis komentar di sini..."
              }
              required
              disabled={!user ? isAnonBlocked : isBlocked}
            />
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          disabled={loading || (!user ? isAnonBlocked : isBlocked)}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />{" "}
              {replyTarget ? "Kirim Balasan" : "Kirim Komentar"}
            </>
          )}
        </Button>
      </form>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* SORT + COMMENT LIST */}
      <div className="mt-5">
        {sortedComments.length > 1 && (
          <div className="flex items-center gap-4 mb-4 text-xs font-medium">
            <div className="flex items-center gap-4">
              {(["newest", "top"] as const).map((opt) => {
                const isActive = sortOrder === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortOrder(opt);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center gap-1.5 py-1 transition-colors relative ${
                      isActive
                        ? "text-zinc-950 dark:text-zinc-50 font-semibold"
                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    }`}
                  >
                    {opt === "newest" ? (
                      <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
                    ) : (
                      <ArrowUpCircleIcon className="w-3.5 h-3.5 stroke-[1.5]" />
                    )}
                    <span>{opt === "newest" ? "Terbaru" : "Terpopuler"}</span>

                    {/* Garis bawah tipis penanda aktif */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-zinc-950 dark:bg-zinc-50 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-center text-zinc-400 py-6 text-sm">
            Belum ada komentar
          </p>
        ) : (
          paginatedComments.map((comment) => {
            const commentProfile = getProfileValue(comment.profiles);
            const authorName = commentProfile?.full_name || comment.author;
            const authorAvatar = commentProfile?.avatar_url ?? null;
            const authorRole = commentProfile?.role ?? "user";
            const isAuthorBlocked = commentProfile?.is_blocked ?? false;
            const parentComment = comment.parent_id
              ? commentMap[comment.parent_id]
              : null;
            const isHighlighted = highlightId === comment.id;
            if (
              comment.anonymous_id &&
              blockedAnonymousIds.has(comment.anonymous_id)
            ) {
              return (
                <article
                  key={comment.id}
                  className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0"
                >
                  <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 py-1">
                    <Ban className="h-3 w-3 shrink-0 text-red-400 dark:text-red-500" />
                    <span>Pengguna ini telah diblokir</span>
                  </div>
                </article>
              );
            }

            return (
              <article
                key={comment.id}
                ref={(el) => {
                  commentRefs.current[comment.id] = el;
                }}
                className={`py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 transition-colors duration-500 px-2 -mx-2 ${isHighlighted ? "bg-blue-50 dark:bg-blue-900/20 rounded-xl" : ""}`}
              >
                {parentComment && (
                  <QuoteBlock
                    comment={parentComment}
                    onClick={() => navigateToComment(parentComment.id)}
                  />
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={authorAvatar} name={authorName} />
                    <div className="flex items-center gap-1.5">
                      <strong
                        className={`text-sm font-medium ${isAuthorBlocked ? "line-through text-zinc-400" : ""}`}
                      >
                        {authorName}
                      </strong>
                      {authorRole === "moderator" && (
                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          MOD
                        </span>
                      )}
                      {isAuthorBlocked && (
                        <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          DIBLOKIR
                        </span>
                      )}
                      {comment.anonymous_id && !comment.user_id && (
                        <span className="bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 text-[10px] px-1.5 py-0.5 rounded-full">
                          Anonim
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <time className="text-xs text-zinc-400">
                      {new Date(comment.created_at).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {isModerator &&
                      comment.user_id &&
                      comment.user_id !== user?.id && (
                        <button
                          onClick={() =>
                            handleToggleBlock(comment.user_id!, isAuthorBlocked)
                          }
                          className={
                            isAuthorBlocked
                              ? "text-green-500 hover:text-green-600"
                              : "text-orange-500 hover:text-orange-600"
                          }
                          title={isAuthorBlocked ? "Buka Blokir" : "Blokir"}
                        >
                          {isAuthorBlocked ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Ban className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    {isModerator && comment.anonymous_id && (
                      <button
                        onClick={() =>
                          handleBlockAnonymous(comment.anonymous_id!)
                        }
                        className="text-orange-500 hover:text-orange-600"
                        title="Blokir pengguna anonim ini"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canDeleteComment(comment) && (
                      <button
                        onClick={() => handleDelete(comment)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-zinc-700 dark:text-zinc-200 text-sm leading-relaxed pl-[42px]">
                  {renderCommentContent(comment.content)}
                  {(() => {
                    const ytUrl = extractYtUrlFromContent(comment.content);
                    return ytUrl ? (
                      <MiniMusicPlayer
                        url={ytUrl}
                        commentId={comment.id}
                        activePlayer={activePlayer}
                        setActivePlayer={setActivePlayer}
                      />
                    ) : null;
                  })()}

                  {/* Reactions */}
                  {(() => {
                    const summary = getReactionSummary(comment.id);
                    const active = EMOJIS.filter((e) => summary[e].count > 0);
                    return (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {active.map((emoji) => {
                          const key = `${comment.id}:${emoji}`;
                          const isHovered = hoveredReaction === key;
                          const reactorIds = getReactorUserIds(
                            comment.id,
                            emoji,
                          );
                          return (
                            <div key={emoji} className="relative">
                              <button
                                onClick={() =>
                                  user && handleReaction(comment.id, emoji)
                                }
                                onMouseEnter={() => setHoveredReaction(key)}
                                onMouseLeave={() => setHoveredReaction(null)}
                                onTouchStart={() =>
                                  setHoveredReaction(isHovered ? null : key)
                                }
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs transition-all ${
                                  summary[emoji].reacted
                                    ? "border-blue-400 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="font-medium tabular-nums">
                                  {summary[emoji].count}
                                </span>
                              </button>
                              {isHovered && (
                                <ReactorTooltip
                                  names={summary[emoji].names}
                                  currentUserId={user?.id}
                                  reactorUserIds={reactorIds}
                                />
                              )}
                            </div>
                          );
                        })}

                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              disabled={!user}
                              title={
                                user ? "Tambah reaksi" : "Login untuk bereaksi"
                              }
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <SmilePlus className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            align="start"
                            className="w-fit p-1.5 rounded-2xl flex gap-1 flex-row shadow-lg"
                          >
                            {EMOJIS.map((emoji) => {
                              const s = getReactionSummary(comment.id);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleReaction(comment.id, emoji)
                                  }
                                  className={`text-lg leading-none p-1.5 rounded-xl transition-all hover:scale-125 ${s[emoji].reacted ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </PopoverContent>
                        </Popover>
                      </div>
                    );
                  })()}

                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <button
                      onClick={() => setReplyTarget(comment)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                    >
                      <Reply className="h-3.5 w-3.5" /> Balas
                    </button>
                  </div>
                </div>
              </article>
            );
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-8 min-w-[32px] items-center justify-center border border-zinc-200 dark:border-zinc-700 px-3 text-xs font-medium transition-colors ${
                    pageNum === currentPage
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}
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
  );
}
