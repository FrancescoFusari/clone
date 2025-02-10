
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Tag, Calendar, Heart } from "lucide-react";
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

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  research_data?: {
    insights?: string;
    questions?: string[];
    key_concepts?: string[];
    related_topics?: string[];
  } | null;
};

const categoryColors = {
  personal: "from-[#FEC6A1] to-[#FEC6A1]/80",
  work: "from-[#E5DEFF] to-[#E5DEFF]/80",
  social: "from-[#FEF7CD] to-[#FEF7CD]/80",
  interests_and_hobbies: "from-[#F2FCE2] to-[#F2FCE2]/80",
  school: "from-[#D3E4FD] to-[#D3E4FD]/80",
};

const Index = () => {
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
        .eq("user_id", session.user.id)
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
      return data as Entry[];
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
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-gradient-white">Your Notes</h1>
        
        {entries && entries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry, index) => (
              <Card 
                key={entry.id} 
                className={`group relative overflow-hidden cursor-pointer rounded-3xl border-0 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${categoryColors[entry.category as keyof typeof categoryColors] || 'from-[#FFDEE2] to-[#FFDEE2]/80'}`}
                onClick={() => navigate(`/entries/${entry.id}`)}
              >
                <div className="absolute top-4 right-4">
                  <Heart className="h-6 w-6 text-black/20 hover:text-black/40 transition-colors" />
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold text-black/80 line-clamp-1">
                    {entry.title || "Untitled Entry"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-black/60">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(entry.created_at), "MMM d")}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-black/70 mb-4 line-clamp-2">{entry.content}</p>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.tags.slice(0, 3).map((tag: string) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="bg-black/10 hover:bg-black/20 text-black/70 rounded-full border-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {entry.tags.length > 3 && (
                        <Badge 
                          variant="secondary"
                          className="bg-black/10 hover:bg-black/20 text-black/70 rounded-full border-0"
                        >
                          +{entry.tags.length - 3}
                        </Badge>
                      )}
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
      </div>
    </CenteredLayout>
  );
};

export default Index;
