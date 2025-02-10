
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

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
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const filteredEntries = entries?.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be signed in to view your entries.</p>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF7CD]/30">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Explore</h1>
            
            {/* Search Bar */}
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                className="pl-9 bg-white/80 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Badge 
                variant="secondary" 
                className="bg-black text-white hover:bg-black/90 px-4 py-2 rounded-full"
              >
                For you {entries?.length ?? 0}
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-white/80 text-black hover:bg-white/90 px-4 py-2 rounded-full"
              >
                Recent
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-white/80 text-black hover:bg-white/90 px-4 py-2 rounded-full"
              >
                Favorites
              </Badge>
            </div>
          </div>

          {/* Entries Grid */}
          {filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEntries.map((entry) => (
                <Card 
                  key={entry.id} 
                  className="border-none bg-white/80 hover:bg-white transition-colors rounded-3xl cursor-pointer"
                  onClick={() => navigate(`/entries/${entry.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">
                      {entry.title || "Untitled Entry"}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(entry.created_at), "PPp")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {entry.content}
                    </p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag: string) => (
                          <Badge 
                            key={tag} 
                            variant="secondary"
                            className="bg-[#FDE1D3] text-black hover:bg-[#FDE1D3]/80 rounded-full"
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
            <Card className="border-none bg-white/80 p-6 rounded-3xl text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "No entries found matching your search" : "No entries found. Create your first entry to get started!"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
