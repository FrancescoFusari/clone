
import { useParams } from "react-router-dom";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { CategoryGraph } from "@/components/CategoryGraph";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Archive, Brain, Database as DatabaseIcon, Folder, Grid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryAIInsights } from "@/components/CategoryAIInsights";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

const getCategoryIcon = (category: EntryCategory) => {
  const icons = {
    personal: Archive,
    work: DatabaseIcon,
    social: Grid,
    interests_and_hobbies: List,
    school: Folder,
  };
  const Icon = icons[category];
  return <Icon className="w-6 h-6" />;
};

const getCategoryColor = (category: EntryCategory) => {
  const colors = {
    personal: "from-purple-500/20 to-purple-600/20",
    work: "from-blue-500/20 to-blue-600/20",
    social: "from-pink-500/20 to-pink-600/20",
    interests_and_hobbies: "from-green-500/20 to-green-600/20",
    school: "from-orange-500/20 to-orange-600/20",
  };
  return colors[category];
};

const getCategoryDescription = (category: EntryCategory) => {
  const descriptions: Record<EntryCategory, string> = {
    personal: "Explore connections between your personal thoughts and reflections",
    work: "Visualize relationships in your professional projects and goals",
    social: "Map your social interactions and relationships",
    interests_and_hobbies: "Discover patterns in your interests and activities",
    school: "Connect your academic progress and learning experiences",
  };
  return descriptions[category];
};

const CategoryGraphPage = () => {
  const { category } = useParams<{ category: string }>();
  const { toast } = useToast();

  const isValidCategory = (cat: string): cat is EntryCategory => {
    return ["personal", "work", "social", "interests_and_hobbies", "school"].includes(cat);
  };

  const generateInsightsMutation = useMutation({
    mutationFn: async (category: EntryCategory) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create or update insights entry with proper conflict handling
      const { data, error } = await supabase
        .from('category_insights')
        .upsert(
          {
            category,
            user_id: user.id,
            status: 'pending',
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,category',
            ignoreDuplicates: false
          }
        )
        .select()
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Insights Generation Started",
        description: "We'll analyze your entries and generate insights. This may take a few moments.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start insights generation. Please try again.",
        variant: "destructive",
      });
      console.error("Error generating insights:", error);
    },
  });

  const { data: categoryStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["category-stats", category],
    queryFn: async () => {
      if (!category || !isValidCategory(category)) return null;

      const { data: entries } = await supabase
        .from("entries")
        .select("subcategory, tags")
        .eq("category", category);

      if (!entries) return null;

      const subcategories = new Set(entries.map(e => e.subcategory).filter(Boolean));
      const allTags = entries.flatMap(e => e.tags || []);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const sortedTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      return {
        subcategoriesCount: subcategories.size,
        tagsCount: new Set(allTags).size,
        topTags: sortedTags,
      };
    },
  });

  if (!category || !isValidCategory(category)) {
    return (
      <CenteredLayout>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Invalid category</p>
          </CardContent>
        </Card>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <Card className={`relative overflow-hidden transition-all duration-300 hover:bg-secondary/10 hover:shadow-lg hover:shadow-primary/10`}>
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(category)} opacity-50`}
          />
          <div className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm">
                    {getCategoryIcon(category)}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Visualization
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {getCategoryDescription(category)}
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => generateInsightsMutation.mutate(category)}
                  disabled={generateInsightsMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" />
                  {generateInsightsMutation.isPending ? "Generating..." : "Generate Insights"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!isStatsLoading && categoryStats && (
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Subcategories</p>
                    <p className="text-2xl font-bold">{categoryStats.subcategoriesCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Total Tags</p>
                    <p className="text-2xl font-bold">{categoryStats.tagsCount}</p>
                  </div>
                  {categoryStats.topTags.length > 0 && (
                    <div className="w-full">
                      <p className="text-sm font-medium mb-2">Most Used Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {categoryStats.topTags.map(([tag, count]) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag} ({count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        <CategoryAIInsights category={category} />

        <CategoryGraph category={category} />

        <Card className="glass-morphism">
          <CardContent className="p-6">
            <CardDescription>
              Click and drag to rotate • Scroll to zoom • Hover over nodes to see details
            </CardDescription>
          </CardContent>
        </Card>
      </motion.div>
    </CenteredLayout>
  );
};

export default CategoryGraphPage;
