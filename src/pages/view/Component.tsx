import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft, ChevronRight, CloudAlert, LibraryBig,
  RefreshCw, Home, Settings, BookOpen,
  Moon, Sun, ZoomIn, ZoomOut,
  ArrowUp, MessageSquare, List, X
} from 'lucide-react';
import SupabaseCommentEmbed from '@/components/SupabaseCommentEmbed';
import type { IBook, IChapter } from '@/types/core.types';
import { DETAIL_PAGE, VIEW_PAGE, SEARCH_PAGE } from '@/routes/constants';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
// 'dark' | 'light' sync dengan Navigation via useTheme() (ThemeContext)
// 'sepia' adalah mode khusus reader, disimpan di localStorage['r-sepia']
type Theme = 'dark' | 'light' | 'sepia';
type FontSize = 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl';

/* ─────────────────────────────────────────────
   EMPTY STATES
───────────────────────────────────────────── */
const EmptyChapterState = ({ onRefresh, onGoHome }: { onRefresh?: () => void; onGoHome?: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 py-16">
    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
      <CloudAlert className="h-9 w-9 text-gray-400 dark:text-white/20" />
    </div>
    <h2 className="text-xl font-bold text-gray-800 dark:text-white/80 mb-2">Chapter Tidak Ditemukan</h2>
    <p className="text-gray-500 dark:text-white/30 mb-8 max-w-sm text-sm leading-relaxed">
      Chapter yang kamu cari tidak tersedia atau telah dihapus.
    </p>
    <div className="flex gap-3">
      {onRefresh && (
        <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/50 text-sm transition-all">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      )}
      {onGoHome && (
        <button onClick={onGoHome} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-all">
          <Home className="h-4 w-4" /> Beranda
        </button>
      )}
    </div>
  </div>
);

const EmptyContentState = ({ chapterName, onRefresh }: { chapterName: string; onRefresh?: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[30vh] text-center px-6 py-12">
    <CloudAlert className="h-10 w-10 text-gray-300 dark:text-white/20 mb-4" />
    <p className="text-gray-500 dark:text-white/30 text-sm mb-4">Konten {chapterName} belum tersedia.</p>
    {onRefresh && (
      <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 text-sm transition-all hover:bg-gray-200 dark:hover:bg-white/10">
        <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────
   IMAGE BLOCK
───────────────────────────────────────────── */
const ImageBlock = ({ image, alt, zoom }: { image: string; alt: string; zoom: number }) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [states, setStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});

  const urls = useMemo(() => {
    if (!image) return [];
    return image.replace(/^\[|\]$/g, '').split(',').map(u => u.trim().replace(/^"|"$/g, '')).filter(Boolean);
  }, [image]);

  const onLoad = (i: number) => { setLoadedCount(p => p + 1); setStates(p => ({ ...p, [i]: 'loaded' })); };

  const onError = (i: number, url: string) => {
    setStates(p => ({ ...p, [i]: 'error' }));
    const canvas = canvasRefs.current[i];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; ctx.drawImage(img, 0, 0); };
    img.onerror = () => { canvas.width = 400; canvas.height = 100; ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 400, 100); ctx.fillStyle = '#ef4444'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Gagal memuat gambar', 200, 55); };
    img.src = url;
  };

  const progress = urls.length > 0 ? (loadedCount / urls.length) * 100 : 100;

  return (
    <div style={{ maxWidth: `${zoom}%`, margin: '0 auto', transition: 'max-width 0.3s ease' }}>
      {progress < 100 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gray-950 border border-white/10 rounded-xl px-5 py-2.5 flex items-center gap-4 shadow-xl">
          <div className="w-28"><Progress value={progress} className="h-1 bg-white/10" /></div>
          <span className="text-white/40 text-xs tabular-nums">{loadedCount}/{urls.length}</span>
        </div>
      )}
      {urls.map((url, i) => {
        const s = states[i];
        if (s === 'error') return <canvas key={i} ref={el => { canvasRefs.current[i] = el; }} className="w-full" />;
        return (
          <div key={i} className="relative w-full">
            <img src={url} alt={`${alt} - ${i + 1}`} loading="lazy"
              className={`w-full block transition-opacity duration-500 ${s === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => onLoad(i)} onError={() => onError(i, url)} />
            {s !== 'loaded' && <div className="absolute inset-0 bg-gray-200 dark:bg-white/5 animate-pulse" style={{ minHeight: 300 }} />}
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────
   SETTINGS PANEL
───────────────────────────────────────────── */
const SettingsPanel = ({ isOpen, onClose, theme, setTheme, fontSize, setFontSize, zoom, setZoom }: {
  isOpen: boolean; onClose: () => void; theme: Theme; setTheme: (t: Theme) => void;
  fontSize: FontSize; setFontSize: (f: FontSize) => void; zoom: number; setZoom: (z: number) => void;
}) => (
  <>
    <div className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'bg-black/40 backdrop-blur-sm' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
    <div className={`fixed right-0 top-0 h-full w-72 z-50 bg-white dark:bg-[#111114] border-l border-gray-100 dark:border-white/5 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <span className="font-semibold text-sm text-gray-800 dark:text-white/80">Pengaturan Baca</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-5 py-6 space-y-7">
        <div>
          <p className="text-gray-400 dark:text-white/30 text-xs uppercase tracking-widest mb-3">Tema</p>
          <div className="grid grid-cols-3 gap-2">
            {([['dark', 'Dark', Moon], ['light', 'Light', Sun], ['sepia', 'Sepia', BookOpen]] as const).map(([v, l, Icon]) => (
              <button key={v} onClick={() => setTheme(v)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all border ${theme === v ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/5 text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white'}`}>
                <Icon className="h-4 w-4" />{l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-gray-400 dark:text-white/30 text-xs uppercase tracking-widest mb-3">Ukuran Teks</p>
          <div className="flex gap-1.5">
            {(['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'] as FontSize[]).map((f, idx) => (
              <button key={f} onClick={() => setFontSize(f)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${fontSize === f ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' : 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/5 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white'}`}>
                {['S', 'M', 'L', 'XL', '2XL'][idx]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 dark:text-white/30 text-xs uppercase tracking-widest">Lebar Gambar</p>
            <span className="text-gray-500 dark:text-white/40 text-xs font-mono">{zoom}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setZoom(Math.max(40, zoom - 10))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white transition-all">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <input type="range" min={40} max={100} step={5} value={zoom} onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 h-1 appearance-none bg-gray-200 dark:bg-white/10 rounded-full cursor-pointer accent-red-500" />
            <button onClick={() => setZoom(Math.min(100, zoom + 10))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white transition-all">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div>
          <p className="text-gray-400 dark:text-white/30 text-xs uppercase tracking-widest mb-3">Pintasan Keyboard</p>
          <div className="space-y-2">
            {[['←', 'Chapter Sebelumnya'], ['→', 'Chapter Berikutnya'], ['S', 'Pengaturan']].map(([k, d]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-gray-400 dark:text-white/30 text-xs">{d}</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded text-gray-500 dark:text-white/40 text-xs font-mono">{k}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

/* ─────────────────────────────────────────────
   CHAPTER DRAWER
───────────────────────────────────────────── */
const ChapterDrawer = ({ isOpen, onClose, chapters, currentId, bookId, navigate }: {
  isOpen: boolean; onClose: () => void; chapters: IChapter[];
  currentId: number; bookId: number; navigate: ReturnType<typeof useNavigate>;
}) => (
  <>
    <div className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'bg-black/40 backdrop-blur-sm' : 'pointer-events-none opacity-0'}`} onClick={onClose} />
    <div className={`fixed left-0 top-0 h-full w-64 z-50 bg-white dark:bg-[#111114] border-r border-gray-100 dark:border-white/5 shadow-2xl transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <span className="font-semibold text-sm text-gray-800 dark:text-white/80">Daftar Chapter</span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-57px)] py-1">
        {chapters.map(ch => (
          <button key={ch.id} onClick={() => { navigate({ to: VIEW_PAGE, params: { bookId: bookId.toString(), id: ch.id.toString() } }); onClose(); }}
            className={`w-full text-left px-5 py-2.5 text-sm transition-all flex items-center justify-between ${ch.id === currentId ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/3'}`}>
            <span>{ch.volume ? `Vol ${ch.volume} Ch ${ch.chapter}` : `Ch ${ch.chapter}`}</span>
            {ch.id === currentId && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  </>
);

/* ─────────────────────────────────────────────
   READING PROGRESS LINE
───────────────────────────────────────────── */
const ReadingProgressLine = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => { const el = document.documentElement; setP((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100); };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return <div className="h-0.5 bg-gray-100 dark:bg-transparent"><div className="h-full bg-red-500 transition-[width] duration-75" style={{ width: `${p}%` }} /></div>;
};

/* ─────────────────────────────────────────────
   TOP BAR
───────────────────────────────────────────── */
const ReaderTopBar = ({ chapter, konten, isVisible, onSettings, onChapterList }: {
  chapter: IChapter; konten: IBook | null; isVisible: boolean;
  onSettings: () => void; onChapterList: () => void;
}) => (
  <header className={`fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-16'}`}>
    <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5 h-16">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center gap-3">
        <Link to={DETAIL_PAGE} params={{ id: konten?.id.toString() ?? '' }}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors group shrink-0">
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:block text-xs max-w-[130px] truncate font-medium">{konten?.judul}</span>
        </Link>
        <div className="flex-1 text-center min-w-0 px-2">
          <p className="text-gray-700 dark:text-white/70 text-sm font-semibold truncate">
            {chapter.volume ? `Vol ${chapter.volume} · ` : ''}Ch {chapter.chapter}
            {chapter.nama && <span className="text-gray-400 dark:text-white/30 font-normal"> · {chapter.nama}</span>}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Link to={SEARCH_PAGE} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            <Search className="h-4 w-4" />
          </Link>
          <button onClick={onChapterList} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            <List className="h-4 w-4" />
          </button>
          <button onClick={onSettings} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <ReadingProgressLine />
  </header>
);

/* ─────────────────────────────────────────────
   BOTTOM NAV
───────────────────────────────────────────── */
const BottomNav = ({ chapter, konten, prevChapter, nextChapter, listCh, isVisible, navigate }: {
  chapter: IChapter; konten: IBook | null; prevChapter: IChapter | null; nextChapter: IChapter | null;
  listCh: IChapter[]; isVisible: boolean; navigate: ReturnType<typeof useNavigate>;
}) => {
  const [sel, setSel] = useState(chapter?.id.toString());
  useEffect(() => setSel(chapter?.id.toString()), [chapter?.id]);
  const go = (id: string) => {
    setSel(id);
    if (konten?.id) {
      navigate({ to: VIEW_PAGE, params: { bookId: konten.id.toString(), id } });
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t border-gray-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">
          <button disabled={!prevChapter}
            onClick={() => prevChapter && konten && navigate({ to: VIEW_PAGE, params: { bookId: konten.id.toString(), id: prevChapter.id.toString() } })}
            className="flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-medium border transition-all disabled:opacity-25 disabled:cursor-not-allowed border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/3 text-gray-500 dark:text-white/50 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 shrink-0">
            <ChevronLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Prev</span>
          </button>
          <div className="flex-1">
            <Select value={sel} onValueChange={go}>
              <SelectTrigger className="h-9 bg-gray-50 max-w-42 dark:bg-white/3 border-gray-200 dark:border-white/8 text-gray-500 dark:text-white/50 rounded-xl text-xs hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#111114] border-gray-100 dark:border-white/10 text-gray-600 dark:text-white/50 max-h-56">
                {listCh.map(ch => (
                  <SelectItem key={ch.id} value={ch.id.toString()} className="text-xs">
                    {ch.volume ? `Vol ${ch.volume} Ch ${ch.chapter}` : `Ch ${ch.chapter}`}
                    {ch.nama && <span className="opacity-50 ml-1">· {ch.nama}</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link to={DETAIL_PAGE} params={{ id: konten?.id.toString() ?? '' }}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/3 border border-gray-200 dark:border-white/8 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 transition-all shrink-0">
            <LibraryBig className="h-4 w-4" />
          </Link>
          <button disabled={!nextChapter}
            onClick={() => nextChapter && konten && navigate({ to: VIEW_PAGE, params: { bookId: konten.id.toString(), id: nextChapter.id.toString() } })}
            className="flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-medium border transition-all disabled:opacity-25 disabled:cursor-not-allowed bg-red-500 border-red-500 text-white hover:bg-red-600 shrink-0">
            <span className="hidden sm:inline">Next</span><ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────── */
export default function ViewComponent({ viewChapter, chapterByBook }: { viewChapter: IChapter | null; chapterByBook: IChapter[] }) {
  const [fontSize, setFontSize] = useState<FontSize>('text-base');
  const [zoom, setZoom] = useState(100);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chapterDrawerOpen, setChapterDrawerOpen] = useState(false);
  const [barsVisible, setBarsVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const lastY = useRef(0);
  const navigate = useNavigate();
  const supabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Theme: pakai useTheme() — sama persis dengan Navigation
  // Sepia adalah mode tambahan khusus reader
  const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme();
  const [isSepiaModeActive, setIsSepiaModeActive] = useState<boolean>(
    () => localStorage.getItem('r-sepia') === 'true'
  );

  // theme yang digunakan di reader = sepia jika aktif, else ikut globalTheme
  const theme: Theme = isSepiaModeActive ? 'sepia' : (globalTheme as 'dark' | 'light');

  const setTheme = (t: Theme) => {
    if (t === 'sepia') {
      setIsSepiaModeActive(true);
      localStorage.setItem('r-sepia', 'true');
    } else {
      setIsSepiaModeActive(false);
      localStorage.removeItem('r-sepia');
      setGlobalTheme(t); // update ThemeContext → sync ke Navigation & <html>
    }
  };

  // Load reader-specific prefs
  useEffect(() => {
    setFontSize((localStorage.getItem('r-fontSize') as FontSize) || 'text-base');
    setZoom(Number(localStorage.getItem('r-zoom')) || 100);
  }, []);

  useEffect(() => { localStorage.setItem('r-fontSize', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('r-zoom', zoom.toString()); }, [zoom]);

  // Hide global nav & footer — reader has its own
  useEffect(() => {
    const nav = document.querySelector('nav') as HTMLElement | null;
    const footer = document.querySelector('footer') as HTMLElement | null;
    if (nav) nav.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (nav) nav.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  // Scroll: auto-hide bars
  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      setShowScrollTop(y > 400);
      if (Math.abs(y - lastY.current) < 8) return;
      setBarsVisible(y < lastY.current || y < 80);
      lastY.current = y;
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const sorted = useMemo(() =>
    [...chapterByBook].sort((a, b) => ((a.volume ?? 0) - (b.volume ?? 0)) || (a.chapter - b.chapter)),
    [chapterByBook]
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!viewChapter) return;
    const idx = sorted.findIndex(c => c.id === viewChapter.id);
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;
    const bid = viewChapter.book?.id?.toString() ?? '';
    const fn = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft' && prev) navigate({ to: VIEW_PAGE, params: { bookId: bid, id: prev.id.toString() } });
      if (e.key === 'ArrowRight' && next) navigate({ to: VIEW_PAGE, params: { bookId: bid, id: next.id.toString() } });
      if (e.key === 's' || e.key === 'S') setSettingsOpen(o => !o);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [viewChapter, sorted, navigate]);

  if (!viewChapter) return <EmptyChapterState onRefresh={() => window.location.reload()} onGoHome={() => navigate({ to: '/' })} />;

  const idx = sorted.findIndex(c => c.id === viewChapter.id);
  const prevChapter = idx > 0 ? sorted[idx - 1] : null;
  const nextChapter = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  // Sepia override: dark/light sepenuhnya dari Tailwind dark: class (sync Navigation)
  const isSepia = isSepiaModeActive;

  return (
    <div key={viewChapter.id} className="min-h-screen transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        .prose-reader { font-family: 'Lora', Georgia, serif; }
        .prose-reader p { margin: 0; padding: 0.5em 0; line-height: 1.9; text-indent: 1.5em; }
        .prose-reader p:first-child, .prose-reader p:empty { text-indent: 0; }
        .prose-reader p:empty::after { content: '\\200B'; }
        .prose-reader h1 { font-size: 1.6em; font-weight: 700; margin: 1em 0 0.5em; text-indent: 0; }
        .prose-reader h2 { font-size: 1.3em; font-weight: 600; margin: 0.8em 0 0.4em; text-indent: 0; }
        .prose-reader strong { font-weight: 600; }
        .prose-reader em { font-style: italic; }
        .prose-reader a { color: #ef4444; }
        .prose-reader ul, .prose-reader ol { margin: 1em 0; padding-left: 1.5em; }
        .prose-reader li { margin: 0.3em 0; line-height: 1.7; }
        .prose-reader ul li { list-style-type: disc; }
        .prose-reader ol li { list-style-type: decimal; }
      `}</style>

      <ReaderTopBar chapter={viewChapter} konten={viewChapter.book} isVisible={barsVisible}
        onSettings={() => setSettingsOpen(true)} onChapterList={() => setChapterDrawerOpen(true)} />

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}
        theme={theme} setTheme={setTheme} fontSize={fontSize} setFontSize={setFontSize} zoom={zoom} setZoom={setZoom} />

      <ChapterDrawer isOpen={chapterDrawerOpen} onClose={() => setChapterDrawerOpen(false)}
        chapters={sorted} currentId={viewChapter.id} bookId={viewChapter.bookId} navigate={navigate} />

      {/* Scroll to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed right-4 bottom-16 z-30 w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 text-gray-400 dark:text-white/30 hover:text-gray-700 dark:hover:text-white shadow-sm transition-all duration-300 ${showScrollTop ? 'opacity-50 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
        <ArrowUp className="h-4 w-4" />
      </button>

      <main className="pt-16 pb-14">
        {/* Chapter header */}
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <Link to={DETAIL_PAGE} params={{ id: viewChapter.bookId.toString() }}
            className="inline-flex items-start gap-1.5 text-gray-400 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 text-xs uppercase tracking-widest mb-3 transition-colors font-medium">
            <LibraryBig className="h-3.5 w-3.5" />
            {viewChapter.book?.judul}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/80 mb-1">
            {viewChapter.volume && <span className="text-gray-400 dark:text-white/25 font-normal text-lg mr-2">Vol {viewChapter.volume}</span>}
            Chapter {viewChapter.chapter}
          </h1>
          {viewChapter.nama && <p className="text-gray-400 dark:text-white/30 text-sm mt-1">{viewChapter.nama}</p>}
          <p className="text-gray-300 dark:text-white/15 text-xs mt-3">{idx + 1} / {sorted.length}</p>
        </div>

        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/8 to-transparent" />
        </div>

        {/* Content */}
        {!viewChapter.isitext && !viewChapter.isigambar ? (
          <EmptyContentState
            chapterName={`Chapter ${viewChapter.chapter}${viewChapter.nama ? ` - ${viewChapter.nama}` : ''}`}
            onRefresh={() => window.location.reload()}
          />
        ) : (
          <>
            {viewChapter.isitext && (
              <div
                className={`max-w-2xl mx-auto px-5 sm:px-8 py-6 rounded-2xl prose-reader ${fontSize} bg-white dark:bg-transparent text-gray-800 dark:text-white/85`}
                style={isSepia ? { backgroundColor: '#faf6ef', color: '#3d2b1f' } : {}}
                dangerouslySetInnerHTML={{ __html: viewChapter.isitext }}
              />
            )}
            {viewChapter.isigambar && (
              <ImageBlock image={viewChapter.isigambar}
                alt={`Chapter ${viewChapter.chapter} - ${viewChapter.book?.judul}`} zoom={zoom} />
            )}
          </>
        )}

        {/* End of chapter nav */}
        <div className="max-w-xl mx-auto px-4 mt-14">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/8 to-transparent mb-8" />
          <div className="grid grid-cols-2 gap-3">
            <button disabled={!prevChapter}
              onClick={() => prevChapter && viewChapter.book?.id && navigate({ to: VIEW_PAGE, params: { bookId: viewChapter.book.id.toString(), id: prevChapter.id.toString() } })}
              className="flex items-center gap-2 py-3.5 px-4 rounded-2xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5 text-gray-500 dark:text-white/40 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/6 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[10px] opacity-50 leading-none mb-1">Sebelumnya</p>
                <p className="text-sm font-medium leading-none truncate">{prevChapter ? `Ch ${prevChapter.chapter}` : '—'}</p>
              </div>
            </button>
            <button disabled={!nextChapter}
              onClick={() => nextChapter && viewChapter.book?.id && navigate({ to: VIEW_PAGE, params: { bookId: viewChapter.book.id.toString(), id: nextChapter.id.toString() } })}
              className="flex items-center justify-end gap-2 py-3.5 px-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/15 transition-all disabled:opacity-25 disabled:cursor-not-allowed">
              <div className="text-right min-w-0">
                <p className="text-[10px] opacity-50 leading-none mb-1">Berikutnya</p>
                <p className="text-sm font-medium leading-none truncate">{nextChapter ? `Ch ${nextChapter.chapter}` : '—'}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* Comments */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="h-4 w-4 text-gray-300 dark:text-white/15" />
            <span className="text-gray-400 dark:text-white/25 text-xs font-semibold uppercase tracking-widest">Komentar</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-white/5" />
          </div>
          {supabaseConfigured ? (
            <SupabaseCommentEmbed site="chapter" slug={`${viewChapter.bookId}-${viewChapter.id}`} title="Komentar Chapter" />
          ) : (
            <p className="text-gray-300 dark:text-white/15 text-xs text-center py-6">
              Set <code className="font-mono">VITE_SUPABASE_URL</code> dan <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> untuk komentar.
            </p>
          )}
        </section>

        {/* Simple footer */}
        <div className="border-t border-gray-100 dark:border-white/5 py-6 text-center">
          <p className="text-gray-300 dark:text-white/15 text-xs">© {new Date().getFullYear()} Riztranslation</p>
        </div>
      </main>

      <BottomNav chapter={viewChapter} konten={viewChapter.book} prevChapter={prevChapter}
        nextChapter={nextChapter} listCh={sorted} isVisible={barsVisible} navigate={navigate} />
    </div>
  );
}
