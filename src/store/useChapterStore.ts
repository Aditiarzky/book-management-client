import { useMemo, useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createChapter,
  deleteChapter,
  getChapterByBookId,
  getChapterById,
  getChapters,
  getLatestChapters,
  updateChapter,
} from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IChapter, IMeta } from '../types/core.types';

const DEFAULT_META: IMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

type ChapterPage = { data?: IChapter[]; meta?: IMeta };

type ViewChapterParams = {
  id: number;
  bookId: number;
} | null;

function flattenChapters(data?: InfiniteData<ChapterPage>) {
  return data?.pages.flatMap((page) => page.data ?? []) ?? [];
}

export const chapterKeys = {
  all: ['chapters'] as const,
  lists: () => [...chapterKeys.all, 'list'] as const,
  list: (limit: number) => [...chapterKeys.lists(), { limit }] as const,
  latestLists: () => [...chapterKeys.all, 'latest-list'] as const,
  latestList: (limit: number) => [...chapterKeys.latestLists(), { limit }] as const,
  details: () => [...chapterKeys.all, 'detail'] as const,
  detail: (params: ViewChapterParams) => [...chapterKeys.details(), params] as const,
  byBookLists: () => [...chapterKeys.all, 'book-list'] as const,
  byBookList: (bookId?: number) => [...chapterKeys.byBookLists(), bookId] as const,
};

interface UseChapterStoreOptions {
  selectedBookId?: number;
  viewParams?: ViewChapterParams;
}

const useChapterStore = (options: UseChapterStoreOptions = {}) => {
  const queryClient = useQueryClient();
  const [chapterLimit, setChapterLimit] = useState(10);
  const [latestLimit, setLatestLimit] = useState(10);
  const [internalBookId, setInternalBookId] = useState<number | null>(null);
  const [internalViewParams, setInternalViewParams] = useState<ViewChapterParams>(null);

  const selectedBookId = options.selectedBookId ?? internalBookId;
  const viewParams = options.viewParams ?? internalViewParams;

  const chapterQuery = useInfiniteQuery({
    queryKey: chapterKeys.list(chapterLimit),
    queryFn: ({ pageParam }) => getChapters(pageParam, chapterLimit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage?.meta?.page ?? 1;
      const totalPages = lastPage?.meta?.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const latestChapterQuery = useInfiniteQuery({
    queryKey: chapterKeys.latestList(latestLimit),
    queryFn: ({ pageParam }) => getLatestChapters(pageParam, latestLimit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage?.meta?.page ?? 1;
      const totalPages = lastPage?.meta?.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const viewChapterQuery = useQuery({
    queryKey: chapterKeys.detail(viewParams),
    queryFn: () =>
      getChapterById(
        (viewParams as NonNullable<ViewChapterParams>).id,
        (viewParams as NonNullable<ViewChapterParams>).bookId
      ),
    enabled: !!viewParams,
    staleTime: 5 * 60 * 1000,
  });

  const chapterByBookQuery = useQuery({
    queryKey: chapterKeys.byBookList(selectedBookId ?? undefined),
    queryFn: () => getChapterByBookId(selectedBookId as number),
    enabled: !!selectedBookId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: IChapter) => createChapter(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.latestLists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.byBookList(variables.bookId) });
      toast.success('Chapter berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IChapter }) => updateChapter(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.latestLists() });
      queryClient.invalidateQueries({
        queryKey: chapterKeys.byBookList(result?.data?.bookId ?? variables.data.bookId),
      });
      queryClient.invalidateQueries({
        queryKey: chapterKeys.detail({ id: variables.id, bookId: variables.data.bookId }),
      });
      toast.success('Chapter berhasil diperbarui');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteChapter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.latestLists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.byBookLists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.details() });
      toast.success('Chapter berhasil dihapus');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const chapters = useMemo(() => flattenChapters(chapterQuery.data), [chapterQuery.data]);
  const latestChapters = useMemo(
    () => flattenChapters(latestChapterQuery.data),
    [latestChapterQuery.data]
  );

  return {
    chapters,
    latestChapters,
    viewChapter: viewChapterQuery.data?.data ?? null,
    chapterByBook: chapterByBookQuery.data?.data ?? [],
    meta:
      latestChapterQuery.data?.pages[latestChapterQuery.data.pages.length - 1]?.meta ??
      chapterQuery.data?.pages[chapterQuery.data.pages.length - 1]?.meta ??
      DEFAULT_META,
    loading:
      chapterQuery.isLoading ||
      latestChapterQuery.isLoading ||
      viewChapterQuery.isLoading ||
      chapterByBookQuery.isLoading ||
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    isLoadingNextPage:
      chapterQuery.isFetchingNextPage || latestChapterQuery.isFetchingNextPage,

    fetchChapters: async (page = 1, limit = 10, isLoadMore = false) => {
      if (isLoadMore) {
        await chapterQuery.fetchNextPage();
        return;
      }

      setChapterLimit(limit);
      if (page === 1) {
        await queryClient.resetQueries({ queryKey: chapterKeys.list(limit) });
      }
    },

    fetchLatestChapters: async (page = 1, limit = 10, isLoadMore = false) => {
      if (isLoadMore) {
        await latestChapterQuery.fetchNextPage();
        return;
      }

      setLatestLimit(limit);
      if (page === 1) {
        await queryClient.resetQueries({ queryKey: chapterKeys.latestList(limit) });
      }
    },

    loadMoreChapters: async () => {
      if (chapterQuery.hasNextPage) {
        await chapterQuery.fetchNextPage();
      }
    },

    loadMoreLatestChapters: async () => {
      if (latestChapterQuery.hasNextPage) {
        await latestChapterQuery.fetchNextPage();
      }
    },

    addChapter: async (data: IChapter) => {
      await createMutation.mutateAsync(data);
    },

    fetchViewChapter: async (id: number, bookId: number) => {
      setInternalViewParams({ id, bookId });
    },

    fetchByBook: async (bookId: number) => {
      setInternalBookId(bookId);
    },

    editChapter: async (id: number, data: IChapter) => {
      await updateMutation.mutateAsync({ id, data });
    },

    removeChapter: async (id: number) => {
      await deleteMutation.mutateAsync(id);
    },

    resetChaptersState: () => {
      setChapterLimit(10);
      setLatestLimit(10);
      setInternalBookId(null);
      setInternalViewParams(null);
    },
  };
};

export default useChapterStore;
