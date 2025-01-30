import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { PrivacyNotice } from "./PrivacyNotice";
import { BackgroundCircles } from "./ui/background-circles";

export const NewEntry = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const processEntry = async (content: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('process-entry', {
        body: { content }
      });

      if (error) throw error;
      console.log("Processed data:", data);
      return data;
    } catch (error) {
      console.error("Error processing entry:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session?.user.id) return;

    setLoading(true);
    try {
      const processedData = await processEntry(content);
      console.log("Processed data:", processedData);

      const { error } = await supabase.from("entries").insert({
        content: processedData.content,
        user_id: session.user.id,
        category: processedData.category,
        subcategory: processedData.subcategory,
        summary: processedData.summary,
        tags: processedData.tags,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Entry saved successfully!",
      });
      navigate("/");
    } catch (error) {
      console.error("Error saving entry:", error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <BackgroundCircles 
        className="absolute inset-0"
      />
      
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 relative z-10">
        <div className="rounded-xl border bg-white/80 dark:bg-black/50 backdrop-blur-lg p-4 sm:p-6 shadow-lg">
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
        </div>

        <div className="mt-4">
          <PrivacyNotice />
        </div>
      </div>
    </div>
  );
};