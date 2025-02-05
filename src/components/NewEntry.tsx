import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { EntryForm } from "@/components/EntryForm";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const NewEntry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (content: string, isUrl?: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to create an entry",
        });
        return;
      }

      if (isUrl) {
        // Call the analyze-url function
        const { data, error } = await supabase.functions.invoke('analyze-url', {
          body: { url: content }
        });

        if (error) throw error;
        
        // Invalidate queries and navigate
        await queryClient.invalidateQueries({ queryKey: ['entries'] });
        await queryClient.invalidateQueries({ queryKey: ['timeline-entries'] });
        
        toast({
          title: "URL processed successfully",
          description: "Your entry has been created",
        });
        navigate('/');
        return;
      }

      // Call the process-entry function for text content
      const { data, error } = await supabase.functions.invoke('process-entry', {
        body: { content }
      });

      if (error) throw error;

      // Invalidate queries and navigate
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
    <div className="bg-[#1A1F2C] min-h-screen">
      <CenteredLayout>
        <EntryForm onSubmit={handleSubmit} />
      </CenteredLayout>
    </div>
  );
};

export default NewEntry;