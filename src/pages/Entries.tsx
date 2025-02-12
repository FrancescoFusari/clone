
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Archive, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

const Entries = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredEntries = entries?.filter((entry) =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sanitizeHTML = (html: string) => {
    if (!html) return { __html: '' };
    
    try {
      return {
        __html: DOMPurify.sanitize(html, {
          USE_PROFILES: { html: true },
          ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote'],
          ALLOWED_ATTR: ['href', 'target', 'rel']
        })
      };
    } catch (error) {
      console.error('Error sanitizing HTML:', error);
      return { __html: html }; // Fallback to raw HTML if sanitization fails
    }
  };

  const stripHTML = (html: string) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = DOMPurify.sanitize(html);
    return div.textContent || div.innerText || '';
  };

  return (
    <CenteredLayout>
      <div className="max-w-6xl mx-auto space-y-8 py-4">
        <Card className="glass-morphism overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#9F9EA1]/20 to-[#F6F6F7]/20 opacity-50" />
          <CardHeader className="relative space-y-2">
            <div className="space-y-2">
              <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm">
                <Archive className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">Your Entries</h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Browse and manage all your entries in one place. Use filters and search to find specific content.
              </p>
            </div>
          </CardHeader>
        </Card>

        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-morphism animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-white/10 rounded" />
                    <div className="h-4 bg-white/5 rounded" />
                    <div className="h-4 bg-white/5 rounded w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredEntries?.map((entry) => (
              <Card
                key={entry.id}
                className="glass-morphism card-hover cursor-pointer overflow-hidden"
                onClick={() => navigate(`/entries/${entry.id}`)}
              >
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold line-clamp-1">{entry.title}</h3>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {stripHTML(entry.formatted_content || entry.content)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{entry.category.replace(/_/g, " ")}</span>
                      <span>{format(new Date(entry.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!isLoading && filteredEntries?.length === 0 && (
          <Card className="glass-morphism">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No entries found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </CenteredLayout>
  );
};

export default Entries;
