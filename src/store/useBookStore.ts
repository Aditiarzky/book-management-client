import { create } from 'zustand';
import { toast } from 'sonner';
import { createBook, deleteBook, getBookById, getBooks, searchBooks, updateBook } from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IBook, IMeta } from '../types/core.types';

interface BookStore {
  books: IBook[];
  detailBook: IBook | null;
  meta: IMeta;
  loading: boolean;
  isLoadingNextPage: boolean;
  fetchBooks: (page?: number, limit?: number, isLoadMore?: boolean) => Promise<void>;
  loadMoreBooks: () => Promise<void>;
  fetchBookById: (id: number) => Promise<void>;
  searchBook: (searchQuery?:string, page?:number, limit?:number, creator?:string, genreIds?: number[], isLoadMore?: boolean) => Promise<void>;
  addBook: (data: IBook) => Promise<void>;
  editBook: (id: number, data: IBook) => Promise<void>;
  removeBook: (id: number) => Promise<void>;
}

const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  detailBook: null,
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  isLoadingNextPage: false,

  fetchBooks: async (page = 1, limit = 10, isLoadMore = false) => {
    if (isLoadMore) {
      set({ isLoadingNextPage: true });
    } else {
      set({ loading: true });
    }

    try {
      const { data, meta } = await getBooks(page, limit);
      set((state) => ({
        books: isLoadMore ? [...state.books, ...data] : data,
        meta,
      }));
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      if (isLoadMore) {
        set({ isLoadingNextPage: false });
      } else {
        set({ loading: false });
      }
    }
  },

  loadMoreBooks: async () => {
    const { page, totalPages } = get().meta;
    if (page >= totalPages) return;

    const nextPage = page + 1;
    await get().fetchBooks(nextPage, 10, true);
  },

  fetchBookById: async (id) => {
    set({ loading: true });
    try {
      const { data } = await getBookById(id);
      set({ detailBook: data });
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      set({ loading: false });
    }
  },

  searchBook: async (
    searchQuery = '',
    page = 1,
    limit = 20,
    creator = '',
    genreIds = [],
    isLoadMore = false
  ) => {
    const setLoading = isLoadMore ? { isLoadingNextPage: true } : { loading: true }
    set(setLoading)

    try {
      const { data, meta } = await searchBooks(searchQuery, page, limit, creator, genreIds=[])
      set((state) => ({
        books: isLoadMore ? [...state.books, ...data] : data,
        meta,
      }))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      set({ loading: false, isLoadingNextPage: false })
    }
  },

  addBook: async (data) => {
    try {
      const result = await createBook(data);
      set((state) => ({ books: [result.data, ...state.books] }));
      toast.success('Book berhasil ditambahkan');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },

  editBook: async (id, data) => {
    try {
      const result = await updateBook(id, data);
      set((state) => ({
        books: state.books.map((g) => (g.id === id ? result.data : g)),
      }));
      toast.success('Book berhasil diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },

  removeBook: async (id) => {
    try {
      await deleteBook(id);
      set((state) => ({
        books: state.books.filter((g) => g.id !== id),
      }));
      toast.success('Book berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },
}));

export default useBookStore;