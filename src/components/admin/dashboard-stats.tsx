
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Tags, TrendingUp } from "lucide-react"
import useBookStore from "@/store/useBookStore"
import useChapterStore from "@/store/useChapterStore"
import useGenreStore from "@/store/useGenreStore"

export default function DashboardStats() {
  const { books } = useBookStore()
  const { chapters } = useChapterStore()
  const { genres } = useGenreStore()

  const stats = [
    {
      title: "Total Books",
      value: books.length,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Chapters",
      value: chapters.length,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Genres",
      value: genres.length,
      icon: Tags,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Avg. Chapters/Book",
      value: books.length > 0 ? Math.round(chapters.length / books.length) : 0,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title} className="transition-transform duration-200 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
