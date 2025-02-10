
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image, Link, Loader2, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatInterface } from "./chat/ChatInterface";
import { RichTextEditor } from "./RichTextEditor";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setShowChat(true)}
          className="bg-primary/20 hover:bg-primary/30 text-primary"
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
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger 
            value="text" 
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <FileText className="h-4 w-4" />
            Text Entry
          </TabsTrigger>
          <TabsTrigger 
            value="url" 
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Link className="h-4 w-4" />
            URL Analysis
          </TabsTrigger>
          <TabsTrigger 
            value="image" 
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Image className="h-4 w-4" />
            Image Upload
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="mt-6">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Write your entry here..."
          />
        </TabsContent>
        
        <TabsContent value="url" className="mt-6">
          <Card className="neo-blur border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Enter a URL to analyze its content and save key information.
                </p>
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-black/20 border-white/10 text-white/90 placeholder:text-white/40 focus-visible:ring-primary/30"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <Card className="neo-blur border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Upload an image to analyze its content and extract insights.
                </p>
                <div className="flex flex-col items-center p-6 border-2 border-dashed border-white/10 rounded-lg bg-black/20">
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
                    <Image className="w-8 h-8 text-white/60" />
                    <span className="text-sm text-white/60">
                      {image ? image.name : "Click to upload an image"}
                    </span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/60 text-center sm:text-left">
          Your {activeTab === "text" ? "entry" : activeTab === "url" ? "URL" : "image"} will be processed with AI to extract insights
        </p>
        <Button 
          type="submit" 
          disabled={loading || (
            activeTab === "text" ? !content.trim() : 
            activeTab === "url" ? !url.trim() : 
            !image
          )}
          className="w-full sm:w-auto bg-primary/20 hover:bg-primary/30 text-primary disabled:bg-white/5 disabled:text-white/40"
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
