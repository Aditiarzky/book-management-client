

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Plus, Search, BookOpen } from "lucide-react"
import type { IBook } from "../../../types/core.types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Link } from "@tanstack/react-router"
import { DETAIL_PAGE } from "@/routes/constants"

interface BooksTableProps {
  books: IBook[]
  loading: boolean
  onAdd: () => void
  onEdit: (book: IBook) => void
  onDelete: (id: number) => void
  onViewChapters: (book: IBook) => void
}

export default function BooksTable({ books, loading, onAdd, onEdit, onDelete, onViewChapters }: BooksTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filteredBooks = books.filter(
    (book) =>
      book.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.alt_judul?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ongoing":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "hiatus":
        return "bg-yellow-100 text-yellow-800"
      case "dropped":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Manage Books</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={onAdd} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Book
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Cover</TableHead>
                  <TableHead className="w-64">Title</TableHead>
                  <TableHead>Author/Artist</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Genres</TableHead>
                  <TableHead>Chapters</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id} className="transition-colors">
                    <TableCell>
                    <Link to={DETAIL_PAGE} params={{id:book.id.toString()}}>
                      <img
                        src={book.cover || "/placeholder.svg?height=60&width=40"}
                        alt={book.judul}
                        className="w-10 h-15 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=60&width=40"
                        }}
                      />
                    </Link>
                    </TableCell>
                    <TableCell>
                    <Link to={DETAIL_PAGE} params={{id:book.id.toString()}}>
                      <div className="whitespace-break-spaces">
                        <div className="font-medium whitespace-break-spaces">{book.judul}</div>
                        {book.alt_judul && <div className="text-sm text-gray-500">{book.alt_judul}</div>}
                      </div>
                    </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">Author: {book.author}</div>
                        <div className="text-sm text-gray-500">Artist: {book.artist}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(book.status || "")}>{book.status || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{book.type || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {book.genres?.slice(0, 2).map((genre) => (
                          <Badge key={genre.id} variant="secondary" className="text-xs">
                            {genre.nama}
                          </Badge>
                        ))}
                        {book.genres?.length > 2 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-xs">
                                  +{book.genres.length - 2}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="flex flex-wrap gap-1">
                                  {book.genres.slice(2).map((genre) => (
                                    <Badge key={genre.id} variant="secondary">
                                      {genre.nama}
                                    </Badge>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewChapters(book)}
                        className="flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        {book.chapters?.length || 0}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => onEdit(book)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Book</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteId(book.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Book</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBooks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No books found" : "No books available"}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this book? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId)
                  setDeleteId(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
