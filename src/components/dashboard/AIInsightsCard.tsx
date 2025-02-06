import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Connection, History, Lightbulb } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

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

export const AIInsightsCard = () => {
  const { session } = useAuth();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["aiInsights", session?.user.id],
    queryFn: async () => {
      console.log("Fetching entries for AI insights analysis");
      // Fetch all entries with research data
      const { data: entries, error } = await supabase
        .from("entries")
        .select("research_data, content, title, created_at")
        .eq("user_id", session?.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
        throw error;
      }

      const validEntries = entries.filter(entry => entry.research_data) as Entry[];
      console.log(`Found ${validEntries.length} entries with research data`);

      // Process entries to extract insights
      const researchData = validEntries.map(entry => entry.research_data as ResearchData);

      // Extract common themes and their frequency
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
        .map(([theme, count]) => ({ theme, count }));

      // Find connections between recent entries
      const recentEntries = validEntries.slice(0, 5);
      const connections = findConnections(recentEntries);

      // Extract unique insights
      const uniqueInsights = Array.from(new Set(
        researchData
          .map(data => data.insights)
          .filter(Boolean)
      )).slice(0, 3);

      // Get thought-provoking questions
      const questions = Array.from(new Set(
        researchData
          .flatMap(data => data.questions || [])
          .filter(Boolean)
      )).slice(0, 3);

      return {
        commonThemes,
        connections,
        insights: uniqueInsights,
        questions,
        recentEntriesCount: recentEntries.length,
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
        {/* Recent Activity Analysis */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Activity
          </h3>
          <p className="text-sm">
            Analyzing {insights?.recentEntriesCount} recent entries for patterns and insights.
          </p>
        </div>

        {/* Common Themes */}
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Common Themes
          </h3>
          <div className="flex flex-wrap gap-2">
            {insights?.commonThemes.map((item) => (
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
            <Connection className="h-4 w-4" />
            Entry Connections
          </h3>
          <ul className="space-y-2">
            {insights?.connections.map((connection, index) => (
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

// Helper function to find connections between entries
function findConnections(entries: Entry[]): string[] {
  const connections: string[] = [];
  
  // Compare each entry with others to find connections
  for (let i = 0; i < entries.length - 1; i++) {
    const currentEntry = entries[i];
    const nextEntry = entries[i + 1];
    
    // Check for shared concepts
    const currentConcepts = currentEntry.research_data?.key_concepts || [];
    const nextConcepts = nextEntry.research_data?.key_concepts || [];
    const sharedConcepts = currentConcepts.filter(concept => 
      nextConcepts.includes(concept)
    );
    
    if (sharedConcepts.length > 0) {
      connections.push(
        `Connection found between "${currentEntry.title}" and "${nextEntry.title}" through ${sharedConcepts.join(", ")}`
      );
    }
  }

  return connections.slice(0, 3); // Return top 3 connections
}