import { useQuery } from '@tanstack/react-query';
import { getPopularBooks } from '../utils/api';
import type { IBook } from '../types/core.types';

export const popularKeys = {
  all: ['popular'] as const,
  list: (limit: number) => [...popularKeys.all, 'list', { limit }] as const,
};

export interface IBookWithLike extends IBook {
  likeCount: number;
}

export default function usePopularStore(limit = 10) {
  const { data, isLoading, isError, refetch } = useQuery<IBookWithLike[]>({
    queryKey: popularKeys.list(limit),
    queryFn: () => getPopularBooks(limit) as Promise<IBookWithLike[]>,
    staleTime: 5 * 60_000, // 5 menit
    retry: 2,
  });

  return {
    popularBooks: data ?? [],
    loading: isLoading,
    isError,
    refetch,
  };
}
