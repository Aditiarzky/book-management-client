import { useEffect } from "react";
import useChapterStore from "../../store/useChapterStore";
import GuestLayout from "../layouts/GuestLayout";
import ViewComponent from "./Component";
import { useParams } from "@tanstack/react-router";
import Sekeleton from "@/components/Sekeleton";

export default function ViewCh() {
  const { viewChapter, chapterByBook, fetchViewChapter, fetchByBook, loading } = useChapterStore();
  const { bookId, id } = useParams({ from: '/view/$bookId/$id' });
  


  const loadInitialData = async () => {
    await Promise.all([fetchViewChapter(Number(id), Number(bookId)), fetchByBook(Number(bookId))]);
  };

  useEffect(() => {
    loadInitialData();
  }, [bookId, id]);

  return (
    <GuestLayout>
      {loading ? (
      <div className="w-full flex gap-3 flex-col items-center justify-center m-3">
        <Sekeleton height="20px" width="250px"/>
        <Sekeleton height="15px" width="150px"/>
        <div className="w-full flex flex-col gap-2 mt-3">
          <Sekeleton count={10} height="200px"/>
        </div>
      </div>
      ):(
      <ViewComponent viewChapter={viewChapter} chapterByBook={chapterByBook}/>
      )}
    </GuestLayout>
  );
}