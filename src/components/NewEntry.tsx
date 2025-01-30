import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { PrivacyNotice } from "./PrivacyNotice";
import { Squares } from "@/components/ui/squares-background";

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
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 -z-10">
        <Squares 
          direction="diagonal"
          speed={0.5}
          squareSize={40}
          borderColor="#333" 
          hoverFillColor="#222"
        />
      </div>
      <div className="w-full max-w-2xl space-y-6 z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Share your thoughts
          </h1>
          <p className="text-gray-400">
            I'll help organize and analyze them
          </p>
        </div>

        <div className="rounded-xl border bg-black/50 backdrop-blur-xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your entry here... I'll help categorize and analyze it"
              className="min-h-[200px] text-base resize-none bg-black/50 border-gray-800 text-white placeholder:text-gray-500"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Your entry will be processed with AI to help organize your thoughts
              </p>
              <Button 
                type="submit" 
                disabled={loading || !content.trim()}
                className="relative overflow-hidden bg-white/10 hover:bg-white/20 text-white"
              >
                {loading ? "Processing..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8">
          <PrivacyNotice />
        </div>
      </div>
    </div>
  );
};