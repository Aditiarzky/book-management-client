import { useEffect } from "react";
import useChapterStore from "../../store/useChapterStore";
import GuestLayout from "../layouts/GuestLayout";
import ViewComponent from "./Component";
import { useParams } from "@tanstack/react-router";
import { setMetaTags } from "@/utils/meta";

/* ── View page skeleton — mirrors the actual reader layout ── */
function ViewSkeleton() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/90 dark:bg-gray-950/90 border-b border-gray-100 dark:border-white/5 flex items-center px-4 gap-3">
        <div className="h-4 w-20 rounded-lg bg-gray-200 dark:bg-white/8" />
        <div className="flex-1 flex justify-center">
          <div className="h-4 w-44 rounded-lg bg-gray-200 dark:bg-white/8" />
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map(i => <div key={i} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5" />)}
        </div>
      </div>

      {/* Progress line */}
      <div className="fixed top-16 left-0 right-0 h-0.5 bg-gray-100 dark:bg-white/5" />

      <main className="pt-16 pb-14">
        {/* Chapter header */}
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-3">
          <div className="h-3 w-28 rounded-lg bg-gray-100 dark:bg-white/5" />
          <div className="h-7 w-40 rounded-xl bg-gray-200 dark:bg-white/8" />
          <div className="h-3 w-24 rounded-lg bg-gray-100 dark:bg-white/5" />
          <div className="h-3 w-12 rounded-lg bg-gray-100 dark:bg-white/5 mt-1" />
        </div>

        {/* Divider */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/8 to-transparent" />
        </div>

        {/* Content blocks — mimics manga page stack */}
        <div className="max-w-2xl mx-auto px-4 flex flex-col gap-1.5">
          {[
            420, 380, 460, 340, 480, 360, 440, 390, 470, 350,
          ].map((h, i) => (
            <div
              key={i}
              className="w-full rounded-sm bg-gray-200 dark:bg-white/8"
              style={{ height: h }}
            />
          ))}
        </div>

        {/* End nav area */}
        <div className="max-w-xl mx-auto px-4 mt-14">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/8 to-transparent mb-8" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5" />
            <div className="h-16 rounded-2xl bg-gray-200 dark:bg-white/8" />
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white/90 dark:bg-gray-950/90 border-t border-gray-100 dark:border-white/5 flex items-center px-4 gap-2">
        <div className="h-9 w-16 rounded-xl bg-gray-100 dark:bg-white/5" />
        <div className="flex-1 h-9 rounded-xl bg-gray-100 dark:bg-white/5 max-w-42" />
        <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5" />
        <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5" />
        <div className="h-9 w-16 rounded-xl bg-gray-200 dark:bg-white/8" />
      </div>
    </div>
  );
}


export default function ViewCh() {
  const { bookId, id } = useParams({ from: '/view/$bookId/$id' });
  const chapterId = Number(id);
  const bookIdNum = Number(bookId);

  const { viewChapter, chapterByBook, loading } = useChapterStore({
    viewParams: { id: chapterId, bookId: bookIdNum },
    selectedBookId: bookIdNum,
  });

  useEffect(() => {
    if (viewChapter && !loading) {
      setMetaTags({
        title: `Baca Chapter ${viewChapter.chapter} - ${viewChapter.book.judul} | Riztranslation`,
        description: viewChapter.book.synopsis || 'Baca chapter buku',
        image: viewChapter.thumbnail || 'https://i.imgur.com/uaZ4pwN.jpeg',
        url: window.location.href,
      });
    }
  }, [viewChapter, loading]);

  return (
    <GuestLayout>
      {loading ? (
        <ViewSkeleton />
      ) : (
        <ViewComponent viewChapter={viewChapter} chapterByBook={chapterByBook} />
      )}
    </GuestLayout>
  );
}
