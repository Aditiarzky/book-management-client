import { create } from 'zustand';
import { toast } from 'sonner';
import {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
} from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IGenre } from '@/types/core.types';

interface GenreStore {
  genres: IGenre[];
  loading: boolean;
  fetchGenres: () => Promise<void>;
  addGenre: (data: IGenre) => Promise<void>;
  editGenre: (id: number, data: IGenre) => Promise<void>;
  removeGenre: (id: number) => Promise<void>;
}

const useGenreStore = create<GenreStore>((set) => ({
  genres: [],
  loading: false,

  fetchGenres: async () => {
    set({ loading: true });
    try {
      const { data } = await getGenres();
      set({ genres: data });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  addGenre: async (data) => {
    set({ loading: true });
    try {
      const result = await createGenre(data);
      set((state) => ({ genres: [result.data, ...state.genres] }));
      toast.success('Genre berhasil ditambahkan');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  editGenre: async (id, data) => {
    set({ loading: true });
    try {
      const result = await updateGenre(id, data);
      set((state) => ({
        genres: state.genres.map((g) => (g.id === id ? result.data : g)),
      }));
      toast.success('Genre berhasil diperbarui');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },

  removeGenre: async (id) => {
    set({ loading: true });
    try {
      await deleteGenre(id);
      set((state) => ({
        genres: state.genres.filter((g) => g.id !== id),
      }));
      toast.success('Genre berhasil dihapus');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ loading: false });
    }
  },
}));

export default useGenreStore;
