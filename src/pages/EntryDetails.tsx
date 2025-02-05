import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Tag, FileText } from "lucide-react";
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

const formatContent = (text: string) => {
  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  
  // Format each paragraph
  return paragraphs.map((paragraph, index) => {
    // Remove extra whitespace and newlines within paragraphs
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

          {entry.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-white/90">AI Summary</h3>
              <p className="text-white/60">{entry.summary}</p>
            </div>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default EntryDetails;