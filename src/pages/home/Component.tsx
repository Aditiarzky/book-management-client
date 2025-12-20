// HomeComponent.tsx
import { BookOpenText, PanelTop, AlertCircle, RefreshCw, Loader } from "lucide-react";
import type {IChapter } from '../../types/core.types';
import { KontenCard } from '../../components/Card';
import useChapterStore from '../../store/useChapterStore';
import useBookStore from '../../store/useBookStore';
import NewCh from "../../components/NewCh";
import Sekeleton from "../../components/Sekeleton";
import { Button } from "@/components/ui/button";
import { useEffect } from 'react';

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

export const EmptyState = ({ title, description, icon: Icon = AlertCircle, onRefresh }: { 
  title: string; 
  description: string; 
  icon?: React.ComponentType<{ className?: string }>; 
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 h-full">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground/70 max-w-sm mb-4">{description}</p>
    {onRefresh && (
      <button 
        onClick={onRefresh} 
        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh Page
      </button>
    )}
  </div>
);

export const ChCorner = ({ chapters, loading }: { chapters: IChapter[]; loading:boolean }) => {
  const { meta, isLoadingNextPage, loadMoreLatestChapters:loadMoreChapters } = useChapterStore();
  const safeMeta = meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <article className="p-5 w-full">
    {loading ? (
      <div className="grid grid-cols-[repeat(auto-fill,_minmax(250px,_1fr))] gap-2 w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <ChapterCardSkeleton key={`chSekeleton-${i}`}/>
          ))}
        </div>
    ) : chapters.length === 0 ? (
      <EmptyState 
        title="No Chapters Available"
        description="No latest chapters found. Please try refreshing the page."
        onRefresh={() => window.location.reload()}
      />
    ) : (
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
      {safeMeta.page < safeMeta.totalPages && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={loadMoreChapters}
            disabled={isLoadingNextPage}
          >
            {isLoadingNextPage ? <Loader className="animate-spin"/> : 'Load More'}
          </Button>
        </div>
      )}
    </article>
  );
};

export default function HomeComponent() {
  const {latestChapters:chapters, loading: loadingCh, fetchLatestChapters, resetChaptersState} = useChapterStore();
  const {books, loading: loadingBook, isLoadingNextPage, meta, loadMoreBooks, fetchBooks, resetBooksState} = useBookStore();

  // Tambahkan useEffect untuk fetch data saat komponen dimount
  useEffect(() => {
    // Reset state dan fetch data buku
    resetBooksState();
    fetchBooks(1, 10, false);
    
    // Reset state dan fetch data chapter
    resetChaptersState();
    fetchLatestChapters(1, 10, false);
  }, [fetchBooks, fetchLatestChapters, resetBooksState, resetChaptersState]);

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
            <ChCorner loading={loadingCh} chapters={chapters || []}/>
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