
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag, FileText, Sparkles, Search, Lightbulb, BookOpen, HelpCircle, MessageCircle } from "lucide-react";
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

type ResearchData = {
  insights: string;
  questions: string[];
  key_concepts: string[];
  related_topics: string[];
};

type EntryComment = {
  id: string;
  text: string;
  type: "observation" | "question" | "suggestion";
};

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

  // Early return if no ID is provided
  if (!id) {
    console.log("No entry ID provided, redirecting to entries list");
    navigate("/");
    return null;
  }

  const { data: entry, isLoading, isError } = useQuery({
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
        toast({
          variant: "destructive",
          title: "Entry not found",
          description: "The requested entry could not be found.",
        });
        navigate("/");
        return null;
      }

      console.log("Fetched entry details:", data);
      return data;
    },
    enabled: !!id,
    retry: false,
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

      const researchData = response.data as ResearchData;

      const { error: updateError } = await supabase
        .from('entries')
        .update({ research_data: researchData })
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

  const research = entry?.research_data as ResearchData | null;
  const isResearchLoading = researchMutation.isPending;

  const handleGenerateResearch = () => {
    if (!research) {
      researchMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate(-1)}
          variant="outline"
          className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load entry details. The entry might have been deleted or you may not have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      {/* Header Card */}
      <Card className="glass-morphism overflow-hidden mb-8">
        <CardHeader className="space-y-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gradient">Entry Details</h1>
            <p className="text-lg text-white/80 leading-relaxed">
              View the complete details of your entry, including AI-generated insights, key concepts, and related topics. Use these insights to explore your thoughts more deeply.
            </p>
          </div>
        </CardHeader>
      </Card>

      <Button
        variant="outline"
        onClick={() => navigate(-1)}
        className="mb-6 bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Entries
      </Button>

      {/* Entry Content Card */}
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
            {formatContent(entry.formatted_content || entry.content)}
          </div>

          {entry.entry_comments && entry.entry_comments.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-white/60" />
                <h3 className="text-lg font-semibold text-white/90">AI Comments & Observations</h3>
              </div>
              <div className="grid gap-4">
                {(entry.entry_comments as EntryComment[]).map((comment) => (
                  <Alert key={comment.id} className="bg-white/5 border-white/10">
                    <div className="flex items-center gap-2">
                      {comment.type === "observation" && <Sparkles className="h-4 w-4" />}
                      {comment.type === "question" && <HelpCircle className="h-4 w-4" />}
                      {comment.type === "suggestion" && <Lightbulb className="h-4 w-4" />}
                      <span className="capitalize text-sm font-medium">{comment.type}</span>
                    </div>
                    <AlertDescription className="mt-2 text-white/80">
                      {comment.text}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

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
