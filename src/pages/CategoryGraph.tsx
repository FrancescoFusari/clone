import { useParams } from "react-router-dom";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { CategoryGraph } from "@/components/CategoryGraph";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

const CategoryGraphPage = () => {
  const { category } = useParams<{ category: string }>();

  // Validate that the category is one of the allowed values
  const isValidCategory = (cat: string): cat is EntryCategory => {
    return ["personal", "work", "social", "interests_and_hobbies", "school"].includes(cat);
  };

  if (!category || !isValidCategory(category)) {
    return <div>Invalid category</div>;
  }

  return (
    <CenteredLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter">
          {category.charAt(0).toUpperCase() + category.slice(1)} Visualization
        </h1>
        <p className="text-muted-foreground">
          Explore the connections between entries, subcategories, and tags
        </p>
        <CategoryGraph category={category} />
      </div>
    </CenteredLayout>
  );
};

export default CategoryGraphPage;