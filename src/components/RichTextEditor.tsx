
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Card } from './ui/card';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder = "Write your entry here..." }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert min-h-[200px] w-full focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <Card className="neo-blur border-primary/20 overflow-hidden">
      <div className="p-4">
        <EditorContent 
          editor={editor} 
          className="min-h-[200px] text-base text-white/90"
        />
      </div>
    </Card>
  );
};
