import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, Loader2, BookOpen, ArrowRight, Clock } from "lucide-react";
import { useDebounce } from "use-debounce";
import useBookStore from "@/store/useBookStore";
import { DETAIL_PAGE, SEARCH_PAGE } from "@/routes/constants";
import type { IBook } from "@/types/core.types";
import noImage from "@/placeholder.gif";
import { slugify } from "@/utils/format";

/* ── Recent searches (localStorage) ── */
const RECENT_KEY = "rz_recent_searches";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function saveRecent(q: string) {
  const prev = getRecent().filter((s) => s !== q);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([q, ...prev].slice(0, MAX_RECENT)),
  );
}
function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

/* ── Status style ── */
const STATUS_COLOR: Record<string, string> = {
  ongoing: "bg-emerald-400",
  completed: "bg-blue-400",
  hiatus: "bg-amber-400",
  dropped: "bg-red-400",
};

/* ── Result row ── */
function BookRow({ book, onSelect }: { book: IBook; onSelect: () => void }) {
  return (
    <Link
      to={DETAIL_PAGE}
      params={{ id: `${book.id}` }}
      search={{ title: slugify(book.judul) }}
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
    >
      {/* Cover */}
      <div className="w-9 h-[52px] rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-white/5">
        <img
          src={book.cover || noImage}
          alt={book.judul}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = noImage;
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/80 truncate leading-snug">
          {book.judul}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {book.type && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-white/25">
              {book.type}
            </span>
          )}
          {book.status && (
            <>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLOR[book.status.toLowerCase()] ?? "bg-gray-300"}`}
              />
              <span className="text-[10px] text-gray-400 dark:text-white/25 capitalize">
                {book.status}
              </span>
            </>
          )}
        </div>
        {book.genres?.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {book.genres.slice(0, 2).map((g) => (
              <span
                key={g.id}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30"
              >
                {g.nama}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-white/15 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

/* ── Skeleton row ── */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
      <div className="w-9 h-[52px] rounded-lg bg-gray-200 dark:bg-white/8 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-3/4 rounded bg-gray-200 dark:bg-white/8" />
        <div className="h-2.5 w-1/3 rounded bg-gray-200 dark:bg-white/8" />
      </div>
    </div>
  );
}

/* ── Main modal ── */
interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [debouncedQuery] = useDebounce(query, 350);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const hasQuery = debouncedQuery.trim().length > 0;

  const { searchResults, loading } = useBookStore({
    searchParams: {
      searchQuery: debouncedQuery,
      limit: 6,
      creator: "",
      genreIds: [],
    },
    searchEnabled: hasQuery,
  });

  const results = searchResults ?? [];

  /* Focus input when opened */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setRecent(getRecent());
    } else {
      setQuery("");
    }
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const goToSearch = (q?: string) => {
    const term = q ?? query;
    if (term.trim()) saveRecent(term.trim());
    onClose();
    navigate({
      to: SEARCH_PAGE,
      search: { query: term, creator: undefined, genre: undefined },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) goToSearch();
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    saveRecent(term);
  };

  const handleClearRecent = () => {
    clearRecent();
    setRecent([]);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/8 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-white/5">
            <Search className="w-4 h-4 text-gray-400 dark:text-white/25 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari judul, author, genre…"
              className="flex-1 text-sm text-gray-800 dark:text-white/80 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-white/20"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {loading && (
                <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
              )}
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-6 h-6 hidden sm:flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <kbd className="text-[10px] font-mono">esc</kbd>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Loading skeleton */}
            {loading && hasQuery && (
              <div className="py-1">
                {[1, 2, 3].map((i) => (
                  <RowSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && hasQuery && results.length > 0 && (
              <div className="py-1">
                <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/20">
                  Hasil ({results.length})
                </p>
                {results.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    onSelect={() => {
                      if (query.trim()) saveRecent(query.trim());
                      onClose();
                    }}
                  />
                ))}
              </div>
            )}

            {/* No result */}
            {!loading && hasQuery && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-gray-400 dark:text-white/20" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-white/40">
                  Tidak ada hasil untuk "{debouncedQuery}"
                </p>
                <p className="text-xs text-gray-400 dark:text-white/25 mt-1">
                  Coba kata kunci lain
                </p>
              </div>
            )}

            {/* Recent searches — shown when input empty */}
            {!hasQuery && recent.length > 0 && (
              <div className="py-1">
                <div className="flex items-center justify-between px-4 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-white/20">
                    Pencarian terakhir
                  </p>
                  <button
                    onClick={handleClearRecent}
                    className="text-[11px] text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/50 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
                {recent.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentClick(term)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                  >
                    <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-white/15 shrink-0" />
                    <span className="flex-1 text-sm text-gray-600 dark:text-white/50 truncate">
                      {term}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-white/15 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Empty initial state */}
            {!hasQuery && recent.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Search className="w-8 h-8 text-gray-200 dark:text-white/10 mb-2" />
                <p className="text-sm text-gray-400 dark:text-white/25">
                  Ketik untuk mulai mencari
                </p>
              </div>
            )}
          </div>

          {/* Footer — lihat selengkapnya */}
          {hasQuery && results.length > 0 && (
            <div className="border-t border-gray-100 dark:border-white/5 px-4 py-3">
              <button
                onClick={() => goToSearch()}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-gray-900 dark:bg-white/8 hover:bg-gray-800 dark:hover:bg-white/12 text-white text-xs font-semibold transition-colors"
              >
                Lihat semua hasil untuk "{debouncedQuery}"
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
