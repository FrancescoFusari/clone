import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight, History, Lightbulb } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

interface ResearchData {
  key_concepts?: string[];
  insights?: string;
  questions?: string[];
  related_topics?: string[];
}

interface Entry {
  research_data: ResearchData;
  content: string;
  title: string;
  created_at: string;
}

interface AIAnalysis {
  commonThemes: { theme: string; count: number }[];
  connections: string[];
  insights: string[];
  questions: string[];
}

export const AIInsightsCard = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  const { data: entries, isError: entriesError } = useQuery({
    queryKey: ["entries", session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) {
        console.log("No user ID found, skipping entries fetch");
        return null;
      }

      console.log("Fetching entries for user:", session.user.id);
      const { data, error } = await supabase
        .from("entries")
        .select("content, title, created_at, research_data")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
        toast({
          title: "Error",
          description: "Failed to fetch entries. Please try again later.",
          variant: "destructive",
        });
        throw error;
      }

      console.log("Fetched entries count:", data?.length || 0);
      return data as Entry[];
    },
    enabled: !!session?.user.id,
  });

  const { data: insights, isLoading, isError: analysisError } = useQuery({
    queryKey: ["aiAnalysis", entries],
    queryFn: async () => {
      if (!entries?.length) {
        console.log("No entries to analyze");
        return null;
      }

      console.log(`Analyzing ${entries.length} entries with AI`);
      try {
        const { data, error } = await supabase.functions.invoke('analyze-entries', {
          body: { entries }
        });

        if (error) {
          console.error("AI analysis error:", error);
          toast({
            title: "Error",
            description: "Failed to analyze entries. Please try again later.",
            variant: "destructive",
          });
          throw error;
        }

        console.log("AI analysis completed successfully");
        return data as AIAnalysis;
      } catch (error) {
        console.error("Error during AI analysis:", error);
        toast({
          title: "Error",
          description: "Failed to analyze entries. Please try again later.",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!entries?.length,
  });

  if (entriesError || analysisError) {
    return (
      <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            An error occurred while fetching insights. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

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

  if (!entries?.length) {
    return (
      <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No entries found to analyze. Start writing to get AI-powered insights!
          </p>
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
        {/* Recent Activity Analysis */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Activity
          </h3>
          <p className="text-sm">
            Analyzing {entries?.length} entries for patterns and insights.
          </p>
        </div>

        {/* Common Themes */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Common Themes
          </h3>
          <div className="flex flex-wrap gap-2">
            {insights.commonThemes.map((item) => (
              <span
                key={item.theme}
                className="px-2 py-1 bg-primary/10 rounded-full text-xs flex items-center gap-1"
              >
                {item.theme}
                <span className="text-muted-foreground">({item.count})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Entry Connections */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Entry Connections
          </h3>
          <ul className="space-y-2">
            {insights.connections.map((connection, index) => (
              <li key={index} className="text-sm">
                {connection}
              </li>
            ))}
          </ul>
        </div>

        {/* Key Insights */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground">Key Insights</h3>
          <ul className="space-y-2">
            {insights.insights.map((insight, index) => (
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
            {insights.questions.map((question, index) => (
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
