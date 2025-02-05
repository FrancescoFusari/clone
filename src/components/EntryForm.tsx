import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EntryFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export const EntryForm = ({ onSubmit }: EntryFormProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onSubmit(content);
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your entry here... I'll help categorize and analyze it"
        className="min-h-[200px] text-base resize-none bg-black/20 border-white/10 text-white/90 placeholder:text-white/60"
      />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-white/60 text-center sm:text-left">
          Your entry will be processed with AI
        </p>
        <Button 
          type="submit" 
          disabled={loading || !content.trim()}
          className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white/90"
        >
          {loading ? "Processing..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
};