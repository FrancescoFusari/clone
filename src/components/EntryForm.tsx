
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Image, Link, Loader2, MessageCircle, Bold, Italic, List, ListOrdered, Quote, Undo, Redo } from "lucide-react";
import { ChatInterface } from "./chat/ChatInterface";
import { cn } from "@/lib/utils";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

interface EntryFormProps {
  onSubmit: (content: string | File, type: "text" | "url" | "image") => Promise<void>;
}

export const EntryForm = ({ onSubmit }: EntryFormProps) => {
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<"text" | "url" | "image">("text");
  const [showChat, setShowChat] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Write your entry here...',
      }),
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let submitContent: string | File;
    
    switch (activeInput) {
      case "text":
        if (!editor?.getHTML()) return;
        submitContent = editor.getHTML();
        break;
      case "url":
        submitContent = url;
        break;
      case "image":
        if (!image) return;
        submitContent = image;
        break;
      default:
        return;
    }

    if ((typeof submitContent === "string" && !submitContent.trim()) || 
        (activeInput === "image" && !image)) return;

    setLoading(true);
    try {
      await onSubmit(submitContent, activeInput);
      if (activeInput === "text") {
        editor?.commands.clearContent();
      } else if (activeInput === "url") {
        setUrl("");
      } else {
        setImage(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  if (showChat) {
    return (
      <ChatInterface 
        onClose={() => setShowChat(false)} 
        onSaveEntry={async (chatContent) => {
          setLoading(true);
          try {
            await onSubmit(chatContent, "text");
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  const inputTypes = [
    {
      id: "text" as const,
      icon: FileText,
      title: "Text Entry",
      description: "Write your thoughts, notes, or any text content",
    },
    {
      id: "url" as const,
      icon: Link,
      title: "URL Analysis",
      description: "Analyze and extract content from any webpage",
    },
    {
      id: "image" as const,
      icon: Image,
      title: "Image Upload",
      description: "Upload and analyze images for insights",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setShowChat(true)}
          variant="outline"
          className="bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-100 border-zinc-700/50"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Switch to Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {inputTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setActiveInput(type.id)}
            className={cn(
              "p-4 text-left rounded-xl border transition-all duration-200",
              "hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]",
              activeInput === type.id
                ? "bg-primary/10 border-primary/20 shadow-lg shadow-primary/5"
                : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-700/50"
            )}
          >
            <type.icon className={cn(
              "w-6 h-6 mb-2",
              activeInput === type.id ? "text-primary" : "text-zinc-400"
            )} />
            <h3 className={cn(
              "font-medium mb-1 text-sm",
              activeInput === type.id ? "text-primary" : "text-zinc-100"
            )}>
              {type.title}
            </h3>
            <p className="text-xs text-zinc-400">
              {type.description}
            </p>
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        {activeInput === "text" && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 p-2 bg-zinc-800/50 border border-zinc-700/50 rounded-t-xl">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={cn("p-2 h-8 w-8", 
                  editor?.isActive('bold') ? 'bg-zinc-700/50' : ''
                )}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={cn("p-2 h-8 w-8",
                  editor?.isActive('italic') ? 'bg-zinc-700/50' : ''
                )}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={cn("p-2 h-8 w-8",
                  editor?.isActive('bulletList') ? 'bg-zinc-700/50' : ''
                )}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={cn("p-2 h-8 w-8",
                  editor?.isActive('orderedList') ? 'bg-zinc-700/50' : ''
                )}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={cn("p-2 h-8 w-8",
                  editor?.isActive('blockquote') ? 'bg-zinc-700/50' : ''
                )}
              >
                <Quote className="h-4 w-4" />
              </Button>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().undo().run()}
                  className="p-2 h-8 w-8"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().redo().run()}
                  className="p-2 h-8 w-8"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <EditorContent 
              editor={editor}
              className="min-h-[300px] p-4 bg-zinc-900/50 border border-zinc-700/50 rounded-b-xl text-zinc-100 focus-within:border-zinc-600 transition-colors prose prose-invert max-w-none prose-sm"
            />
          </div>
        )}
        
        {activeInput === "url" && (
          <div className="space-y-2 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
            <p className="text-sm text-zinc-400">
              Enter a URL to analyze its content and save key information.
            </p>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="bg-zinc-900/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700/50"
            />
          </div>
        )}

        {activeInput === "image" && (
          <div className="space-y-2 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50">
            <p className="text-sm text-zinc-400">
              Upload an image to analyze its content and extract insights.
            </p>
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-zinc-700/50 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Image className="w-10 h-10 text-zinc-500" />
                <span className="text-sm text-zinc-400">
                  {image ? image.name : "Click to upload an image"}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <p className="text-sm text-zinc-400 text-center sm:text-left">
          Your {activeInput === "text" ? "entry" : activeInput === "url" ? "URL" : "image"} will be processed with AI to extract insights
        </p>
        <Button 
          type="submit" 
          disabled={loading || (
            activeInput === "text" ? !editor?.getHTML() : 
            activeInput === "url" ? !url.trim() : 
            !image
          )}
          className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:bg-zinc-900/50 disabled:text-zinc-500"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Save Entry'
          )}
        </Button>
      </div>
    </form>
  );
};
