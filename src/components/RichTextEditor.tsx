import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import useUpFile from '@/store/useUploadFileStore';
import { Progress } from '@radix-ui/react-progress';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Highlighter, Image as ImageIcon } from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange?: (html: string) => void;
}

const TiptapEditor = ({ content, onChange }: TiptapEditorProps) => {
  const { uploadFile } = useUpFile();
  const [progressBar, setProgressBar] = useState(0);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content || '<p>Masukkan konten di sini...</p>',
    editorProps: {
      attributes: {
        class: 'max-w-full min-h-[200px] focus:outline-none p-4 border rounded',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const url = await uploadFile(file, (progress) => {
        setProgressBar(progress);
      });
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        toast.success('Gambar berhasil diunggah');
      } else {
        toast.error('Gagal mengunggah gambar');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengunggah');
    } finally {
      setProgressBar(0);
    }
  };

  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const setLink = () => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleLinkButtonClick = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
  };

  return (
    <Card className="p-0">
      <style>
        {`
          .tiptap-editor-content {
            min-height: 200px; /* Ensures the editor has a minimum height */
          }
          .tiptap-editor-content h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 1em 0;
            text-indent: 0; /* No indentation for headings */
          }
          .tiptap-editor-content h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 1em 0;
            text-indent: 0; /* No indentation for headings */
          }
          .tiptap-editor-content p {
            margin: 1.2em 0; /* Clear separation between paragraphs */
            min-height: 1.5em; /* Visible height for empty paragraphs */
            line-height: 1.6; /* Improved readability */
            text-indent: 2em; /* Novel-like first-line indentation */
          }
          .tiptap-editor-content p:empty {
            text-indent: 0; /* No indentation for empty paragraphs */
          }
          .tiptap-editor-content p:empty::after {
            content: '\u200B'; /* Zero-width space to force empty paragraph rendering */
          }
          .tiptap-editor-content br {
            display: block;
            content: '';
            margin-bottom: 1.2em; /* Spacing for line breaks */
          }
          .tiptap-editor-content ul,
          .tiptap-editor-content ol {
            margin: 1.2em 0;
            padding-left: 2em;
          }
          .tiptap-editor-content ul li {
            list-style-type: disc;
            margin: 0.5em 0; /* Spacing between list items */
          }
          .tiptap-editor-content ol li {
            list-style-type: decimal;
            margin: 0.5em 0; /* Spacing between list items */
          }
          .tiptap-editor-content a {
            color: #1a73e8;
            text-decoration: underline;
          }
          .tiptap-editor-content strong {
            font-weight: bold;
          }
          .tiptap-editor-content em {
            font-style: italic;
          }
          .tiptap-editor-content u {
            text-decoration: underline;
          }
          .tiptap-editor-content img {
            width: 100%;
            max-width: 100%;
            height: auto;
            margin: 0.5em 0;
          }
          .tiptap-editor-content [data-type="highlight"] {
            background-color: yellow;
          }
          .tiptap-editor-content [style*="text-align: left"] {
            text-align: left;
          }
          .tiptap-editor-content [style*="text-align: center"] {
            text-align: center;
          }
          .tiptap-editor-content [style*="text-align: right"] {
            text-align: right;
          }
          .tiptap-editor-content [style*="text-align: justify"] {
            text-align: justify;
          }
        `}
      </style>
      <CardContent className="p-0">
        {editor && (
          <div className="flex flex-wrap gap-1 p-2 border-b rounded-t">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBold().run()}
              size="sm"
              title="Bold"
              aria-label="Bold"
            >
              <Bold size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              size="sm"
              title="Italic"
              aria-label="Italic"
            >
              <Italic size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('underline') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              size="sm"
              title="Underline"
              aria-label="Underline"
            >
              <UnderlineIcon size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              size="sm"
              title="Heading 1"
              aria-label="Heading 1"
            >
              H1
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              size="sm"
              title="Heading 2"
              aria-label="Heading 2"
            >
              H2
            </Button>
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              size="sm"
              title="Bullet List"
              aria-label="Bullet List"
            >
              <List size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              size="sm"
              title="Ordered List"
              aria-label="Ordered List"
            >
              <ListOrdered size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('link') ? 'default' : 'outline'}
              onClick={handleLinkButtonClick}
              size="sm"
              title="Link"
              aria-label="Link"
            >
              <LinkIcon size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              size="sm"
              title="Align Left"
              aria-label="Align Left"
            >
              <AlignLeft size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              size="sm"
              title="Align Center"
              aria-label="Align Center"
            >
              <AlignCenter size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              size="sm"
              title="Align Right"
              aria-label="Align Right"
            >
              <AlignRight size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              size="sm"
              title="Justify"
              aria-label="Justify"
            >
              <AlignJustify size={16} />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('highlight') ? 'default' : 'outline'}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              size="sm"
              title="Highlight"
              aria-label="Highlight"
            >
              <Highlighter size={16} />
            </Button>
            <select
              className="border rounded px-2 py-1 text-sm h-8"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
              title="Text Color"
              aria-label="Text Color"
            >
              <option className='text-gray-800' value="#000000">Black</option>
              <option className='text-red-800 ' value="#ff0000">Red</option>
              <option className='text-green-800' value="#00ff00">Green</option>
              <option className='text-blue-800' value="#0000ff">Blue</option>
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={handleImageButtonClick}
              size="sm"
              title="Upload Image"
              aria-label="Upload Image"
            >
              <ImageIcon size={16} />
            </Button>
          </div>
        )}
        {showLinkInput && (
          <div className="flex gap-2 p-2 border-b">
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Masukkan URL"
              className="text-sm"
              aria-label="URL Input"
            />
            <Button size="sm" onClick={setLink} aria-label="Set Link">
              Set
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowLinkInput(false)} aria-label="Cancel Link">
              Batal
            </Button>
          </div>
        )}
        <EditorContent className="h-96 overflow-y-scroll tiptap-editor-content p-2" editor={editor} />
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
          aria-hidden="true"
        />
        {progressBar > 0 && <Progress value={progressBar} className="w-full h-2 mt-2" />}
      </CardContent>
    </Card>
  );
};

export default TiptapEditor;