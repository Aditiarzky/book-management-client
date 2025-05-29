import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { IGenre } from "../../../types/core.types"

interface GenreFormProps {
  genre?: IGenre | null
  onSubmit: (data: Omit<IGenre, "id" | "created_at" | "updated_at">) => void
  onCancel: () => void
  loading?: boolean
}

export default function GenreForm({ genre, onSubmit, onCancel, loading }: GenreFormProps) {
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
  })

  useEffect(() => {
    if (genre) {
      setFormData({
        nama: genre.nama || "",
        deskripsi: genre.deskripsi || "",
      })
    }
  }, [genre])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nama) {
      return
    }
    onSubmit(formData)
  }

  return (
    <Card className="w-5xl mx-auto">
      <CardHeader>
        <CardTitle>{genre ? "Edit Genre" : "Add New Genre"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nama">Genre Name *</Label>
            <Input
              id="nama"
              value={formData.nama}
              onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
              required
              className={formData.nama ? "" : "border-red-500"}
            />
            {!formData.nama && <p className="text-xs text-red-500">Genre name is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Description</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => setFormData((prev) => ({ ...prev, deskripsi: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !formData.nama}>
              {loading ? "Saving..." : genre ? "Update" : "Add"}
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