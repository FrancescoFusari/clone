import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { PrivacyNotice } from "./PrivacyNotice";

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
      // Process the entry with AI
      const processedData = await processEntry(content);
      console.log("Processed data:", processedData);

      // Save entry with AI-generated metadata and formatted content
      const { error } = await supabase.from("entries").insert({
        content: processedData.content, // Use the formatted content
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
    <div className="container max-w-2xl py-8">
      <PrivacyNotice />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your entry here..."
          className="min-h-[200px]"
        />
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? "Processing and Saving..." : "Save Entry"}
        </Button>
      </form>
    </div>
  );
};