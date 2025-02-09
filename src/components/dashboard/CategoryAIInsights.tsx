
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight, RefreshCw, Tag, Lightbulb, Connection } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

interface CategoryAIInsightsProps {
  category: EntryCategory;
}

interface CategoryInsight {
  summary: string;
  topThemes: Array<{ theme: string; count: number }>;
  keyInsights: string[];
  suggestions: string[];
  connections: string[];
}

export const CategoryAIInsights = ({ category }: CategoryAIInsightsProps) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["category-insights", category],
    queryFn: async () => {
      if (!session?.user.id) return null;

      const { data, error } = await supabase
        .from("category_insights")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("category", category)
        .maybeSingle();

      if (error) throw error;

      if (!data?.insights) return null;

      return JSON.parse(data.insights) as CategoryInsight;
    },
    enabled: !!session?.user.id,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user.id) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("analyze-category", {
        body: { user_id: session.user.id, category },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-insights", category] });
      toast({
        title: "Success",
        description: "Category insights have been generated successfully",
      });
    },
    onError: (error) => {
      console.error("Error generating insights:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate insights. Please try again later.",
      });
    },
  });

  if (insightsLoading) {
    return (
      <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Category Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Category Insights
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          {insights ? 'Regenerate' : 'Generate'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {generateMutation.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : insights ? (
          <>
            {/* Summary */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground">Summary</h3>
              <p className="text-sm">{insights.summary}</p>
            </div>

            {/* Top Themes */}
            {insights.topThemes && insights.topThemes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Top Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {insights.topThemes.map((theme) => (
                    <Badge
                      key={theme.theme}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {theme.theme}
                      <span className="text-muted-foreground">({theme.count})</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Key Insights */}
            {insights.keyInsights && insights.keyInsights.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Key Insights
                </h3>
                <ul className="space-y-2">
                  {insights.keyInsights.map((insight, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Connections */}
            {insights.connections && insights.connections.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Connection className="h-4 w-4" />
                  Connections
                </h3>
                <ul className="space-y-2">
                  {insights.connections.map((connection, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" />
                      {connection}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {insights.suggestions && insights.suggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Suggestions</h3>
                <ul className="space-y-2">
                  {insights.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-1 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No insights generated yet. Click the generate button to analyze entries in this category.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
