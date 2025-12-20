import axios from 'axios';
import getErrorMessage from './error';
import type { IBookCreateInput, IBookUpdateInput, IChapterCreateInput, IChapterUpdateInput, ICredentials, IGenre } from '../types/core.types';

const baseUrl = 'https://book-management-express.vercel.app/api'; 
// const baseUrl = 'http://localhost:3000/api'; 

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export async function login(loginData: ICredentials) {
  try {
    const response = await api.post(`${baseUrl}/auth/login`, loginData);
    const { message, success } = response.data;
    if (success) {
      return { message, success };
    }
    throw new Error(message);
  } catch (error) {
    const message = getErrorMessage(error);
    return { message, success: false };
  }
}

export async function logout() {
  try {
    const response = await api.post(`${baseUrl}/auth/logout`);
    const { message, success } = response.data;
    if (success) {
      return { message, success };
    }
    throw new Error(message);
  } catch (error) {
    const message = getErrorMessage(error);
    return { message, success: false };
  }
}

export async function getUserAuth() {
  try {
    const response = await api.get(`${baseUrl}/users/me`);
    return response.data;
  } catch (error) {
    const message = getErrorMessage(error);
    return { message, success: false };
  }
}

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

export async function searchBooks(  
  searchQuery: string = '',
  page: number = 1,
  limit: number = 10,
  creator: string = '',
  genreIds: number[] = []) {
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

export async function getLatestChapters(page = 1, limit = 10) {
  try {
    const res = await api.get(`/chapters/latest?page=${page}&limit=${limit}`);
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
    const res = await api.put(`/chapters/${id}?bookId=${data.bookId}`, data);
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

export async function uploadImageToCloudinary(file: File, onProgress: (progress: number) => void): Promise<string> {
  const cloudName = 'dwswkz2sk';
  const uploadPreset = 'msa_image';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials are not set');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        onProgress(percent);
      },
    });

    return response.data.secure_url;
  } catch (error) {
    throw getErrorMessage(error);
  }
}