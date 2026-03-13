import { Heart } from 'lucide-react';
import { useLike } from '@/utils/use-like';

type LikeType = 'book' | 'chapter';

interface LikeButtonProps {
  type: LikeType;
  targetId: number;
  variant?: 'book' | 'chapter';
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString('id-ID');
}

export default function LikeButton({ type, targetId, variant = 'book' }: LikeButtonProps) {
  const { count, hasLiked, like, isLoading } = useLike(type, targetId);

  /* ─── CHAPTER variant ─── */
  /* ditaruh tepat di atas section komentar, centered, full emotional beat */
  if (variant === 'chapter') {
    return (
      <div className="flex flex-col items-center text-center py-8 px-4">
        <p className="text-[15px] font-semibold text-gray-800 dark:text-white/80 leading-snug">
          {hasLiked ? 'Makasih, senang kamu suka!' : 'Gimana chapter ini menurut kamu?'}
        </p>
        <p className="mt-1.5 text-sm text-gray-400 dark:text-white/30 leading-relaxed max-w-xs">
          {hasLiked
            ? 'Dukunganmu berarti banyak untuk kami terus berkarya.'
            : 'Kalau kamu menikmatinya, klik tombol di bawah — itu berarti banyak buat kami!'}
        </p>

        <button
          onClick={like}
          disabled={hasLiked || isLoading}
          className={`group mt-5 flex items-center gap-2.5 px-7 py-3 rounded-full border-[1.5px] transition-all duration-200
            ${hasLiked
              ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 cursor-default'
              : 'bg-white dark:bg-white/3 border-rose-200 dark:border-rose-500/25 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-300 dark:hover:border-rose-500/40 active:scale-95'
            }`}
        >
          <Heart
            className={`h-[18px] w-[18px] transition-all duration-200 shrink-0
              ${hasLiked
                ? 'fill-rose-500 text-rose-500'
                : 'text-rose-400 dark:text-rose-400/60 group-hover:text-rose-500 group-hover:scale-110'
              }`}
          />
          <span className={`text-[14px] font-semibold transition-colors
            ${hasLiked
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-rose-500 dark:text-rose-400/70 group-hover:text-rose-600 dark:group-hover:text-rose-400'
            }`}>
            {isLoading ? '...' : hasLiked ? 'Sudah disukai' : 'Aku suka chapter ini!'}
          </span>
        </button>

        <p className="mt-3 text-xs text-gray-300 dark:text-white/20">
          {isLoading ? '' : count > 0
            ? `${formatCount(count)} orang menyukai chapter ini`
            : 'Jadilah yang pertama menyukainya'}
        </p>
      </div>
    );
  }

  /* ─── BOOK variant ─── */
  /* pill kompak, centered, langsung di bawah genre badges */
  return (
    <button
      onClick={like}
      disabled={hasLiked || isLoading}
      className={`group inline-flex items-center gap-3 px-5 py-[10px] rounded-full border transition-all duration-200
        ${hasLiked
          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 cursor-default'
          : 'bg-white dark:bg-white/3 border-gray-200 dark:border-white/8 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-200 dark:hover:border-rose-500/30 active:scale-95'
        }`}
    >
      <Heart
        className={`h-4 w-4 shrink-0 transition-all duration-200
          ${hasLiked
            ? 'fill-rose-500 text-rose-500'
            : 'text-gray-300 dark:text-white/20 group-hover:text-rose-400 group-hover:scale-110'
          }`}
      />
      <div className="text-left">
        <p className={`text-[12px] font-semibold leading-none mb-[3px]
          ${hasLiked
            ? 'text-rose-600 dark:text-rose-400'
            : 'text-gray-600 dark:text-white/50 group-hover:text-rose-500 dark:group-hover:text-rose-400'
          }`}>
          {hasLiked ? 'Ditambahkan ke favorit!' : 'Suka cerita ini?'}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-white/25 leading-none">
          {isLoading ? '...' : count > 0
            ? `${formatCount(count)} pembaca sudah menyukainya`
            : 'Jadilah yang pertama!'}
        </p>
      </div>
    </button>
  );
}
