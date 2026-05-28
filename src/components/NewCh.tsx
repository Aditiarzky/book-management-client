import { Link } from "@tanstack/react-router";
import { DETAIL_PAGE, VIEW_PAGE } from "@/routes/constants";
import { isWithinOneWeek, getSmartDate, slugify } from "../utils/format";
import { Eye } from "lucide-react";
import noImage from "@/placeholder.gif";
import { formatVisitCount } from "@/lib/format";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface ChapterMixBook {
  type?: number;
  judul: string;
  cover: string;
  bookId: number;
  chapter: number;
  thumbnail: string | null;
  volume: number | null;
  id: number;
  created_at: Date;
  nama?: string;
  tipe: string | null;
  visitCount?: number;
}

interface ChProps {
  thumbnail: string | null;
  id: number;
  bookId: number;
  chapter: number;
  volume: number | null;
  created_at: Date;
  nama?: string;
  type?: number;
  visitCount?: number;
}

/* ─────────────────────────────────────────────
   NEW BADGE — shown within one week
───────────────────────────────────────────── */
const NewBadge = ({ created_at }: { created_at: Date | string }) => {
  if (!isWithinOneWeek(created_at)) return null;
  return (
    <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold uppercase tracking-wide leading-none">
      New
    </span>
  );
};

/* ─────────────────────────────────────────────
   Ch — chapter thumbnail card
   type=1 → large (used in DetailComponent)
   type=0/undefined → small (used in HomeComponent sidebar/grid)
───────────────────────────────────────────── */
export const Ch = ({
  thumbnail,
  chapter,
  volume,
  nama,
  created_at,
  bookId,
  id,
  type,
  visitCount = 0,
}: ChProps) => {
  const date = getSmartDate(created_at);
  const chapterLabel = `Ch ${chapter}${volume ? ` · Vol ${volume}` : ""}`;

  /* ── Large card (type=1, used in detail page) ── */
  if (type === 1) {
    return (
      <Link
        to={VIEW_PAGE}
        params={{ bookId: bookId.toString(), id: id.toString() }}
        className="block w-fit group"
      >
        <div className="relative w-36 h-28 rounded-xl overflow-hidden">
          <NewBadge created_at={created_at} />
          <img
            src={thumbnail || noImage}
            alt={chapterLabel}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-[11px] font-semibold leading-tight">
              {chapterLabel}
            </p>
            {nama && (
              <p className="text-white/70 text-[10px] leading-tight truncate">
                {nama}
              </p>
            )}
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-white/50 text-[9px]">{date}</p>
              <p className="inline-flex items-center gap-1 text-white/70 text-[9px]">
                <Eye className="h-2.5 w-2.5" />
                <span className="pt-0.5">{formatVisitCount(visitCount)}</span>
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  /* ── Small card (type=0, used in home page grid) ── */
  return (
    <div className="relative w-[110px] h-20 rounded-xl overflow-hidden group">
      <NewBadge created_at={created_at} />
      <img
        src={thumbnail || noImage}
        alt={chapterLabel}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-1.5">
        <p className="text-white text-[10px] font-semibold leading-tight truncate">
          {chapterLabel}
          {nama ? ` · ${nama}` : ""}
        </p>
        <p className="text-white/50 text-[9px]">{date}</p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   NewCh — home page latest chapter card
   (cover + chapter info side-by-side)
───────────────────────────────────────────── */
const NewCh = ({
  tipe,
  judul,
  chapter,
  nama,
  created_at,
  cover,
  thumbnail,
  volume,
  id,
  bookId,
  visitCount = 0,
}: ChapterMixBook) => {
  const date = getSmartDate(created_at);
  const chapterLabel = `Ch ${chapter}${volume ? ` · Vol ${volume}` : ""}`;
  const isNew = isWithinOneWeek(created_at);

  return (
    <div className="relative flex gap-3 p-2.5 rounded-2xl border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-all group cursor-pointer overflow-hidden">
      {/* Thumbnail background */}
      {(thumbnail || cover) && (
        <div className="absolute inset-0 z-0">
          <img
            src={thumbnail || cover || noImage}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-20 dark:opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/40 to-white/80 dark:from-gray-950/70 dark:via-gray-950/50 dark:to-gray-950/80" />
        </div>
      )}

      {/* Cover */}
      <Link
        to={DETAIL_PAGE}
        params={{ id: `${bookId}` }}
        search={{ title: slugify(judul) }}
        className="relative z-10 shrink-0"
      >
        <div className="w-24 h-32 rounded-xl overflow-hidden shadow-sm">
          <img
            src={cover || noImage}
            alt={judul}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Info */}
      <Link
        to={VIEW_PAGE}
        params={{ bookId: `${bookId}`, id: `${id}` }}
        className="relative z-10 flex-1 min-w-0 flex flex-col justify-between py-0.5"
      >
        <div className="space-y-0.5">
          {tipe && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">
              {tipe}
            </span>
          )}
          <h2 className="text-[13px] font-semibold text-gray-800 dark:text-white/85 line-clamp-2 leading-snug">
            {judul}
          </h2>
          <p className="text-xs text-gray-500 dark:text-white/45 font-medium truncate">
            {chapterLabel}
            {nama ? ` · ${nama}` : ""}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-gray-400 dark:text-white/30">
            <Eye className="h-3 w-3" />
            <span className="text-[10px]">{formatVisitCount(visitCount)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isNew && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-500 dark:text-red-400 text-[9px] font-bold uppercase tracking-wide leading-none">
                New
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-white/30">
              {date}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NewCh;
