import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link } from "lucide-react";

interface EntryFormProps {
  onSubmit: (content: string, isUrl?: boolean) => Promise<void>;
}

export const EntryForm = ({ onSubmit }: EntryFormProps) => {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "url">("text");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeContent = activeTab === "text" ? content : url;
    if (!activeContent.trim()) return;

    setLoading(true);
    try {
      await onSubmit(activeContent, activeTab === "url");
      if (activeTab === "text") {
        setContent("");
      } else {
        setUrl("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "text" | "url")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 neo-blur">
          <TabsTrigger value="text" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <FileText className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Link className="h-4 w-4" />
            URL
          </TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="mt-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your entry here... I'll help categorize and analyze it"
            className="min-h-[200px] text-base resize-none neo-blur border-white/10 text-white/90 placeholder:text-white/60 whitespace-pre-wrap focus-visible:ring-primary/50"
            style={{ whiteSpace: 'pre-wrap' }}
          />
        </TabsContent>
        <TabsContent value="url" className="mt-4">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a URL to analyze..."
            className="neo-blur border-white/10 text-white/90 placeholder:text-white/60 focus-visible:ring-primary/50"
          />
        </TabsContent>
      </Tabs>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/60 text-center sm:text-left">
          Your {activeTab === "text" ? "entry" : "URL"} will be processed with AI
        </p>
        <Button 
          type="submit" 
          disabled={loading || !(activeTab === "text" ? content.trim() : url.trim())}
          className="w-full sm:w-auto bg-primary/20 hover:bg-primary/30 text-primary disabled:bg-secondary/20 disabled:text-white/40"
        >
          {loading ? "Processing..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
};