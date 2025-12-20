// useBookStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { createBook, deleteBook, getBookById, getBooks, searchBooks, updateBook } from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IBook, IMeta } from '../types/core.types';

interface BookCache {
  data: IBook[];
  meta: IMeta;
  timestamp: number;
}

interface BookStore {
  books: IBook[];
  searchResults: IBook[];
  detailBook: IBook | null;
  meta: IMeta;
  searchMeta: IMeta;
  loading: boolean;
  isLoadingNextPage: boolean;
  isLoadingNextSearch: boolean;
  cache: {
    books: { [key: string]: BookCache };
    search: { [key: string]: BookCache };
    detailBook: { [key: string]: { data: IBook; timestamp: number } };
  };
  fetchBooks: (page?: number, limit?: number, isLoadMore?: boolean) => Promise<void>;
  loadMoreBooks: () => Promise<void>;
  fetchBookById: (id: number) => Promise<void>;
  searchBook: (
    searchQuery?: string,
    page?: number,
    limit?: number,
    creator?: string,
    genreIds?: number[],
    isLoadMore?: boolean
  ) => Promise<void>;
  loadMoreSearch: (
    searchQuery?: string,
    creator?: string,
    genreIds?: number[]
  ) => Promise<void>;
  addBook: (data: IBook) => Promise<void>;
  editBook: (id: number, data: IBook) => Promise<void>;
  removeBook: (id: number) => Promise<void>;
  resetBooksState: () => void; // Tambahkan fungsi reset
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  searchResults: [],
  detailBook: null,
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  searchMeta: { total: 0, page: 1, limit: 20, totalPages: 1 },
  loading: false,
  isLoadingNextPage: false,
  isLoadingNextSearch: false,
  cache: {
    books: {},
    search: {},
    detailBook: {},
  },

  fetchBooks: async (page = 1, limit = 10, isLoadMore = false) => {
    const cacheKey = `books-${page}-${limit}`;
    const cached = get().cache.books[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION && !isLoadMore) {
      set({ books: cached.data, meta: cached.meta, loading: false });
      return;
    }

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
        cache: {
          ...state.cache,
          books: {
            ...state.cache.books,
            [cacheKey]: { data: isLoadMore ? [...state.books, ...data] : data, meta, timestamp: now },
          },
        },
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
    const cacheKey = `detail-${id}`;
    const cached = get().cache.detailBook[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      set({ detailBook: cached.data, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const { data } = await getBookById(id);
      set({
        detailBook: data,
        cache: {
          ...get().cache,
          detailBook: {
            ...get().cache.detailBook,
            [cacheKey]: { data, timestamp: now },
          },
        },
      });
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
    genreIds: number[] = [],
    isLoadMore = false
  ) => {
    const cacheKey = `search-${searchQuery}-${page}-${limit}-${creator}-${genreIds.join(',')}`;
    const cached = get().cache.search[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION && !isLoadMore) {
      set({ searchResults: cached.data, searchMeta: cached.meta, loading: false });
      return;
    }

    if (isLoadMore) {
      set({ isLoadingNextSearch: true });
    } else {
      set({ loading: true });
    }

    try {
      const { data, meta } = await searchBooks(searchQuery, page, limit, creator, genreIds);
      set((state) => ({
        searchResults: isLoadMore ? [...state.searchResults, ...data] : data,
        searchMeta: meta,
        cache: {
          ...state.cache,
          search: {
            ...state.cache.search,
            [cacheKey]: { data: isLoadMore ? [...state.searchResults, ...data] : data, meta, timestamp: now },
          },
        },
      }));
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      if (isLoadMore) {
        set({ isLoadingNextSearch: false });
      } else {
        set({ loading: false });
      }
    }
  },

  loadMoreSearch: async (searchQuery = '', creator = '', genreIds: number[] = []) => {
    const { page, totalPages } = get().searchMeta;
    if (page >= totalPages) return;

    const nextPage = page + 1;
    await get().searchBook(searchQuery, nextPage, 20, creator, genreIds, true);
  },

  addBook: async (data) => {
    set({ loading: true });
    try {
      const result = await createBook(data);
      set((state) => ({
        books: [result.data, ...state.books],
        searchResults: state.searchResults, // Optionally update searchResults if relevant
      }));
      toast.success('Book berhasil ditambahkan');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  editBook: async (id, data) => {
    set({ loading: true });
    try {
      const result = await updateBook(id, data);
      set((state) => ({
        books: state.books.map((g) => (g.id === id ? result.data : g)),
        searchResults: state.searchResults.map((g) => (g.id === id ? result.data : g)),
        detailBook: state.detailBook?.id === id ? result.data : state.detailBook,
      }));
      toast.success('Book berhasil diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  removeBook: async (id) => {
    set({ loading: true });
    try {
      await deleteBook(id);
      set((state) => ({
        books: state.books.filter((g) => g.id !== id),
        searchResults: state.searchResults.filter((g) => g.id !== id),
        detailBook: state.detailBook?.id === id ? null : state.detailBook,
      }));
      toast.success('Book berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  // Tambahkan fungsi reset
  resetBooksState: () => {
    set({
      books: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      loading: false,
      isLoadingNextPage: false,
    });
  },
}));

export default useBookStore;