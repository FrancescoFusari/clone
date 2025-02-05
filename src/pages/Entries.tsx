
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
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { useAuth } from "@/components/AuthProvider";

const Entries = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries", session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        console.log("No authenticated user found");
        return [];
      }

      console.log("Fetching entries for user:", session.user.id);
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
      return data || [];
    },
    enabled: !!session?.user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <CenteredLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white/90">Please Sign In</h1>
          <p className="text-white/60">You need to be signed in to view your entries.</p>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <h1 className="text-3xl font-bold mb-8 text-white/90">Your Entries</h1>
      {entries && entries.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card 
              key={entry.id} 
              className="hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl hover:scale-[1.02]"
              onClick={() => navigate(`/entries/${entry.id}`)}
            >
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
                <p className="text-sm text-white/80 mb-4 line-clamp-3">{entry.content}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-white/60" />
                    {entry.tags.map((tag: string) => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="bg-white/10 text-white/80 hover:bg-white/20 rounded-full"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <p className="text-white/60">No entries found. Create your first entry to get started!</p>
        </div>
      )}
    </CenteredLayout>
  );
};

export default Entries;
