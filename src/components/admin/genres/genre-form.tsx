import type React from "react";
import { useState, useEffect } from "react";
import { X, Tags } from "lucide-react";
import type { IGenre } from "../../../types/core.types";

interface GenreFormProps {
  genre?: IGenre | null;
  onSubmit: (data: Omit<IGenre, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function GenreForm({ genre, onSubmit, onCancel, loading }: GenreFormProps) {
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setNama(genre?.nama ?? "");
    setDeskripsi(genre?.deskripsi ?? "");
    setTouched(false);
  }, [genre]);

  const invalid = touched && !nama.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!nama.trim()) return;
    onSubmit({ nama: nama.trim(), deskripsi: deskripsi.trim() });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center">
            <Tags className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{genre ? "Edit Genre" : "Tambah Genre"}</h2>
            <p className="text-xs text-gray-400">{genre ? `Mengedit: ${genre.nama}` : "Buat genre baru"}</p>
          </div>
        </div>
        <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Nama */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Nama Genre <span className="text-red-400 normal-case font-normal tracking-normal">*</span>
          </label>
          <input
            value={nama}
            onChange={e => setNama(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Contoh: Action, Romance, Fantasy…"
            className={`w-full h-10 px-3.5 text-sm rounded-xl border bg-white text-gray-800 placeholder:text-gray-300 outline-none transition-all
              ${invalid
                ? "border-red-300 ring-2 ring-red-100"
                : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              }`}
          />
          {invalid && <p className="text-xs text-red-400">Nama genre wajib diisi</p>}
        </div>

        {/* Deskripsi */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Deskripsi</label>
          <textarea
            value={deskripsi}
            onChange={e => setDeskripsi(e.target.value)}
            rows={3}
            placeholder="Deskripsi singkat tentang genre ini…"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-300 outline-none resize-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={loading}
            className="flex-1 h-10 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            {loading ? "Menyimpan…" : genre ? "Simpan Perubahan" : "Tambah Genre"}
          </button>
          <button type="button" onClick={onCancel}
            className="h-10 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
