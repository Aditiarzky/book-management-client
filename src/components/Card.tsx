import { Link } from '@tanstack/react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import type { IBook, IMeta } from '../types/core.types';
import { DETAIL_PAGE } from '../routes/constants';
import Sekeleton from './Sekeleton';
import { Button } from './ui/button';
import { CircleArrowRight, Loader } from 'lucide-react';
import { EmptyState } from '@/pages/home/Component';

export const KontenCard = ({ 
  books, 
  meta, 
  loading, 
  loadMoreBooks, 
  isLoadingNextPage 
}: { 
  meta?: IMeta; // Make meta optional
  loadMoreBooks: () => Promise<void>; 
  isLoadingNextPage: boolean; 
  books: IBook[]; 
  loading: boolean 
}) => {
  // Provide default values for meta if it's undefined
  const safeMeta = meta || { total: 0, page: 1, limit: 10, totalPages: 1 };
  
  return (
    <div className="p-5 w-full">
      {loading ? (
        // Menampilkan skeleton saat loading awal
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`bookSekeletonWrap-${i}`}
              style={{ width: '144px', flexShrink: 0 }} // 36 * 4 = 144px
            >
              <Sekeleton height="160px" width="9rem" key={`bookSekeleton-${i}`} />
            </div>
          ))}
        </div>
      ) : !books || books.length === 0 ? (
        <EmptyState 
          title="No Books Available"
          description="No books found. Please try refreshing the page."
          onRefresh={() => window.location.reload()}
        />
      ) : (
        <Swiper
          spaceBetween={15}
          slidesPerView={'auto'}
          className="w-full"
        >
          {books.map((book) => (
            <SwiperSlide
              key={book.id}
              style={{ width: '144px' }} // 36 * 4 = 144px
              className="!w-fit"
            >
              <Link to={DETAIL_PAGE} params={{ id: `${book.id}` }} className="hov-b block">
                <article
                  className="h-40 w-36 mb-3 drop-shadow-md rounded-lg bg-cover bg-center"
                  title={book.judul}
                  style={{
                    backgroundImage: `url(${book.cover})`,
                  }}
                >
                  <div className="h-40 z-10 w-36 rounded-lg bg-gradient-to-t from-gray-900/50">
                    <div className="p-2 z-20 text-white flex flex-col justify-end h-40">
                      <h1 className="text-md leading-tight font-semibold line-clamp-3 wrap-break-word">{book.judul}</h1>
                      <p className="text-sm">{book.type ?? 'Unknown'}</p>
                    </div>
                  </div>
                </article>
              </Link>
            </SwiperSlide>
          ))}
          {safeMeta.page < safeMeta.totalPages && (
            <SwiperSlide
              style={{ width: '144px' }} // Sesuaikan lebar dengan slide buku
              className="!w-fit"
            >
              <div className="h-40 mb-3 flex items-center justify-center">
                <Button
                  onClick={loadMoreBooks}
                  disabled={isLoadingNextPage}
                  variant='outline'
                >
                  {isLoadingNextPage ? <Loader className='animate-spin'/> : <CircleArrowRight/>}
                </Button>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      )}
    </div>
  );
};