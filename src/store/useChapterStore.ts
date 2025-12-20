// useChapterStore.ts
import { create } from 'zustand';
import { toast } from 'sonner';
import { createChapter, deleteChapter, getChapterByBookId, getChapterById, getChapters, getLatestChapters, updateChapter } from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IChapter, IMeta } from '../types/core.types';

export interface ChapterStore {
  chapters: IChapter[];
  latestChapters: IChapter[];
  viewChapter: IChapter | null;
  chapterByBook: IChapter[];
  meta: IMeta;
  loading: boolean;
  isLoadingNextPage: boolean;
  cache: {
    chapters: { [key: string]: { data: IChapter[]; meta: IMeta; timestamp: number } };
    latestChapters: { [key: string]: { data: IChapter[]; meta: IMeta; timestamp: number } };
    viewChapter: { [key: string]: { data: IChapter; timestamp: number } };
    chapterByBook: { [key: string]: { data: IChapter[]; timestamp: number } };
  };
  fetchChapters: (page?: number, limit?: number, isLoadMore?: boolean) => Promise<void>;
  fetchLatestChapters: (page?: number, limit?: number, isLoadMore?: boolean) => Promise<void>;
  loadMoreChapters: () => Promise<void>;
  loadMoreLatestChapters: () => Promise<void>;
  addChapter: (data: IChapter) => Promise<void>;
  fetchViewChapter: (id: number, bookId: number) => Promise<void>;
  fetchByBook: (bookId: number) => Promise<void>;
  editChapter: (id: number, data: IChapter) => Promise<void>;
  removeChapter: (id: number) => Promise<void>;
  resetChaptersState: () => void; // Tambahkan fungsi reset
}

const CACHE_DURATION = 5 * 60 * 1000; 

