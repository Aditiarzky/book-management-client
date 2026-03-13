import { Ch } from '@/components/NewCh';
import type { IBook } from '@/types/core.types';
import { useState } from 'react';
import SupabaseCommentEmbed from '@/components/SupabaseCommentEmbed';
import LikeButton from '@/components/LikeButton';
import { AlertCircle, RefreshCw, BookOpen, Users, Palette, Tag, ArrowUpDown, ChevronDown, MessageSquare, Info, List } from 'lucide-react';

interface DetailInterface {
  book: IBook | null;
}

const EmptyState = ({ title, description, onRefresh }: {
  title: string;
  description: string;
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h2 className="text-gray-500 dark:text-white/30 text-sm mb-4 max-w-xs">{title}</h2>
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
      <AlertCircle className="h-6 w-6 text-gray-400 dark:text-white/20" />
    </div>
    <p className="text-gray-500 dark:text-white/30 text-sm mb-4 max-w-xs">{description}</p>
    {onRefresh && (
      <button onClick={onRefresh}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 text-sm transition-all">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
    )}
  </div>
);

const StatusBadge = ({ status }: { status?: string }) => {
  const map: Record<string, string> = {
    ongoing: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    completed: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
    hiatus: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    dropped: 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400',
  };
  const key = (status || '').toLowerCase();
  const cls = map[key] || 'bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/40';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {status || 'Unknown'}
    </span>
  );
};

