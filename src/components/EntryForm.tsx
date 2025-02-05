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
        className="min-h-[200px] text-base resize-none bg-white/50 dark:bg-black/20"
      />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center sm:text-left">
          Your entry will be processed with AI
        </p>
        <Button 
          type="submit" 
          disabled={loading || !content.trim()}
          className="w-full sm:w-auto"
        >
          {loading ? "Processing..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
};