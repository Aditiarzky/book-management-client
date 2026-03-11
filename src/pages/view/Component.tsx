
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, CloudAlert, LibraryBig, RefreshCw, Home } from 'lucide-react';
import SupabaseCommentEmbed from '@/components/SupabaseCommentEmbed';
import type { IBook, IChapter } from '@/types/core.types';
import { DETAIL_PAGE, VIEW_PAGE } from '@/routes/constants';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

// Custom Switch Component
const CustomSwitch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
      />
      <div className={`w-11 h-6 bg-gray-200 rounded-md peer dark:bg-gray-700 ${checked ? 'bg-gray-500' : ''}`}>
        <div className={`absolute top-0.5 left-[2px] bg-white border-gray-300 border rounded-md h-5 w-5 transition-all ${checked ? 'translate-x-5' : ''}`}></div>
      </div>
    </label>
  );
};

// Komponen Empty State untuk Chapter
const EmptyChapterState = ({ onRefresh, onGoHome }: {
  onRefresh?: () => void;
  onGoHome?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
    <CloudAlert className="h-16 w-16 text-muted-foreground mb-4" />
    <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Chapter Tidak Ditemukan</h2>
    <p className="text-muted-foreground mb-6 max-w-md">
      Chapter yang Anda cari tidak tersedia atau telah dihapus. Silakan coba chapter lain atau kembali ke halaman utama.
    </p>
    <div className="flex gap-3">
      {onRefresh && (
        <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Halaman
        </Button>
      )}
      {onGoHome && (
        <Button onClick={onGoHome} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Button>
      )}
    </div>
  </div>
);

// Komponen Empty State untuk Konten Chapter
const EmptyContentState = ({ chapterName, onRefresh }: {
  chapterName: string;
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[30vh] p-8 text-center">
    <CloudAlert className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-xl font-semibold text-muted-foreground mb-2">Konten Tidak Tersedia</h3>
    <p className="text-muted-foreground mb-4 max-w-md">
      Konten untuk {chapterName} tidak tersedia. Mungkin masih dalam proses penerjemahan atau ada masalah teknis.
    </p>
    {onRefresh && (
      <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Coba Lagi
      </Button>
    )}
  </div>
);

interface NavChInterface {
  chapter: IChapter | null;
  konten: IBook | null;
  nextChapter: IChapter | null;
  prevChapter: IChapter | null;
  listCh: IChapter[];
}

interface ImageBlockProps {
  image: string;
  alt: string;
}

const ImageBlock = ({ image, alt }: ImageBlockProps) => {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const [loadedCount, setLoadedCount] = useState(0)
  const [errors, setErrors] = useState<number[]>([])
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({})

  const imageUrls = useMemo(() => {
    if (!image) return []
    const trimmed = image.replace(/^\[|\]$/g, '')
    return trimmed
      .split(',')
      .map((url) => url.trim().replace(/^"|"$/g, ''))
      .filter(Boolean)
  }, [image])

  const handleImageLoad = (index: number) => {
    setLoadedCount((prev) => prev + 1)
    setImageLoadStates((prev) => ({ ...prev, [index]: 'loaded' }))
  }

  const handleImageError = (index: number, url: string) => {
    setErrors((prev) => [...prev, index])
    setImageLoadStates((prev) => ({ ...prev, [index]: 'error' }))

    const canvas = canvasRefs.current[index]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)
    }

    img.onerror = () => {
      canvas.width = 300
      canvas.height = 150
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "red"
      ctx.font = "16px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Gagal memuat gambar", canvas.width / 2, canvas.height / 2)
    }

    img.src = url
  }

  const progress = imageUrls.length > 0 ? (loadedCount / imageUrls.length) * 100 : 0

  return (
    <div className="space-y-4">
      {progress < 100 && (
        <div className="w-1/2 max-w-md mx-auto">
          <Progress value={progress} />
          <p className="text-center text-sm text-muted-foreground mt-2">
            Memuat gambar... ({loadedCount}/{imageUrls.length})
          </p>
        </div>
      )}

      {errors.length > 0 && progress === 100 && (
        <p className="text-red-500 text-center">Beberapa gambar gagal dimuat, ditampilkan ulang dengan canvas.</p>
      )}

      <div>
        {imageUrls.map((url: string, index) => {
          const state = imageLoadStates[index]

          if (state === 'error') {
            return (
              <canvas
                key={index}
                ref={(el) => {
                  canvasRefs.current[index] = el
                }}
                aria-label={`Canvas fallback untuk ${alt} - bagian ${index + 1}`}
                className="w-full"
              />
            )
          }

          return (
            <div key={index} className="relative w-full">
              {/* Always render <img>, handle state via onLoad/onError */}
              <img
                src={url}
                alt={`${alt} - bagian ${index + 1}`}
                loading="lazy"
                className={`w-full transition-opacity duration-300 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageError(index, url)}
              />
              {state !== 'loaded' && (
                <div className="absolute inset-0 my-2 bg-muted animate-pulse rounded-md" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


function NavCh({ chapter, konten, prevChapter, listCh, nextChapter }: NavChInterface) {
  const [isFixed, setIsFixed] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState(chapter?.id.toString());
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset;
      if (currentScrollPos < prevScrollPos && !isFixed) {
        setIsFixed(true);
      } else if (currentScrollPos > prevScrollPos && isFixed) {
        setIsFixed(false);
      }
      setPrevScrollPos(currentScrollPos);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFixed, prevScrollPos]);

  useEffect(() => {
    setSelectedChapter(chapter?.id.toString());
  }, [chapter?.id]);

  const handleGoToNextChapter = () => {
    if (!nextChapter || !konten?.id) return;
    navigate({
      to: VIEW_PAGE,
      params: {
        bookId: konten.id.toString(),
        id: nextChapter.id.toString(),
      },
    });
  };

  const handleGoToPrevChapter = () => {
    if (!prevChapter || !konten?.id) return;
    navigate({
      to: VIEW_PAGE,
      params: {
        bookId: konten.id.toString(),
        id: prevChapter.id.toString(),
      },
    });
  };

  const handleChapterChange = (value: string) => {
    setSelectedChapter(value);
    if (konten?.id) {
      navigate({ to: `/view/${konten.id}/${value}` });
    }
  };

  // Jika tidak ada chapter, tidak tampilkan navigasi
  if (!chapter) {
    return null;
  }

  return (
    <div>
      <nav className={`${isFixed ? 'fixed' : 'hidden'} w-full left-0 right-0 bottom-0 z-50`}>
        <div className="my-5 ps-3 pe-3 flex w-full justify-center text-white gap-3">
          {prevChapter && (
            <Button className="hov-b w-fit p-0 text-white" onClick={handleGoToPrevChapter}>
              <div className="px-3 py-2.5 bg-gray-900 shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] rounded">
                <ChevronLeft className='h-4' />
              </div>
            </Button>
          )}
          <Link className="hov-b" to={DETAIL_PAGE} params={{ id: `${konten?.id}` }}>
            <div className="px-3 py-2.5 bg-gray-900 shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] rounded">
              <LibraryBig className='h-4' />
            </div>
          </Link>
          <div className="bg-gray-900 shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] rounded">
            <Select value={selectedChapter} onValueChange={handleChapterChange}>
              <SelectTrigger className="border text-gray-500 border-gray-900 bg-inherit rounded">
                <SelectValue placeholder="Select Chapter" />
              </SelectTrigger>
              <SelectContent className='bg-gray-900 text-gray-500'>
                {listCh.map((ch) => (
                  <SelectItem key={ch.id} value={ch.id.toString()}>
                    {ch.volume ? `Vol ${ch.volume} Ch ${ch.chapter}` : `Ch ${ch.chapter}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {nextChapter && (
            <Button className="hov-b w-fit p-0 text-white" onClick={handleGoToNextChapter}>
              <div className="px-3 py-2.5 bg-gray-900 shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px] rounded">
                <ChevronRight className='h-4' />
              </div>
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}

export default function ViewComponent(
  { viewChapter, chapterByBook }:
    { viewChapter: IChapter | null, chapterByBook: IChapter[] }) {
  const [fontSizeClass, setFontSizeClass] = useState('');
  const [readingMode, setReadingMode] = useState(false);
  const navigate = useNavigate();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    setFontSizeClass(savedFontSize || 'text-md');
    const savedReadingMode = localStorage.getItem('readingMode');
    setReadingMode(savedReadingMode === 'true');
  }, []);

  const handleFontSizeChange = (event: { target: { value: string; }; }) => {
    const selectedFontSize = event.target.value;
    setFontSizeClass(selectedFontSize);
    localStorage.setItem('fontSize', selectedFontSize);
  };

  const toggleReadingMode = () => {
    const newMode = !readingMode;
    setReadingMode(newMode);
    localStorage.setItem('readingMode', newMode.toString());
  };

  const createMarkup = (text: string) => {
    return { __html: text };
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate({ to: '/' });
  };

  // Jika tidak ada viewChapter, tampilkan empty state
  if (!viewChapter) {
    return <EmptyChapterState onRefresh={handleRefresh} onGoHome={handleGoHome} />;
  }

  const sortedChapters = [...chapterByBook].sort((a, b) => {
    const volA = a.volume ?? 0;
    const volB = b.volume ?? 0;
    if (volA !== volB) {
      return volA - volB;
    }
    return a.chapter - b.chapter;
  });
  const currentIndex = sortedChapters.findIndex((ch) => ch.id === viewChapter.id);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  return (
    <div key={viewChapter?.id}>
      {/* style untuk isi teks */}
      <style>
        {`
          .tiptap-content {
            font-family:serif;
            min-height: 200px; /* Ensures the container has a minimum height */
          }
          .tiptap-content h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 1em 0;
            text-indent: 0; /* No indentation for headings */
          }
          .tiptap-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 1em 0;
            text-indent: 0; /* No indentation for headings */
          }
          .tiptap-content p {
            margin: 1em 0; /* Clear separation between paragraphs */
            min-height: 1.5em; /* Visible height for empty paragraphs */
            line-height: 1.5; /* Improved readability */
            text-indent: 1em; /* Novel-like first-line indentation */
          }
          .tiptap-content p:empty {
            text-indent: 0; /* No indentation for empty paragraphs */
          }
          .tiptap-content p:empty::after {
            content: '\u200B'; /* Zero-width space to force empty paragraph rendering */
          }
          .tiptap-content br {
            display: block;
            content: '';
            margin-bottom: 1.2em; /* Spacing for line breaks */
          }
          .tiptap-content ul,
          .tiptap-content ol {
            margin: 1.2em 0;
            padding-left: 2em;
          }
          .tiptap-content ul li {
            list-style-type: disc;
            margin: 0.5em 0; /* Spacing between list items */
          }
          .tiptap-content ol li {
            list-style-type: decimal;
            margin: 0.5em 0; /* Spacing between list items */
          }
          .tiptap-content a {
            color: #1a73e8;
            text-decoration: underline;
          }
          .tiptap-content strong {
            font-weight: bold;
          }
          .tiptap-content em {
            font-style: italic;
          }
          .tiptap-content u {
            text-decoration: underline;
          }
          .tiptap-content img {
            width: 100%;
            max-width: 100%;
            height: auto;
            margin: 0.5em 0;
          }
          .tiptap-content [data-type="highlight"] {
            background-color: yellow;
          }
          .tiptap-content [style*="text-align: left"] {
            text-align: left;
          }
          .tiptap-content [style*="text-align: center"] {
            text-align: center;
          }
          .tiptap-content [style*="text-align: right"] {
            text-align: right;
          }
          .tiptap-content [style*="text-align: justify"] {
            text-align: justify;
          }
        `}
      </style>

      <div>
        <NavCh
          konten={viewChapter?.book}
          chapter={viewChapter}
          prevChapter={prevChapter}
          listCh={sortedChapters}
          nextChapter={nextChapter}
        />
      </div>

      <main className="transition-all min-h-dvh flex mb-10 flex-col items-center w-full duration-500 max-w-6xl mx-auto">
        <div className="my-5 w-full md:px-4 px-2 flex flex-col gap-1 items-center">
          <h1 className="text-2xl hover:underline font-semibold text-center">
            <Link to={DETAIL_PAGE} params={{ id: viewChapter.bookId.toString() }}>{viewChapter.book.judul}</Link>
          </h1>
          <h1 className="text-xl font-medium">
            Chapter {viewChapter.chapter}
            {viewChapter.volume && <span className="ml-1">Vol {viewChapter.volume}</span>}
            {viewChapter.nama && <span className="ml-1">{viewChapter.nama}</span>}
          </h1>
        </div>
        <div className='md:px-4 w-full px-2'>
          {viewChapter.isitext && (
            <div className="mb-4 flex flex-col items-end justify-end w-full gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="readingMode" className="text-sm font-medium">
                  Reading Theme
                </label>
                <CustomSwitch
                  checked={readingMode}
                  onCheckedChange={toggleReadingMode}
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="fontSize" className="text-sm font-medium flex items-center gap-1">
                  Font Size
                </label>
                <select
                  id="fontSize"
                  className="pl-2 pe-10 cursor-pointer py-1 border text-gray-500 border-gray-300 bg-inherit rounded"
                  value={fontSizeClass}
                  onChange={handleFontSizeChange}
                >
                  <option value="text-xs">XS</option>
                  <option value="text-sm">SM</option>
                  <option value="text-md">MD</option>
                  <option value="text-lg">LG</option>
                  <option value="text-xl">XL</option>
                  <option value="text-2xl">2XL</option>
                  <option value="text-3xl">3XL</option>
                  <option value="text-4xl">4XL</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Cek apakah ada konten (teks atau gambar) */}
        {(!viewChapter.isitext && !viewChapter.isigambar) ? (
          <EmptyContentState
            chapterName={`Chapter ${viewChapter.chapter}${viewChapter.nama ? ` - ${viewChapter.nama}` : ''}`}
            onRefresh={handleRefresh}
          />
        ) : (
          <>
            {viewChapter.isitext && (
              <div className={`tiptap-content transition-all duration-200 p-4 w-full rounded-xl ${fontSizeClass} ${readingMode ? 'bg-amber-50 shadow-xl dark:shadow-gray-800 text-amber-900' : ''}`} dangerouslySetInnerHTML={createMarkup(viewChapter.isitext)} />
            )}
            {viewChapter.isigambar && (
              <ImageBlock image={viewChapter.isigambar} alt={`Chapter ${viewChapter.chapter} - ${viewChapter.book.judul}`} />
            )}
          </>
        )}
      </main>
      <section className="w-full max-w-6xl mx-auto px-2 py-10 dark:text-white text-black min-h-96">
        {supabaseConfigured ? (
          <SupabaseCommentEmbed
            site="chapter"
            slug={`${viewChapter.bookId}-${viewChapter.id}`}
            title="Komentar Chapter"
          />
        ) : (
          <p className="text-xs text-slate-400">
            Komentar Supabase belum dikonfigurasi. Set <code>VITE_SUPABASE_URL</code> dan{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> untuk menampilkannya.
          </p>
        )}
      </section>
    </div>
  );
}
