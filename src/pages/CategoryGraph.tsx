import { useParams } from "react-router-dom";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { CategoryGraph } from "@/components/CategoryGraph";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

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

  const isValidCategory = (cat: string): cat is EntryCategory => {
    return ["personal", "work", "social", "interests_and_hobbies", "school"].includes(cat);
  };

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
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter text-gradient">
            {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Visualization
          </h1>
          <p className="text-muted-foreground">
            {getCategoryDescription(category)}
          </p>
        </div>

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