import { useState, useEffect } from "react";
import { Loader2, BookOpen } from "lucide-react";
import useBookStore from "@/store/useBookStore";
import type { SearchFiltersType } from "@/components/SearchFilter";
import SearchFilters from "@/components/SearchFilter";
import BookCard from "@/components/BookCard";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";
import { setMetaTags } from "@/utils/meta";

export default function SearchPage() {
  const { searchResults, loading, isLoadingNextSearch, searchMeta, searchBook, loadMoreSearch } = useBookStore();
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersType>({
    searchQuery: "",
    creator: "",
    genreIds: [],
  });
  const [debouncedFilters] = useDebounce(filters, 500); // Debounce filters
  const navigate = useNavigate();

  const handleSearch = async (newFilters: SearchFiltersType) => {
    setHasSearched(true);
    setFilters(newFilters);
  };

  useEffect(() => {
    // Perform search when debounced filters change
    searchBook(
      debouncedFilters.searchQuery || undefined,
      1,
      20,
      debouncedFilters.creator || undefined,
      debouncedFilters.genreIds.length > 0 ? debouncedFilters.genreIds : undefined,
      false
    );
  }, [debouncedFilters]);

  useEffect(() => {
    // Set meta tags for SEO
    if (!loading) {
      setMetaTags({
        title: `Search ${debouncedFilters.searchQuery || 'Book'} | Riztranslation`,
        description: `Temukan buku seperti ${debouncedFilters.searchQuery || 'manga dan novel'} di Riztranslation.`,
        image: "https://i.imgur.com/uaZ4pwN.jpeg",
        url: `https://riztranslation.rf.gd/search?query=${encodeURIComponent(debouncedFilters.searchQuery || '')}`,
      });
    }
  }, [debouncedFilters, loading]);

  const canLoadMore = searchMeta.page < searchMeta.totalPages;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4">
        <SearchFilters onSearch={handleSearch} loading={loading} />
        <div className="mb-6">
          {loading && !isLoadingNextSearch ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Searching for books...</p>
              </div>
            </div>
          ) : (
            <>
              {hasSearched && (
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-600">
                    {searchResults.length > 0 ? `Found ${searchResults.length} books` : "No books found"}
                  </span>
                </div>
              )}

              {searchResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {searchResults.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onClick={() => {
                          navigate({ to: `/detail/${book.id}` });
                        }}
                      />
                    ))}
                  </div>
                  {canLoadMore && (
                    <div className="text-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() =>
                          loadMoreSearch(
                            filters.searchQuery || undefined,
                            filters.creator || undefined,
                            filters.genreIds.length > 0 ? filters.genreIds : undefined
                          )
                        }
                        disabled={isLoadingNextSearch}
                      >
                        {isLoadingNextSearch ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : hasSearched ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No books found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Try changing the search keywords or filters you are using.
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>💡 Search tips:</p>
                    <ul className="list-disc list-inside space-y-1 max-w-md mx-auto">
                      <li>Use more general keywords</li>
                      <li>Check the spelling of keywords</li>
                      <li>Try different filter combinations</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}