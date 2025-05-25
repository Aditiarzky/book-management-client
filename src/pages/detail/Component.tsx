import { DiscussionEmbed } from 'disqus-react';
import { Ch } from '@/components/NewCh';
import type { IBook} from '@/types/core.types';
import {useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface DetailInterface{
  book: IBook | null;
}

function NavDetail({book}:DetailInterface) {
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
  const createMarkup = (text:string) => {
    return { __html: text };
  };
  return(
    <div>
      <div className='flex justify-center'>
      <ul className='flex gap-3 px-3 py-2 m-5 rounded-xl bg-gray-900 w-fit text-white font-medium'>
        <li className={showChapter ? 'hov-b' : 'hov-b brightness-50'} onClick={toggleChapter}>Chapter</li>
        <li className={!showChapter ? 'hov-b' : 'hov-b brightness-50'} onClick={toggleChapter}>Informasi</li>
      </ul>
      </div>
      {/* daftar chapter */}
      
      {showChapter && (
        <div className='flex items-center flex-col gap-3'>
        <section>
        <label htmlFor="sortOrder">Sort By</label>
          <select id="sortOrder" className="ml-2 pl-2 pe-10 cursor-pointer py-1 border text-gray-500 border-gray-300 bg-inherit rounded" value={sortOrder} onChange={handleSortOrderChange}>
            <option value="ascending">Asc</option>
            <option value="descending">Desc</option>
          </select>
        </section>
        <section className=" gap-x-1.5 gap-y-3 flex flex-wrap justify-center" >
        {book?.chapters.sort((a, b) => {
          if (sortOrder === 'ascending') {
            return a.chapter - b.chapter;
          } else {
            return b.chapter - a.chapter;
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
      )}
      {showChapter && book?.chapters.length === 0 && (
        <div className="text-center text-gray-500 py-8">
            Chapters Coming Soon
        </div>
      )}
      {/* Informasi */}
      {!showChapter && (
      <section className="">
        <ul className='flex gap-2 px-1'>
          <li className='bg-red-400 text-white text-xs rounded-lg py-1 px-2'>{book?.status}</li>
          <li className=' bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs hover:bg-gray-200 dark:hover:bg-gray-500 transition-colorstext-xs rounded-lg py-1 px-2'>{book?.type}</li>
        </ul>
        <dl className='py-5 border-b-[0.5px] transition-all border-gray-200 dark:border-gray-800 px-1'>
          <div className="flex mb-1 last:mb-0">
            <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
              Alt Title
            </dt>
            <dd className='whitespace-pre-wrap break-all break-words support-break-word s13-regular-white flex-1'>
              {book?.alt_judul}
            </dd>
          </div>
          <div className="flex mb-1 last:mb-0">
            <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
              Author
            </dt>
            <dd className='whitespace-pre-wrap break-all break-words support-break-word s13-regular-white flex-1'>
              {book?.author}
            </dd>
          </div>
          <div className="flex mb-1 last:mb-0">
            <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
              Artist
            </dt>
            <dd className='whitespace-pre-wrap break-all break-words support-break-word s13-regular-white flex-1'>
              {book?.artist}
            </dd>
          </div>
          <div className="flex mb-1 last:mb-0">
            <dt className="whitespace-pre-wrap break-all break-words support-break-word s13-regular-white opacity-50 mr-8 flex-none w-14">
              Genre
            </dt>
            <dd className="flex flex-wrap gap-1 flex-1">
              {book?.genres.map((g) => (
                <p
                  className='px-2 border rounded-md'
                  key={g.nama}
                >
                  {g.nama}
                </p>
              ))}
            </dd>
          </div>
        </dl>
        <div className='mt-2 px-1'>
          <p className='text-xl font-medium mb-1'>Synopsis</p>
          <p className="whitespace-pre-wrap break-words support-break-word s13-regular-white overflow-hidden" dangerouslySetInnerHTML={createMarkup(book?.synopsis || '-')}></p>
        </div>
      </section>
      )}
    </div>
  )
}


export default function DetailComponent({book}:DetailInterface) {
  const { theme } = useTheme();
  const disqusShortname = 'riztranslation-1'; 
  const disqusConfig = {
      url: `https://riztranslation.rf.gd/detail/${book?.id}`, 
      identifier: `book-${book?.id}` || 'unknown', 
      title: book?.judul || "judul", 
  };

  return (
    <div>
      <main className="transition-all w-full duration-500 min-h-dvh max-w-6xl mx-auto px-4">
        <div className="max-w-[1500px]">
          <section className="w-full mt-5 mb-16">
            <div className="flex justify-center h-64 w-full">
              <div
                style={{ backgroundImage: `url(${book?.cover})` }}
                className="h-48 w-full bg-center flex justify-center bg-cover shadow-2xl dark:shadow-gray-600 rounded-lg"
              >
              <div className='flex w-full justify-center rounded-lg h-full backdrop-blur-xs'>
                <img
                  src={book?.cover}
                  alt={book?.judul}
                  className="h-52 w-40 object-cover mt-12 absolute rounded-md shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
                />
              </div>
            </div>
            </div>

            <div className="flex gap-1 items-center mt-3 flex-col">
              <h1 className="text-2xl text-center font-semibold">{book?.judul}</h1>
              <span className="text-center font-medium opacity-80">
                {book?.author}, {book?.artist}
              </span>
              <h1 className="text-center flex-wrap justify-center flex gap-1">
                {book?.genres.map((g) => (
                <p
                  className='px-2 border rounded-md'
                  key={g.nama}
                >
                  {g.nama}
                </p>
              ))}
              </h1>
            </div>

            <NavDetail book={book}/>
          </section>
        </div>
      </main>
          <section className='w-full max-w-6xl mx-auto px-2 py-10 dark:text-white text-black min-h-96'>
            <div className='rounded-md border shadow-xl dark:shadow-gray-800 p-6'>
            <DiscussionEmbed key={`disqus-${book?.id}-${theme}`} shortname={disqusShortname} config={disqusConfig} />
            </div>
          </section>
    </div>
  );
}