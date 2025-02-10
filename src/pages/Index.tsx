
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, FileText } from "lucide-react";
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
  category?: "personal" | "work" | "social" | "interests_and_hobbies" | "school";
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

      return data as Entry[];
    },
    enabled: !!session?.user,
  });

  const filteredEntries = entries?.filter(entry => 
    entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content?.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="min-h-screen bg-[#0D111A] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Your Entries</h1>
            </div>
            <p className="text-gray-400">
              Browse and manage all your entries in one place. Use filters and search to find specific content.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search entries..."
              className="w-full pl-10 py-6 bg-[#161B22] border-none rounded-xl text-white placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Entries Grid */}
          {filteredEntries && filteredEntries.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-[#161B22] rounded-xl p-6 space-y-4 cursor-pointer hover:bg-[#1C2128] transition-colors"
                  onClick={() => navigate(`/entries/${entry.id}`)}
                >
                  <h2 className="text-xl font-semibold line-clamp-2">
                    {entry.title || "Untitled Entry"}
                  </h2>
                  <p className="text-gray-400 text-sm line-clamp-3">
                    {entry.content}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span className="capitalize">{entry.category || "Personal"}</span>
                    <span>{format(new Date(entry.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#161B22] rounded-xl p-8 text-center">
              <p className="text-gray-400">
                {searchQuery ? "No entries found matching your search" : "No entries found. Create your first entry to get started!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
