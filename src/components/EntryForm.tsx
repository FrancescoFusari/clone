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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "text" | "url")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 neo-blur">
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
        </TabsList>
        <TabsContent value="text" className="mt-6">
          <div className="space-y-3">
            <p className="text-sm text-white/70 leading-relaxed">
              Write or paste your text below. Our AI will help categorize and analyze it.
            </p>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your entry here..."
              className="min-h-[200px] text-base resize-none neo-blur text-white/90 placeholder:text-white/40 focus-visible:ring-primary/30"
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>
        </TabsContent>
        <TabsContent value="url" className="mt-6">
          <div className="space-y-3">
            <p className="text-sm text-white/70 leading-relaxed">
              Enter a URL to analyze its content and save key information.
            </p>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="neo-blur text-white/90 placeholder:text-white/40 focus-visible:ring-primary/30"
            />
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-sm text-white/60 text-center sm:text-left">
          Your {activeTab === "text" ? "entry" : "URL"} will be processed with AI to extract insights
        </p>
        <Button 
          type="submit" 
          disabled={loading || !(activeTab === "text" ? content.trim() : url.trim())}
          className="w-full sm:w-auto glass-morphism text-primary disabled:bg-white/5 disabled:text-white/40"
        >
          {loading ? "Processing..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
};