import { BookOpenText, Facebook, AlertCircle, RefreshCw, Loader, ChevronDown } from "lucide-react";
import type { IChapter } from '../../types/core.types';
import { KontenCard } from '../../components/Card';
import useChapterStore from '../../store/useChapterStore';
import useBookStore from '../../store/useBookStore';
import NewCh from "../../components/NewCh";

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
const ChapterCardSkeleton = () => (
  <div className="flex gap-3 p-2.5 rounded-2xl bg-white dark:bg-white/3 border border-gray-100 dark:border-white/5 animate-pulse">
    <div className="w-14 h-20 rounded-xl bg-gray-200 dark:bg-white/8 shrink-0" />
    <div className="flex-1 py-0.5 flex flex-col justify-between">
      <div className="space-y-1.5">
        <div className="h-2.5 w-12 bg-gray-200 dark:bg-white/8 rounded-md" />
        <div className="h-3.5 w-full bg-gray-200 dark:bg-white/8 rounded-md" />
        <div className="h-3.5 w-3/4 bg-gray-200 dark:bg-white/8 rounded-md" />
      </div>
      <div className="h-2.5 w-20 bg-gray-200 dark:bg-white/8 rounded-md" />
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
export const EmptyState = ({ title, description, icon: Icon = AlertCircle, onRefresh }: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
      <Icon className="h-6 w-6 text-gray-400 dark:text-white/20" />
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

/* ─────────────────────────────────────────────
   FACEBOOK EMBED
───────────────────────────────────────────── */
const FbPage = () => (
  <div className="flex flex-col md:flex-row gap-4 justify-center items-center overflow-x-auto py-2">
    {[
      'https://www.facebook.com/riztranslation',
      'https://www.facebook.com/riztranslations',
    ].map(href => (
      <div key={href} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shrink-0 shadow-sm">
        <iframe
          src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(href)}&tabs=timeline&width=340&height=480&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
          width="340" height="480"
          style={{ border: 'none', overflow: 'hidden', display: 'block' }}
          scrolling="no" frameBorder="0" allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────────
   CHAPTER CORNER
───────────────────────────────────────────── */
export const ChCorner = ({ chapters, loading }: { chapters: IChapter[]; loading: boolean }) => {
  const { meta, isLoadingNextPage, loadMoreLatestChapters: loadMoreChapters } = useChapterStore();
  const safeMeta = meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="w-full">
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <ChapterCardSkeleton key={i} />)}
        </div>
      ) : chapters.length === 0 ? (
        <EmptyState
          title="Belum Ada Chapter"
          description="Belum ada chapter terbaru. Coba refresh halaman."
          onRefresh={() => window.location.reload()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {chapters.map(chapter => (
              <NewCh
                key={chapter.id}
                judul={chapter.book.judul}
                chapter={chapter.chapter}
                thumbnail={chapter.thumbnail}
                cover={chapter.book.cover}
                created_at={chapter.created_at}
                volume={chapter.volume}
                id={chapter.id}
                tipe={chapter.book.type}
                bookId={chapter.bookId}
              />
            ))}
            {isLoadingNextPage && Array.from({ length: 3 }).map((_, i) => <ChapterCardSkeleton key={`next-${i}`} />)}
          </div>

          {safeMeta.page < safeMeta.totalPages && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMoreChapters}
                disabled={isLoadingNextPage}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/8 text-gray-600 dark:text-white/50 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingNextPage
                  ? <><Loader className="h-4 w-4 animate-spin" /> Memuat...</>
                  : <><ChevronDown className="h-4 w-4" /> Muat Lebih Banyak</>
                }
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
      <Icon className="h-4 w-4 text-gray-500 dark:text-white/40" />
    </div>
    <h2 className="text-base font-semibold text-gray-800 dark:text-white/80">{title}</h2>
    <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
  </div>
);

/* ─────────────────────────────────────────────
   HOME
───────────────────────────────────────────── */
export default function HomeComponent() {
  const { latestChapters: chapters, loading: loadingCh } = useChapterStore();
  const { books, loading: loadingBook, isLoadingNextPage, meta, loadMoreBooks } = useBookStore();

  return (
    <main className="w-full max-w-6xl mx-auto px-4 py-4 space-y-10">

      {/* ── Book shelf ── */}
      <section>
        <KontenCard
          loadMoreBooks={loadMoreBooks}
          loading={loadingBook}
          books={books}
          isLoadingNextPage={isLoadingNextPage}
          meta={meta}
        />
      </section>

      {/* ── Latest chapters ── */}
      <section>
        <SectionHeader icon={BookOpenText} title="Chapter Terbaru" />
        <ChCorner loading={loadingCh} chapters={chapters || []} />
      </section>

      {/* ── Facebook ── */}
      <section>
        <SectionHeader icon={Facebook} title="Facebook Page" />
        <FbPage />
      </section>

    </main>
  );
}
