
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

export const CategoryAIInsights = () => {
  const { category } = useParams<{ category: string }>();

  // Validate that category is a valid EntryCategory
  const validCategory = category as EntryCategory;
  if (!validCategory || !["personal", "work", "social", "interests_and_hobbies", "school"].includes(validCategory)) {
    return null;
  }

  const { data: insights, isLoading } = useQuery({
    queryKey: ["category-insights", validCategory],
    queryFn: async () => {
      const { data: entries } = await supabase
        .from("entries")
        .select("*")
        .eq("category", validCategory);

      if (!entries?.length) {
        return null;
      }

      const { data, error } = await supabase.functions.invoke("analyze-entries", {
        body: { entries },
      });

      if (error) {
        console.error("Error analyzing entries:", error);
        throw error;
      }

      return data;
    },
    enabled: !!validCategory,
  });

  if (!insights) {
    return null;
  }

  return (
    <Card className="glass-morphism">
      <CardHeader className="flex flex-row items-start gap-4">
        <div className="p-2 rounded-xl bg-background/50 backdrop-blur-sm">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold">AI Insights</h3>
          <p className="text-muted-foreground">
            Analysis of your {category?.replace("_", " ")} entries
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {insights.commonThemes?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Common Themes</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {insights.commonThemes.map((theme: { theme: string; count: number }) => (
                    <li key={theme.theme}>
                      {theme.theme} (mentioned {theme.count} times)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.connections?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Connections</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {insights.connections.map((connection: string) => (
                    <li key={connection}>{connection}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.insights?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Key Insights</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {insights.insights.map((insight: string) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {insights.questions?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Questions to Consider</h4>
                <ul className="list-disc pl-4 space-y-1">
                  {insights.questions.map((question: string) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
