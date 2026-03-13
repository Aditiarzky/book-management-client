import { useState } from "react";
import { Edit, Trash2, Plus, ArrowLeft, Image, FileText as TextIcon } from "lucide-react";
import type { IChapter, IBook } from "../../../types/core.types";
import { Link } from "@tanstack/react-router";
import { VIEW_PAGE } from "@/routes/constants";
import { SearchInput, TableSkeleton, EmptyState, Pagination, ConfirmDelete, Th, Td, ActionBtn } from "@/components/admin/ui";

interface ChaptersTableProps {
  chapters: IChapter[];
  book: IBook | null;
  loading: boolean;
  isFetching?: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onAdd: () => void;
  onEdit: (ch: IChapter) => void;
  onDelete: (id: number) => void;
  onBack: () => void;
}

export default function ChaptersTable({ chapters, book, loading, isFetching, pagination, onPageChange, onLimitChange, onAdd, onEdit, onDelete, onBack }: ChaptersTableProps) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = chapters
    .filter((c): c is IChapter => !!c)
    .filter(c =>
      (c.nama?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      c.chapter.toString().includes(search)
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 p-5 border-b border-gray-100 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <button onClick={onBack}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-[15px] font-semibold text-gray-900">Kelola Chapter</h2>
          </div>
          {book && (
            <p className="text-xs text-gray-400 ml-9 truncate max-w-xs">{book.judul}</p>
          )}
        </div>
        <div className="flex gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari chapter..." className="w-full sm:w-48" />
          <button onClick={onAdd}
            className="h-9 px-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState message={search ? "Tidak ada chapter yang cocok" : "Belum ada chapter"} />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <Th>Chapter</Th>
                <Th className="hidden sm:table-cell">Nama</Th>
                <Th className="hidden md:table-cell">Thumbnail</Th>
                <Th className="hidden sm:table-cell">Konten</Th>
                <Th className="hidden lg:table-cell">Tanggal</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(ch => (
                <tr key={ch.id} className="hover:bg-gray-50/50 transition-colors group">
                  <Td>
                    <Link to={VIEW_PAGE} params={{ id: ch.id.toString(), bookId: ch.bookId.toString() }}>
                      <div>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">
                          Ch. {ch.chapter}
                        </span>
                        {ch.volume && (
                          <span className="ml-1.5 text-[11px] text-gray-400">Vol. {ch.volume}</span>
                        )}
                        {/* Mobile-only name */}
                        {ch.nama && <p className="text-xs text-gray-400 mt-0.5 sm:hidden truncate max-w-[160px]">{ch.nama}</p>}
                      </div>
                    </Link>
                  </Td>

                  <Td className="hidden sm:table-cell">
                    <p className="text-sm text-gray-600 truncate max-w-[200px]">{ch.nama || <span className="text-gray-300">—</span>}</p>
                  </Td>

                  <Td className="hidden md:table-cell">
                    {ch.thumbnail ? (
                      <img src={ch.thumbnail} alt="thumb"
                        className="w-14 h-9 object-cover rounded-lg bg-gray-100"
                        onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
                    ) : (
                      <span className="text-xs text-gray-300">Kosong</span>
                    )}
                  </Td>

                  <Td className="hidden sm:table-cell">
                    <div className="flex gap-1">
                      {ch.isigambar && (
                        <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded-md font-medium">
                          <Image className="w-3 h-3" /> Gambar
                        </span>
                      )}
                      {ch.isitext && (
                        <span className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded-md font-medium">
                          <TextIcon className="w-3 h-3" /> Teks
                        </span>
                      )}
                      {!ch.isigambar && !ch.isitext && (
                        <span className="text-xs text-gray-300">Kosong</span>
                      )}
                    </div>
                  </Td>

                  <Td className="hidden lg:table-cell">
                    <span className="text-xs text-gray-400">{new Date(ch.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </Td>

                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionBtn onClick={() => onEdit(ch)} title="Edit chapter">
                        <Edit className="w-3.5 h-3.5" />
                      </ActionBtn>
                      <ActionBtn onClick={() => setDeleteId(ch.id)} variant="danger" title="Hapus chapter">
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

      <Pagination {...pagination} onPageChange={onPageChange} onLimitChange={onLimitChange} isFetching={isFetching} />

      <ConfirmDelete
        open={deleteId !== null}
        title="Hapus Chapter?"
        description="Tindakan ini tidak dapat dibatalkan. Data chapter akan dihapus permanen."
        onConfirm={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
