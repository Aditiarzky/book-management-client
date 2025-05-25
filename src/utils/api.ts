import axios from 'axios';
import getErrorMessage from './error';
import type { IBookCreateInput, IBookUpdateInput, IChapterCreateInput, IChapterUpdateInput, IGenre } from '../types/core.types';

const baseUrl = 'https://manga-reader-api.up.railway.app'; 

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

// ======================= GENRES ==========================
export async function getGenres() {
  try {
    const res = await api.get('/genres');
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getGenreById(id:number) {
  try {
    const res = await api.get(`/genres/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function createGenre(data:IGenre) {
  try {
    const res = await api.post('/genres', data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateGenre(id:number, data:IGenre) {
  try {
    const res = await api.put(`/genres/${id}`, data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteGenre(id:number) {
  try {
    const res = await api.delete(`/genres/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// ======================= BOOKS ==========================

export async function getBooks(page = 1, limit = 10, sortBy: 'desc' | 'asc' = 'desc') {
  try {
    const res = await api.get(`/books?page=${page}&limit=${limit}&sortBy=${sortBy}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getBookById(id:number) {
  try {
    const res = await api.get(`/books/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function searchBooks(searchQuery = ' ', page = 1, limit = 10, creator = '', genreIds = []) {
  try {
    const genreId = genreIds.length ? `genreIds=${genreIds.join(',')}` : '';
    const res = await api.get(`/books/search?search=${searchQuery}&page=${page}&limit=${limit}&creator=${creator}&${genreId}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function createBook(data:IBookCreateInput) {
  try {
    const res = await api.post('/books', data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateBook(id:number, data:IBookUpdateInput) {
  try {
    const res = await api.put(`/books/${id}`, data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteBook(id:number) {
  try {
    const res = await api.delete(`/books/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

// ======================= CHAPTERS ==========================
export async function getChapters(page = 1, limit = 10) {
  try {
    const res = await api.get(`/chapters?page=${page}&limit=${limit}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getChapterById(id:number, bookId: number) {
  try {
    const res = await api.get(`/chapters/${id}?bookId=${bookId}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getChapterByBookId(bookId: number) {
  try {
    const res = await api.get(`/chapters/book/${bookId}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function createChapter(data:IChapterCreateInput) {
  try {
    const res = await api.post('/chapters', data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function updateChapter(id:number, data:IChapterUpdateInput) {
  try {
    const res = await api.put(`/chapters/${id}`, data);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function deleteChapter(id:number) {
  try {
    const res = await api.delete(`/chapters/${id}`);
    return res.data;
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}
