
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as "text" | "url")} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
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
          <Card className="neo-blur border-primary/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm text-white/70">
                  Write or paste your text below. Our AI will help categorize and analyze it.
                </p>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your entry here..."
                  className="min-h-[250px] text-base resize-none bg-black/20 border-white/10 text-white/90 placeholder:text-white/40 focus-visible:ring-primary/30"
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </div>
            </CardContent>
          </Card>
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
      </Tabs>
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/60 text-center sm:text-left">
          Your {activeTab === "text" ? "entry" : "URL"} will be processed with AI to extract insights
        </p>
        <Button 
          type="submit" 
          disabled={loading || !(activeTab === "text" ? content.trim() : url.trim())}
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
