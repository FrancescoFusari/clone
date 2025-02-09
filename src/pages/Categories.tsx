
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { Card, CardHeader } from "@/components/ui/card";
import { Archive, Database, FolderTree, Grid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AIInsightsCard } from "@/components/dashboard/AIInsightsCard";

interface CategoryCard {
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  value: string;
}

const categories: CategoryCard[] = [
  {
    name: "Personal",
    value: "personal",
    description: "Private thoughts, reflections, and personal experiences",
    icon: <Archive className="w-6 h-6" />,
    color: "from-purple-500/20 to-purple-600/20",
  },
  {
    name: "Work",
    value: "work",
    description: "Professional goals, projects, and career development",
    icon: <Database className="w-6 h-6" />,
    color: "from-blue-500/20 to-blue-600/20",
  },
  {
    name: "Social",
    value: "social",
    description: "Interactions, relationships, and social activities",
    icon: <Grid className="w-6 h-6" />,
    color: "from-pink-500/20 to-pink-600/20",
  },
  {
    name: "Interests & Hobbies",
    value: "interests_and_hobbies",
    description: "Passions, hobbies, and recreational activities",
    icon: <List className="w-6 h-6" />,
    color: "from-green-500/20 to-green-600/20",
  },
  {
    name: "School",
    value: "school",
    description: "Academic progress, studies, and learning experiences",
    icon: <FolderTree className="w-6 h-6" />,
    color: "from-orange-500/20 to-orange-600/20",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <CenteredLayout>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="glass-morphism overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8A898C]/20 to-[#F1F0FB]/20 opacity-50" />
          <CardHeader className="relative space-y-2">
            <div className="space-y-2">
              <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm">
                <FolderTree className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">Categories</h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Explore and organize your entries by category. Each category provides a unique visualization of your content.
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* AI Insights */}
        <AIInsightsCard />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(`/categories/${category.value}`)}
            >
              <Card className={`relative overflow-hidden card-hover cursor-pointer`}>
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-50`}
                />
                <div className="relative p-6 space-y-4">
                  <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm">
                    {category.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </CenteredLayout>
  );
};

export default Categories;
