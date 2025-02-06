import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowRight, History, Lightbulb, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

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
  analysis_data?: AIAnalysis | null;
  analysis_generated_at?: string | null;
}

interface AIAnalysis {
  commonThemes: { theme: string; count: number }[];
  connections: string[];
  insights: string[];
  questions: string[];
}

export const AIInsightsCard = () => {
  const { session, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entries, isError: entriesError } = useQuery({
    queryKey: ["entries", session?.user.id],
    queryFn: async () => {
      if (!session?.user.id) {
        console.log("No user ID found in session, skipping entries fetch");
        return null;
      }

      console.log("Fetching entries for user:", session.user.id);
      try {
        const { data, error } = await supabase
          .from("entries")
          .select("content, title, created_at, research_data, analysis_data, analysis_generated_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase error fetching entries:", error);
          toast({
            title: "Error",
            description: "Failed to fetch entries. Please try again later.",
            variant: "destructive",
          });
          throw error;
        }

        console.log("Successfully fetched entries count:", data?.length || 0);
        
        // Transform the data to ensure type safety
        const transformedData = data?.map(entry => {
          // First cast to unknown, then to AIAnalysis to ensure type safety
          const analysisData = entry.analysis_data as unknown;
          const isValidAnalysis = (data: unknown): data is AIAnalysis => {
            if (typeof data !== 'object' || data === null) return false;
            const d = data as any;
            return Array.isArray(d.commonThemes) &&
                   Array.isArray(d.connections) &&
                   Array.isArray(d.insights) &&
                   Array.isArray(d.questions);
          };

          return {
            ...entry,
            analysis_data: isValidAnalysis(analysisData) ? analysisData : null,
            research_data: entry.research_data as ResearchData
          };
        }) as Entry[];

        return transformedData;
      } catch (error) {
        console.error("Error in entries fetch:", error);
        throw error;
      }
    },
    enabled: !!session?.user.id && !authLoading,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!entries?.length) {
        throw new Error("No entries available for analysis");
      }

      console.log(`Starting AI analysis for ${entries.length} entries`);
      const { data, error } = await supabase.functions.invoke('analyze-entries', {
        body: { entries }
      });

      if (error) {
        console.error("AI analysis error:", error);
        throw error;
      }

      // Save analysis results for each entry
      const { error: updateError } = await supabase
        .from('entries')
        .update({ 
          analysis_data: data,
          analysis_generated_at: new Date().toISOString()
        })
        .eq('user_id', session?.user.id);

      if (updateError) {
        console.error("Error saving analysis:", updateError);
        throw updateError;
      }

      console.log("AI analysis completed and saved successfully");
      return data as AIAnalysis;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", session?.user.id] });
      toast({
        title: "Success",
        description: "AI insights have been regenerated successfully",
      });
    },
    onError: (error) => {
      console.error("Error during AI analysis:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate AI insights. Please try again later.",
      });
    },
  });

  // Get the latest analysis from entries
  const latestAnalysis = entries?.[0]?.analysis_data as AIAnalysis | undefined;
  const analysisDate = entries?.[0]?.analysis_generated_at;

  if (authLoading) {
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
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entriesError) {
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights
        </CardTitle>
        <div className="flex items-center gap-2">
          {analysisDate && (
            <span className="text-xs text-muted-foreground">
              Last generated: {new Date(analysisDate).toLocaleDateString()}
            </span>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {generateMutation.isPending ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
            <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
            <div className="h-24 animate-pulse bg-primary/5 rounded-lg" />
          </div>
        ) : latestAnalysis ? (
          <>
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
            {latestAnalysis.commonThemes && latestAnalysis.commonThemes.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Common Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {latestAnalysis.commonThemes.map((item) => (
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
            )}

            {/* Entry Connections */}
            {latestAnalysis.connections && latestAnalysis.connections.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Entry Connections
                </h3>
                <ul className="space-y-2">
                  {latestAnalysis.connections.map((connection, index) => (
                    <li key={index} className="text-sm">
                      {connection}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Insights */}
            {latestAnalysis.insights && latestAnalysis.insights.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Key Insights</h3>
                <ul className="space-y-2">
                  {latestAnalysis.insights.map((insight, index) => (
                    <li key={index} className="text-sm">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reflective Questions */}
            {latestAnalysis.questions && latestAnalysis.questions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Questions to Consider</h3>
                <ul className="space-y-2">
                  {latestAnalysis.questions.map((question, index) => (
                    <li key={index} className="text-sm">
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No AI insights generated yet. Click the regenerate button to analyze your entries.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
