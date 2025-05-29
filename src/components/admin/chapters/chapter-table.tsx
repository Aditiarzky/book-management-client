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
import { Edit, Trash2, Plus, Search, ArrowLeft } from "lucide-react"
import type { IChapter, IBook } from "../../../types/core.types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Link } from "@tanstack/react-router"
import { VIEW_PAGE } from "@/routes/constants"

interface ChaptersTableProps {
  chapters: IChapter[]
  book: IBook | null
  loading: boolean
  onAdd: () => void
  onEdit: (chapter: IChapter) => void
  onDelete: (id: number) => void
  onBack: () => void
}

export default function ChaptersTable({
  chapters,
  book,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onBack,
}: ChaptersTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filteredChapters = chapters.filter(
    (chapter) =>
      chapter.nama.toLowerCase().includes(searchTerm.toLowerCase()) || chapter.chapter.toString().includes(searchTerm),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle>Manage Chapters</CardTitle>
            </div>
            {book && (
              <div className="text-sm text-gray-600">
                Book: <span className="font-medium">{book.judul}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button onClick={onAdd} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Chapter
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
                  <TableHead className="w-20">Chapter</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Thumbnail</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChapters.map((chapter) => (
                  <TableRow key={chapter.id} className="transition-colors">
                    <TableCell>
                    <Link to={VIEW_PAGE} params={{id:chapter.id.toString(), bookId:chapter.bookId.toString()}}>
                      <Badge variant="outline">Ch. {chapter.chapter}</Badge>
                    </Link>
                    </TableCell>
                    <TableCell>
                    <Link to={VIEW_PAGE} params={{id:chapter.id.toString(), bookId:chapter.bookId.toString()}}>
                      {chapter.volume ? (
                        <Badge variant="secondary">Vol. {chapter.volume}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </Link>
                    </TableCell>
                    <TableCell>
                    <Link to={VIEW_PAGE} params={{id:chapter.id.toString(), bookId:chapter.bookId.toString()}}>
                      <div className="font-medium">{chapter.nama}</div>
                    </Link>
                    </TableCell>
                    <TableCell>
                    <Link to={VIEW_PAGE} params={{id:chapter.id.toString(), bookId:chapter.bookId.toString()}}>
                      {chapter.thumbnail ? (
                        <img
                          src={chapter.thumbnail || "/placeholder.svg"}
                          alt="Thumbnail"
                          className="w-12 h-8 object-cover rounded transition-transform duration-200 hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg?height=32&width=48"
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">No thumbnail</span>
                      )}
                    </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {chapter.isigambar && (
                          <Badge variant="outline" className="text-xs">
                            Images
                          </Badge>
                        )}
                        {chapter.isitext && (
                          <Badge variant="outline" className="text-xs">
                            Text
                          </Badge>
                        )}
                        {!chapter.isigambar && !chapter.isitext && (
                          <span className="text-gray-400 text-xs">No content</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{new Date(chapter.created_at).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => onEdit(chapter)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Chapter</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteId(chapter.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Chapter</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredChapters.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No chapters found" : "No chapters available"}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chapter? This action cannot be undone.
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