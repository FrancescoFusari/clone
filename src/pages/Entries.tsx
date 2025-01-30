import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Tag, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { TagManagement } from "@/components/TagManagement";

const Entries = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      console.log("Fetching entries...");
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load entries",
        });
        throw error;
      }

      console.log("Fetched entries:", data);
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

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      <h1 className="text-3xl font-bold mb-8">Your Entries</h1>
      
      {/* Add TagManagement component */}
      <div className="mb-8">
        <TagManagement />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entries?.map((entry) => (
          <Card 
            key={entry.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/entries/${entry.id}`)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="capitalize">{entry.category}</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(entry.created_at), "PPp")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{entry.content}</p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-gray-500" />
                  {entry.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Entries;