
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { EntryForm } from "@/components/EntryForm";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const NewEntry = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const handleSubmit = async (content: string | File, type: "text" | "url" | "image") => {
    try {
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to create an entry",
        });
        return;
      }

      if (type === "image") {
        const file = content as File;
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        // Upload image to storage
        const { error: uploadError } = await supabase.storage
          .from('entry-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw uploadError;
        }

        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('entry-images')
          .getPublicUrl(fileName);

        console.log("Processing image content from URL:", publicUrl);

        const { data, error } = await supabase.functions.invoke('process-entry', {
          body: { 
            content: publicUrl,
            user_id: session.user.id,
            type: "image"
          }
        });

        if (error) {
          console.error("Error processing image entry:", error);
          throw error;
        }

        console.log("Image entry processed successfully:", data);
      } else {
        console.log(`Processing ${type} content:`, content.toString().substring(0, 100) + "...");

        const { data, error } = await supabase.functions.invoke(
          type === "url" ? 'analyze-url' : 'process-entry',
          {
            body: { 
              [type === "url" ? "url" : "content"]: content,
              user_id: session.user.id,
              type
            }
          }
        );

        if (error) {
          console.error(`Error processing ${type} entry:`, error);
          throw error;
        }

        console.log(`${type} entry processed successfully:`, data);
      }

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
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Card className="neo-blur border-primary/20 overflow-hidden">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-gradient">
                Create New Entry
              </h1>
            </div>
            <p className="text-lg text-white/80 leading-relaxed max-w-2xl">
              Transform your thoughts into organized insights. Share your ideas, analyze content from around the web, or upload images - our AI assistant will help structure and enhance your entries.
            </p>
          </CardHeader>
        </Card>

        <Card className="neo-blur border-primary/20">
          <CardContent className="pt-6">
            <EntryForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </CenteredLayout>
  );
};

export default NewEntry;
