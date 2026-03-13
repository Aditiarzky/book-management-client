import type React from "react";
import { useState, useEffect, useRef } from "react";
import { X, FileText, Upload, Image, AlignLeft, GripVertical, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { IChapter, IChapterCreateInput, IChapterUpdateInput, IBook } from "../../../types/core.types";
import useUpFile from "@/store/useUploadFileStore";
import TiptapEditor from "@/components/RichTextEditor";

interface ChapterFormProps {
  chapter?: IChapter | null;
  book: IBook | null;
  onSubmit: (data: IChapterCreateInput | IChapterUpdateInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface ImageItem { id: number; url: string; progress?: number; isUploading?: boolean; }

/* ── Draggable image tile ── */
function DraggableImage({ image, index, moveImage, removeImage }: { image: ImageItem; index: number; moveImage: (a: number, b: number) => void; removeImage: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({ type: "IMAGE", item: { index }, canDrag: !image.isUploading, collect: m => ({ isDragging: m.isDragging() }) });
  const [, drop] = useDrop({ accept: "IMAGE", hover: (item: { index: number }) => { if (item.index !== index && !image.isUploading) { moveImage(item.index, index); item.index = index; } } });
  if (!image.isUploading) drag(drop(ref));

  return (
    <div ref={ref} className={`relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-[3/4] group transition-opacity ${isDragging ? "opacity-40" : ""}`}>
      <img src={image.url || "/placeholder.svg"} alt="" className="w-full h-full object-cover"
        onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
      {image.progress !== undefined && image.progress < 100 && (
        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/40 to-transparent">
          <Progress value={image.progress} className="h-1" />
        </div>
      )}
      {!image.isUploading && (
        <>
          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical className="w-3 h-3 text-white" />
          </div>
          <button onClick={() => removeImage(index)}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-3 h-3 text-white" />
          </button>
          <div className="absolute bottom-1.5 left-1.5 text-[10px] text-white/70 font-mono">{index + 1}</div>
        </>
      )}
    </div>
  );
}

/* ── Field label ── */
function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{children}</p>;
}

/* ── Number input ── */
function NumInput({ value, onChange, step = 1, min = 0, placeholder }: { value: number | ""; onChange: (v: number | "") => void; step?: number; min?: number; placeholder?: string }) {
  return (
    <input type="number" step={step} min={min} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className="w-full h-10 px-3.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
  );
}

export default function ChapterForm({ chapter, book, onSubmit, onCancel, loading }: ChapterFormProps) {
  const { uploadFile, uploadFileMultiple, loading: uploading } = useUpFile();

  const [form, setForm] = useState({ bookId: book?.id ?? 0, chapter: 1 as number | "", volume: "" as number | "", nama: "", thumbnail: "", isigambar: [] as string[], isitext: "" });
  const [thumbProgress, setThumbProgress] = useState<number | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<ImageItem[]>([]);
  const [activeTab, setActiveTab] = useState<"images" | "text">("images");

  useEffect(() => {
    if (chapter) {
      let imgs: string[] = [];
      if (Array.isArray(chapter.isigambar)) imgs = chapter.isigambar;
      else if (typeof chapter.isigambar === "string") {
        try { const p = JSON.parse(chapter.isigambar); imgs = Array.isArray(p) ? p : chapter.isigambar.split(",").map(u => u.trim()); }
        catch { imgs = chapter.isigambar.split(",").map(u => u.trim().replace(/^"|"$/g, "")); }
      }
      setForm({ bookId: chapter.bookId, chapter: chapter.chapter, volume: chapter.volume ?? "", nama: chapter.nama ?? "", thumbnail: chapter.thumbnail ?? "", isigambar: imgs, isitext: chapter.isitext ?? "" });
    } else if (book) {
      let next = 1;
      if (book.chapters?.length) next = Math.max(...book.chapters.map(c => Number(c.chapter))) + 1;
      setForm(p => ({ ...p, bookId: book.id, chapter: next }));
    }
  }, [chapter, book]);

  /* Upload thumbnail */
  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbProgress(0);
    const url = await uploadFile(file, p => setThumbProgress(p));
    if (url) { setForm(p => ({ ...p, thumbnail: url })); setThumbProgress(null); }
  };

  /* Upload images */
  const handleImgsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const uploading: ImageItem[] = Array.from(files).map((_, i) => ({ id: Date.now() + i, url: "/placeholder.svg", progress: 0, isUploading: true }));
    setUploadingFiles(p => [...p, ...uploading]);
    const results = await Promise.all(Array.from(files).map(async (file, i) => {
      const url = await uploadFileMultiple(file, p => {
        setUploadingFiles(prev => prev.map(item => item.id === uploading[i].id ? { ...item, progress: p } : item));
      });
      return { i, url };
    }));
    const urls = results.filter(r => r.url).sort((a, b) => a.i - b.i).map(r => r.url!);
    setForm(p => ({ ...p, isigambar: [...p.isigambar, ...urls] }));
    setUploadingFiles(p => p.filter(item => !uploading.find(u => u.id === item.id)));
  };

  const moveImage = (from: number, to: number) => {
    setForm(p => { const a = [...p.isigambar]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return { ...p, isigambar: a }; });
  };
  const removeImage = (index: number) => {
    if (index >= form.isigambar.length) { setUploadingFiles(p => p.filter((_, i) => i !== index - form.isigambar.length)); return; }
    setForm(p => { const a = [...p.isigambar]; a.splice(index, 1); return { ...p, isigambar: a }; });
  };

  const allImages: ImageItem[] = [
    ...form.isigambar.map((url, id) => ({ id, url: url.replace(/^"|"$/g, ""), isUploading: false })),
    ...uploadingFiles,
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chapter && form.chapter !== 0) return;
    const thumb = form.thumbnail?.trim() || book?.cover || (form.isigambar.length > 0 ? form.isigambar[0] : "") || null;
    onSubmit({
      ...form,
      chapter: Number(form.chapter),
      volume: form.volume !== "" ? Number(form.volume) : null,
      thumbnail: thumb,
      isigambar: form.isigambar.length > 0 ? JSON.stringify(form.isigambar) : undefined,
      isitext: form.isitext || null,
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-3xl mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{chapter ? "Edit Chapter" : "Tambah Chapter"}</h2>
              {book && <p className="text-xs text-gray-400 truncate max-w-[260px]">{book.judul}</p>}
            </div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[78vh]">
            <div className="p-6 space-y-5">

              {/* Row 1: chapter / volume / nama */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Chapter *</Label>
                  <NumInput value={form.chapter} onChange={v => setForm(p => ({ ...p, chapter: v }))} step={0.1} min={0} />
                </div>
                <div>
                  <Label>Volume</Label>
                  <NumInput value={form.volume} onChange={v => setForm(p => ({ ...p, volume: v }))} min={1} placeholder="—" />
                </div>
                <div className="col-span-1 sm:col-span-1">
                  <Label>Nama Chapter</Label>
                  <input value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Judul chapter (opsional)"
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <Label>Thumbnail</Label>
                <div className="flex gap-3 items-start">
                  <div className={`w-20 h-[60px] rounded-xl border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden bg-gray-50 ${form.thumbnail ? "border-transparent" : "border-gray-200"}`}>
                    {form.thumbnail
                      ? <img src={form.thumbnail} alt="thumb" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = "/placeholder.svg"; }} />
                      : <Image className="w-5 h-5 text-gray-300" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 h-9 px-3 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors w-fit">
                      <Upload className="w-3.5 h-3.5" /> Upload
                      <input type="file" accept="image/*" onChange={handleThumbUpload} disabled={uploading} className="hidden" />
                    </label>
                    {thumbProgress !== null && <Progress value={thumbProgress} className="h-1.5 w-40" />}
                    <input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))} placeholder="atau paste URL…"
                      className="w-full h-9 px-3 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 placeholder:text-gray-300 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all" />
                  </div>
                </div>
              </div>

              {/* Content tabs */}
              <div>
                <div className="flex border-b border-gray-100 mb-4 gap-0.5">
                  {(["images", "text"] as const).map(tab => (
                    <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all ${activeTab === tab ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"}`}>
                      {tab === "images" ? <><Image className="w-3.5 h-3.5" /> Gambar {form.isigambar.length > 0 && <span className="ml-0.5 opacity-70">({form.isigambar.length})</span>}</> : <><AlignLeft className="w-3.5 h-3.5" /> Teks</>}
                    </button>
                  ))}
                </div>

                {activeTab === "images" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 h-9 px-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload className="w-3.5 h-3.5" /> Upload Gambar
                        <input type="file" accept="image/*" multiple onChange={handleImgsUpload} disabled={uploading} className="hidden" />
                      </label>
                      <p className="text-xs text-gray-400 self-center">Drag untuk urutkan ulang</p>
                    </div>

                    {/* URL textarea */}
                    <textarea rows={3} value={form.isigambar.join(",")}
                      onChange={e => setForm(p => ({ ...p, isigambar: e.target.value.split(",").map(u => u.trim().replace(/^"|"$/g, "")).filter(Boolean) }))}
                      placeholder="Atau paste URL gambar, pisah dengan koma…"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 placeholder:text-gray-300 outline-none resize-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all font-mono" />

                    {/* Image grid */}
                    {allImages.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {allImages.map((img, i) => (
                          <DraggableImage key={img.id} image={img} index={i} moveImage={moveImage} removeImage={removeImage} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "text" && (
                  <div>
                    <TiptapEditor content={form.isitext} onChange={html => setForm(p => ({ ...p, isitext: html }))} />
                    <p className="text-xs text-gray-400 mt-2">Untuk novel atau chapter berbasis teks.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              {allImages.length > 0 && `${form.isigambar.length} gambar`}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onCancel}
                className="h-9 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-white transition-colors">
                Batal
              </button>
              <button type="submit" disabled={loading || uploading}
                className="h-9 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {loading ? "Menyimpan…" : chapter ? "Simpan" : "Tambah Chapter"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DndProvider>
  );
}
