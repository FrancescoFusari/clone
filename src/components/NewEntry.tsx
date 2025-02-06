import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { EntryForm } from "@/components/EntryForm";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        {/* Header Card */}
        <Card className="glass-morphism overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gradient">
                Create New Entry
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Transform your thoughts into organized insights. Share your ideas or analyze content from around the web - our AI assistant will help structure and enhance your entries.
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Form Card */}
        <Card className="glass-morphism">
          <CardContent className="pt-6">
            <EntryForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </CenteredLayout>
  );
};

export default NewEntry;