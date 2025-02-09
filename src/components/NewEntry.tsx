
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

  const handleSubmit = async (content: string, isUrl?: boolean, metadata?: {
    priority?: 'high' | 'medium' | 'low';
    attachments?: File[];
    customSubcategory?: string;
  }) => {
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
          body: { 
            url: content,
            user_id: session.user.id,
            metadata
          }
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

      // Handle file uploads first if there are any attachments
      let uploadedAttachments = [];
      if (metadata?.attachments && metadata.attachments.length > 0) {
        for (const file of metadata.attachments) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('entry-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            toast({
              variant: "destructive",
              title: "Upload failed",
              description: `Failed to upload ${file.name}`,
            });
            continue;
          }

          uploadedAttachments.push({
            name: file.name,
            path: filePath,
            type: file.type,
            size: file.size
          });
        }
      }

      console.log("Processing text content");
      const { data, error } = await supabase.functions.invoke('process-entry', {
        body: { 
          content,
          user_id: session.user.id,
          metadata: {
            ...metadata,
            attachments: uploadedAttachments
          }
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
              Transform your thoughts into organized insights. Share your ideas or analyze content from around the web - our AI assistant will help structure and enhance your entries.
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
