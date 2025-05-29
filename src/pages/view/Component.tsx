import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate} from '@tanstack/react-router';
import { ALargeSmall, ChevronLeft, ChevronRight, CloudAlert, LibraryBig } from 'lucide-react';
import { DiscussionEmbed } from 'disqus-react';
import { useTheme } from '@/context/ThemeContext';
import type { IBook, IChapter } from '@/types/core.types';
import { DETAIL_PAGE, VIEW_PAGE } from '@/routes/constants';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface NavChInterface{
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
                className={`w-full transition-opacity duration-300 ${
                  state === 'loaded' ? 'opacity-100' : 'opacity-0'
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


function NavCh({ chapter, konten, prevChapter, listCh, nextChapter}:NavChInterface) {
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
          <Link className="hov-b" to={DETAIL_PAGE} params={{id:`${konten?.id}`}}>
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
                    Chapter {ch.chapter}
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
  { viewChapter, chapterByBook}:
  {viewChapter:IChapter|null, chapterByBook:IChapter[]}) {
  const [fontSizeClass, setFontSizeClass] = useState('');
  const { theme } = useTheme();
  
  const disqusShortname = 'riztranslation-1'; 
  const disqusConfig = {
      url: `https://riztranslation.rf.gd/view/${viewChapter?.bookId}/${viewChapter?.id}`, 
      identifier: `chapter-${viewChapter?.id}` || 'unknown', 
      title: `${viewChapter?.book.judul} - Chapter ${viewChapter?.chapter}` || "chapterJudul", 
  };

  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    setFontSizeClass(savedFontSize || 'text-md');
  }, []);

  const handleFontSizeChange = (event: { target: { value: any; }; }) => {
    const selectedFontSize = event.target.value;
    setFontSizeClass(selectedFontSize);
    localStorage.setItem('fontSize', selectedFontSize);
  };

  const createMarkup = (text: string) => {
    return { __html: text };
  };

  if (!viewChapter) {
    return <div className='w-full flex justify-center items-center h-dvh'>No Data<CloudAlert className='w-20'/></div>;
  }

const sortedChapters = [...chapterByBook].sort((a, b) => a.chapter - b.chapter);
const currentIndex = sortedChapters.findIndex((ch) => ch.id === viewChapter.id);
const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  return (
    <div key={viewChapter?.id}>
      <style>
        {`
          .tiptap-content {
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
            margin: 1.2em 0; /* Clear separation between paragraphs */
            min-height: 1.5em; /* Visible height for empty paragraphs */
            line-height: 1.6; /* Improved readability */
            text-indent: 2em; /* Novel-like first-line indentation */
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

      <main className="transition-all min-h-dvh flex mb-10 flex-col items-center w-full duration-500 max-w-6xl mx-auto md:px-4 px-2">
        <div className="my-5 w-full flex flex-col gap-1 items-center">
          <h1 className="text-2xl hover:underline font-medium text-center">
            <Link to={DETAIL_PAGE} params={{id:viewChapter.bookId.toString()}}>{viewChapter.book.judul}</Link>
          </h1>
          <h1 className="text-xl font-medium">
            Chapter {viewChapter.chapter}
            {viewChapter.volume && <span className="ml-1">Vol {viewChapter.volume}</span>}
            {viewChapter.nama && <span className="ml-1">{viewChapter.nama}</span>}
          </h1>
        </div>

        {viewChapter.isitext && (
          <div className="mb-4 flex flex-col items-end justify-end w-full">
            <label htmlFor="fontSize" className="mb-1 flex">
              Font Size <ALargeSmall />
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
        )}

        {viewChapter.isitext && (
          <div className={`tiptap-content px-2 ${fontSizeClass}`} dangerouslySetInnerHTML={createMarkup(viewChapter.isitext)} />
        )}
        {viewChapter.isigambar && (
          <ImageBlock image={viewChapter.isigambar} alt={`Chapter ${viewChapter.chapter} - ${viewChapter.book.judul}`} />
        )}
      </main>
      <section className="w-full max-w-6xl mx-auto px-2 py-10 dark:text-white text-black min-h-96">
        <div className="rounded-md border shadow-xl dark:shadow-gray-800 p-6">
          <DiscussionEmbed key={`disqus-${viewChapter?.id}-${theme}`} shortname={disqusShortname} config={disqusConfig} />
        </div>
      </section>
    </div>
  );
}