import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner"; // Impor Navigate untuk redirect
import Sidebar from "../../components/admin/sidebar";
import DashboardStats from "../../components/admin/dashboard-stats";
import BookForm from "../../components/admin/books/book-form";
import ChapterForm from "../../components/admin/chapters/chapter-form";
import GenreForm from "../../components/admin/genres/genre-form";
import type { IBook, IChapter, IGenre } from "../../types/core.types";
import useGenreStore from "@/store/useGenreStore";
import useChapterStore from "@/store/useChapterStore";
import useBookStore from "@/store/useBookStore";
import { useAuthStore } from "@/store/useAuthStore"; // Impor store autentikasi
import ChaptersTable from "@/components/admin/chapters/chapter-table";
import GenresTable from "@/components/admin/genres/genre-table";
import BooksTable from "@/components/admin/books/book-table";
import { Navigation } from "@/components/Navigation";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showBookForm, setShowBookForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showGenreForm, setShowGenreForm] = useState(false);
  const [editingBook, setEditingBook] = useState<IBook | null>(null);
  const [editingChapter, setEditingChapter] = useState<IChapter | null>(null);
  const [editingGenre, setEditingGenre] = useState<IGenre | null>(null);
  const [selectedBook, setSelectedBook] = useState<IBook | null>(null);

  const { books, loading: booksLoading, fetchBooks, addBook, editBook, removeBook } = useBookStore();
  const {
    chapters,
    chapterByBook,
    loading: chaptersLoading,
    fetchChapters,
    fetchByBook,
    addChapter,
    editChapter,
    removeChapter,
  } = useChapterStore();
  const { genres, loading: genresLoading, fetchGenres, addGenre, editGenre, removeGenre } = useGenreStore();
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore(); // Ambil state dan fungsi dari auth store

  // Panggil fetchUser saat komponen dimuat untuk memeriksa status autentikasi
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Ambil data buku, bab, dan genre hanya jika pengguna terautentikasi
  useEffect(() => {
    if (isAuthenticated) {
      fetchBooks();
      fetchChapters();
      fetchGenres();
    }
  }, [isAuthenticated, fetchBooks, fetchChapters, fetchGenres]);

  // Jika masih loading, tampilkan indikator loading
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen gap-2">Loading... <Loader2 className="w-5 animate-spin"/></div>;
  }

  // Jika tidak terautentikasi, alihkan ke halaman login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Book handlers
  const handleAddBook = () => {
    setEditingBook(null);
    setShowBookForm(true);
  };

  const handleEditBook = (book: IBook) => {
    setEditingBook(book);
    setShowBookForm(true);
  };

  const handleBookSubmit = async (data: any) => {
    try {
      if (editingBook) {
        await editBook(editingBook.id, data);
      } else {
        await addBook(data);
      }
      setShowBookForm(false);
      setEditingBook(null);
    } catch (error) {
      toast.error("Failed to save book");
    }
  };

  const handleDeleteBook = async (id: number) => {
    try {
      await removeBook(id);
    } catch (error) {
      toast.error("Failed to delete book");
    }
  };

  const handleViewChapters = (book: IBook) => {
    setSelectedBook(book);
    setActiveTab("chapters");
    fetchByBook(book.id);
  };

  // Chapter handlers
  const handleAddChapter = () => {
    setEditingChapter(null);
    setShowChapterForm(true);
  };

  const handleEditChapter = (chapter: IChapter) => {
    setEditingChapter(chapter);
    setShowChapterForm(true);
  };

  const handleChapterSubmit = async (data: any) => {
    try {
      if (editingChapter) {
        await editChapter(editingChapter.id, data);
      } else {
        await addChapter(data);
      }
      setShowChapterForm(false);
      setEditingChapter(null);
      if (selectedBook) {
        fetchByBook(selectedBook.id);
      }
    } catch (error) {
      toast.error("Failed to save chapter");
    }
  };

  const handleDeleteChapter = async (id: number) => {
    try {
      await removeChapter(id);
      if (selectedBook) {
        fetchByBook(selectedBook.id);
      }
    } catch (error) {
      toast.error("Failed to delete chapter");
    }
  };

  const handleBackToBooks = () => {
    setSelectedBook(null);
    setActiveTab("books");
  };

  // Genre handlers
  const handleAddGenre = () => {
    setEditingGenre(null);
    setShowGenreForm(true);
  };

  const handleEditGenre = (genre: IGenre) => {
    setEditingGenre(genre);
    setShowGenreForm(true);
  };

  const handleGenreSubmit = async (data: any) => {
    try {
      if (editingGenre) {
        await editGenre(editingGenre.id!, data);
      } else {
        await addGenre(data);
      }
      setShowGenreForm(false);
      setEditingGenre(null);
    } catch (error) {
      toast.error("Failed to save genre");
    }
  };

  const handleDeleteGenre = async (id: number) => {
    try {
      await removeGenre(id);
    } catch (error) {
      toast.error("Failed to delete genre");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardStats />;
      case "books":
        return (
          <BooksTable
            books={books}
            loading={booksLoading}
            onAdd={handleAddBook}
            onEdit={handleEditBook}
            onDelete={handleDeleteBook}
            onViewChapters={handleViewChapters}
          />
        );
      case "chapters":
        return (
          <ChaptersTable
            chapters={selectedBook ? (chapterByBook || []) : chapters} // Provide empty array if chapterByBook is undefined
            book={selectedBook}
            loading={chaptersLoading}
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
            loading={genresLoading}
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
    <div className="flex flex-col">
      <Navigation />
      <div className="flex flex-1 lg:flex-row">
        <div className="fixed z-50">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-1 sm:ml-64 p-4 sm:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "books" && "Manage Books"}
              {activeTab === "chapters" && (selectedBook ? `Chapters - ${selectedBook.judul}` : "Manage Chapters")}
              {activeTab === "genres" && "Manage Genres"}
            </h1>
          </div>
          <div className="overflow-x-auto h-screen">{renderContent()}</div>
        </div>
      </div>

      {/* Book Form Dialog */}
      <Dialog open={showBookForm} onOpenChange={setShowBookForm}>
        <DialogContent className="sm:max-w-6xl w-fit shadow-none bg-transparent border-0 max-h-[90vh] p-0 overflow-y-auto">
          <BookForm
            book={editingBook}
            loading={booksLoading}
            onSubmit={handleBookSubmit}
            onCancel={() => setShowBookForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Chapter Form Dialog */}
      <Dialog open={showChapterForm} onOpenChange={setShowChapterForm}>
        <DialogContent className="sm:max-w-6xl w-fit shadow-none bg-transparent border-0 max-h-[90vh] p-0 overflow-y-auto">
          <ChapterForm
            chapter={editingChapter}
            book={selectedBook}
            loading={chaptersLoading}
            onSubmit={handleChapterSubmit}
            onCancel={() => setShowChapterForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Genre Form Dialog */}
      <Dialog open={showGenreForm} onOpenChange={setShowGenreForm}>
        <DialogContent className="sm:max-w-6xl w-fit shadow-none bg-transparent border-0 max-h-[90vh] p-0 overflow-y-auto">
          <GenreForm
            genre={editingGenre}
            loading={genresLoading}
            onSubmit={handleGenreSubmit}
            onCancel={() => setShowGenreForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}