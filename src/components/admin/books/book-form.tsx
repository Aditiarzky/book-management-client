import type React from "react";
import { useState, useEffect } from "react";
import { X, BookOpen, Upload, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { IBook, IBookCreateInput, IBookUpdateInput } from "../../../types/core.types";
import useGenreStore from "@/store/useGenreStore";
import useUpFile from "@/store/useUploadFileStore";

interface BookFormProps {
  book?: IBook | null;
  onSubmit: (data: IBookCreateInput | IBookUpdateInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const STATUSES = ["ongoing", "completed", "hiatus", "dropped"] as const;
const TYPES = ["Manga", "Web Manga", "Web Novel", "Light Novel", "Novel"] as const;

const STATUS_STYLE: Record<string, string> = {
  ongoing: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
  hiatus: "border-amber-200 bg-amber-50 text-amber-700",
  dropped: "border-red-200 bg-red-50 text-red-500",
};

/* ── Field wrapper ── */
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5 normal-case font-normal tracking-normal">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

/* ── Text input ── */
function TextInput({ value, onChange, placeholder, hasError }: { value: string; onChange: (v: string) => void; placeholder?: string; hasError?: boolean }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`w-full h-10 px-3.5 text-sm rounded-xl border bg-white text-gray-800 placeholder:text-gray-300 outline-none transition-all
        ${hasError ? "border-red-300 ring-2 ring-red-100" : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"}`} />
  );
}

export default function BookForm({ book, onSubmit, onCancel, loading }: BookFormProps) {
  const { genres } = useGenreStore();
  const { uploadFile, loading: uploading } = useUpFile();

  const [form, setForm] = useState({
    judul: "", alt_judul: "", cover: "", author: "", artist: "",
    synopsis: "", status: "", type: "", genreIds: [] as number[],
  });
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm({
      judul: book?.judul ?? "",
      alt_judul: book?.alt_judul ?? "",
      cover: book?.cover ?? "",
      author: book?.author ?? "",
      artist: book?.artist ?? "",
      synopsis: book?.synopsis ?? "",
      status: book?.status ?? "",
      type: book?.type ?? "",
      genreIds: book?.genres?.map(g => g.id!).filter(Boolean) ?? [],
    });
    setSubmitted(false);
  }, [book]);

  const set = (key: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [key]: v }));

  const toggleGenre = (id: number) =>
    setForm(p => ({
      ...p,
      genreIds: p.genreIds.includes(id) ? p.genreIds.filter(x => x !== id) : [...p.genreIds, id],
    }));

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverProgress(0);
    const url = await uploadFile(file, p => setCoverProgress(p));
    if (url) { setForm(p => ({ ...p, cover: url })); setCoverProgress(null); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.judul || !form.author || !form.artist || !form.cover) return;
    onSubmit(form);
  };

  const err = (field: keyof typeof form) =>
    submitted && !form[field] ? `${field === "judul" ? "Judul" : field === "author" ? "Author" : field === "artist" ? "Artist" : "Cover"} wajib diisi` : undefined;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-3xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{book ? "Edit Buku" : "Tambah Buku"}</h2>
            <p className="text-xs text-gray-400">{book ? `Mengedit: ${book.judul}` : "Isi detail buku baru"}</p>
          </div>
        </div>
        <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit}>
        <div className="overflow-y-auto max-h-[75vh]">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LEFT — cover upload */}
            <div className="md:col-span-1 flex flex-col gap-5">

              {/* Cover preview */}
              <Field label="Cover" required error={err("cover")}>
                <div className="flex gap-3 items-start">
                  <div className={`w-[90px] h-[128px] rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden bg-gray-50 transition-colors ${form.cover ? "border-transparent" : "border-gray-200"}`}>
                    {form.cover
                      ? <img src={form.cover} alt="cover" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
                      : <BookOpen className="w-6 h-6 text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className={`flex items-center gap-2 h-9 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors
                      ${uploading ? "border-gray-100 bg-gray-50 text-gray-400" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? "Mengupload…" : "Upload File"}
                      <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploading} className="hidden" />
                    </label>
                    {coverProgress !== null && <Progress value={coverProgress} className="h-1.5" />}
                    <input value={form.cover} onChange={e => setForm(p => ({ ...p, cover: e.target.value }))}
                      placeholder="atau paste URL…"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                  </div>
                </div>
              </Field>

              {/* Status */}
              <Field label="Status">
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s} type="button" onClick={() => setForm(p => ({ ...p, status: p.status === s ? "" : s }))}
                      className={`h-8 px-3 rounded-xl text-xs font-medium border transition-all capitalize ${form.status === s ? STATUS_STYLE[s] : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Type */}
              <Field label="Tipe">
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: p.type === t ? "" : t }))}
                      className={`h-8 px-3 rounded-xl text-xs font-medium border transition-all ${form.type === t ? "border-gray-700 bg-gray-900 text-white" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {/* RIGHT — metadata */}
            <div className="md:col-span-1 space-y-4">
              <Field label="Judul" required error={err("judul")}>
                <TextInput value={form.judul} onChange={set("judul")} placeholder="Judul buku" hasError={!!err("judul")} />
              </Field>
              <Field label="Judul Alternatif">
                <TextInput value={form.alt_judul} onChange={set("alt_judul")} placeholder="Judul lain (opsional)" />
              </Field>
              <Field label="Author" required error={err("author")}>
                <TextInput value={form.author} onChange={set("author")} placeholder="Nama author" hasError={!!err("author")} />
              </Field>
              <Field label="Artist" required error={err("artist")}>
                <TextInput value={form.artist} onChange={set("artist")} placeholder="Nama artist" hasError={!!err("artist")} />
              </Field>
              <Field label="Sinopsis">
                <textarea value={form.synopsis} onChange={e => setForm(p => ({ ...p, synopsis: e.target.value }))}
                  rows={4} placeholder="Ringkasan cerita…"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-300 outline-none resize-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
              </Field>
            </div>

            {/* Genre — full width */}
            <div className="md:col-span-2">
              <Field label="Genre">
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  {/* Selected tags */}
                  {form.genreIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {form.genreIds.map(id => {
                        const g = genres.find(x => x.id === id);
                        return g ? (
                          <button key={id} type="button" onClick={() => toggleGenre(id)}
                            className="flex items-center gap-1 h-6 pl-2.5 pr-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-medium hover:bg-gray-700 transition-colors">
                            {g.nama}
                            <X className="w-3 h-3 opacity-60" />
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                    {genres.map(g => {
                      const selected = form.genreIds.includes(g.id!);
                      return (
                        <button key={g.id} type="button" onClick={() => toggleGenre(g.id!)}
                          className={`flex items-center gap-2 h-8 px-3 rounded-xl text-xs font-medium border transition-all text-left ${selected ? "border-gray-700 bg-white text-gray-900" : "border-transparent bg-white text-gray-500 hover:border-gray-200"}`}>
                          <span className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-gray-900 border-gray-900" : "border-gray-300"}`}>
                            {selected && <Check className="w-2.5 h-2.5 text-white" />}
                          </span>
                          <span className="truncate">{g.nama}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-400">Kolom bertanda * wajib diisi</p>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel}
              className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading || uploading}
              className="h-9 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              {loading ? "Menyimpan…" : book ? "Simpan Perubahan" : "Tambah Buku"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
