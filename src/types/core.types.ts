export interface IUser {
  id?: string;
  name: string;
  email: string;
  password?: string;
}

export interface ICredentials {
  email: string;
  password: string;
}

export interface IGenre {
  id?: number;
  nama: string;
  deskripsi: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IGenreWithBooks extends IGenre {
  books: IBook[];
}

export interface IBook {
  id: number;
  judul: string;
  alt_judul: string | null;
  cover: string;
  author: string;
  artist: string;
  synopsis: string | null;
  status: string | null;
  type: string | null;
  created_at: Date;
  updated_at: Date;
  genres: IGenre[];
  chapters: IChapter[];
}

export interface IBookWithRelations extends IBook {
  genres: IGenre[];
  chapters: IChapter[];
}

export interface IBookCreateInput {
  judul: string;
  alt_judul?: string | null;
  cover: string;
  author: string;
  artist: string;
  synopsis?: string | null;
  status?: string | null;
  type?: string | null;
  genreIds?: number[];
}

export interface IBookUpdateInput {
  judul?: string;
  alt_judul?: string | null;
  cover?: string;
  author?: string;
  artist?: string;
  synopsis?: string | null;
  status?: string | null;
  type?: string | null;
  genreIds?: number[];
}


export interface IChapter {
  id: number;
  bookId: number;
  chapter: number;
  volume: number | null;
  nama: string;
  thumbnail: string | null;
  isigambar: string | null;
  isitext: string | null;
  created_at: Date;
  updated_at: Date;
  book: IBook;
}

export interface IChapterWithBook extends IChapter {
  book: IBook;
}

export interface IChapterCreateInput {
  bookId: number;
  chapter: number;
  volume?: number | null;
  nama?: string;
  thumbnail?: string | null;
  isigambar?: string | null;
  isitext?: string | null;
}

export interface IUpFileStore {
  loading: boolean;
  onProgress: number;
  uploadFile: (file: File, onUploadProgress?: (progress: number) => void) => Promise<string | null>;
  uploadFileMultiple: (file: File, onUploadProgress?: (progress: number) => void) => Promise<string | null>;
}

export interface IChapterUpdateInput {
  bookId: number;
  chapter?: number;
  volume?: number | null;
  nama?: string;
  thumbnail?: string | null;
  isigambar?: string | null;
  isitext?: string | null;
}

export interface IMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}