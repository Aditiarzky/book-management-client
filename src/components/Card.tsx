import { Link } from '@tanstack/react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import 'swiper/css';
import type { IBook, IMeta } from '../types/core.types';
import { DETAIL_PAGE } from '../routes/constants';
import { Loader, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/pages/home/Component';

/* ─────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────── */
const BookSkeleton = () => (
  <div className="animate-pulse shrink-0 w-32">
    <div className="h-44 w-32 rounded-2xl bg-gray-200 dark:bg-white/8 mb-2" />
    <div className="h-3 w-20 bg-gray-200 dark:bg-white/8 rounded-md mb-1.5" />
    <div className="h-2.5 w-12 bg-gray-200 dark:bg-white/8 rounded-md" />
  </div>
);

/* ─────────────────────────────────────────────
   BOOK CARD
───────────────────────────────────────────── */
const BookCard = ({ book }: { book: IBook }) => (
  <Link to={DETAIL_PAGE} params={{ id: `${book.id}` }} className="block group shrink-0 w-32">
    <div className="relative h-44 w-32 rounded-2xl overflow-hidden mb-2 shadow-md">
      {/* Cover image */}
      <img
        src={book.cover || '/placeholder-cover.jpg'}
        alt={book.judul}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Type badge */}
      {book.type && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold uppercase tracking-wide">
          {book.type}
        </span>
      )}

      {/* Status dot */}
      {book.status && (
        <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white/30 ${book.status.toLowerCase() === 'ongoing' ? 'bg-emerald-400' :
            book.status.toLowerCase() === 'completed' ? 'bg-blue-400' :
              book.status.toLowerCase() === 'hiatus' ? 'bg-amber-400' : 'bg-gray-400'
          }`} title={book.status} />
      )}

      {/* Title at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{book.judul}</p>
      </div>
    </div>
  </Link>
);

/* ─────────────────────────────────────────────
   LOAD MORE SLIDE
───────────────────────────────────────────── */
const LoadMoreSlide = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="flex flex-col items-center justify-center gap-2 h-44 w-28 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/25 hover:border-gray-300 dark:hover:border-white/20 hover:text-gray-500 dark:hover:text-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading
      ? <Loader className="h-5 w-5 animate-spin" />
      : <>
        <ChevronRight className="h-5 w-5" />
        <span className="text-xs font-medium">Lihat<br />lainnya</span>
      </>
    }
  </button>
);

/* ─────────────────────────────────────────────
   KONTEN CARD
───────────────────────────────────────────── */
export const KontenCard = ({
  books,
  meta,
  loading,
  loadMoreBooks,
  isLoadingNextPage,
}: {
  meta?: IMeta;
  loadMoreBooks: () => Promise<void>;
  isLoadingNextPage: boolean;
  books: IBook[];
  loading: boolean;
}) => {
  const safeMeta = meta || { total: 0, page: 1, limit: 10, totalPages: 1 };
  const hasMore = safeMeta.page < safeMeta.totalPages;

  if (loading) {
    return (
      <div className="w-full overflow-hidden">
        <div className="flex gap-3 pb-2">
          {Array.from({ length: 8 }).map((_, i) => <BookSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <EmptyState
        title="Belum Ada Buku"
        description="Belum ada buku yang tersedia."
        onRefresh={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="w-full">
      <Swiper
        modules={[FreeMode, Autoplay]}
        spaceBetween={12}
        slidesPerView="auto"
        freeMode={{ enabled: true, momentum: true, momentumRatio: 0.6 }}
        autoplay={{ delay: 3000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        grabCursor
        className="w-full"
      >
        {books.map(book => (
          <SwiperSlide key={book.id} style={{ width: 'auto' }}>
            <BookCard book={book} />
          </SwiperSlide>
        ))}

        {hasMore && (
          <SwiperSlide style={{ width: 'auto' }}>
            <div className="flex items-start pt-0">
              <LoadMoreSlide onClick={loadMoreBooks} loading={isLoadingNextPage} />
            </div>
          </SwiperSlide>
        )}
      </Swiper>
    </div>
  );
};
