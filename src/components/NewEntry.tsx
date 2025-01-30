import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { Loader2 } from "lucide-react";

export const NewEntry = () => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Process entry with AI
      const { data: processedData, error: aiError } = await supabase.functions.invoke('process-entry', {
        body: { content }
      });

      if (aiError) throw aiError;

      // Save to database
      const { error: dbError } = await supabase
        .from('entries')
        .insert({
          content,
          user_id: session?.user.id,
          category: processedData.category,
          subcategory: processedData.subcategory,
          tags: processedData.tags,
          summary: processedData.summary
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Entry saved successfully",
      });
      setContent("");
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: "Error",
        description: "Failed to save entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <Card className="max-w-2xl mx-auto mt-12 p-6 bg-card backdrop-blur-lg border-gray-200/20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">New Entry</h1>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[200px] resize-none"
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};