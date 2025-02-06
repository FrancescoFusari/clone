import { useParams } from "react-router-dom";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { CategoryGraph } from "@/components/CategoryGraph";

const CategoryGraphPage = () => {
  const { category } = useParams<{ category: string }>();

  if (!category) {
    return <div>Category not found</div>;
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