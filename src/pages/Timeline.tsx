import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Clock, Filter } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Database } from "@/integrations/supabase/types";

type TimelineEntry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  category: Database["public"]["Enums"]["entry_category"];
  expanded?: boolean;
};

const Timeline = () => {
  const navigate = useNavigate();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["timeline-entries"],
    queryFn: async () => {
      console.log("Fetching entries for timeline...");
      const { data, error } = await supabase
        .from("entries")
        .select("id, title, content, created_at, category")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching timeline entries:", error);
        throw error;
      }

      console.log("Fetched timeline entries:", data);
      return data as TimelineEntry[];
    },
  });

  const toggleExpand = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (expandedEntries.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const filteredEntries = entries?.filter(
    (entry) =>
      selectedCategories.length === 0 || selectedCategories.includes(entry.category)
  );

  const categories: Database["public"]["Enums"]["entry_category"][] = [
    "personal",
    "work",
    "social",
    "interests_and_hobbies",
    "school",
  ];

  if (isLoading) {
    return (
      <CenteredLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <div className="w-full max-w-2xl mx-auto py-6 space-y-8">
        {/* Header Card */}
        <Card className="glass-morphism overflow-hidden">
          <CardHeader className="space-y-2">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gradient">Timeline View</h1>
              <p className="text-lg text-white/80 leading-relaxed">
                View your entries chronologically, with the ability to filter by category and expand entries for quick previews. Click on any entry to see its full details.
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Content Card */}
        <Card className="glass-morphism">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Filter className="h-5 w-5" />
              Filter by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <ToggleGroup
                type="multiple"
                value={selectedCategories}
                onValueChange={setSelectedCategories}
                className="inline-flex flex-nowrap min-w-full"
              >
                {categories.map((category) => (
                  <ToggleGroupItem
                    key={category}
                    value={category}
                    aria-label={`Filter by ${category}`}
                    className="whitespace-nowrap capitalize text-sm bg-white/5 data-[state=on]:bg-white/10"
                  >
                    {category.replace(/_/g, " ")}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-3">
          {filteredEntries?.map((entry) => (
            <Card
              key={entry.id}
              className="backdrop-blur-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
            >
              <CardHeader 
                className="cursor-pointer py-3 select-none" 
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base text-white/90 line-clamp-1">
                      {entry.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-white/60 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.created_at), "PPp")}
                    </CardDescription>
                  </div>
                  {expandedEntries.has(entry.id) ? (
                    <ChevronUp className="h-4 w-4 text-white/60 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/60 shrink-0" />
                  )}
                </div>
              </CardHeader>
              {expandedEntries.has(entry.id) && (
                <CardContent className="py-3 space-y-3">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">
                    {entry.content.length > 200
                      ? `${entry.content.substring(0, 200)}...`
                      : entry.content}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                    onClick={() => navigate(`/entries/${entry.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
          
          {filteredEntries?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-white/60">No entries found</p>
            </div>
          )}
        </div>
      </div>
    </CenteredLayout>
  );
};

export default Timeline;