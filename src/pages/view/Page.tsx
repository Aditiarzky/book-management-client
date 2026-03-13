import { useEffect } from "react";
import useChapterStore from "../../store/useChapterStore";
import GuestLayout from "../layouts/GuestLayout";
import ViewComponent from "./Component";
import { useParams } from "@tanstack/react-router";
import Sekeleton from "@/components/Sekeleton";
import { setMetaTags } from "@/utils/meta";

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
        <div className="w-full right-0 flex gap-3 flex-col items-center justify-center mt-3">
          <Sekeleton height="20px" width="250px" />
          <Sekeleton height="15px" width="150px" />
          <div className="w-[90%] flex flex-col gap-2 mt-3">
            <Sekeleton count={10} height="200px" />
          </div>
        </div>
      ) : (
        <ViewComponent viewChapter={viewChapter} chapterByBook={chapterByBook} />
      )}
    </GuestLayout>
  );
}
