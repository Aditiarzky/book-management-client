import { ChevronLeft, ChevronRight, Search, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── Search input ── */
export function SearchInput({ value, onChange, placeholder = "Cari...", className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full pl-9 pr-3 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
      />
    </div>
  );
}

/* ── Table skeleton ── */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-1">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 items-center px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 rounded-md bg-gray-100 animate-pulse flex-1" style={{ maxWidth: c === 0 ? 40 : undefined }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
        <Search className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

/* ── Pagination ── */
export function Pagination({ page, limit, total, totalPages, onPageChange, onLimitChange, isFetching }: {
  page: number; limit: number; total: number; totalPages: number;
  onPageChange: (p: number) => void; onLimitChange: (l: number) => void;
  isFetching?: boolean;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const from = total > 0 ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between bg-white rounded-b-2xl">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        {total > 0 ? (
          <span>{from}–{to} dari {total.toLocaleString("id-ID")} data</span>
        ) : (
          <span>Tidak ada data</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Baris</span>
          <Select value={limit.toString()} onValueChange={v => onLimitChange(Number(v))}>
            <SelectTrigger className="h-8 w-16 text-xs rounded-lg border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-gray-500 tabular-nums px-1 min-w-[60px] text-center">
            {page} / {safeTotalPages}
          </span>
          <button onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))} disabled={page >= safeTotalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Confirm delete dialog ── */
export function ConfirmDelete({ open, title, description, onConfirm, onCancel }: {
  open: boolean; title: string; description: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancel}
            className="flex-1 h-9 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Batal
          </button>
          <button onClick={onConfirm}
            className="flex-1 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-medium text-white transition-colors flex items-center justify-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Table header cell ── */
export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider", className)}>
      {children}
    </th>
  );
}

/* ── Table row cell ── */
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3 text-sm text-gray-700 align-middle", className)}>
      {children}
    </td>
  );
}

/* ── Action button ── */
export function ActionBtn({ onClick, variant = "default", title, children }: {
  onClick: () => void; variant?: "default" | "danger"; title?: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn(
        "w-8 h-8 flex items-center justify-center rounded-lg border transition-all duration-150",
        variant === "danger"
          ? "border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          : "border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      )}>
      {children}
    </button>
  );
}
