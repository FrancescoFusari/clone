import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag, TrendingUp } from "lucide-react";

export const TagManagement = () => {
  const { data: tagAnalytics, isLoading } = useQuery({
    queryKey: ["tagAnalytics"],
    queryFn: async () => {
      console.log("Fetching tag analytics...");
      const { data, error } = await supabase
        .from("tag_analytics")
        .select("*")
        .order("usage_count", { ascending: false });

      if (error) {
        console.error("Error fetching tag analytics:", error);
        throw error;
      }

      console.log("Fetched tag analytics:", data);
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Popular Tags
        </CardTitle>
        <CardDescription>Most frequently used tags in your entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {tagAnalytics?.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.tag}
              <span className="ml-1 text-xs flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {tag.usage_count}
              </span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};