import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Brain, Lightbulb, Network, PieChart } from "lucide-react";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

interface ThemeCount {
  theme: string;
  count: number;
}

interface CategoryInsightsData {
  commonThemes: ThemeCount[];
  connections: string[];
  insights: string[];
  questions: string[];
}

interface CategoryInsights {
  insights: CategoryInsightsData;
}

interface CategoryAIInsightsProps {
  category: EntryCategory;
}

export const CategoryAIInsights = ({ category }: CategoryAIInsightsProps) => {
  const { data: insightsData, isLoading } = useQuery({
    queryKey: ["category-insights", category],
    queryFn: async () => {
      console.log("Fetching insights for category:", category);
      const { data: existingInsights, error } = await supabase
        .from("category_insights")
        .select("*")
        .eq("category", category)
        .maybeSingle();

      if (error) {
        console.error("Error fetching insights:", error);
        throw error;
      }

      // If no insights exist yet, return null
      if (!existingInsights) {
        return null;
      }

      // Type assertion with type guard
      const insightsData = existingInsights.insights;
      if (typeof insightsData === 'object' && insightsData !== null && 
          'commonThemes' in insightsData && 
          'connections' in insightsData && 
          'insights' in insightsData && 
          'questions' in insightsData) {
        return { insights: insightsData as CategoryInsightsData };
      }
      
      return null;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insightsData?.insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>No insights available yet for this category.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { commonThemes, connections, insights: insightsList, questions } = insightsData.insights;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          AI Insights for {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </CardTitle>
        <CardDescription>
          Analyzing patterns and connections in your {category} entries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {commonThemes?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Common Themes
            </h3>
            <div className="flex flex-wrap gap-2">
              {commonThemes.map((theme, index) => (
                <Badge key={index} variant="secondary">
                  {theme.theme} ({theme.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {connections?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Network className="w-5 h-5" />
              Connections
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {connections.map((connection, index) => (
                <li key={index} className="text-muted-foreground">
                  {connection}
                </li>
              ))}
            </ul>
          </div>
        )}

        {insightsList?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Key Insights
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              {insightsList.map((insight, index) => (
                <li key={index} className="text-muted-foreground">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {questions?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Questions for Reflection</h3>
            <ul className="list-disc pl-5 space-y-1">
              {questions.map((question, index) => (
                <li key={index} className="text-muted-foreground">
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
