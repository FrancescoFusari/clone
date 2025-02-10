
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Tag, Calendar, Link, Image as ImageIcon } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  tags: string[];
  type?: 'url' | 'image' | 'text';
  research_data?: {
    insights?: string;
    questions?: string[];
    key_concepts?: string[];
    related_topics?: string[];
  } | null;
};

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const isMobile = useIsMobile();
  
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

  const getCardSize = (entry: Entry) => {
    // Dynamic sizing based on entry type and content
    if (entry.type === 'image') {
      return 'row-span-2 col-span-2';
    }
    
    if (entry.type === 'text' && entry.content?.length > 200) {
      return 'row-span-2 col-span-2';
    }

    // Check for long content or multiple tags for text entries
    const hasLongContent = entry.content?.length > 150;
    const hasMultipleTags = entry.tags?.length > 2;
    
    if (hasLongContent || hasMultipleTags) {
      return isMobile ? 'col-span-2' : 'row-span-2';
    }

    // For URL entries or short content
    return isMobile ? 'col-span-1' : '';
  };

  const getEntryIcon = (entry: Entry) => {
    switch (entry.type) {
      case 'url':
        return <Link className="h-5 w-5" />;
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <CenteredLayout>
      <h1 className="text-3xl font-bold mb-8 text-white/90">Your Entries</h1>
      {entries && entries.length > 0 ? (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'} auto-rows-auto`}>
          {entries.map((entry) => (
            <Card 
              key={entry.id} 
              className={`
                transition-all duration-300 cursor-pointer
                hover:scale-[1.02]
                border-0 shadow-none
                bg-[#FDE1D3]
                ${getCardSize(entry)}
              `}
              onClick={() => navigate(`/entries/${entry.id}`)}
            >
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-black/80">
                  {getEntryIcon(entry)}
                  {entry.title || "Untitled Entry"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-black/60">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(entry.created_at), "PPp")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className={`text-sm text-black/70 mb-4 ${getCardSize(entry).includes('row-span-2') ? 'line-clamp-4' : 'line-clamp-2'}`}>
                  {entry.content}
                </p>
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-4 w-4 text-black/60" />
                    {entry.tags.map((tag: string) => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="bg-black/10 text-black/70 hover:bg-black/20"
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

export default Index;
