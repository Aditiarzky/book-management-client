import { Link } from '@tanstack/react-router';
import { DETAIL_PAGE, VIEW_PAGE } from '@/routes/constants';
import { formatDate, formatDistanceToNow, isWithinOneMonth, isWithinOneWeek } from '../utils/format';
import noImage from '@/placeholder.gif';

interface ChapterMixBook {
  type?: number;
  judul: string;
  cover: string;
  bookId: number;
  chapter: number;
  thumbnail: string|null;
  volume: number|null;
  id:number;
  created_at: Date;
  nama?:string;
  tipe: string | null;
}

// Tipe khusus untuk komponen Ch
interface ChProps {
  thumbnail: string | null;
  id: number;
  bookId: number;
  chapter: number;
  volume: number | null;
  created_at: Date;
  nama?: string;
  type?: number;
}


const NewCh = ({ tipe, judul, chapter, nama, created_at, cover, thumbnail, volume, id, bookId }: ChapterMixBook) => {
  return (
    <main>
      <div
        title={judul}
        className="flex space-x-2 cursor-pointer items-center hov-b drop-shadow-sm"
      >
        <Link to={DETAIL_PAGE} params={{id:`${bookId}`}} key={bookId}>
          <div
            style={{ backgroundImage: `url(${cover})` }}
            className="h-40 w-28 bg-no-repeat bg-cover bg-center rounded-lg hov-b"
          />
        </Link>
        <Link to={VIEW_PAGE} params={{bookId: `${bookId}`,id: `${id}`}} key={id}>
          <div className="flex flex-col space-y-1 w-36">
            <span className="text-xs">{tipe}</span>
            <h1 className="font-semibold text-md line-clamp-2 wrap-break-word">{judul}</h1>
            <Ch
              thumbnail={thumbnail || noImage}
              id={id}
              bookId={bookId}
              chapter={chapter}
              volume={volume}
              created_at={created_at}
              nama={nama}
            />
          </div>
        </Link>
      </div>
    </main>
  );
};

export default NewCh;

export const Ch = ({ thumbnail, chapter, volume, nama, created_at, bookId, id, type }: ChProps) => {
  const parsedDate = new Date(created_at);
  let formattedDate;

  if (isWithinOneWeek(parsedDate)) {
    formattedDate = formatDistanceToNow(parsedDate);
  } else if (isWithinOneMonth(parsedDate)) {
    formattedDate = formatDistanceToNow(parsedDate, { includeSeconds: true });
  } else {
    formattedDate = formatDate(parsedDate);
  }

  if (type === 1) {
    return (
      <Link to={VIEW_PAGE} params={{bookId: bookId.toString(),id: id.toString()}} key={id} className="w-fit">
        <div
          style={{ backgroundImage: `url(${thumbnail || noImage})` }}
          className="w-fit rounded-lg hov-b bg-no-repeat bg-cover"
        >
          <div className="flex h-28 font-medium p-1 flex-col text-white justify-end w-36 rounded-lg bg-gradient-to-t from-gray-900/70">
            <h1 className="text-xs">
              Chapter {chapter}
              {volume && <span className="ml-1">Vol {volume}</span>}
            </h1>
            <p className='text-xs'>{nama && <span>{nama}</span>}</p>
            <span className="text-[9px]">{formattedDate}</span>
          </div>
        </div>
      </Link>
    );
  } else {
    return (
      <div key={`cardCh-${id}`} className="w-fit">
        <div
          style={{ backgroundImage: `url(${thumbnail})` }}
          className="w-fit rounded-lg hov-b bg-no-repeat bg-cover"
        >
          <div className="flex h-20 p-1 flex-col text-white justify-end w-[110px] rounded-lg bg-gradient-to-t from-gray-900/70">
            <h1 className="text-xs">
              Chapter {chapter}
              {volume && <span className="ml-1">Vol {volume}</span>}
              {nama && <span className="ml-1">{nama}</span>}
            </h1>
            <span className="text-[9px]">{formattedDate}</span>
          </div>
        </div>
      </div>
    );
  }
};