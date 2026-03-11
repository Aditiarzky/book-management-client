import { Ch } from '@/components/NewCh';
import type { IBook } from '@/types/core.types';
import { useEffect, useState } from 'react';
import SupabaseCommentEmbed from '@/components/SupabaseCommentEmbed';
import { AlertCircle, RefreshCw } from 'lucide-react';
interface DetailInterface {
  book: IBook | null;
}
const EmptyState = ({ title, description, icon: Icon = AlertCircle, onRefresh }: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  onRefresh?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-muted-foreground/30 rounded-lg bg-muted/20 h-full">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium text-muted-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground/70 max-w-sm mb-4">{description}</p>
    {onRefresh && (
      <button
        onClick={onRefresh}
        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh Page
      </button>
    )}
  </div>
);
function NavDetail({ book }: DetailInterface) {
  const [showChapter, setShowChapter] = useState(true);
  const toggleChapter = () => {
    setShowChapter(!showChapter);
  };
  const [sortOrder, setSortOrder] = useState('');
  useEffect(() => {
    const savedSortOrder = localStorage.getItem('sortOrder');
    if (savedSortOrder) {
      setSortOrder(savedSortOrder);
    } else {
      setSortOrder('ascending');
    }
  }, []);
  const handleSortOrderChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSortOrder = event.target.value;
    setSortOrder(selectedSortOrder);
    localStorage.setItem('sortOrder', selectedSortOrder);
  };
  const createMarkup = (text: string) => {
    return { __html: text };
  };
  return (
    <div>
      <div className='flex justify-center'>
        <ul className='flex gap-3 px-3 py-2 m-5 rounded-xl bg-gray-900 w-fit text-white font-medium'>
          <li className={showChapter ? 'hov-b' : 'hov-b brightness-50'} onClick={toggleChapter}>Chapter</li>
          <li className={!showChapter ? 'hov-b' : 'hov-b brightness-50'} onClick={toggleChapter}>Informasi</li>
        </ul>
      </div>
      {/* daftar chapter */}

      {showChapter && (
        book ? (
          <div className='flex items-center flex-col gap-3'>
            <section>
              <label htmlFor="sortOrder">Sort By</label>
              <select id="sortOrder" className="ml-2 pl-2 pe-10 cursor-pointer py-1 border text-gray-500 border-gray-300 bg-inherit rounded" value={sortOrder} onChange={handleSortOrderChange}>
                <option value="ascending">Asc</option>
                <option value="descending">Desc</option>
              </select>
            </section>
            <section className=" gap-x-1.5 gap-y-3 flex flex-wrap justify-center" >
              {(book.chapters || []).sort((a, b) => {
                const volA = a.volume ?? 0;
                const volB = b.volume ?? 0;
                const chapA = a.chapter;
                const chapB = b.chapter;
                if (sortOrder === 'ascending') {
                  if (volA !== volB) {
                    return volA - volB;
                  }
                  return chapA - chapB;
                } else {
                  if (volA !== volB) {
                    return volB - volA;
                  }
                  return chapB - chapA;
                }
              }).map((chapter) => (
                <div className='drop-shadow-md'>
                  <Ch
                    type={1}
                    chapter={chapter.chapter}
                    thumbnail={chapter.thumbnail}
                    created_at={chapter.created_at}
                    volume={chapter.volume}
                    id={chapter.id}
                    bookId={chapter.bookId}
                    nama={chapter.nama}
                  />
                </div>
              ))}
            </section>
          </div>
        ) : (
          <EmptyState
            title="No Book Data"
            description="We couldn't find any book information. Please try refreshing the page."
            onRefresh={() => window.location.reload()}
          />
        )
      )}
      {showChapter && book && (book.chapters || []).length === 0 && (
        <EmptyState
          title="No Chapters Available"
          description="Chapters are coming soon. Please check back later or refresh the page."
          onRefresh={() => window.location.reload()}
        />
      )}
      {/* Informasi */}
      {!showChapter && (
        book ? (
          <section className="">
            <ul className='flex gap-2 px-1'>
              <li className='bg-red-400 text-white text-xs rounded-lg py-1 px-2'>{book.status || 'Unknown'}</li>
              <li className=' bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs hover:bg-gray-200 dark:hover:bg-gray-500 transition-colorstext-xs rounded-lg py-1 px-2'>{book.type || 'Unknown'}</li>
            </ul>
            <dl className='py-5 border-b-[0.5px] transition-all border-gray-200 dark:border-gray-800 px-1'>
              <div className="flex mb-1 last:mb-0">
                <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
                  Alt Title
                </dt>
                <dd className='whitespace-pre-wrap break-all break-words support-break-word s13-regular-white flex-1'>
                  {book.alt_judul || '-'}
                </dd>
              </div>
              <div className="flex mb-1 last:mb-0">
                <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
                  Author
                </dt>
                <dd className='whitespace-pre-wrap break-all break-words support-break-word s13-regular-white flex-1'>
                  {book.author || '-'}
                </dd>
              </div>
              <div className="flex mb-1 last:mb-0">
                <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
                  Artist
                </dt>
                <dd className='whitespace-pre-wrap break-all break-words support-break-word s13-regular-white flex-1'>
                  {book.artist || '-'}
                </dd>
              </div>
              <div className="flex mb-1 last:mb-0">
                <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
                  Genre
                </dt>
                <dd className="flex flex-wrap gap-1 flex-1">
                  {(book.genres || []).length > 0 ? (
                    book.genres.map((g) => (
                      <p
                        className='px-2 border rounded-md'
                        key={g.nama}
                      >
                        {g.nama}
                      </p>
                    ))
                  ) : (
                    <p>No genres available</p>
                  )}
                </dd>
              </div>
            </dl>
            <div className='mt-2 px-1'>
              <p className='text-xl font-medium mb-1'>Synopsis</p>
              <p className="whitespace-pre-wrap break-words support-break-word s13-regular-white overflow-hidden" dangerouslySetInnerHTML={createMarkup(book.synopsis || '-')} />
            </div>
          </section>
        ) : (
          <EmptyState
            title="No Book Information"
            description="Book details are not available. Please try refreshing the page."
            onRefresh={() => window.location.reload()}
          />
        )
      )}
    </div>
  )
}
export default function DetailComponent({ book }: DetailInterface) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
  const commentSlug = book ? `book-${book.id}` : 'book-unknown'

  return (
    <div>
      <main className="transition-all w-full duration-500 min-h-dvh max-w-6xl mx-auto px-4">
        <div className="max-w-[1500px]">
          <section className="w-full mt-5 mb-16">
            {book ? (
              <div className="flex justify-center h-64 w-full">
                <div
                  style={{ backgroundImage: `url(${book.cover || '/placeholder-cover.jpg'})` }}
                  className="h-48 w-full bg-center flex justify-center bg-cover shadow-2xl dark:shadow-gray-600 rounded-lg"
                >
                  <div className='flex w-full justify-center rounded-lg h-full backdrop-blur-xs'>
                    <img
                      src={book.cover || '/placeholder-cover.jpg'}
                      alt={book.judul || 'Unknown Title'}
                      className="h-52 w-40 object-cover mt-12 absolute rounded-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Cover Available"
                description="Book cover is not available. Please try refreshing the page."
                onRefresh={() => window.location.reload()}
              />
            )}
            <div className="flex gap-1 items-center mt-3 flex-col">
              <h1 className="text-2xl text-center font-semibold">{book?.judul || 'Unknown Title'}</h1>
              <span className="text-center font-medium opacity-80">
                {book?.author || 'Unknown Author'}, {book?.artist || 'Unknown Artist'}
              </span>
              <h1 className="text-center flex-wrap justify-center flex gap-1">
                {book && (book.genres || []).length > 0 ? (
                  book.genres.map((g) => (
                    <p
                      className='px-2 border rounded-md'
                      key={g.nama}
                    >
                      {g.nama}
                    </p>
                  ))
                ) : (
                  <p>No genres available</p>
                )}
              </h1>
            </div>
            <NavDetail book={book} />
          </section>
        </div>
      </main>
      <section className='w-full max-w-6xl mx-auto px-2 py-10 dark:text-white text-black min-h-96'>
        {supabaseConfigured ? (
          <SupabaseCommentEmbed
            site="book-detail"
            slug={commentSlug}
            title="Komentar Buku"
          />
        ) : (
          <p className="text-xs text-slate-400">
            Komentar Supabase belum dikonfigurasi. Set environment variable{' '}
            <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> untuk menampilkannya.
          </p>
        )}
      </section>
    </div>
  )
}
