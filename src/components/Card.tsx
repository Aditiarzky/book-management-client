import { Link } from '@tanstack/react-router';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import type { IBook, IMeta } from '../types/core.types';
import { DETAIL_PAGE } from '../routes/constants';
import Sekeleton from './Sekeleton';
import { Button } from './ui/button';
import { CircleArrowRight, Loader2 } from 'lucide-react';

export const KontenCard = ({ books, meta, loading, loadMoreBooks, isLoadingNextPage,}: {meta:IMeta, loadMoreBooks:() => Promise<void>, isLoadingNextPage:boolean, books: IBook[], loading:boolean }) => {
  return (
    <div className="p-5 w-full">
      <Swiper
        spaceBetween={15}
        slidesPerView={'auto'}
        className="w-full"
      >
        {loading ? (
          // Menampilkan skeleton saat loading awal
          Array.from({ length: 10 }).map((_, i) => (
            <SwiperSlide
              key={`bookSekeletonWrap-${i}`}
              style={{ width: '144px' }} // 36 * 4 = 144px
              className="!w-fit"
            >
              <Sekeleton height="160px" width="9rem" key={`bookSekeleton-${i}`} />
            </SwiperSlide>
          ))
        ) : (
          books.map((book) => (
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
          ))
        )}
{meta.page < meta.totalPages && (
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
                    {isLoadingNextPage ? <Loader2 className='animate-spin'/> : <CircleArrowRight/>}
                  </Button>
                </div>
              </SwiperSlide>
            )}
      </Swiper>
    </div>
  );
};
