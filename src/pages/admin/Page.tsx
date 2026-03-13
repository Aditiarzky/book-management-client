/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { IBook, IChapter, IGenre } from "../../types/core.types";
import useGenreStore from "@/store/useGenreStore";
import useChapterStore from "@/store/useChapterStore";
import useBookStore from "@/store/useBookStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate } from "@tanstack/react-router";
import { Loader2, LayoutDashboard, BookOpen, FileText, Tags } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBooks, getChapters, getGenresPaged, searchBooks } from "@/utils/api";
import { useDebounce } from "use-debounce";
import DashboardStats from "@/components/admin/dashboard-stats";
import BooksTable from "@/components/admin/books/book-table";
import ChaptersTable from "@/components/admin/chapters/chapter-table";
import GenresTable from "@/components/admin/genres/genre-table";
import Sidebar from "@/components/admin/sidebar";
import BookForm from "@/components/admin/books/book-form";
import ChapterForm from "@/components/admin/chapters/chapter-form";
import GenreForm from "@/components/admin/genres/genre-form";

const DEFAULT_META = { total: 0, page: 1, limit: 10, totalPages: 1 };

const TAB_LABELS: Record<string, { label: string; sub: string; icon: React.ElementType }> = {
  dashboard: { label: "Dashboard", sub: "Ringkasan data dan aktivitas terbaru.", icon: LayoutDashboard },
  books: { label: "Kelola Buku", sub: "Kelola daftar buku dengan pencarian dan pagination.", icon: BookOpen },
  chapters: { label: "Kelola Chapter", sub: "Kelola chapter untuk buku yang dipilih.", icon: FileText },
  genres: { label: "Kelola Genre", sub: "Kelola genre untuk klasifikasi buku.", icon: Tags },
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  /* Form visibility */
  const [showBookForm, setShowBookForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showGenreForm, setShowGenreForm] = useState(false);

  /* Editing state */
  const [editingBook, setEditingBook] = useState<IBook | null>(null);
  const [editingChapter, setEditingChapter] = useState<IChapter | null>(null);
  const [editingGenre, setEditingGenre] = useState<IGenre | null>(null);
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);

  /* Pagination — books */
  const [bookSearch, setBookSearch] = useState("");
  const [bookPage, setBookPage] = useState(1);
  const [bookLimit, setBookLimit] = useState(10);
  const [debouncedBookSearch] = useDebounce(bookSearch, 400);

  /* Pagination — chapters */
  const [chapterPage, setChapterPage] = useState(1);
  const [chapterLimit, setChapterLimit] = useState(10);

  /* Pagination — genres */
  const [genrePage, setGenrePage] = useState(1);
  const [genreLimit, setGenreLimit] = useState(10);

  const queryClient = useQueryClient();

  /* ── Stores (mutations only) ── */
  const { addBook, editBook, removeBook } = useBookStore();
  const { addGenre, editGenre, removeGenre } = useGenreStore();
  const {
    chapters: allChapters,
    chapterByBook,
    loading: chaptersLoading,
    addChapter,
    editChapter,
    removeChapter,
  } = useChapterStore({ selectedBookId: selectedBook?.id });

  /* ── Auth ── */
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();

  useEffect(() => { fetchUser(); }, [fetchUser]);

  /* Reset to page 1 on filter changes */
  useEffect(() => { setBookPage(1); }, [debouncedBookSearch, bookLimit]);
  useEffect(() => { setChapterPage(1); }, [chapterLimit]);
  useEffect(() => { setGenrePage(1); }, [genreLimit]);

  /* ── Queries ── */
  const booksQuery = useQuery({
    queryKey: ["admin-books", { query: debouncedBookSearch, page: bookPage, limit: bookLimit }],
    queryFn: () => debouncedBookSearch.trim()
      ? searchBooks(debouncedBookSearch, bookPage, bookLimit)
      : getBooks(bookPage, bookLimit),
    placeholderData: prev => prev,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const chaptersQuery = useQuery({
    queryKey: ["admin-chapters", { page: chapterPage, limit: chapterLimit }],
    queryFn: () => getChapters(chapterPage, chapterLimit),
    placeholderData: prev => prev,
    enabled: isAuthenticated && activeTab === "chapters" && !selectedBook,
    staleTime: 30_000,
  });

  const genresQuery = useQuery({
    queryKey: ["admin-genres", { page: genrePage, limit: genreLimit }],
    queryFn: () => getGenresPaged(genrePage, genreLimit),
    placeholderData: prev => prev,
    enabled: isAuthenticated && activeTab === "genres",
    staleTime: 30_000,
  });

  /* ── Derived data ── */
  const books = booksQuery.data?.data ?? [];
  const booksMeta = booksQuery.data?.meta ?? { ...DEFAULT_META, page: bookPage, limit: bookLimit };

  const chapters = selectedBook
    ? (chapterByBook ?? [])
    : chaptersQuery.data?.data ?? allChapters ?? [];

  const chaptersMeta = selectedBook
    ? { ...DEFAULT_META, page: 1, limit: chapters.length || chapterLimit, total: chapters.length, totalPages: 1 }
    : chaptersQuery.data?.meta ?? { ...DEFAULT_META, page: chapterPage, limit: chapterLimit };

  const genres = genresQuery.data?.data ?? [];
  const genresMeta = genresQuery.data?.meta ?? { ...DEFAULT_META, page: genrePage, limit: genreLimit };

  /* ── Auth guards ── */
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  /* ── Book handlers ── */
  const handleAddBook = () => { setEditingBook(null); setShowBookForm(true); };
  const handleEditBook = (book: IBook) => { setEditingBook(book); setShowBookForm(true); };

  const handleBookSubmit = async (data: any) => {
    try {
      if (editingBook) await editBook(editingBook.id, data);
      else await addBook(data);
      await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast.success(editingBook ? "Buku berhasil diupdate" : "Buku berhasil ditambahkan");
      setShowBookForm(false);
      setEditingBook(null);
    } catch (err) {
      toast.error("Gagal menyimpan buku: " + err);
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      await removeBook(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      toast.success("Buku berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus buku: " + err);
    }
  };

  const handleViewChapters = (book: IBook) => {
    setSelectedBook(book);
    setActiveTab("chapters");
  };

  /* ── Chapter handlers ── */
  const handleAddChapter = () => { setEditingChapter(null); setShowChapterForm(true); };
  const handleEditChapter = (ch: IChapter) => { setEditingChapter(ch); setShowChapterForm(true); };

  const handleChapterSubmit = async (data: any) => {
    try {
      if (editingChapter) await editChapter(editingChapter.id, data);
      else await addChapter(data);
      await queryClient.invalidateQueries({ queryKey: ["admin-chapters"] });
      toast.success(editingChapter ? "Chapter berhasil diupdate" : "Chapter berhasil ditambahkan");
      setShowChapterForm(false);
      setEditingChapter(null);
    } catch (err) {
      toast.error("Gagal menyimpan chapter: " + err);
    }
  };

  const handleDeleteChapter = async (id: number) => {
    try {
      await removeChapter(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-chapters"] });
      toast.success("Chapter berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus chapter: " + err);
    }
  };

  const handleBackToBooks = () => {
    setSelectedBook(null);
    setActiveTab("books");
  };

  /* ── Genre handlers ── */
  const handleAddGenre = () => { setEditingGenre(null); setShowGenreForm(true); };
  const handleEditGenre = (g: IGenre) => { setEditingGenre(g); setShowGenreForm(true); };

  const handleGenreSubmit = async (data: any) => {
    try {
      if (editingGenre) await editGenre(editingGenre.id!, data);
      else await addGenre(data);
      await queryClient.invalidateQueries({ queryKey: ["admin-genres"] });
      toast.success(editingGenre ? "Genre berhasil diupdate" : "Genre berhasil ditambahkan");
      setShowGenreForm(false);
      setEditingGenre(null);
    } catch (err) {
      toast.error("Gagal menyimpan genre: " + err);
    }
  };

  const handleDeleteGenre = async (id: number) => {
    try {
      await removeGenre(id);
      await queryClient.invalidateQueries({ queryKey: ["admin-genres"] });
      toast.success("Genre berhasil dihapus");
    } catch (err) {
      toast.error("Gagal menghapus genre: " + err);
    }
  };

  /* ── Current tab meta ── */
  const currentTab = TAB_LABELS[activeTab] ?? TAB_LABELS.dashboard;
  const TabIcon = currentTab.icon;

  const chapterTabLabel = activeTab === "chapters" && selectedBook
    ? `Chapter — ${selectedBook.judul}`
    : currentTab.label;

  /* ── Content renderer ── */
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardStats />;

      case "books":
        return (
          <BooksTable
            books={books}
            loading={booksQuery.isLoading}
            isFetching={booksQuery.isFetching}
            searchTerm={bookSearch}
            onSearchTermChange={(v) => { setBookSearch(v); setBookPage(1); }}
            pagination={{ page: booksMeta.page, limit: booksMeta.limit, total: booksMeta.total, totalPages: booksMeta.totalPages }}
            onPageChange={setBookPage}
            onLimitChange={setBookLimit}
            onAdd={handleAddBook}
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
            onViewChapters={handleViewChapters}
          />
        );

      case "chapters":
        return (
          <ChaptersTable
            chapters={chapters}
            book={selectedBook}
            loading={selectedBook ? chaptersLoading : chaptersQuery.isLoading}
            isFetching={chaptersQuery.isFetching}
            pagination={{ page: chaptersMeta.page, limit: chaptersMeta.limit, total: chaptersMeta.total, totalPages: chaptersMeta.totalPages }}
            onPageChange={setChapterPage}
            onLimitChange={setChapterLimit}
            onAdd={handleAddChapter}
            onEdit={handleEditChapter}
            onDelete={handleDeleteChapter}
            onBack={handleBackToBooks}
          />
        );

      case "genres":
        return (
          <GenresTable
            genres={genres}
            loading={genresQuery.isLoading}
            isFetching={genresQuery.isFetching}
            pagination={{ page: genresMeta.page, limit: genresMeta.limit, total: genresMeta.total, totalPages: genresMeta.totalPages }}
            onPageChange={setGenrePage}
            onLimitChange={setGenreLimit}
            onAdd={handleAddGenre}
            onEdit={handleEditGenre}
            onDelete={handleDeleteGenre}
          />
        );

      default:
        return <DashboardStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 ml-10 lg:ml-0">
            <TabIcon className="w-4 h-4 text-gray-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 leading-tight truncate">
              {chapterTabLabel}
            </h1>
            <p className="text-xs text-gray-400 truncate">{currentTab.sub}</p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* ── Dialogs ── */}

      {/* Book form */}
      <Dialog open={showBookForm} onOpenChange={open => { if (!open) { setShowBookForm(false); setEditingBook(null); } }}>
        <DialogContent className="max-w-3xl w-full p-0 border-0 bg-transparent shadow-none">
          <BookForm
            book={editingBook}
            loading={booksQuery.isLoading}
            onSubmit={handleBookSubmit}
            onCancel={() => { setShowBookForm(false); setEditingBook(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Chapter form */}
      <Dialog open={showChapterForm} onOpenChange={open => { if (!open) { setShowChapterForm(false); setEditingChapter(null); } }}>
        <DialogContent className="max-w-3xl w-full p-0 border-0 bg-transparent shadow-none">
          <ChapterForm
            chapter={editingChapter}
            book={selectedBook}
            loading={chaptersLoading}
            onSubmit={handleChapterSubmit}
            onCancel={() => { setShowChapterForm(false); setEditingChapter(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Genre form */}
      <Dialog open={showGenreForm} onOpenChange={open => { if (!open) { setShowGenreForm(false); setEditingGenre(null); } }}>
        <DialogContent className="max-w-md w-full p-0 border-0 bg-transparent shadow-none">
          <GenreForm
            genre={editingGenre}
            loading={genresQuery.isLoading}
            onSubmit={handleGenreSubmit}
            onCancel={() => { setShowGenreForm(false); setEditingGenre(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