const ChapterList = ({ book }: { book: IBook }) => {
  const [sortOrder, setSortOrder] = useState<'ascending' | 'descending'>(() =>
    (localStorage.getItem('sortOrder') as 'ascending' | 'descending') || 'ascending'
  );

  const handleSort = (v: 'ascending' | 'descending') => {
    setSortOrder(v);
    localStorage.setItem('sortOrder', v);
  };

  const sorted = [...(book.chapters || [])].sort((a, b) => {
    const va = a.volume ?? 0, vb = b.volume ?? 0;
    if (sortOrder === 'ascending') return va !== vb ? va - vb : a.chapter - b.chapter;
    return va !== vb ? vb - va : b.chapter - a.chapter;
  });

  if (!sorted.length) return (
    <EmptyState title="Belum Ada Chapter" description="Chapter akan segera hadir. Pantau terus!" onRefresh={() => window.location.reload()} />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 dark:text-white/30 text-xs font-medium">
          {sorted.length} chapter
        </p>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
          {(['ascending', 'descending'] as const).map(o => (
            <button key={o} onClick={() => handleSort(o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortOrder === o
                ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white'}`}>
              <ArrowUpDown className="h-3 w-3" />
              {o === 'ascending' ? 'Terlama' : 'Terbaru'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {sorted.map(chapter => (
          <div key={chapter.id} className="drop-shadow-sm">
            <Ch
              type={1}
              chapter={chapter.chapter}
              thumbnail={chapter.thumbnail}
              created_at={chapter.created_at}
              volume={chapter.volume}
              id={chapter.id}
              bookId={chapter.bookId}
              nama={chapter.nama}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const InfoTab = ({ book }: { book: IBook }) => {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const synopsis = book.synopsis || '';
  const isLong = synopsis.length > 300;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5 overflow-hidden">
        {[
          { icon: BookOpen, label: 'Alt Title', value: book.alt_judul },
          { icon: Users, label: 'Author', value: book.author },
          { icon: Palette, label: 'Artist', value: book.artist },
        ].map(({ icon: Icon, label, value }, i, arr) => (
          <div key={label} className={`flex items-start gap-4 px-5 py-3.5 ${i < arr.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}>
            <div className="flex items-center gap-2 w-20 shrink-0 mt-0.5">
              <Icon className="h-3.5 w-3.5 text-gray-300 dark:text-white/20 shrink-0" />
              <span className="text-gray-400 dark:text-white/30 text-xs font-medium">{label}</span>
            </div>
            <span className="text-gray-700 dark:text-white/70 text-sm break-words flex-1">{value || '—'}</span>
          </div>
        ))}
        <div className="flex items-start gap-4 px-5 py-3.5 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 w-20 shrink-0 mt-0.5">
            <Tag className="h-3.5 w-3.5 text-gray-300 dark:text-white/20 shrink-0" />
            <span className="text-gray-400 dark:text-white/30 text-xs font-medium">Genre</span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {(book.genres || []).length > 0 ? book.genres.map(g => (
              <span key={g.nama}
                className="px-2.5 py-0.5 rounded-lg bg-gray-200 dark:bg-white/8 text-gray-600 dark:text-white/50 text-xs font-medium">
                {g.nama}
              </span>
            )) : <span className="text-gray-400 dark:text-white/25 text-sm">—</span>}
          </div>
        </div>
      </div>
      <div>
        <p className="text-gray-800 dark:text-white/70 text-sm font-semibold mb-3 uppercase tracking-widest text-xs">Synopsis</p>
        <div className="relative">
          <div
            className={`text-gray-600 dark:text-white/50 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${!synopsisExpanded && isLong ? 'max-h-24' : 'max-h-[2000px]'}`}
            dangerouslySetInnerHTML={{ __html: synopsis || '—' }}
          />
          {!synopsisExpanded && isLong && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
          )}
        </div>
        {isLong && (
          <button onClick={() => setSynopsisExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-medium hover:opacity-80 transition-opacity">
            {synopsisExpanded ? 'Sembunyikan' : 'Selengkapnya'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${synopsisExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

function NavDetail({ book }: DetailInterface) {
  const [tab, setTab] = useState<'chapters' | 'info'>('chapters');

  return (
    <div className="mt-6">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
          {([
            { key: 'chapters', label: 'Chapter', icon: List },
            { key: 'info', label: 'Informasi', icon: Info },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${tab === key
                ? 'bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white'}`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'chapters' && (
        book ? <ChapterList book={book} /> : (
          <EmptyState title="No Book Data" description="Data buku tidak ditemukan." onRefresh={() => window.location.reload()} />
        )
      )}
      {tab === 'info' && (
        book ? <InfoTab book={book} /> : (
          <EmptyState title="No Book Info" description="Informasi buku tidak tersedia." onRefresh={() => window.location.reload()} />
        )
      )}
    </div>
  );
}

export default function DetailComponent({ book }: DetailInterface) {
  const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const commentSlug = book ? `book-${book.id}` : 'book-unknown';

  return (
    <div className="min-h-dvh">
      <main className="w-full max-w-3xl mx-auto px-4">

        {/* ── Hero cover ── */}
        <section className="mb-2">
          {book ? (
            <>
              <div className="relative h-44 w-full rounded-b-3xl overflow-hidden -mx-4 px-4"
                style={{ width: 'calc(100% + 2rem)' }}>
                <div
                  className="absolute inset-0 bg-cover bg-center scale-110"
                  style={{ backgroundImage: `url(${book.cover || '/placeholder-cover.jpg'})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-white dark:to-gray-950" />
              </div>

              <div className="relative flex flex-col items-center -mt-28 z-10">
                <div className="relative">
                  <img
                    src={book.cover || '/placeholder-cover.jpg'}
                    alt={book.judul || 'Cover'}
                    className="w-36 h-52 object-cover rounded-2xl shadow-2xl ring-2 ring-white dark:ring-gray-950"
                  />
                  {book.type && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gray-900 text-white text-xs font-semibold whitespace-nowrap shadow-lg">
                      {book.type}
                    </span>
                  )}
                </div>

                <div className="text-center mt-5 px-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
                    {book.judul || 'Unknown Title'}
                  </h1>
                  <p className="text-gray-400 dark:text-white/40 text-sm mb-3">
                    {[book.author, book.artist].filter(Boolean).join(' · ') || 'Unknown'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-4">
                    <StatusBadge status={book.status || 'unknown'} />
                    {(book.genres || []).slice(0, 3).map(g => (
                      <span key={g.nama}
                        className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-white/40 text-xs font-medium">
                        {g.nama}
                      </span>
                    ))}
                    {(book.genres || []).length > 3 && (
                      <span className="text-gray-400 dark:text-white/25 text-xs">+{book.genres.length - 3}</span>
                    )}
                  </div>

                  {/* ── Like button ── */}
                  <LikeButton type="book" targetId={book.id} variant="book" />
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Cover Tidak Tersedia"
              description="Cover buku tidak dapat dimuat."
              onRefresh={() => window.location.reload()}
            />
          )}
        </section>

        {/* ── Divider ── */}
        {book && (
          <div className="my-6 mx-auto w-16 h-px bg-gray-100 dark:bg-white/5" />
        )}

        {/* ── Tabs ── */}
        <NavDetail book={book} />
      </main>

      {/* ── Comments ── */}
      <section className="w-full max-w-3xl mx-auto px-4 py-10 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-4 w-4 text-gray-300 dark:text-white/15" />
          <span className="text-gray-400 dark:text-white/25 text-xs font-semibold uppercase tracking-widest">Komentar</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
        </div>
        {supabaseConfigured ? (
          <SupabaseCommentEmbed site="book-detail" slug={commentSlug} title="Komentar Buku" />
        ) : (
          <p className="text-gray-300 dark:text-white/15 text-xs text-center py-6">
            Set <code className="font-mono">VITE_SUPABASE_URL</code> dan <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> untuk komentar.
          </p>
        )}
      </section>
    </div>
  );
}
