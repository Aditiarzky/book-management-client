import { BookOpen, FileText, Tags, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBooks, getChapters, getGenresPaged } from "@/utils/api";

/* ── Reusable skeleton ── */
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
);

/* ── Stat card ── */
function StatCard({ title, value, sub, icon: Icon, color, loading }: {
  title: string; value: number; sub: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm hover:border-gray-200 transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{title}</p>
        {loading ? <Skeleton className="h-7 w-16 mb-1" /> : (
          <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{value.toLocaleString("id-ID")}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

/* ── Status pill ── */
const STATUS_STYLE: Record<string, string> = {
  ongoing: "bg-emerald-50 text-emerald-600",
  completed: "bg-blue-50 text-blue-600",
  hiatus: "bg-amber-50 text-amber-600",
  dropped: "bg-red-50 text-red-500",
};

function statusStyle(s?: string) {
  return STATUS_STYLE[s?.toLowerCase() ?? ""] ?? "bg-gray-100 text-gray-500";
}

export default function DashboardStats() {
  const booksQ = useQuery({ queryKey: ["dash-books-10"], queryFn: () => getBooks(1, 10), staleTime: 60_000 });
  const chapsQ = useQuery({ queryKey: ["dash-chapters-1"], queryFn: () => getChapters(1, 1), staleTime: 60_000 });
  const genresQ = useQuery({ queryKey: ["dash-genres-1"], queryFn: () => getGenresPaged(1, 1), staleTime: 60_000 });

  const totalBooks = booksQ.data?.meta?.total ?? 0;
  const totalChaps = chapsQ.data?.meta?.total ?? 0;
  const totalGenres = genresQ.data?.meta?.total ?? 0;
  const avgChaps = totalBooks > 0 ? Math.round(totalChaps / totalBooks) : 0;
  const loading = booksQ.isLoading || chapsQ.isLoading || genresQ.isLoading;
  const recentBooks = booksQ.data?.data ?? [];

  const stats = [
    { title: "Total Buku", value: totalBooks, sub: "buku terdaftar", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { title: "Total Chapter", value: totalChaps, sub: "di semua buku", icon: FileText, color: "bg-emerald-50 text-emerald-600" },
    { title: "Total Genre", value: totalGenres, sub: "kategori tersedia", icon: Tags, color: "bg-violet-50 text-violet-600" },
    { title: "Rata-rata Chapter", value: avgChaps, sub: "per buku", icon: TrendingUp, color: "bg-orange-50 text-orange-500" },
  ];

  const statusRows = [
    { label: "Ongoing", bar: "bg-emerald-400", key: "ongoing" },
    { label: "Completed", bar: "bg-blue-400", key: "completed" },
    { label: "Hiatus", bar: "bg-amber-400", key: "hiatus" },
    { label: "Dropped", bar: "bg-red-400", key: "dropped" },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.title} {...s} loading={loading} />)}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Status breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-[13px] font-semibold text-gray-800 mb-4">Distribusi Status</p>
          {loading ? (
            <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-7 w-full" />)}</div>
          ) : (
            <div className="space-y-3">
              {statusRows.map(({ label, bar, key }) => {
                const count = recentBooks.filter(b => b.status?.toLowerCase() === key).length;
                const total = recentBooks.length || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-500 font-medium">{label}</span>
                      <span className="text-xs font-semibold text-gray-700 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-gray-300 pt-1">Dari {recentBooks.length} buku di halaman pertama</p>
            </div>
          )}
        </div>

        {/* Recent books */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 lg:col-span-2">
          <p className="text-[13px] font-semibold text-gray-800 mb-4">Buku Terbaru</p>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : recentBooks.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Belum ada buku</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentBooks.slice(0, 6).map(book => (
                <div key={book.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <img src={book.cover || "/placeholder.svg"} alt={book.judul}
                    className="w-8 h-11 object-cover rounded-lg shrink-0 bg-gray-100"
                    onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{book.judul}</p>
                    <p className="text-xs text-gray-400 truncate">{book.author}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 capitalize ${statusStyle(book.status ?? undefined)}`}>
                    {book.status || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
