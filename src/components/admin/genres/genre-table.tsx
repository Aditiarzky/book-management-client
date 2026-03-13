import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import type { IGenre } from "../../../types/core.types";
import { SearchInput, TableSkeleton, EmptyState, Pagination, ConfirmDelete, Th, Td, ActionBtn } from "@/components/admin/ui";

interface GenresTableProps {
  genres: IGenre[];
  loading: boolean;
  isFetching?: boolean;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onAdd: () => void;
  onEdit: (g: IGenre) => void;
  onDelete: (id: number) => void;
}

export default function GenresTable({ genres, loading, isFetching, pagination, onPageChange, onLimitChange, onAdd, onEdit, onDelete }: GenresTableProps) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filtered = genres.filter(g =>
    g.nama.toLowerCase().includes(search.toLowerCase()) ||
    (g.deskripsi?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 p-5 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Kelola Genre</h2>
          <p className="text-xs text-gray-400 mt-0.5">{pagination.total} genre terdaftar</p>
        </div>
        <div className="flex gap-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Cari genre..." className="w-full sm:w-48" />
          <button onClick={onAdd}
            className="h-9 px-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium flex items-center gap-1.5 shrink-0 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <EmptyState message={search ? "Tidak ada genre yang cocok" : "Belum ada genre"} />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-100">
              <tr>
                <Th className="w-14">ID</Th>
                <Th>Nama</Th>
                <Th className="hidden sm:table-cell">Deskripsi</Th>
                <Th className="hidden md:table-cell">Dibuat</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(genre => (
                <tr key={genre.id} className="hover:bg-gray-50/50 transition-colors">
                  <Td>
                    <span className="text-xs font-mono text-gray-400">#{genre.id}</span>
                  </Td>
                  <Td>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{genre.nama}</p>
                      {/* Mobile description */}
                      {genre.deskripsi && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px] sm:hidden">{genre.deskripsi}</p>
                      )}
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {genre.deskripsi || <span className="text-gray-300 italic">Tidak ada deskripsi</span>}
                    </p>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <span className="text-xs text-gray-400">
                      {new Date(genre.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <ActionBtn onClick={() => onEdit(genre)} title="Edit genre">
                        <Edit className="w-3.5 h-3.5" />
                      </ActionBtn>
                      <ActionBtn onClick={() => setDeleteId(genre.id!)} variant="danger" title="Hapus genre">
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
        title="Hapus Genre?"
        description="Genre yang dihapus tidak dapat dikembalikan. Buku yang menggunakan genre ini tidak akan ikut terhapus."
        onConfirm={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
