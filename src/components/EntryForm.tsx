
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Link, Loader2, MessageCircle, Upload, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChatInterface } from "./chat/ChatInterface";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EntryFormProps {
  onSubmit: (content: string, isUrl?: boolean, metadata?: EntryMetadata) => Promise<void>;
}

interface EntryMetadata {
  priority?: 'high' | 'medium' | 'low';
  attachments?: File[];
  customSubcategory?: string;
}

interface FilePreview {
  file: File;
  preview: string;
}

export const EntryForm = ({ onSubmit }: EntryFormProps) => {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "url">("text");
  const [showChat, setShowChat] = useState(false);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [attachments, setAttachments] = useState<FilePreview[]>([]);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type. Please upload images (JPEG, PNG, GIF) or PDFs.`,
          variant: "destructive",
        });
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 5MB size limit.`,
          variant: "destructive",
        });
      }
      
      return isValidType && isValidSize;
    });

    // Create previews for valid files
    const newPreviews = await Promise.all(
      validFiles.map(async (file) => {
        if (file.type === 'application/pdf') {
          return {
            file,
            preview: URL.createObjectURL(file)
          };
        }
        return {
          file,
          preview: URL.createObjectURL(file)
        };
      })
    );

    setAttachments(prev => [...prev, ...newPreviews]);
  }, [toast]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].preview);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeContent = activeTab === "text" ? content : url;
    if (!activeContent.trim()) return;

    setLoading(true);
    try {
      await onSubmit(activeContent, activeTab === "url", {
        priority,
        attachments: attachments.map(a => a.file),
        customSubcategory: customSubcategory.trim() || undefined
      });
      
      if (activeTab === "text") {
        setContent("");
      } else {
        setUrl("");
      }
      setAttachments([]);
      setCustomSubcategory("");
      setPriority('medium');
    } finally {
      setLoading(false);
    }
  };

  if (showChat) {
    return (
      <ChatInterface 
        onClose={() => setShowChat(false)} 
        onSaveEntry={async (chatContent) => {
          setLoading(true);
          try {
            await onSubmit(chatContent);
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
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your entry here..."
            className="min-h-[250px] text-base resize-none bg-black/20 border-white/10 text-white/90 placeholder:text-white/40 focus-visible:ring-primary/30"
            style={{ whiteSpace: 'pre-wrap' }}
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
      </Tabs>

      <div className="grid gap-6">
        <div className="grid gap-4">
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Custom Subcategory (Optional)</Label>
            <Input
              value={customSubcategory}
              onChange={(e) => setCustomSubcategory(e.target.value)}
              placeholder="Enter a custom subcategory..."
              className="bg-black/20 border-white/10 text-white/90 placeholder:text-white/40"
            />
          </div>

          <div>
            <Label>Attachments</Label>
            <div className="mt-2">
              <Input
                type="file"
                onChange={handleFileChange}
                multiple
                accept="image/jpeg,image/png,image/gif,application/pdf"
                className="bg-black/20 border-white/10 text-white/90"
              />
              <p className="text-sm text-white/60 mt-1">
                Supported formats: JPEG, PNG, GIF, PDF (max 5MB each)
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {attachments.map((attachment, index) => (
                  <div key={index} className="relative group">
                    {attachment.file.type === 'application/pdf' ? (
                      <div className="bg-black/20 p-4 rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white/60" />
                      </div>
                    ) : (
                      <img
                        src={attachment.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
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
