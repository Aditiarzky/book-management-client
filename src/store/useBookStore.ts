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
  createBook,
  deleteBook,
  getBookById,
  getBooks,
  searchBooks,
  updateBook,
} from '../utils/api';
import getErrorMessage from '../utils/error';
import type { IBook, IBookCreateInput, IBookUpdateInput, IMeta } from '../types/core.types';

const DEFAULT_META: IMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (limit: number) => [...bookKeys.lists(), { limit }] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id?: number) => [...bookKeys.details(), id] as const,
  searchLists: () => [...bookKeys.all, 'search-list'] as const,
  searchList: (params: {
    searchQuery: string;
    limit: number;
    creator: string;
    genreIds: number[];
  }) => [...bookKeys.searchLists(), params] as const,
};

type BookPage = { data?: IBook[]; meta?: IMeta };

function flattenBooks(data?: InfiniteData<BookPage>) {
  return data?.pages.flatMap((page) => page.data ?? []) ?? [];
}

interface SearchParams {
  searchQuery: string;
  limit: number;
  creator: string;
  genreIds: number[];
}

interface UseBookStoreOptions {
  detailBookId?: number;
  searchParams?: SearchParams;
  searchEnabled?: boolean;
}

const DEFAULT_SEARCH_PARAMS: SearchParams = {
  searchQuery: '',
  limit: 20,
  creator: '',
  genreIds: [],
};

const useBookStore = (options: UseBookStoreOptions = {}) => {
  const queryClient = useQueryClient();
  const [internalBookId, setInternalBookId] = useState<number | null>(null);
  const [bookLimit, setBookLimit] = useState(10);
  const [internalSearchParams, setInternalSearchParams] = useState<SearchParams>(DEFAULT_SEARCH_PARAMS);

  const selectedBookId = options.detailBookId ?? internalBookId;
  const activeSearchParams = options.searchParams ?? internalSearchParams;
  const searchEnabled = options.searchEnabled ?? true;

  const bookQuery = useInfiniteQuery({
    queryKey: bookKeys.list(bookLimit),
    queryFn: ({ pageParam }) => getBooks(pageParam, bookLimit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const page = lastPage?.meta?.page ?? 1;
      const totalPages = lastPage?.meta?.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const searchQuery = useInfiniteQuery({
    queryKey: bookKeys.searchList(activeSearchParams),
    queryFn: ({ pageParam }) =>
      searchBooks(
        activeSearchParams.searchQuery,
        pageParam,
        activeSearchParams.limit,
        activeSearchParams.creator,
        activeSearchParams.genreIds
      ),
    initialPageParam: 1,
    enabled: searchEnabled,
    getNextPageParam: (lastPage) => {
      const page = lastPage?.meta?.page ?? 1;
      const totalPages = lastPage?.meta?.totalPages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const detailQuery = useQuery({
    queryKey: bookKeys.detail(selectedBookId ?? undefined),
    queryFn: () => getBookById(selectedBookId as number),
    enabled: !!selectedBookId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: IBookCreateInput) => createBook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      toast.success('Book berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IBookUpdateInput }) => updateBook(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.searchLists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(variables.id) });
      toast.success('Book berhasil diperbarui');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBook(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.searchLists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(id) });
      toast.success('Book berhasil dihapus');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const books = useMemo(() => flattenBooks(bookQuery.data), [bookQuery.data]);
  const searchResults = useMemo(() => flattenBooks(searchQuery.data), [searchQuery.data]);

  return {
    books,
    searchResults,
    detailBook: detailQuery.data?.data ?? null,
    meta: bookQuery.data?.pages[bookQuery.data.pages.length - 1]?.meta ?? DEFAULT_META,
    searchMeta: searchQuery.data?.pages[searchQuery.data.pages.length - 1]?.meta ?? {
      ...DEFAULT_META,
      limit: activeSearchParams.limit,
    },
    loading: bookQuery.isLoading || searchQuery.isLoading || detailQuery.isLoading,
    isLoadingNextPage: bookQuery.isFetchingNextPage,
    isLoadingNextSearch: searchQuery.isFetchingNextPage,

    fetchBooks: async (page = 1, limit = 10, isLoadMore = false) => {
      if (isLoadMore) {
        await bookQuery.fetchNextPage();
        return;
      }

      setBookLimit(limit);
      if (page === 1) {
        await queryClient.resetQueries({ queryKey: bookKeys.list(limit) });
      }
    },

    loadMoreBooks: async () => {
      if (bookQuery.hasNextPage) {
        await bookQuery.fetchNextPage();
      }
    },

    fetchBookById: async (id: number) => {
      setInternalBookId(id);
    },

    searchBook: async (
      searchQueryInput = '',
      page = 1,
      limit = 20,
      creator = '',
      genreIds: number[] = [],
      isLoadMore = false
    ) => {
      if (isLoadMore) {
        await searchQuery.fetchNextPage();
        return;
      }

      const params = { searchQuery: searchQueryInput, limit, creator, genreIds };
      setInternalSearchParams(params);
      if (page === 1) {
        await queryClient.resetQueries({ queryKey: bookKeys.searchList(params) });
      }
    },

    loadMoreSearch: async () => {
      if (searchQuery.hasNextPage) {
        await searchQuery.fetchNextPage();
      }
    },

    addBook: async (data: IBookCreateInput) => {
      await createMutation.mutateAsync(data);
    },

    editBook: async (id: number, data: IBookUpdateInput) => {
      await updateMutation.mutateAsync({ id, data });
    },

    removeBook: async (id: number) => {
      await deleteMutation.mutateAsync(id);
    },

    resetBooksState: () => {
      setBookLimit(10);
      setInternalSearchParams(DEFAULT_SEARCH_PARAMS);
      setInternalBookId(null);
    },
  };
};

export default useBookStore;
