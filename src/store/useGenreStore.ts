import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createGenre,
  deleteGenre,
  getGenres,
  updateGenre,
} from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IGenre } from '@/types/core.types';

export const genreKeys = {
  all: ['genres'] as const,
  list: () => [...genreKeys.all, 'list'] as const,
};

const useGenreStore = () => {
  const queryClient = useQueryClient();

  const genreQuery = useQuery({
    queryKey: genreKeys.list(),
    queryFn: getGenres,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: IGenre) => createGenre(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genreKeys.list() });
      toast.success('Genre berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IGenre }) => updateGenre(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genreKeys.list() });
      toast.success('Genre berhasil diperbarui');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: genreKeys.list() });
      toast.success('Genre berhasil dihapus');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return {
    genres: genreQuery.data?.data ?? [],
    loading:
      genreQuery.isLoading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,

    fetchGenres: async () => {
      await queryClient.invalidateQueries({ queryKey: genreKeys.list() });
    },

    addGenre: async (data: IGenre) => {
      await createMutation.mutateAsync(data);
    },

    editGenre: async (id: number, data: IGenre) => {
      await updateMutation.mutateAsync({ id, data });
    },

    removeGenre: async (id: number) => {
      await deleteMutation.mutateAsync(id);
    },
  };
};

export default useGenreStore;
