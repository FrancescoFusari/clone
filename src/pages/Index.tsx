
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Tag, Calendar, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
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

  // Fetch user profile for the personalized greeting
  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session?.user.id)
        .single();
      return data;
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-white/90">Please Sign In</h1>
        <p className="text-white/60">You need to be signed in to view your entries.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      {/* New Personal Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.username?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
                  Welcome back, {profile?.username || session.user.email?.split('@')[0]}
                </h1>
                <p className="text-lg text-white/60 mt-1">
                  Here are your entries
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/new')}
                className="glass-morphism border-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-white/90">
              {entries?.length || 0}
            </p>
            <p className="text-sm text-white/60">Total Entries</p>
          </div>
        </div>
      </div>

      {/* Entries Grid */}
      {entries && entries.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {entries.map((entry) => (
            <Card 
              key={entry.id} 
              className="bg-secondary/30 backdrop-blur-sm border-white/5 rounded-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
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
                        className="bg-white/5 text-white/80 hover:bg-white/10 rounded-full"
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
        <div className="text-center max-w-7xl mx-auto">
          <p className="text-white/60">No entries found. Create your first entry to get started!</p>
        </div>
      )}
    </div>
  );
};

export default Index;
