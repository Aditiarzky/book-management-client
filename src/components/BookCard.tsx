import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { User, Paperclip } from "lucide-react"
import type { IBook } from "../types/core.types"

interface BookCardProps {
  book: IBook
  onClick?: () => void
}

export default function BookCard({ book, onClick }: BookCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "oneshot":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "hiatus":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }
  

  return (
    <Card
      className="group cursor-pointer border-0 drop-shadow-md transition-all py-0 duration-200 hover:shadow-lg hover:scale-[1.02] w-full mx-auto"
      onClick={onClick}
      style={{
        backgroundImage: `url(${book.cover || "/placeholder.svg?height=400&width=300"})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top',
      }}
    >
      <div className="bg-gradient-to-t from-gray-900 to-transparent rounded-lg py-3 flex flex-col justify-end group-hover:bg-black/70 transition-colors duration-200 h-64">
        <CardContent className="px-4 flex flex-col gap-2">
          <div>
            <h3 className="font-semibold text-md text-white line-clamp-2 mb-2">
              {book.judul}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-200">
              <User className="w-4 h-4" />
              <span>{book.author}</span>
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-1 mb-3">
              {book.genres?.slice(0, 3).map((genre) => (
                <Badge key={genre.id} variant="secondary" className="text-xs bg-white/20 text-white">
                  {genre.nama}
                </Badge>
              ))}
              {book.genres?.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                  +{book.genres.length - 3}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-4 items-start flex-col gap-2 pt-0 flex">
          <div className="flex items-center justify-between w-full">
            <Badge className={getStatusColor(book.status||'-')}>{book.status}</Badge>
            <div className="flex items-center gap-1 text-xs text-gray-200">
              <Paperclip className="w-3 h-3" />
              <span>Total Ch: {book.chapters.length}</span>
            </div>
          </div>
        </CardFooter>
      </div>
    </Card>
  )
}