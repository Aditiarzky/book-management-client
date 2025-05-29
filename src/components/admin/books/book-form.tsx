import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { IBook, IBookCreateInput, IBookUpdateInput } from "../../../types/core.types"
import useGenreStore from "@/store/useGenreStore"
import useUpFile from "@/store/useUploadFileStore"
import { Progress } from "@/components/ui/progress"

interface BookFormProps {
  book?: IBook | null
  onSubmit: (data: IBookCreateInput | IBookUpdateInput) => void
  onCancel: () => void
  loading?: boolean
}

export default function BookForm({ book, onSubmit, onCancel, loading }: BookFormProps) {
  const { genres, fetchGenres } = useGenreStore();
  const { uploadFile, loading: uploadLoading } = useUpFile();
  const [formData, setFormData] = useState({
    judul: "",
    alt_judul: "",
    cover: "",
    author: "",
    artist: "",
    synopsis: "",
    status: "",
    type: "",
    genreIds: [] as number[],
  });
  const [coverProgress, setCoverProgress] = useState<number | null>(null);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  useEffect(() => {
    if (book) {
      setFormData({
        judul: book.judul || "",
        alt_judul: book.alt_judul || "",
        cover: book.cover || "",
        author: book.author || "",
        artist: book.artist || "",
        synopsis: book.synopsis || "",
        status: book.status || "",
        type: book.type || "",
        genreIds: book.genres?.map((g) => g.id!).filter(Boolean) || [],
      });
    } else {
      // Reset form when no book is provided (for adding new book)
      setFormData({
        judul: "",
        alt_judul: "",
        cover: "",
        author: "",
        artist: "",
        synopsis: "",
        status: "",
        type: "",
        genreIds: [],
      });
    }
  }, [book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.author || !formData.artist || !formData.cover) {
      return;
    }
    onSubmit(formData);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCoverProgress(0);
    const url = await uploadFile(file, (progress) => {
      setCoverProgress(progress);
    });
    if (url) {
      setFormData((prev) => ({ ...prev, cover: url }));
      setCoverProgress(null);
    }
  };

  const handleGenreToggle = (genreId: number) => {
    setFormData((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }));
  };

  return (
    <Card className="w-5xl mx-auto">
      <CardHeader>
        <CardTitle>{book ? "Edit Book" : "Add New Book"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="judul">Title *</Label>
              <Input
                id="judul"
                value={formData.judul}
                onChange={(e) => setFormData((prev) => ({ ...prev, judul: e.target.value }))}
                required
                className={formData.judul ? "" : "border-red-500"}
              />
              {!formData.judul && <p className="text-xs text-red-500">Title is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt_judul">Alternative Title</Label>
              <Input
                id="alt_judul"
                value={formData.alt_judul}
                onChange={(e) => setFormData((prev) => ({ ...prev, alt_judul: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="cover-upload" className="">Cover Image *</Label>
              <div className="flex items-center flex-col gap-2">
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadLoading}
                  className="cursor-pointer"
                />
                {uploadLoading && coverProgress !== null && (
                  <Progress value={coverProgress} className="w-full h-2 bg-gray-200" />
                )}
              </div>
              <Input
                id="cover"
                value={formData.cover}
                onChange={(e) => setFormData((prev) => ({ ...prev, cover: e.target.value }))}
                placeholder="Or enter cover URL manually"
                required
                className={`bg-white border-gray-300 ${formData.cover ? "" : "border-red-500"}`}
              />
              {!formData.cover && <p className="text-xs text-red-500">Cover image is required</p>}
              {formData.cover && (
                <div className="mt-2">
                  <img
                    src={formData.cover || "/placeholder.svg"}
                    alt="Cover Preview"
                    className="w-32 h-48 object-cover rounded border border-gray-300 transition-transform duration-200 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=192&width=128";
                    }}
                  />
                </div>
              )}
            </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                required
                className={formData.author ? "" : "border-red-500"}
              />
              {!formData.author && <p className="text-xs text-red-500">Author is required</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist">Artist *</Label>
              <Input
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData((prev) => ({ ...prev, artist: e.target.value }))}
                required
                className={formData.artist ? "" : "border-red-500"}
              />
              {!formData.artist && <p className="text-xs text-red-500">Artist is required</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="synopsis">Synopsis</Label>
            <Textarea
              id="synopsis"
              value={formData.synopsis}
              onChange={(e) => setFormData((prev) => ({ ...prev, synopsis: e.target.value }))}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status ? formData.status : book?.status||''}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="ongoing" value="ongoing">Ongoing</SelectItem>
                  <SelectItem key="completed" value="completed">Completed</SelectItem>
                  <SelectItem key="hiatus" value="hiatus">Hiatus</SelectItem>
                  <SelectItem key="dropped" value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type ? formData.type : book?.type||''}
                defaultValue={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manga">Manga</SelectItem>
                  <SelectItem value="Web Manga">Web Manga</SelectItem>
                  <SelectItem value="Light Novel">Light Novel</SelectItem>
                  <SelectItem value="Novel">Novel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Genres</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded p-3">
              {genres.map((genre) => (
                <div key={genre.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre.id}`}
                    checked={formData.genreIds.includes(genre.id!)}
                    onCheckedChange={() => handleGenreToggle(genre.id!)}
                  />
                  <Label htmlFor={`genre-${genre.id}`} className="text-sm cursor-pointer hover:text-blue-600">
                    {genre.nama}
                  </Label>
                </div>
              ))}
            </div>
            {formData.genreIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.genreIds.map((genreId) => {
                  const genre = genres.find((g) => g.id === genreId)
                  return genre ? (
                    <Badge key={genreId} variant="secondary" className="hover:bg-blue-100 transition-colors">
                      {genre.nama}
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.judul || !formData.author || !formData.artist || !formData.cover}
            >
              {loading ? "Saving..." : book ? "Update" : "Add"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}