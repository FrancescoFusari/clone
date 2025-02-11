import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image, Link, Loader2, MessageCircle } from "lucide-react";
import { ChatInterface } from "./chat/ChatInterface";

interface EntryFormProps {
  onSubmit: (content: string | File, type: "text" | "url" | "image") => Promise<void>;
}

export const EntryForm = ({ onSubmit }: EntryFormProps) => {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "url" | "image">("text");
  const [showChat, setShowChat] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let submitContent: string | File;
    
    switch (activeTab) {
      case "text":
        submitContent = content;
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
        (activeTab === "image" && !image)) return;

    setLoading(true);
    try {
      await onSubmit(submitContent, activeTab);
      if (activeTab === "text") {
        setContent("");
      } else if (activeTab === "url") {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as "text" | "url" | "image")} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-1">
          <TabsTrigger 
            value="text" 
            className="data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 rounded-lg py-3"
          >
            <FileText className="h-4 w-4 mr-2" />
            Text Entry
          </TabsTrigger>
          <TabsTrigger 
            value="url" 
            className="data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 rounded-lg py-3"
          >
            <Link className="h-4 w-4 mr-2" />
            URL Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="image" 
            className="data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 rounded-lg py-3"
          >
            <Image className="h-4 w-4 mr-2" />
            Image Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="mt-8">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your entry here..."
            className="min-h-[300px] text-base resize-none bg-zinc-900/50 border-zinc-700/50 rounded-xl text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700/50"
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </TabsContent>
        
        <TabsContent value="url" className="mt-8">
          <div className="space-y-4 bg-zinc-900/30 p-6 rounded-xl border border-zinc-800/50">
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
        </TabsContent>

        <TabsContent value="image" className="mt-8">
          <div className="space-y-4 bg-zinc-900/30 p-6 rounded-xl border border-zinc-800/50">
            <p className="text-sm text-zinc-400">
              Upload an image to analyze its content and extract insights.
            </p>
            <div className="flex flex-col items-center p-8 border-2 border-dashed border-zinc-700/50 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Image className="w-12 h-12 text-zinc-500" />
                <span className="text-sm text-zinc-400">
                  {image ? image.name : "Click to upload an image"}
                </span>
              </label>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <p className="text-sm text-zinc-400 text-center sm:text-left">
          Your {activeTab === "text" ? "entry" : activeTab === "url" ? "URL" : "image"} will be processed with AI to extract insights
        </p>
        <Button 
          type="submit" 
          disabled={loading || (
            activeTab === "text" ? !content.trim() : 
            activeTab === "url" ? !url.trim() : 
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
