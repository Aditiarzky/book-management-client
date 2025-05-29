import { create } from 'zustand';
import { toast } from 'sonner';
import { createChapter, deleteChapter, getChapterByBookId, getChapterById, getChapters, updateChapter } from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IChapter, IMeta } from '../types/core.types';

export interface ChapterStore {
  chapters: IChapter[];
  viewChapter: IChapter | null;
  chapterByBook: IChapter[];
  meta: IMeta;
  loading: boolean;
  isLoadingNextPage: boolean;
  cache: {
    chapters: { [key: string]: { data: IChapter[]; timestamp: number } };
    viewChapter: { [key: string]: { data: IChapter; timestamp: number } };
    chapterByBook: { [key: string]: { data: IChapter[]; timestamp: number } };
  };
  fetchChapters: (page?: number, limit?: number, isLoadMore?: boolean) => Promise<void>;
  loadMoreChapters: () => Promise<void>;
  addChapter: (data: IChapter) => Promise<void>;
  fetchViewChapter: (id: number, bookId: number) => Promise<void>;
  fetchByBook: (bookId: number) => Promise<void>;
  editChapter: (id: number, data: IChapter) => Promise<void>;
  removeChapter: (id: number) => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; 

const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  viewChapter: null,
  chapterByBook: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  isLoadingNextPage: false,
  cache: { viewChapter: {}, chapterByBook: {}, chapters: {} },

  fetchChapters: async (page = 1, limit = 10, isLoadMore = false) => {
    const cacheKey = `${page}-${limit}`;
    const cached = get().cache.chapters[cacheKey];
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION) {
      set({ chapters: cached.data, loading: false });
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
            [cacheKey]: { data, timestamp: now },
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

  addChapter: async (data) => {
    set({ loading: true });
    try {
      const { chapter } = await createChapter(data);
      set((state) => {
        const bookId = data.bookId;
        const chapterByBookKey = `${bookId}`;
        const updatedChapterByBook = [chapter, ...(state.chapterByBook || [])];

        return {
          loading:false,
          chapters: [chapter, ...state.chapters],
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
      set((state) => ({
        chapters: state.chapters.filter((g) => g.id !== id),
      }));
      toast.success('Chapter berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },
}));

export default useChapterStore;