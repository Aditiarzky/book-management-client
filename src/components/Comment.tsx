import type { IBook } from '@/types/core.types';
import { DiscussionEmbed } from 'disqus-react'

interface CommentParameter {
    book: IBook | null;
}

const Comment = ({book} : CommentParameter) => {
    const disqusShortname = 'riztranslation-1'; // Isi dengan shortname kamu
    const disqusConfig = {
        url: `https://riztranslation.rf.gd/detail/${book?.id}`, // Masukkan url dari halaman detail blog
        identifier: `book-${book?.id}` || 'unknown', // Disini kita menggunakan identifier berupa post slug karena identifier haruslah unique
        title: book?.judul || "judul", 
        theme: 'light',
    };
  return (
      <section className='py-5 bg-gray-900 border-t-[0.5px] border-gray-200 dark:border-gray-800'>
        <div id="disqus_thread" className='text-white max-w-6xl mx-auto px-4'>
        <h1 className="my-3 font-medium text-white text-xl">Komentar</h1>
        </div>
        <div style={{ all: "unset", color: "#000", backgroundColor: "#fff" }}>
        <DiscussionEmbed key={`disqus-${book?.id}`} shortname={disqusShortname} config={disqusConfig} />
        </div>
      </section>
  )
}

export default Comment