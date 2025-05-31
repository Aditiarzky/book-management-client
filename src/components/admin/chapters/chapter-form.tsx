import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { IChapter, IChapterCreateInput, IChapterUpdateInput, IBook } from "../../../types/core.types";
import useUpFile from "@/store/useUploadFileStore";
import TiptapEditor from "@/components/RichTextEditor";

interface ChapterFormProps {
  chapter?: IChapter | null;
  book: IBook | null;
  onSubmit: (data: IChapterCreateInput | IChapterUpdateInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface ImageItem {
  id: number;
  url: string;
  progress?: number;
  isUploading?: boolean;
}

interface DraggableImageProps {
  image: ImageItem;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  removeImage: (index: number) => void;
}

const ItemTypes = {
  IMAGE: "image",
};

const DraggableImage: React.FC<DraggableImageProps> = ({ image, index, moveImage, removeImage }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.IMAGE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !image.isUploading,
  });

  const [, drop] = useDrop({
    accept: ItemTypes.IMAGE,
    hover: (item: { index: number }) => {
      if (item.index !== index && !image.isUploading) {
        moveImage(item.index, index);
        item.index = index;
      }
    },
  });

  if (!image.isUploading) {
    drag(drop(ref));
  }

  return (
    <div ref={ref} className={`relative w-24 h-24 group ${isDragging ? "opacity-50" : "opacity-100"}`}>
      <img
        src={image.url || "/placeholder.svg"}
        alt={`Page ${index + 1}`}
        className="w-24 h-24 object-cover rounded border transition-transform duration-200 hover:scale-105"
        onError={(e) => {
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
      {image.progress !== undefined && image.progress < 100 && (
        <div className="absolute bottom-0 w-full">
          <Progress value={image.progress} className="h-1" />
        </div>
      )}
      {!image.isUploading && (
        <button
          onClick={() => removeImage(index)}
          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export default function ChapterForm({ chapter, book, onSubmit, onCancel, loading }: ChapterFormProps) {
  const [formData, setFormData] = useState({
    bookId: book?.id || 0,
    chapter: 1,
    volume: null as number | null,
    nama: "",
    thumbnail: "",
    isigambar: [] as string[],
    isitext: "",
  });
  const [thumbnailProgress, setThumbnailProgress] = useState<number | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<ImageItem[]>([]);
  const { uploadFile, uploadFileMultiple, loading: uploadLoading } = useUpFile();

  useEffect(() => {
    if (chapter) {
      let parsedImages: string[] = [];

      if (Array.isArray(chapter.isigambar)) {
        parsedImages = chapter.isigambar;
      } else if (typeof chapter.isigambar === "string") {
        try {
          const jsonParsed = JSON.parse(chapter.isigambar);
          if (Array.isArray(jsonParsed)) {
            parsedImages = jsonParsed.map((url) => String(url).trim());
          } else {
            parsedImages = chapter.isigambar.split(",").map((url) => url.trim().replace(/^"|"$/g, ""));
          }
        } catch (err) {
          parsedImages = chapter.isigambar.split(",").map((url) => url.trim().replace(/^"|"$/g, ""));
        }
      }

      setFormData({
        bookId: chapter.bookId,
        chapter: chapter.chapter,
        volume: chapter.volume,
        nama: chapter.nama || "",
        thumbnail: chapter.thumbnail || "",
        isigambar: parsedImages,
        isitext: chapter.isitext || "",
      });
    } else if (book) {
      setFormData((prev) => ({ ...prev, bookId: book.id }));
    }
  }, [chapter, book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.chapter < 0) {
      return;
    }

    // Ambil thumbnail dari isigambar jika kosong
    const thumbnail = formData.thumbnail?.trim();
    const fallbackThumbnail =
      (!thumbnail || thumbnail === "") && formData.isigambar.length > 0
        ? formData.isigambar[Math.floor(Math.random() * formData.isigambar.length)]
        : thumbnail;

    const submitData: IChapterCreateInput | IChapterUpdateInput = {
      ...formData,
      volume: formData.volume || null,
      thumbnail: fallbackThumbnail || null,
      isigambar: formData.isigambar.length > 0 ? JSON.stringify(formData.isigambar) : undefined,
      isitext: formData.isitext || null,
    };

    onSubmit(submitData);
    console.log(submitData);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnailProgress(0);
    const url = await uploadFile(file, (progress) => {
      setThumbnailProgress(progress);
    });
    if (url) {
      setFormData((prev) => ({ ...prev, thumbnail: url }));
      setThumbnailProgress(null);
    }
  };

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newUploadingFiles: ImageItem[] = Array.from(files).map((file, index) => ({
      file: file,
      id: formData.isigambar.length + index + Date.now(),
      url: "/placeholder.svg",
      progress: 0,
      isUploading: true,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    const uploadPromises = Array.from(files).map(async (file, index) => {
      const url = await uploadFileMultiple(file, (progress) => {
        setUploadingFiles((prev) =>
          prev.map((item) =>
            item.id === newUploadingFiles[index].id ? { ...item, progress } : item
          )
        );
      });
      return { index, url };
    });

    const uploadedResults = await Promise.all(uploadPromises);

    // Urutkan berdasarkan urutan input file (index)
    const sortedUrls = uploadedResults
      .filter((res) => res.url)
      .sort((a, b) => a.index - b.index)
      .map((res) => res.url!);

    setFormData((prev) => ({
      ...prev,
      isigambar: [...prev.isigambar, ...sortedUrls],
    }));

    // Bersihkan uploaded files
    setUploadingFiles((prev) =>
      prev.filter((item) => !newUploadingFiles.some((newItem) => newItem.id === item.id))
    );

    setUploadingFiles((prev) => prev.filter((item) => !newUploadingFiles.some((newItem) => newItem.id === item.id)));
  };

  const imageUrls = [
    ...formData.isigambar.map((url, index) => ({
      id: index,
      url: url.replace(/^"|"$/g, ""),
      progress: undefined,
      isUploading: false,
    })),
    ...uploadingFiles,
  ];

  const moveImage = (dragIndex: number, hoverIndex: number) => {
    const newImages = [...formData.isigambar];
    const [reorderedImage] = newImages.splice(dragIndex, 1);
    newImages.splice(hoverIndex, 0, reorderedImage);
    setFormData((prev) => ({
      ...prev,
      isigambar: newImages,
    }));
  };

  const removeImage = (index: number) => {
    if (imageUrls[index].isUploading) {
      setUploadingFiles((prev) => prev.filter((_, i) => i !== index - formData.isigambar.length));
    } else {
      const newImages = [...formData.isigambar];
      newImages.splice(index, 1);
      setFormData((prev) => ({
        ...prev,
        isigambar: newImages,
      }));
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value
      .split(",")
      .map((url) => url.trim().replace(/^"|"$/g, ""))
      .filter((url) => url);
    setFormData((prev) => ({
      ...prev,
      isigambar: urls,
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className="w-5xl mx-auto">
        <CardHeader>
          <CardTitle>
            {chapter ? "Edit Chapter" : "Add New Chapter"}
            {book && <div className="text-sm font-normal text-gray-600 mt-1">Book: {book.judul}</div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chapter">Chapter Number *</Label>
                <Input
                  id="chapter"
                  type="number"
                  min="0"
                  value={formData.chapter}
                  onChange={(e) => setFormData((prev) => ({ ...prev, chapter: Number.parseInt(e.target.value) || 0 }))}
                  required
                  className={formData.chapter >= 0 ? "" : "border-red-500"}
                />
                {formData.chapter < 0 && <p className="text-xs text-red-500">Chapter number is required</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <Input
                  id="volume"
                  type="number"
                  min="1"
                  value={formData.volume || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, volume: e.target.value ? Number.parseInt(e.target.value) : null }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama">Chapter Name</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail-upload">Thumbnail</Label>
              <div className="flex items-center flex-col gap-2">
                <Input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  disabled={uploadLoading}
                  className="cursor-pointer"
                />
                {uploadLoading && thumbnailProgress !== null && (
                  <Progress value={thumbnailProgress} className="w-full h-2" />
                )}
              </div>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) => setFormData((prev) => ({ ...prev, thumbnail: e.target.value }))}
                placeholder="Or enter thumbnail URL manually"
              />
              {formData.thumbnail && (
                <div className="mt-2">
                  <img
                    src={formData.thumbnail || "/placeholder.svg"}
                    alt="Thumbnail Preview"
                    className="w-32 h-20 object-cover rounded border transition-transform duration-200 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
            </div>

            <Tabs defaultValue="images" className="w-full p-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="images">Image Content</TabsTrigger>
                <TabsTrigger value="text">Text Content</TabsTrigger>
              </TabsList>

              <TabsContent value="images" className="space-y-2">
                <Label htmlFor="images-upload">Upload Images</Label>
                <Input
                  id="images-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  disabled={uploadLoading}
                  className="cursor-pointer"
                />
                <Label htmlFor="isigambar">Image URLs (comma-separated for multiple images)</Label>
                <Textarea
                  id="isigambar"
                  value={formData.isigambar.join(",")}
                  onChange={handleTextareaChange}
                  rows={6}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  className="resize-none"
                />
                <div className="text-sm text-gray-500">
                  Upload images or enter URLs manually. Drag images to reorder (after upload), or click the trash icon to remove.
                </div>
                {imageUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {imageUrls.map((image, index) => (
                      <DraggableImage
                        key={image.id}
                        image={image}
                        index={index}
                        moveImage={moveImage}
                        removeImage={removeImage}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="space-y-2">
                <Label htmlFor="isitext">Text Content</Label>
                <TiptapEditor
                  content={formData.isitext}
                  onChange={(html) => setFormData((prev) => ({ ...prev, isitext: html }))}
                />
                <div className="text-sm text-gray-500">For novels or text-based chapters with rich text and images</div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || uploadLoading || formData.chapter < 0}>
                {loading || uploadLoading ? "Saving..." : chapter ? "Update" : "Add"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DndProvider>
  );
}