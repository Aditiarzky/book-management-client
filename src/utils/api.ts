import axios from 'axios';
import { supabase } from './supabase';
import getErrorMessage from './error';
import type {
  IBook,
  IBookCreateInput,
  IBookUpdateInput,
  IChapterCreateInput,
  IChapterUpdateInput,
  ICredentials,
  IGenre,
} from '../types/core.types';

const baseUrl = 'https://book-management-express.vercel.app/api';
// const baseUrl = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

// ======================= AUTH ==========================

export async function login(loginData: ICredentials) {
  try {
    const response = await api.post('/auth/login', loginData);
    const { message, success } = response.data;
    if (success) return { message, success };
    throw new Error(message);
  } catch (error) {
    return { message: getErrorMessage(error), success: false };
  }
}

export async function logout() {
  try {
    const response = await api.post('/auth/logout');
    const { message, success } = response.data;
    if (success) return { message, success };
    throw new Error(message);
  } catch (error) {
    return { message: getErrorMessage(error), success: false };
  }
}

export async function getUserAuth() {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    return { message: getErrorMessage(error), success: false };
  }
}

// ======================= GENRES — GET via Supabase ==========================

export async function getGenres() {
  const { data, error } = await supabase
    .from('Genre')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { data, success: true };
}

export async function getGenresPaged(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('Genre')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: data ?? [],
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    success: true,
  };
}

export async function getGenreById(id: number) {
  const { data, error } = await supabase
    .from('Genre')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { data, success: true };
}

// GENRES — mutate via Express
export async function createGenre(data: IGenre) {
  try {
    const res = await api.post('/genres', data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateGenre(id: number, data: IGenre) {
  try {
    const res = await api.put(`/genres/${id}`, data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteGenre(id: number) {
  try {
    const res = await api.delete(`/genres/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// ======================= BOOKS — GET via Supabase ==========================

// Normalize genre & chapters dari struktur Supabase join ke struktur Express:
// Supabase genres: [{ genre: { id, nama } }]  →  Express: [{ id, nama }]
function normalizeBook(book: IBook) {
  if (!book) return book;
  return {
    ...book,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    genres: (book.genres ?? []).map((g: any) => g.genre ?? g),
    chapters: book.chapters ?? [],
  };
}

export async function getBooks(page = 1, limit = 10, sortBy: 'desc' | 'asc' = 'desc') {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('Book')
    .select(`
      *,
      genres:_BookGenre(genre:Genre(*)),
      chapters:Chapter(id, chapter, volume, nama, created_at)
    `, { count: 'exact' })
    .order('created_at', { ascending: sortBy === 'asc' })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data ?? []).map(normalizeBook),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    success: true,
  };
}

export async function getBookById(id: number) {
  const { data, error } = await supabase
    .from('Book')
    .select(`
      *,
      genres:_BookGenre(genre:Genre(*)),
      chapters:Chapter(
        id, chapter, volume, nama, thumbnail, bookId, created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return { data: normalizeBook(data), success: true };
}

export async function searchBooks(
  searchQuery = '',
  page = 1,
  limit = 20,
  creator = '',
  genreIds: number[] = []
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('Book')
    .select(`
      *,
      genres:_BookGenre(
        genre:Genre(*)
      ),
      chapters:Chapter(id, chapter, volume, nama, created_at)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (searchQuery) {
    query = query.or(
      `judul.ilike.%${searchQuery}%,alt_judul.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`
    );
  }

  if (creator) {
    query = query.or(`author.ilike.%${creator}%,artist.ilike.%${creator}%`);
  }

  if (genreIds.length > 0) {
    // Filter by genre via join table
    const { data: bookGenreRows, error: bgError } = await supabase
      .from('_BookGenre')
      .select('A')
      .in('B', genreIds);

    if (bgError) throw new Error(bgError.message);

    const bookIds = [...new Set(bookGenreRows?.map((r) => r.A) ?? [])];
    if (bookIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 }, success: true };
    }

    query = query.in('id', bookIds);
  }

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data: (data ?? []).map(normalizeBook),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    success: true,
  };
}

// BOOKS — mutate via Express
export async function createBook(data: IBookCreateInput) {
  try {
    const res = await api.post('/books', data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateBook(id: number, data: IBookUpdateInput) {
  try {
    const res = await api.put(`/books/${id}`, data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteBook(id: number) {
  try {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// ======================= CHAPTERS — GET via Supabase ==========================

export async function getChapters(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('Chapter')
    .select('*, book:Book(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    success: true,
  };
}

export async function getLatestChapters(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Ambil chapter terbaru per book menggunakan RPC (fungsi di Supabase)
  const { data, error, count } = await supabase
    .rpc('get_latest_chapters', {}, { count: 'exact' })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    success: true,
  };
}

export async function getChapterById(id: number, bookId: number) {
  const { data, error } = await supabase
    .from('Chapter')
    .select('*, book:Book(*)')
    .eq('id', id)
    .eq('bookId', bookId)
    .single();

  if (error) throw new Error(error.message);
  return { data, success: true };
}

export async function getChapterByBookId(bookId: number) {
  const { data, error } = await supabase
    .from('Chapter')
    .select('*, book:Book(*)')
    .eq('bookId', bookId)
    .order('volume', { ascending: false })
    .order('chapter', { ascending: false });

  if (error) throw new Error(error.message);
  return { data, success: true };
}

// CHAPTERS — mutate via Express
export async function createChapter(data: IChapterCreateInput) {
  try {
    const res = await api.post('/chapters', data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateChapter(id: number, data: IChapterUpdateInput) {
  try {
    const res = await api.put(`/chapters/${id}?bookId=${data.bookId}`, data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteChapter(id: number) {
  try {
    const res = await api.delete(`/chapters/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// ======================= UPLOAD ==========================

export async function uploadImageToCloudinary(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  const cloudName = 'dwswkz2sk';
  const uploadPreset = 'msa_image';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onProgress(percent);
        },
      }
    );
    return response.data.secure_url;
  } catch (error) {
    throw getErrorMessage(error);
  }
}
