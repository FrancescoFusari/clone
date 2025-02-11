import { useParams } from "react-router-dom";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { CategoryGraph } from "@/components/CategoryGraph";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Archive, Database as DatabaseIcon, Folder, Grid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryAIInsights } from "@/components/dashboard/CategoryAIInsights";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

const getCategoryIcon = (category: EntryCategory) => {
  const icons = {
    personal: Archive,
    work: DatabaseIcon,
    social: Grid,
    interests: List,
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
    interests: "from-green-500/20 to-green-600/20",
    school: "from-orange-500/20 to-orange-600/20",
  };
  return colors[category];
};

const getCategoryDescription = (category: EntryCategory) => {
  const descriptions: Record<EntryCategory, string> = {
    personal: "Explore connections between your personal thoughts and reflections",
    work: "Visualize relationships in your professional projects and goals",
    social: "Map your social interactions and relationships",
    interests: "Discover patterns in your interests and activities",
    school: "Connect your academic progress and learning experiences",
  };
  return descriptions[category];
};

const CategoryGraphPage = () => {
  const { category } = useParams<{ category: string }>();

  const isValidCategory = (cat: string): cat is EntryCategory => {
    return ["personal", "work", "social", "interests", "school"].includes(cat);
  };

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
    enabled: !!category && isValidCategory(category),
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
