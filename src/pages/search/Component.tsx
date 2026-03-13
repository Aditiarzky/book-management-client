import { useState, useEffect } from "react";
import { Loader, BookOpen, Search, RefreshCw, Home, Filter } from "lucide-react";
import useBookStore from "@/store/useBookStore";
import type { SearchFiltersType } from "@/components/SearchFilter";
import SearchFilters from "@/components/SearchFilter";
import BookCard from "@/components/BookCard";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { setMetaTags } from "@/utils/meta";

const BookCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-64 bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

const EmptySearchState = ({
  searchQuery,
  onResetFilters,
  onGoHome,
}: {
  searchQuery: string;
  onResetFilters?: () => void;
  onGoHome?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
      <Search className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-2xl font-semibold mb-2 text-gray-800">No Results Found</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      We couldn't find any books matching "<span className="font-medium">{searchQuery}</span>"
    </p>
    <div className="flex gap-3">
      {onResetFilters && (
        <Button onClick={onResetFilters} variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Reset Filters
        </Button>
      )}
      {onGoHome && (
        <Button onClick={onGoHome} className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Browse All Books
        </Button>
      )}
    </div>
  </div>
);

const InitialSearchState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
      <Search className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-2xl font-semibold mb-2 text-gray-800">Search for Books</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">
      Use the search bar and filters above to find books you're interested in.
    </p>
  </div>
);

export default function SearchPage() {
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersType>({
    searchQuery: "",
    creator: "",
    genreIds: [],
  });
  const [debouncedFilters] = useDebounce(filters, 500);

  const { searchResults, loading, isLoadingNextSearch, searchMeta, loadMoreSearch } = useBookStore({
    searchParams: {
      searchQuery: debouncedFilters.searchQuery || "",
      limit: 20,
      creator: debouncedFilters.creator || "",
      genreIds: debouncedFilters.genreIds,
    },
    searchEnabled: hasSearched,
  });

  const navigate = useNavigate();
  const results = searchResults || [];

  const handleSearch = async (newFilters: SearchFiltersType) => {
    setHasSearched(true);
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ searchQuery: "", creator: "", genreIds: [] });
    setHasSearched(false);
  };

  useEffect(() => {
    if (!loading) {
      setMetaTags({
        title: `Search ${debouncedFilters.searchQuery || 'Book'} | Riztranslation`,
        description: `Temukan buku seperti ${debouncedFilters.searchQuery || 'manga dan novel'} di Riztranslation.`,
        image: "https://i.imgur.com/uaZ4pwN.jpeg",
        url: `https://riztranslation.rf.gd/search?query=${encodeURIComponent(debouncedFilters.searchQuery || '')}`,
      });
    }
  }, [debouncedFilters, loading]);

  const canLoadMore = !!searchMeta && searchMeta.page < searchMeta.totalPages;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4">
        <SearchFilters onSearch={handleSearch} loading={loading} />
        <div className="mb-6">
          {loading && !isLoadingNextSearch ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            </div>
          ) : (
            <>
              {hasSearched && (
                <div className="flex items-center justify-between mb-6">
                  <span className="text-gray-600 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                    {results.length > 0 ? `Found ${results.length} books` : "No books found"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Reset
                  </Button>
                </div>
              )}

              {results.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {results.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => navigate({ to: `/detail/${book.id}` })}
                      />
                    ))}
                  </div>

                  {isLoadingNextSearch && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <BookCardSkeleton key={`skeleton-${i}`} />
                      ))}
                    </div>
                  )}

                  {canLoadMore && (
                    <div className="text-center mt-6">
                      <Button variant="outline" onClick={() => loadMoreSearch()} disabled={isLoadingNextSearch}>
                        {isLoadingNextSearch ? <Loader className="h-4 w-4 animate-spin" /> : "Load More"}
                      </Button>
                    </div>
                  )}
                </>
              ) : hasSearched ? (
                <EmptySearchState
                  searchQuery={filters.searchQuery || "your search"}
                  onResetFilters={handleResetFilters}
                  onGoHome={() => navigate({ to: "/" })}
                />
              ) : (
                <InitialSearchState />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
