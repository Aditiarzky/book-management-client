import { Ch } from "@/components/NewCh";
import MoreLikeThis from "@/components/MoreLikeThis";
import type { IBook } from "@/types/core.types";
import { useEffect, useMemo, useState } from "react";
import SupabaseCommentEmbed from "@/components/SupabaseCommentEmbed";
import LikeButton from "@/components/LikeButton";
import { useVisitCounter, useVisitCounts } from "@/hooks/useVisitCounts";
import {
  AlertCircle,
  RefreshCw,
  BookOpen,
  Users,
  Palette,
  Tag,
  ArrowUpDown,
  ChevronDown,
  MessageSquare,
  Info,
  List,
  Search,
  Eye,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SEARCH_PAGE, VIEW_PAGE } from "@/routes/constants";
import noImage from "@/placeholder.gif";
import { formatVisitCount } from "@/lib/format";
import { getSmartDate } from "@/utils/format";

interface DetailInterface {
  book: IBook | null;
}

const EmptyState = ({
  title,
  description,
  onRefresh,
}: {
  title: string;
  description: string;
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h2 className="text-gray-500 dark:text-white/30 text-sm mb-4 max-w-xs">
      {title}
    </h2>
    <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
      <AlertCircle className="h-6 w-6 text-gray-400 dark:text-white/20" />
    </div>
    <p className="text-gray-500 dark:text-white/30 text-sm mb-4 max-w-xs">
      {description}
    </p>
    {onRefresh && (
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/40 text-sm transition-all"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </button>
    )}
  </div>
);

const StatusBadge = ({ status }: { status?: string }) => {
  const map: Record<string, string> = {
    ongoing:
      "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    completed:
      "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
    hiatus:
      "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
    dropped: "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400",
  };
  const key = (status || "").toLowerCase();
  const cls =
    map[key] || "bg-gray-100 dark:bg-white/8 text-gray-600 dark:text-white/40";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${cls}`}
    >
      {status || "Unknown"}
    </span>
  );
};

const SearchPill = ({
  children,
  title,
  search,
  className = "",
}: {
  children: string;
  title: string;
  search: {
    query: string | undefined;
    creator: string | undefined;
    genre: number | undefined;
  };
  className?: string;
}) => (
  <Link
    to={SEARCH_PAGE}
    search={search}
    title={title}
    className={`inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-gray-100/90 px-1.5 py-1 text-xs font-medium text-gray-600 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:bg-white/8 dark:text-white/55 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 ${className}`}
  >
    <Search className="h-3 w-3 shrink-0 opacity-70" />
    <span className="truncate">{children}</span>
  </Link>
);

const ChapterList = ({ book }: { book: IBook }) => {
  const [sortOrder, setSortOrder] = useState<"ascending" | "descending">(
    () =>
      (localStorage.getItem("sortOrder") as "ascending" | "descending") ||
      "ascending",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">(
    () => (localStorage.getItem("viewMode") as "card" | "list") || "list",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  const handleSort = (v: "ascending" | "descending") => {
    setSortOrder(v);
    localStorage.setItem("sortOrder", v);
  };

  const sorted = [...(book.chapters || [])].sort((a, b) => {
    const va = a.volume ?? 0,
      vb = b.volume ?? 0;
    if (sortOrder === "ascending")
      return va !== vb ? va - vb : a.chapter - b.chapter;
    return va !== vb ? vb - va : b.chapter - a.chapter;
  });

  const chapterVisitCounts = useVisitCounts(
    "chapter",
    sorted.map((ch) => ch.id),
  );

  const filtered = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return sorted;

    return sorted.filter((chapter) => {
      const chapterLabel = `chapter ${chapter.chapter}`.toLowerCase();
      const volumeLabel = chapter.volume
        ? `vol ${chapter.volume}`.toLowerCase()
        : "";
      const titleLabel = (chapter.nama ?? "").toLowerCase();
      return (
        chapterLabel.includes(keyword) ||
        volumeLabel.includes(keyword) ||
        titleLabel.includes(keyword)
      );
    });
  }, [searchQuery, sorted]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  const handleViewMode = (v: "card" | "list") => {
    setViewMode(v);
    localStorage.setItem("viewMode", v);
  };

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  if (!sorted.length)
    return (
      <EmptyState
        title="Belum Ada Chapter"
        description="Chapter akan segera hadir. Pantau terus!"
        onRefresh={() => window.location.reload()}
      />
    );

  return (
    <div>
      {/* Header & View Mode Switcher */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 dark:text-white/30 text-xs font-medium">
          {filtered.length} / {sorted.length} chapter
        </p>
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl transition-all duration-300">
          {(["ascending", "descending"] as const).map((o) => (
            <button
              key={o}
              onClick={() => handleSort(o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ease-in-out ${
                sortOrder === o
                  ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm scale-105"
                  : "text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <ArrowUpDown
                className={`h-3 w-3 transition-transform duration-500 ${sortOrder === o ? "rotate-180" : ""}`}
              />
              {o === "ascending" ? "Terlama" : "Terbaru"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-xs group">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors duration-300" />
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari chapter / volume / judul..."
            className="w-full rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent focus:border-gray-300 dark:focus:border-white/15 pl-9 pr-3 py-2 text-xs text-gray-700 dark:text-white/70 outline-none transition-all duration-300"
          />
        </label>

        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-fit">
          {[
            { id: "card", icon: LayoutGrid, label: "Card" },
            { id: "list", icon: Rows3, label: "List" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleViewMode(mode.id as "card" | "list")}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all duration-300 ease-in-out ${
                viewMode === mode.id
                  ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              <mode.icon className="h-3.5 w-3.5" /> {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area dengan Fade-In Animation */}
      <div
        key={`${viewMode}-${currentPage}-${sortOrder}`}
        className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out ${
          viewMode === "card"
            ? "flex flex-wrap justify-center gap-3"
            : "space-y-2"
        }`}
      >
        {paginated.map((chapter) =>
          viewMode === "card" ? (
            <Ch
              type={1}
              chapter={chapter.chapter}
              thumbnail={chapter.thumbnail}
              created_at={chapter.created_at}
              volume={chapter.volume}
              id={chapter.id}
              bookId={chapter.bookId}
              nama={chapter.nama}
              visitCount={chapterVisitCounts[chapter.id] ?? 0}
            />
          ) : (
            <Link
              key={chapter.id}
              to={VIEW_PAGE}
              params={{
                bookId: chapter.bookId.toString(),
                id: chapter.id.toString(),
              }}
              className="group relative flex items-center justify-between min-h-16 gap-3 rounded-xl border border-border bg-white dark:bg-white/3 px-4 py-3 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
              style={{
                backgroundImage: `url('${chapter.thumbnail || noImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-black/10 dark:from-gray-900 dark:via-gray-900/80 dark:to-black/40 z-0" />

              <div className="min-w-0 relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                <p className="text-sm text-gray-700 dark:text-white/80 font-medium truncate">
                  {chapter.volume ? `Vol ${chapter.volume} · ` : ""}Chapter{" "}
                  {chapter.chapter}
                </p>
                {chapter.nama && (
                  <p className="text-xs text-gray-600 dark:text-white/35 truncate transition-colors group-hover:text-gray-500 dark:group-hover:text-white/50">
                    {chapter.nama}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 dark:text-white/30 mt-0.5">
                  {getSmartDate(chapter.created_at)}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-1 text-[10px] text-white/90 px-1.5 py-0.5 rounded-lg bg-black/30 backdrop-blur-[2px] border border-white/5 shrink-0 self-center shadow-sm">
                <Eye className="h-3 w-3 opacity-80 group-hover:animate-pulse" />
                <span className="font-semibold tracking-tighter leading-none">
                  {formatVisitCount(chapterVisitCounts[chapter.id] ?? 0)}
                </span>
              </div>
            </Link>
          ),
        )}
      </div>

      {/* Pagination */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-all duration-200 active:scale-95"
        >
          Prev
        </button>
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 dark:text-white/20">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          }
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-all duration-200 active:scale-95"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const InfoTab = ({ book }: { book: IBook }) => {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const synopsis = book.synopsis || "";
  const isLong = synopsis.length > 300;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5 overflow-hidden">
        {[
          { icon: BookOpen, label: "Alt Title", value: book.alt_judul },
          { icon: Users, label: "Author", value: book.author },
          { icon: Palette, label: "Artist", value: book.artist },
        ].map(({ icon: Icon, label, value }, i, arr) => (
          <div
            key={label}
            className={`flex items-start gap-4 px-5 py-3.5 ${i < arr.length - 1 ? "border-b border-gray-100 dark:border-white/5" : ""}`}
          >
            <div className="flex items-center gap-2 w-20 shrink-0 mt-0.5">
              <Icon className="h-3.5 w-3.5 text-gray-300 dark:text-white/20 shrink-0" />
              <span className="text-gray-400 dark:text-white/30 text-xs font-medium">
                {label}
              </span>
            </div>
            <span className="text-gray-700 dark:text-white/70 text-sm break-words flex-1">
              {(label === "Author" || label === "Artist") && value ? (
                <SearchPill
                  search={{
                    query: undefined,
                    creator: value,
                    genre: undefined,
                  }}
                  title={`Cari buku dengan ${label} ${value}`}
                >
                  {value}
                </SearchPill>
              ) : (
                value || "—"
              )}
            </span>
          </div>
        ))}
        <div className="flex items-start gap-4 px-5 py-3.5 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2 w-20 shrink-0 mt-0.5">
            <Tag className="h-3.5 w-3.5 text-gray-300 dark:text-white/20 shrink-0" />
            <span className="text-gray-400 dark:text-white/30 text-xs font-medium">
              Genre
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {(book.genres || []).length > 0 ? (
              book.genres.map((g) => (
                <SearchPill
                  key={g.nama}
                  search={{ query: undefined, creator: undefined, genre: g.id }}
                  title={`Cari buku genre ${g.nama}`}
                >
                  {g.nama}
                </SearchPill>
              ))
            ) : (
              <span className="text-gray-400 dark:text-white/25 text-sm">
                —
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="text-gray-800 dark:text-white/70 text-sm font-semibold mb-3 uppercase tracking-widest text-xs">
          Synopsis
        </p>
        <div className="relative">
          <div
            className={`text-gray-600 dark:text-white/50 text-sm leading-relaxed overflow-hidden transition-all duration-300 ${!synopsisExpanded && isLong ? "max-h-24" : "max-h-[2000px]"}`}
            dangerouslySetInnerHTML={{ __html: synopsis || "—" }}
          />
          {!synopsisExpanded && isLong && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
          )}
        </div>
        {isLong && (
          <button
            onClick={() => setSynopsisExpanded((e) => !e)}
            className="mt-2 flex items-center gap-1 text-red-500 dark:text-red-400 text-xs font-medium hover:opacity-80 transition-opacity"
          >
            {synopsisExpanded ? "Sembunyikan" : "Selengkapnya"}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${synopsisExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
};

function NavDetail({ book }: DetailInterface) {
  const [tab, setTab] = useState<"chapters" | "info">("chapters");

  return (
    <div className="mt-6">
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
          {(
            [
              { key: "chapters", label: "Chapter", icon: List },
              { key: "info", label: "Informasi", icon: Info },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === key
                  ? "bg-white dark:bg-white/10 text-gray-800 dark:text-white shadow-sm"
                  : "text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === "chapters" &&
        (book ? (
          <ChapterList book={book} />
        ) : (
          <EmptyState
            title="No Book Data"
            description="Data buku tidak ditemukan."
            onRefresh={() => window.location.reload()}
          />
        ))}
      {tab === "info" &&
        (book ? (
          <InfoTab book={book} />
        ) : (
          <EmptyState
            title="No Book Info"
            description="Informasi buku tidak tersedia."
            onRefresh={() => window.location.reload()}
          />
        ))}
    </div>
  );
}

export default function DetailComponent({ book }: DetailInterface) {
  const supabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
  const commentSlug = book ? `${book.id}` : "unknown";
  const { count: bookVisitCount } = useVisitCounter(
    "book",
    book?.id,
    Boolean(book?.id),
  );

  return (
    <div className="min-h-dvh">
      <main className="w-full max-w-3xl mx-auto px-4">
        {/* ── Hero cover ── */}
        <section className="mb-2">
          {book ? (
            <>
              <div
                className="relative h-44 w-full rounded-b-3xl overflow-hidden -mx-4 px-4"
                style={{ width: "calc(100% + 2rem)" }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center scale-110"
                  style={{
                    backgroundImage: `url(${book.cover || "/placeholder-cover.jpg"})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-white dark:to-gray-950" />
              </div>

              <div className="relative flex flex-col items-center -mt-28 z-10">
                <div className="relative">
                  <img
                    src={book.cover || "/placeholder-cover.jpg"}
                    alt={book.judul || "Cover"}
                    className="w-36 h-52 object-cover rounded-2xl shadow-2xl ring-2 ring-white dark:ring-gray-950"
                  />
                  {book.type && (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gray-900 text-white text-xs font-semibold whitespace-nowrap shadow-lg">
                      {book.type}
                    </span>
                  )}
                </div>

                <div className="text-center mt-5 px-4">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-1">
                    {book.judul || "Unknown Title"}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                    {book.author ? (
                      <SearchPill
                        search={{
                          query: undefined,
                          creator: book.author,
                          genre: undefined,
                        }}
                        title={`Cari buku dengan author ${book.author}`}
                        className="bg-white/80 dark:bg-white/5"
                      >
                        {book.author}
                      </SearchPill>
                    ) : (
                      <span className="text-gray-400 dark:text-white/40 text-sm">
                        Unknown
                      </span>
                    )}
                    {book.artist && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200/80 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/40">
                        <span className="opacity-60">Art by</span>
                        <span className="truncate">{book.artist}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-4">
                    <StatusBadge status={book.status || "unknown"} />
                    {(book.genres || []).slice(0, 3).map((g) => (
                      <SearchPill
                        key={g.nama}
                        search={{
                          query: undefined,
                          creator: undefined,
                          genre: g.id,
                        }}
                        title={`Cari buku genre ${g.nama}`}
                        className="bg-gray-100 text-gray-500 dark:bg-white/8 dark:text-white/40"
                      >
                        {g.nama}
                      </SearchPill>
                    ))}
                    {(book.genres || []).length > 3 && (
                      <span className="text-gray-400 dark:text-white/25 text-xs">
                        +{book.genres.length - 3}
                      </span>
                    )}
                  </div>

                  {/* ── Like button ── */}
                  <LikeButton
                    type="book"
                    targetId={book.id}
                    variant="book"
                    visitCount={bookVisitCount}
                  />
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Cover Tidak Tersedia"
              description="Cover buku tidak dapat dimuat."
              onRefresh={() => window.location.reload()}
            />
          )}
        </section>

        {/* ── Divider ── */}
        {book && (
          <div className="my-6 mx-auto w-16 h-px bg-gray-100 dark:bg-white/5" />
        )}

        {/* ── Tabs ── */}
        <NavDetail book={book} />
      </main>

      {/* ── More Like This ── */}
      {book && (
        <section className="w-full mt-16">
          <MoreLikeThis book={book} />
        </section>
      )}

      {/* ── Comments ── */}
      <section className="w-full max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-4 w-4 text-gray-300 dark:text-white/15" />
          <span className="text-gray-400 dark:text-white/25 text-xs font-semibold uppercase tracking-widest">
            Komentar
          </span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
        </div>
        {supabaseConfigured ? (
          <SupabaseCommentEmbed
            site="detail"
            slug={commentSlug}
            title="Komentar Buku"
          />
        ) : (
          <p className="text-gray-300 dark:text-white/15 text-xs text-center py-6">
            Set <code className="font-mono">VITE_SUPABASE_URL</code> dan{" "}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> untuk
            komentar.
          </p>
        )}
      </section>
    </div>
  );
}
