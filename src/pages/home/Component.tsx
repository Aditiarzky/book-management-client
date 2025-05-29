import { BookOpenText, Loader2, PanelTop } from "lucide-react";
import type {IChapter } from '../../types/core.types';
import { KontenCard } from '../../components/Card';
import useChapterStore from '../../store/useChapterStore';
import useBookStore from '../../store/useBookStore';
import NewCh from "../../components/NewCh";
import Sekeleton from "../../components/Sekeleton";
import { Button } from "@/components/ui/button";

const FbPage = () => {
  return (
    <div className="flex-col md:flex-row flex w-full gap-5 overflow-scroll justify-center items-center">
        <div style={{height: '500px' }}>
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Friztranslation&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
              width="340"
              height="500"
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            ></iframe>
        </div>
        <div style={{height: '500px' }}>
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Friztranslations&tabs=timeline&width=340&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
              width="340"
              height="500"
              style={{ border: 'none', overflow: 'hidden' }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen={true}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            ></iframe>
        </div>
    </div>
  );
};

export const ChapterCardSkeleton = () => {
  return (
    <div className="w-fit items-end flex gap-2 animate-pulse mr-3">
      {/* Card Image */}
      <Sekeleton width="110px" height="160px" borderRadius="0.5rem" />

      {/* Content Box */}
      <div className="mt-2 w-[110px]">
        <Sekeleton width="60%" height="12px" className="mb-1" />
        <Sekeleton width="100px" height="80px" />
      </div>
    </div>
  );
};

export const ChCorner = ({ chapters, loading }: { chapters: IChapter[]; loading:boolean }) => {
  const { meta, isLoadingNextPage, loadMoreChapters } = useChapterStore();

  return (
    <article className="p-5 w-full">
    {loading ? (
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-2 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <ChapterCardSkeleton key={`chSekeleton-${i}`}/>
          ))}
        </div>
    ):(
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-2 w-full">
        {chapters.map((chapter) => (
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
        {isLoadingNextPage &&
          Array.from({ length: 6 }).map((_, i) => (
            <ChapterCardSkeleton key={`nextPage-${i}`} />
        ))}
      </div>
    )}
      {meta.page < meta.totalPages && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={loadMoreChapters}
            disabled={isLoadingNextPage}
          >
            {isLoadingNextPage ? <Loader2 className="animate-spin"/> : 'Load More'}
          </Button>
        </div>
      )}
    </article>
  );
};

export default function HomeComponent() {

  const {chapters, loading: loadingCh} = useChapterStore();
  const {books, loading: loadingBook, isLoadingNextPage, meta, loadMoreBooks} = useBookStore();

  return (
    <div>
      <main className="transition-all w-full duration-500 max-w-6xl mx-auto md:px-4 px-2">
        <div>
          {/* Content */}
          <header className="h-fit w-full bg-center bg-cover relative">
            <KontenCard loadMoreBooks={loadMoreBooks} loading={loadingBook} books={books} isLoadingNextPage={isLoadingNextPage} meta={meta}/>
          </header>
          <div className="w-full">
            <h1 className="text-2xl px-3 font-semibold flex items-center gap-2"><BookOpenText/> Latest Chapter</h1>
          </div>
          <section className="flex flex-wrap md:flex-nowrap">
            <ChCorner loading={loadingCh} chapters={chapters}/>
          </section>
          <div className="w-full">
            <h1 className="text-2xl px-3 items-center flex gap-2 font-semibold"><PanelTop/> Facebook Page</h1>
          </div>
          <section className="py-5 md:p-5">
            <FbPage />
          </section>
        </div>
      </main>
    </div>
  );
}