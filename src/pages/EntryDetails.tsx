import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag, FileText, Sparkles, Search, Lightbulb, BookOpen, HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ResearchData, Json } from "@/integrations/supabase/types";

const formatContent = (text: string) => {
  const paragraphs = text.split(/\n\s*\n/);
  
  return paragraphs.map((paragraph, index) => {
    const formattedParagraph = paragraph
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n/g, ' ');
    
    return formattedParagraph.length > 0 ? (
      <p key={index} className="mb-4">
        {formattedParagraph}
      </p>
    ) : null;
  });
};

const EntryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: entry, isLoading } = useQuery({
    queryKey: ["entry", id],
    queryFn: async () => {
      console.log("Fetching entry details for:", id);
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching entry:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load entry details",
        });
        throw error;
      }

      if (!data) {
        console.log("No entry found with id:", id);
        return null;
      }

      console.log("Fetched entry details:", data);
      return data;
    },
  });

  const researchMutation = useMutation({
    mutationFn: async () => {
      if (!entry) return null;
      
      console.log("Generating research for entry:", id);
      const response = await supabase.functions.invoke('research-content', {
        body: { content: entry.content, title: entry.title },
      });

      if (response.error) {
        console.error("Error generating research:", response.error);
        throw response.error;
      }

      // Explicitly type cast the response data to ResearchData
      const researchData = response.data as ResearchData;
      console.log("Research data before saving:", researchData);

      const { error: updateError } = await supabase
        .from('entries')
        .update({ 
          research_data: researchData as unknown as Json 
        })
        .eq('id', id);

      if (updateError) {
        console.error("Error saving research data:", updateError);
        throw updateError;
      }

      console.log("Research results saved:", researchData);
      return researchData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry", id] });
      toast({
        title: "Success",
        description: "Research insights generated and saved",
      });
    },
    onError: (error) => {
      console.error("Error in research mutation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate research insights",
      });
    },
  });

  const research = entry?.research_data ? (entry.research_data as ResearchData) : null;
  const isResearchLoading = researchMutation.isPending;

  const handleGenerateResearch = () => {
    if (!research) {
      researchMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4 text-white/90">Entry not found</h1>
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
          className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6 bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Entries
      </Button>

      <Card className="mb-6 backdrop-blur-lg bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white/90">
            <FileText className="h-5 w-5" />
            {entry.title || "Untitled Entry"}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-white/60">
            <Calendar className="h-4 w-4" />
            {format(new Date(entry.created_at), "PPp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none mb-6 dark:prose-invert text-white/80">
            {formatContent(entry.content)}
          </div>

          {(entry.summary || entry.title) && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-white/60" />
                <h3 className="text-lg font-semibold text-white/90">AI Generated Content</h3>
              </div>
              <div className="grid gap-4 p-4 rounded-lg bg-white/5">
                {entry.title && (
                  <div>
                    <span className="text-sm font-medium text-white/60">Title:</span>
                    <p className="text-white/80">{entry.title}</p>
                  </div>
                )}
                {entry.summary && (
                  <div>
                    <span className="text-sm font-medium text-white/60">Summary:</span>
                    <p className="text-white/80">{entry.summary}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-6">
              <Tag className="h-4 w-4 text-white/60" />
              {entry.tags.map((tag: string) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="bg-white/10 text-white/80 hover:bg-white/20"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-white/60" />
                <h3 className="text-lg font-semibold text-white/90">AI Research Insights</h3>
              </div>
              {!research && !isResearchLoading && (
                <Button
                  onClick={handleGenerateResearch}
                  variant="outline"
                  className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                >
                  Generate Insights
                </Button>
              )}
            </div>

            {isResearchLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-1/2 bg-white/5" />
                <Skeleton className="h-4 w-2/3 bg-white/5" />
              </div>
            ) : research ? (
              <div className="grid gap-6">
                <Alert className="bg-white/5 border-white/10">
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>Key Concepts</AlertTitle>
                  <AlertDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {research.key_concepts.map((concept: string) => (
                        <Badge 
                          key={concept}
                          variant="secondary" 
                          className="bg-white/10 text-white/80 hover:bg-white/20"
                        >
                          {concept}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-white/5 border-white/10">
                  <BookOpen className="h-4 w-4" />
                  <AlertTitle>Related Topics</AlertTitle>
                  <AlertDescription>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {research.related_topics.map((topic: string) => (
                        <Badge 
                          key={topic}
                          variant="secondary"
                          className="bg-white/10 text-white/80 hover:bg-white/20"
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-white/5 border-white/10">
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>AI Insights</AlertTitle>
                  <AlertDescription className="mt-2 text-white/80">
                    {research.insights}
                  </AlertDescription>
                </Alert>

                <Alert className="bg-white/5 border-white/10">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Questions to Consider</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-2 text-white/80">
                      {research.questions.map((question: string) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert className="bg-white/5 border-white/10">
                <AlertTitle>No research insights available</AlertTitle>
                <AlertDescription>
                  Click the "Generate Insights" button to analyze this entry and generate research insights.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntryDetails;