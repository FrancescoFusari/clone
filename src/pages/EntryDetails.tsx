import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { useToast } from "@/components/ui/use-toast";

interface ResearchData {
  summary?: string;
  related_topics?: string[];
  key_insights?: string[];
}

const EntryDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching entry:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load entry details",
        });
        throw error;
      }

      console.log("Entry data:", data); // Debug log
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <CenteredLayout>
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Entry not found</h1>
          <p>The requested entry could not be found.</p>
        </Card>
      </CenteredLayout>
    );
  }

  const researchData = entry.research_data as ResearchData | null;

  return (
    <CenteredLayout>
      <Card className="p-6 max-w-3xl w-full">
        <h1 className="text-2xl font-bold mb-4">{entry.title}</h1>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Content</h2>
            <p className="whitespace-pre-wrap">{entry.content}</p>
          </div>

          {entry.summary && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Summary</h2>
              <p>{entry.summary}</p>
            </div>
          )}

          {researchData && (
            <div className="space-y-4">
              {researchData.summary && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
                  <p>{researchData.summary}</p>
                </div>
              )}

              {researchData.key_insights && researchData.key_insights.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Key Insights</h2>
                  <ul className="list-disc pl-5 space-y-1">
                    {researchData.key_insights.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {researchData.related_topics && researchData.related_topics.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-2">Related Topics</h2>
                  <div className="flex flex-wrap gap-2">
                    {researchData.related_topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-secondary rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-secondary rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Created: {new Date(entry.created_at).toLocaleDateString()}
          </div>
        </div>
      </Card>
    </CenteredLayout>
  );
};

export default EntryDetails;