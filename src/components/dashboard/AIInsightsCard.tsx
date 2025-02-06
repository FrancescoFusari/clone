import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

interface ResearchData {
  key_concepts?: string[];
  insights?: string;
  questions?: string[];
}

export const AIInsightsCard = () => {
  const { session } = useAuth();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["aiInsights", session?.user.id],
    queryFn: async () => {
      // Fetch recent entries with research data
      const { data: entries, error } = await supabase
        .from("entries")
        .select("research_data, content")
        .eq("user_id", session?.user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Process entries to extract insights
      const researchData = entries
        .filter(entry => entry.research_data)
        .map(entry => entry.research_data as ResearchData);

      // Extract common themes
      const allConcepts = researchData
        .flatMap(data => data.key_concepts || [])
        .filter(Boolean);

      const conceptFrequency = allConcepts.reduce((acc: Record<string, number>, concept) => {
        acc[concept] = (acc[concept] || 0) + 1;
        return acc;
      }, {});

      const commonThemes = Object.entries(conceptFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([theme]) => theme);

      // Extract unique insights
      const uniqueInsights = Array.from(new Set(
        researchData
          .map(data => data.insights)
          .filter(Boolean)
      )).slice(0, 3);

      // Get interesting questions
      const questions = Array.from(new Set(
        researchData
          .flatMap(data => data.questions || [])
          .filter(Boolean)
      )).slice(0, 3);

      return {
        commonThemes,
        insights: uniqueInsights,
        questions,
      };
    },
    enabled: !!session?.user.id,
  });

  if (isLoading) {
    return (
      <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
            <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
            <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Common Themes */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Common Themes</h3>
          <div className="flex flex-wrap gap-2">
            {insights?.commonThemes.map((theme) => (
              <span
                key={theme}
                className="px-2 py-1 bg-primary/10 rounded-full text-xs"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Key Insights</h3>
          <ul className="space-y-2">
            {insights?.insights.map((insight, index) => (
              <li key={index} className="text-sm">
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* Reflective Questions */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Questions to Consider</h3>
          <ul className="space-y-2">
            {insights?.questions.map((question, index) => (
              <li key={index} className="text-sm">
                {question}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};