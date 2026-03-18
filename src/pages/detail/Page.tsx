import { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import useBookStore from "../../store/useBookStore";
import DetailComponent from "./Component";
import GuestLayout from "../layouts/GuestLayout";

import { setMetaTags } from "@/utils/meta";

/* ── Detail page skeleton ── */
function DetailSkeleton() {
  return (
    <div className="min-h-dvh animate-pulse">
      {/* Banner blur */}
      <div className="relative h-44 w-full rounded-b-3xl overflow-hidden bg-gray-200 dark:bg-white/8 -mx-0" />

      {/* Cover + meta */}
      <div className="relative flex flex-col items-center -mt-28 z-10 px-4">
        {/* Cover card */}
        <div className="w-36 h-52 rounded-2xl bg-gray-300 dark:bg-white/10 shadow-2xl ring-2 ring-white dark:ring-gray-950" />

        {/* Type badge */}
        <div className="mt-3 h-5 w-16 rounded-full bg-gray-200 dark:bg-white/8" />

        {/* Title */}
        <div className="mt-5 flex flex-col items-center gap-2 w-full max-w-xs">
          <div className="h-5 w-48 rounded-xl bg-gray-200 dark:bg-white/8" />
          <div className="h-3.5 w-32 rounded-xl bg-gray-100 dark:bg-white/5" />
        </div>

        {/* Status + genre badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {[80, 60, 72, 56].map(w => (
            <div key={w} className="h-6 rounded-lg bg-gray-200 dark:bg-white/8" style={{ width: w }} />
          ))}
        </div>

        {/* Like button area */}
        <div className="mt-5 h-10 w-40 rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>

      {/* Divider */}
      <div className="my-6 mx-auto w-16 h-px bg-gray-100 dark:bg-white/5" />

      {/* Tab switcher */}
      <div className="flex justify-center mb-6 px-4">
        <div className="h-10 w-52 rounded-2xl bg-gray-100 dark:bg-white/5" />
      </div>

      {/* Chapter sort + grid */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-5">
          <div className="h-4 w-16 rounded-lg bg-gray-100 dark:bg-white/5" />
          <div className="h-8 w-36 rounded-xl bg-gray-100 dark:bg-white/5" />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="w-36 h-28 rounded-xl bg-gray-200 dark:bg-white/8" />
          ))}
        </div>
      </div>
    </div>
  );
}


export default function Detail() {
  const { id } = useParams({ strict: false });
  const parseId = parseInt(id || '', 10);
  const { loading: loadingBook, detailBook } = useBookStore({ detailBookId: parseId });

  useEffect(() => {
    if (detailBook && !loadingBook) {
      setMetaTags({
        title: `Baca ${detailBook.judul} terbaru | Riztranslation`,
        description: detailBook.synopsis || `Baca ${detailBook.judul} terbaru di website Riztranslation`,
        image: detailBook.cover || 'https://i.imgur.com/uaZ4pwN.jpeg',
        url: window.location.href,
      });
    }
  }, [detailBook, loadingBook]);

  return (
    <GuestLayout>
      {loadingBook ? (
        <DetailSkeleton />
      ) : (
        <DetailComponent book={detailBook} />
      )}
    </GuestLayout>
  );
}
