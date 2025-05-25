import { create } from 'zustand';
import { toast } from 'sonner';
import { createChapter, deleteChapter, getChapterByBookId, getChapterById, getChapters, updateChapter } from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IChapter, IMeta } from '@/types/core.types';

export interface ChapterStore {
  chapters: IChapter[];
  viewChapter: IChapter | null;
  chapterByBook: IChapter[];
  meta: IMeta;
  loading: boolean;
  isLoadingNextPage: boolean;
  fetchChapters: (page?: number, limit?: number, isLoadMore?:boolean) => Promise<void>;
  loadMoreChapters: () => Promise<void>;
  addChapter: (data: IChapter) => Promise<void>;
  fetchViewChapter: (id: number, bookId: number) => Promise<void>;
  fetchByBook: (bookId: number) => Promise<void>;
  editChapter: (id: number, data: IChapter) => Promise<void>;
  removeChapter: (id: number) => Promise<void>;
}

const useChapterStore = create<ChapterStore>((set, get) => ({
  chapters: [],
  viewChapter: null,
  chapterByBook: [],
  meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
  loading: false,
  isLoadingNextPage: false,

  fetchChapters: async (page = 1, limit = 10, isLoadMore = false) => {
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
    try {
      const { chapter } = await createChapter(data);
      set((state) => ({ chapters: [chapter, ...state.chapters] }));
      toast.success('chapter berhasil ditambahkan');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },

  fetchViewChapter: async (id, bookId) => {
    set({ loading: true })
    try {
      const { data } = await getChapterById(id, bookId);
      set(() => ({viewChapter:data, loading: false}));
    } catch (error) {
      toast.error(getErrorMessage(error));
      set({ loading: false });
    } finally{
      set({ loading: false })
    }
  },

  fetchByBook: async (bookId) => {
    try {
      const { data } = await getChapterByBookId(bookId);
      set(() => ({chapterByBook:data}));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },

  editChapter: async (id, data) => {
    try {
      const result = await updateChapter(id, data);
      set((state) => ({
        chapters: state.chapters.map((g) => (g.id === id ? result.data : g)),
      }));
      toast.success('chapter berhasil diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },

  removeChapter: async (id) => {
    try {
      await deleteChapter(id);
      set((state) => ({
        chapters: state.chapters.filter((g) => g.id !== id),
      }));
      toast.success('chapter berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },
}));

export default useChapterStore;
