import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Search, Filter, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import useGenreStore from "@/store/useGenreStore"

interface SearchFiltersProps {
  onSearch: (filters: SearchFiltersType) => void
  loading?: boolean
}

export interface SearchFiltersType {
  searchQuery: string
  creator: string
  genreIds: number[]
}

export default function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const { genres, fetchGenres } = useGenreStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [creator, setCreator] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  const handleSearch = () => {
    onSearch({
      searchQuery: searchQuery.trim(),
      creator: creator.trim(),
      genreIds: selectedGenres,
    })
  }

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) => (prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setCreator("")
    setSelectedGenres([])
    onSearch({
      searchQuery: "",
      creator: "",
      genreIds: [],
    })
  }

  const hasActiveFilters = searchQuery || creator || selectedGenres.length > 0

  return (
    <Card className="mb-6">
      <CardContent className="px-6 py-3">
        {/* Main Search */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search book title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="px-6">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {/* Filter Toggle */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto">
                <Filter className="w-4 h-4" />
                <span>Advanced Filters</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          <CollapsibleContent className="mt-4 space-y-4">
            {/* Creator Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Creator</label>
              <Input
                placeholder="Creator name..."
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Genre Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Genre</label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre.id}
                    variant={selectedGenres.includes(genre.id || Math.random()) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => handleGenreToggle(genre.id || Math.random())}
                  >
                    {genre.nama}
                  </Badge>
                ))}
              </div>
              {selectedGenres.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{selectedGenres.length} genres selected</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchQuery && <Badge variant="secondary">Search: "{searchQuery}"</Badge>}
              {creator && <Badge variant="secondary">Creator: "{creator}"</Badge>}
              {selectedGenres.map((genreId) => {
                const genre = genres.find((g) => g.id === genreId)
                return genre ? (
                  <Badge key={genreId} variant="secondary">
                    Genre: {genre.nama}
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}