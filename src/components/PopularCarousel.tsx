import { useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import { Heart, ChevronLeft, ChevronRight, BookOpen, Flame } from 'lucide-react';
import { DETAIL_PAGE } from '@/routes/constants';
import usePopularStore from '@/store/usePopularStore';
import type { IBook } from '@/types/core.types';
import noImage from '@/placeholder.gif';

/* ── utils ── */
const STATUS_COLOR: Record<string, string> = {
  ongoing: 'bg-emerald-400',
  completed: 'bg-blue-400',
  hiatus: 'bg-amber-400',
  dropped: 'bg-red-400',
};

function formatLike(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/* ── Skeleton ── */
const HeroSkeleton = () => (
  <div className="relative w-full h-[260px] sm:h-[320px] rounded-2xl overflow-hidden animate-pulse bg-gray-200 dark:bg-white/8">
    <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
      <div className="h-3 w-16 rounded bg-gray-300 dark:bg-white/10" />
      <div className="h-5 w-48 rounded bg-gray-300 dark:bg-white/10" />
      <div className="h-3 w-32 rounded bg-gray-300 dark:bg-white/10" />
    </div>
  </div>
);

/* ── Thumb pill ── */
const ThumbPill = ({
  book, active, onClick,
}: {
  book: IBook; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`shrink-0 transition-all duration-300 ${active ? 'opacity-100 ring-2 ring-white/60 ring-offset-1 ring-offset-black/20' : 'opacity-50 hover:opacity-75'}`}
  >
    <div className="w-10 h-14 sm:w-12 sm:h-[68px] rounded-xl overflow-hidden">
      <img
        src={book.cover || noImage}
        alt={book.judul}
        className="w-full h-full object-cover"
        onError={e => { e.currentTarget.src = noImage; }}
      />
    </div>
  </button>
);

/* ── Main component ── */
export default function PopularCarousel() {
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  // Extend IBook type locally to include likeCount, which is present in the data but not in the IBook interface
  type BookWithLikeCount = IBook & {
    likeCount?: number;
  };

  const { popularBooks, loading } = usePopularStore(10);
  // Assert the popularBooks array to the extended type to avoid 'any' casts
  const books: BookWithLikeCount[] = popularBooks;

  if (loading) return <HeroSkeleton />;
  if (books.length === 0) return null;

  // 'active' variable was declared but never used, so it's removed.

  const goTo = (idx: number) => {
    swiperRef.current?.slideTo(idx);
  };

  return (
    <div className="relative w-full">
      <style>{`
        .popular-swiper { overflow: hidden !important; }
        .popular-swiper .swiper-wrapper { align-items: stretch; }
        .popular-swiper .swiper-slide {
          position: relative !important;
          overflow: hidden !important;
          width: 100% !important;
          flex-shrink: 0;
        }
      `}</style>
      {/* ── Section label ── */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-xl bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-white/70">Terpopuler</span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
      </div>

      {/* ── Hero slider ── */}
      <div className="relative rounded-2xl overflow-hidden select-none">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={books.length > 1}
          onSwiper={sw => { swiperRef.current = sw; }}
          onSlideChange={sw => setActiveIdx(sw.realIndex)}
          className="popular-swiper w-full h-[260px] sm:h-[320px]"
        >
          {books.map(book => (
            <SwiperSlide key={book.id} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>
              {/* Background cover blur */}
              <div className="absolute inset-0">
                <img
                  src={book.cover || noImage}
                  alt=""
                  className="w-full h-full object-cover scale-110 blur-xs brightness-80"
                  onError={e => { e.currentTarget.src = noImage; }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-full flex items-end">
                <div className="flex items-end gap-4 p-5 w-full">
                  {/* Cover */}
                  <Link to={DETAIL_PAGE} params={{ id: `${book.id}` }} className="shrink-0 hidden sm:block">
                    <div className="w-[90px] h-[128px] rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/10">
                      <img
                        src={book.cover || noImage}
                        alt={book.judul}
                        className="w-full h-full object-cover"
                        onError={e => { e.currentTarget.src = noImage; }}
                      />
                    </div>
                  </Link>

                  {/* Meta */}
                  <div className="flex-1 min-w-0 pb-1">
                    {/* Type + status */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {book.type && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                          {book.type}
                        </span>
                      )}
                      {book.status && (
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[book.status.toLowerCase()] ?? 'bg-gray-400'}`} />
                      )}
                      {book.status && (
                        <span className="text-[10px] text-white/40 capitalize">{book.status}</span>
                      )}
                    </div>

                    {/* Title */}
                    <Link to={DETAIL_PAGE} params={{ id: `${book.id}` }}>
                      <h2 className="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-2 hover:text-white/80 transition-colors">
                        {book.judul}
                      </h2>
                    </Link>

                    {/* Author */}
                    <p className="text-xs text-white/40 mt-0.5 truncate">{book.author}</p>

                    {/* Genres */}
                    {book.genres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {book.genres.slice(0, 3).map(g => (
                          <span key={g.id} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60">
                            {g.nama}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-3">
                      {/* Like count */}
                      {book.likeCount !== undefined && book.likeCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                          <span className="text-xs font-semibold text-white/70">
                            {formatLike(book.likeCount)}
                          </span>
                        </div>
                      )}
                      {/* Chapter count */}
                      {book.chapters?.length > 0 && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-white/30" />
                          <span className="text-xs text-white/40">
                            {book.chapters.length} chapter
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── Prev / Next buttons ── */}
        {books.length > 1 && (
          <>
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-sm items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-sm items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* ── Rank badge ── */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/90 backdrop-blur-sm">
          <Flame className="w-3 h-3 text-white" />
          <span className="text-[11px] font-bold text-white">#{activeIdx + 1}</span>
        </div>

        {/* ── Dot indicators (mobile) / Thumb pills (sm+) ── */}
        <div className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5">
          {/* Thumb pills — hidden on mobile, visible sm+ */}
          <div className="hidden sm:flex items-center gap-1.5">
            {books.map((book, i) => (
              <ThumbPill
                key={book.id}
                book={book}
                active={i === activeIdx}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          {/* Dot indicators — mobile only */}
          <div className="flex sm:hidden items-center gap-1">
            {books.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === activeIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
