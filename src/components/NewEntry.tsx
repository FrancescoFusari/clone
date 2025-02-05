import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { EntryForm } from "@/components/EntryForm";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";

const NewEntry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const handleSubmit = async (content: string, isUrl?: boolean) => {
    try {
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to create an entry",
        });
        return;
      }

      console.log("Processing entry with content:", content.substring(0, 100) + "...");

      if (isUrl) {
        console.log("Processing URL content");
        const { data, error } = await supabase.functions.invoke('analyze-url', {
          body: { url: content }
        });

        if (error) {
          console.error("Error processing URL:", error);
          throw error;
        }

        console.log("URL processed successfully:", data);
        
        // Invalidate queries and navigate to index
        await queryClient.invalidateQueries({ queryKey: ['entries'] });
        await queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
        
        toast({
          title: "URL processed successfully",
          description: "Your entry has been created",
        });
        navigate('/');
        return;
      }

      console.log("Processing text content");
      const { data, error } = await supabase.functions.invoke('process-entry', {
        body: { 
          content,
          user_id: session.user.id
        }
      });

      if (error) {
        console.error("Error processing entry:", error);
        throw error;
      }

      console.log("Entry processed successfully:", data);

      // Invalidate queries and navigate to index
      await queryClient.invalidateQueries({ queryKey: ['entries'] });
      await queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
      
      toast({
        title: "Entry created successfully",
        description: "Your entry has been processed and saved",
      });
      navigate('/');

    } catch (error) {
      console.error('Error creating entry:', error);
      toast({
        variant: "destructive",
        title: "Error creating entry",
        description: "There was a problem creating your entry. Please try again.",
      });
    }
  };

  return (
    <CenteredLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">
            Create New Entry
          </h1>
          <p className="text-lg text-white/80">
            Share your thoughts, ideas, or paste a URL. Our AI will help analyze and organize your content, making it easier to find and reference later.
          </p>
        </div>
        <EntryForm onSubmit={handleSubmit} />
      </div>
    </CenteredLayout>
  );
};

export default NewEntry;