import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { PrivacyNotice } from "./PrivacyNotice";
import { EntryForm } from "./EntryForm";
import { CenteredLayout } from "./layouts/CenteredLayout";

export const NewEntry = () => {
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

  const handleSubmit = async (content: string) => {
    if (!session?.user.id) return;

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
    }
  };

  return (
    <CenteredLayout>
      <h1 className="text-3xl font-bold mb-8 text-white/90">New Entry</h1>
      <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
        <EntryForm onSubmit={handleSubmit} />
      </div>
      <div className="mt-4">
        <PrivacyNotice />
      </div>
    </CenteredLayout>
  );
};