const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  latestChapters: [],
  viewChapter: null,
  chapterByBook: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  isLoadingNextPage: false,
  cache: { 
    viewChapter: {},
    chapterByBook: {},
    chapters: {},
    latestChapters: {} 
  },

  fetchChapters: async (page = 1, limit = 10, isLoadMore = false) => {
    const cacheKey = `${page}-${limit}`;
    const cached = get().cache.chapters[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION && !isLoadMore) {
      set({ chapters: cached.data, meta: cached.meta, loading: false });
      return;
    }
    

    if (isLoadMore) {
      set({ isLoadingNextPage: true });
    } else {
      set({ loading: true });
    }

    try {
      const response = await getChapters(page, limit);
      const { data, meta } = response;

      set((state) => ({
        chapters: page === 1 ? data : [...state.chapters, ...data],
        meta,
        cache: {
          ...get().cache,
          chapters: {
            ...get().cache.chapters,
            [cacheKey]: { data: page === 1 ? data : [...state.chapters, ...data], meta, timestamp: now },
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

  fetchLatestChapters: async (page = 1, limit = 10, isLoadMore = false) => {
    const cacheKey = `${page}-${limit}`;
    const cached = get().cache.latestChapters[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION && !isLoadMore) {
      set({ latestChapters: cached.data, meta: cached.meta, loading: false });
      return;
    }
    

    if (isLoadMore) {
      set({ isLoadingNextPage: true });
    } else {
      set({ loading: true });
    }

    try {
      const response = await getLatestChapters(page, limit);
      const { data, meta } = response;

      set((state) => ({
        latestChapters: page === 1 ? data : [...state.latestChapters, ...data],
        meta,
        cache: {
          ...get().cache,
          latestChapters: {
            ...get().cache.latestChapters,
            [cacheKey]: { data: page === 1 ? data : [...state.latestChapters, ...data], meta, timestamp: now },
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

  loadMoreChapters: async () => {
    const { page, totalPages } = get().meta;
    if (page >= totalPages) return;

    const nextPage = page + 1;
    await get().fetchChapters(nextPage, 10, true);
  },

  loadMoreLatestChapters: async () => {
    const { page, totalPages } = get().meta;
    if (page >= totalPages) return;

    const nextPage = page + 1;
    await get().fetchLatestChapters(nextPage, 10, true);
  },

  addChapter: async (data) => {
    set({ loading: true });
    try {
      const result = await createChapter(data);
      set((state) => {
        const bookId = data.bookId;
        const chapterByBookKey = `${bookId}`;
        const updatedChapterByBook = [result.data, ...(state.chapterByBook || [])];

        return {
          loading:false,
          chapters: [result.data, ...state.chapters],
          chapterByBook: updatedChapterByBook,
          cache: {
            ...state.cache,
            chapterByBook: {
              ...state.cache.chapterByBook,
              [chapterByBookKey]: {
                data: updatedChapterByBook,
                timestamp: Date.now(),
              },
            },
          },
        };
      });
      toast.success('Chapter berhasil ditambahkan');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally{
      set({ loading: false });
    }
  },

  fetchViewChapter: async (id, bookId) => {
    const cacheKey = `${id}-${bookId}`;
    const cached = get().cache.viewChapter[cacheKey];
    const now = Date.now();
    const currentChapter = get().viewChapter;

    // Selalu set loading ke true dan kosongkan viewChapter jika chapter berbeda
    if (!currentChapter || currentChapter.id !== id || currentChapter.bookId !== bookId) {
      set({ loading: true, viewChapter: null });
    }

    // Gunakan cache jika tersedia dan belum kedaluwarsa
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      set({ viewChapter: cached.data, loading: false });
      return;
    }

    try {
      const { data } = await getChapterById(id, bookId);
      set({
        viewChapter: data,
        cache: {
          ...get().cache,
          viewChapter: {
            ...get().cache.viewChapter,
            [cacheKey]: { data, timestamp: now },
          },
        },
        loading: false,
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
      set({ loading: false });
    }
  },
  
  fetchByBook: async (bookId) => {
    const cacheKey = `${bookId}`;
    const cached = get().cache.chapterByBook[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      set({ chapterByBook: cached.data, loading: false });
      return;
    }

    set({ loading: true });
    try {
      const { data } = await getChapterByBookId(bookId);
      set({
        chapterByBook: data,
        cache: {
          ...get().cache,
          chapterByBook: {
            ...get().cache.chapterByBook,
            [cacheKey]: { data, timestamp: now },
          },
        },
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  editChapter: async (id, data) => {
    set({ loading: true });
    try {
      const result = await updateChapter(id, data);
      set((state) => {
        const updatedChapters = state.chapters.map((g) =>
          g.id === id ? result.data : g
        );

        const updatedChapterByBook = state.chapterByBook.map((g) =>
          g.id === id ? result.data : g
        );

        const bookId = result.data.bookId;
        const chapterByBookKey = `${bookId}`;

        return {
          chapters: updatedChapters,
          chapterByBook: updatedChapterByBook,
          cache: {
            ...state.cache,
            chapterByBook: {
              ...state.cache.chapterByBook,
              [chapterByBookKey]: {
                data: updatedChapterByBook,
                timestamp: Date.now(),
              },
            },
          },
        };
      });
      toast.success('Chapter berhasil diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  removeChapter: async (id) => {
    set({ loading: true });
    try {
      await deleteChapter(id);

      set((state) => {
        // Filter chapter dari chapters
        const updatedChapters = state.chapters.filter((g) => g.id !== id);

        // Filter chapter dari chapterByBook
        const updatedChapterByBook = state.chapterByBook.filter((g) => g.id !== id);

        // Update semua cache.chapterByBook
        const updatedCacheChapterByBook = { ...state.cache.chapterByBook };
        for (const key in updatedCacheChapterByBook) {
          const entry = updatedCacheChapterByBook[key];
          updatedCacheChapterByBook[key] = {
            ...entry,
            data: entry.data.filter((g) => g.id !== id),
          };
        }

        // Update semua cache.chapters
        const updatedCacheChapters = { ...state.cache.chapters };
        for (const key in updatedCacheChapters) {
          const entry = updatedCacheChapters[key];
          updatedCacheChapters[key] = {
            ...entry,
            data: entry.data.filter((g) => g.id !== id),
          };
        }

        return {
          chapters: updatedChapters,
          chapterByBook: updatedChapterByBook,
          cache: {
            ...state.cache,
            chapterByBook: updatedCacheChapterByBook,
            chapters: updatedCacheChapters,
          },
        };
      });

      toast.success('Chapter berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  // Tambahkan fungsi reset
  resetChaptersState: () => {
    set({
      latestChapters: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      loading: false,
      isLoadingNextPage: false,
    });
  },
}));

export default useChapterStore;