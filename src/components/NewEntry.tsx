
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

  const handleSubmit = async (content: string | File, type: "text" | "url" | "image" | "document") => {
    try {
      if (!session?.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to create an entry",
        });
        return;
      }

      if (type === "image" || type === "document") {
        const file = content as File;
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const bucket = type === "image" ? 'entry-images' : 'entry-documents';

        console.log(`Uploading ${type}:`, { fileName, fileType: file.type, bucket });

        // Upload file to storage with explicit content type and owner
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(`${session.user.id}/${fileName}`, file, {
            contentType: file.type || (type === "document" ? "application/pdf" : "image/jpeg"),
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Error uploading ${type}:`, uploadError);
          throw new Error(`Failed to upload ${type}: ${uploadError.message}`);
        }

        console.log(`${type} uploaded successfully:`, uploadData);

        // Get public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(`${session.user.id}/${fileName}`);

        console.log(`Processing ${type} content from URL:`, publicUrl);

        const { data, error } = await supabase.functions.invoke('process-entry', {
          body: { 
            content: publicUrl,
            user_id: session.user.id,
            type,
            folder: "default"
          }
        });

        if (error) {
          console.error(`Error processing ${type} entry:`, error);
          throw error;
        }

        console.log(`${type} entry processed successfully:`, data);
      } else {
        console.log(`Processing ${type} content:`, content.toString().substring(0, 100) + "...");

        const { data, error } = await supabase.functions.invoke(
          type === "url" ? 'analyze-url' : 'process-entry',
          {
            body: { 
              [type === "url" ? "url" : "content"]: content,
              user_id: session.user.id,
              type,
              folder: "default"
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
        description: error instanceof Error ? error.message : "There was a problem creating your entry. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 px-2 pb-24">
      <div className="w-full max-w-4xl mx-auto min-h-[calc(100vh-8rem)] py-8">
        <EntryForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewEntry;
