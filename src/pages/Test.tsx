import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const Test = () => {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-24">
      <div className="w-full max-w-2xl mx-auto py-6 mb-20">
        <h1 className="text-2xl font-bold mb-6 text-white/90">Test Timeline</h1>
        
        <div className="mb-6 overflow-x-auto">
          <ToggleGroup
            type="multiple"
            value={selectedCategories}
            onValueChange={setSelectedCategories}
            className="inline-flex flex-nowrap min-w-full pb-2"
          >
            {categories.map((category) => (
              <ToggleGroupItem
                key={category}
                value={category}
                aria-label={`Filter by ${category}`}
                className="whitespace-nowrap capitalize"
              >
                {category.replace(/_/g, " ")}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="space-y-3">
          {filteredEntries?.map((entry) => (
            <Card
              key={entry.id}
              className="backdrop-blur-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
            >
              <CardHeader className="cursor-pointer py-3" onClick={() => toggleExpand(entry.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base text-white/90">{entry.title}</CardTitle>
                    <CardDescription className="text-sm text-white/60">
                      {format(new Date(entry.created_at), "PPp")}
                    </CardDescription>
                  </div>
                  {expandedEntries.has(entry.id) ? (
                    <ChevronUp className="h-4 w-4 text-white/60" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  )}
                </div>
              </CardHeader>
              {expandedEntries.has(entry.id) && (
                <CardContent className="py-3">
                  <p className="text-sm text-white/80 mb-3">
                    {entry.content.length > 200
                      ? `${entry.content.substring(0, 200)}...`
                      : entry.content}
                  </p>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 text-white/90 hover:bg-white/10"
                    onClick={() => navigate(`/entries/${entry.id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Test;