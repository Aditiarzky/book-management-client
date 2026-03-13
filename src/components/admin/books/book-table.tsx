import { useState } from "react";
import { Edit, Trash2, Plus, BookOpen, ExternalLink } from "lucide-react";
import type { IBook } from "../../../types/core.types";
import { Link } from "@tanstack/react-router";
import { DETAIL_PAGE } from "@/routes/constants";
import { SearchInput, TableSkeleton, EmptyState, Pagination, ConfirmDelete, Th, Td, ActionBtn } from "@/components/admin/ui";

const STATUS_STYLE: Record<string, string> = {
  ongoing: "bg-emerald-50 text-emerald-600 border-emerald-100",
  completed: "bg-blue-50 text-blue-600 border-blue-100",
  hiatus: "bg-amber-50 text-amber-600 border-amber-100",
  dropped: "bg-red-50 text-red-500 border-red-100",
};

interface BooksTableProps {
  books: IBook[];
  loading: boolean;
  isFetching?: boolean;
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onAdd: () => void;
  onEdit: (book: IBook) => void;
  onDelete: (id: number) => void;
  onViewChapters: (book: IBook) => void;
}

export default function BooksTable({ books, loading, isFetching, searchTerm, onSearchTermChange, pagination, onPageChange, onLimitChange, onAdd, onEdit, onDelete, onViewChapters }: BooksTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 p-5 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Kelola Buku</h2>
          <p className="text-xs text-gray-400 mt-0.5">{pagination.total.toLocaleString("id-ID")} buku terdaftar</p>
        </div>
        <div className="flex gap-2">
          <SearchInput value={searchTerm} onChange={onSearchTermChange} placeholder="Cari judul, author..." className="w-full sm:w-56" />
          <button onClick={onAdd}
            className="h-9 px-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : books.length === 0 ? (
          <EmptyState message={searchTerm ? "Tidak ada buku yang cocok" : "Belum ada buku"} />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <Th>Buku</Th>
                <Th className="hidden md:table-cell">Author / Artist</Th>
                <Th className="hidden sm:table-cell">Status</Th>
                <Th className="hidden lg:table-cell">Type</Th>
                <Th className="hidden lg:table-cell">Genre</Th>
                <Th>Chapter</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {books.map(book => (
                <tr key={book.id} className="hover:bg-gray-50/50 transition-colors group">
                  {/* Cover + title */}
                  <Td>
                    <div className="flex items-center gap-3">
                      <Link to={DETAIL_PAGE} params={{ id: book.id.toString() }} className="shrink-0">
                        <img src={book.cover || "/placeholder.svg"} alt={book.judul}
                          className="w-9 h-[52px] object-cover rounded-lg bg-gray-100 group-hover:ring-2 ring-gray-200 transition-all"
                          onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
                      </Link>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{book.judul}</p>
                        {book.alt_judul && <p className="text-xs text-gray-400 truncate max-w-[180px]">{book.alt_judul}</p>}
                        {/* Mobile-only sub-info */}
                        <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border capitalize ${STATUS_STYLE[book.status?.toLowerCase() ?? ""] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                            {book.status ?? "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Td>

                  <Td className="hidden md:table-cell">
                    <p className="text-xs text-gray-600">{book.author}</p>
                    <p className="text-xs text-gray-400">{book.artist}</p>
                  </Td>

                  <Td className="hidden sm:table-cell">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-lg border capitalize ${STATUS_STYLE[book.status?.toLowerCase() ?? ""] ?? "bg-gray-50 text-gray-500 border-gray-100"}`}>
                      {book.status ?? "—"}
                    </span>
                  </Td>

                  <Td className="hidden lg:table-cell">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{book.type ?? "—"}</span>
                  </Td>

                  <Td className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(book.genres ?? []).slice(0, 2).map(g => (
                        <span key={g.id} className="text-[11px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md">{g.nama}</span>
                      ))}
                      {(book.genres ?? []).length > 2 && (
                        <span className="text-[11px] text-gray-400">+{book.genres.length - 2}</span>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <button onClick={() => onViewChapters(book)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
                      <BookOpen className="w-3.5 h-3.5" />
                      {book.chapters?.length ?? 0}
                    </button>
                  </Td>

                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={DETAIL_PAGE} params={{ id: book.id.toString() }}>
                        <ActionBtn onClick={() => { }} title="Lihat detail">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </ActionBtn>
                      </Link>
                      <ActionBtn onClick={() => onEdit(book)} title="Edit buku">
                        <Edit className="w-3.5 h-3.5" />
                      </ActionBtn>
                      <ActionBtn onClick={() => setDeleteId(book.id)} variant="danger" title="Hapus buku">
                        <Trash2 className="w-3.5 h-3.5" />
                      </ActionBtn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <Pagination {...pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} isFetching={isFetching} />

      {/* Confirm delete */}
      <ConfirmDelete
        open={deleteId !== null}
        title="Hapus Buku?"
        description="Tindakan ini tidak dapat dibatalkan. Semua chapter dalam buku ini juga akan ikut terhapus."
        onConfirm={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
