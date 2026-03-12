import { Link } from '@tanstack/react-router';
import { DETAIL_PAGE, VIEW_PAGE } from '@/routes/constants';
import { formatDate, formatDistanceToNow, isWithinOneMonth, isWithinOneWeek } from '../utils/format';
import noImage from '@/placeholder.gif';

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
}

/* ─────────────────────────────────────────────
   DATE HELPER
───────────────────────────────────────────── */
function getFormattedDate(created_at: Date): string {
  const d = new Date(created_at);
  if (isWithinOneWeek(d)) return formatDistanceToNow(d);
  if (isWithinOneMonth(d)) return formatDistanceToNow(d, { includeSeconds: true });
  return formatDate(d);
}

/* ─────────────────────────────────────────────
   NEW BADGE — shown within one week
───────────────────────────────────────────── */
const NewBadge = ({ created_at }: { created_at: Date }) => {
  if (!isWithinOneWeek(new Date(created_at))) return null;
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
export const Ch = ({ thumbnail, chapter, volume, nama, created_at, bookId, id, type }: ChProps) => {
  const date = getFormattedDate(created_at);
  const chapterLabel = `Ch ${chapter}${volume ? ` · Vol ${volume}` : ''}`;

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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-[11px] font-semibold leading-tight">{chapterLabel}</p>
            {nama && <p className="text-white/70 text-[10px] leading-tight truncate">{nama}</p>}
            <p className="text-white/50 text-[9px] mt-0.5">{date}</p>
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
          {chapterLabel}{nama ? ` · ${nama}` : ''}
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
const NewCh = ({ tipe, judul, chapter, nama, created_at, cover, volume, id, bookId }: ChapterMixBook) => {
  const date = getFormattedDate(created_at);
  const chapterLabel = `Ch ${chapter}${volume ? ` · Vol ${volume}` : ''}`;
  const isNew = isWithinOneWeek(new Date(created_at));

  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-white dark:bg-white/3 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all group cursor-pointer">
      {/* Cover */}
      <Link to={DETAIL_PAGE} params={{ id: `${bookId}` }} className="shrink-0 relative">
        <div className="w-16 h-24 rounded-xl overflow-hidden">
          <img
            src={cover || noImage}
            alt={judul}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Info */}
      <Link to={VIEW_PAGE} params={{ bookId: `${bookId}`, id: `${id}` }} className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div>
          {tipe && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25">{tipe}</span>
          )}
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white/80 line-clamp-2 leading-snug mt-0.5">
            {judul}
          </h2>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-gray-500 dark:text-white/40 font-medium">
            {chapterLabel}{nama ? ` · ${nama}` : ''}
          </span>
          <div className="flex items-center gap-1.5">
            {isNew && (
              <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 dark:text-red-400 text-[9px] font-bold uppercase tracking-wide">
                New
              </span>
            )}
            <span className="text-[10px] text-gray-400 dark:text-white/25">{date}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NewCh;
