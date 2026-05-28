import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { searchBooks } from '@/utils/api';
import { DETAIL_PAGE } from '@/routes/constants';
import { slugify } from '@/utils/format';
import type { IBook } from '@/types/core.types';
import noImage from '@/placeholder.gif';
import { Sparkles } from 'lucide-react';

const STATUS_DOT: Record<string, string> = {
  ongoing: 'bg-emerald-400',
  completed: 'bg-blue-400',
  hiatus: 'bg-amber-400',
  dropped: 'bg-red-400',
};

export default function MoreLikeThis({ book }: { book: IBook }) {
  const genreIds = book.genres?.map(g => g.id!).filter(Boolean) ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['more-like-this', book.id, genreIds],
    queryFn: () => searchBooks('', 1, 20, '', genreIds),
    enabled: genreIds.length > 0,
    staleTime: 10 * 60 * 1000,
    select: (res) => {
      const filtered = (res.data ?? []).filter((b: IBook) => b.id !== book.id);
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
      return filtered.slice(0, 8);
    },
  });

  if (!genreIds.length || (!isLoading && !data?.length)) return null;

  return (
    <section className="w-full max-w-3xl mx-auto px-4 pb-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-widest">
          More Like This
        </span>
        <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 w-24 animate-pulse">
                <div className="h-36 w-24 rounded-xl bg-gray-200 dark:bg-white/8 mb-2" />
                <div className="h-2.5 w-16 bg-gray-200 dark:bg-white/8 rounded mb-1" />
                <div className="h-2 w-10 bg-gray-200 dark:bg-white/8 rounded" />
              </div>
            ))
          : data?.map(b => (
              <Link
                key={b.id}
                to={DETAIL_PAGE}
                params={{ id: `${b.id}` }}
                search={{ title: slugify(b.judul) }}
                className="shrink-0 w-24 group"
              >
                <div className="relative h-36 w-24 rounded-xl overflow-hidden mb-1.5 shadow-sm">
                  <img
                    src={b.cover || noImage}
                    alt={b.judul}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {b.status && (
                    <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${STATUS_DOT[b.status.toLowerCase()] ?? 'bg-gray-400'}`} />
                  )}
                </div>
                <p className="text-[11px] font-medium text-gray-700 dark:text-white/70 line-clamp-2 leading-snug">
                  {b.judul}
                </p>
                {b.type && (
                  <p className="text-[9px] text-gray-400 dark:text-white/25 uppercase tracking-wider mt-0.5">
                    {b.type}
                  </p>
                )}
              </Link>
            ))}
      </div>
    </section>
  );
}
