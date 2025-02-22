
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { Card, CardHeader } from "@/components/ui/card";
import { Archive, Database, FolderTree, Grid, List } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
    color: "bg-[#8B5CF6]",
  },
  {
    name: "Work",
    value: "work",
    description: "Professional goals, projects, and career development",
    icon: <Database className="w-6 h-6" />,
    color: "bg-[#0EA5E9]",
  },
  {
    name: "Social",
    value: "social",
    description: "Interactions, relationships, and social activities",
    icon: <Grid className="w-6 h-6" />,
    color: "bg-[#D946EF]",
  },
  {
    name: "Interests & Hobbies",
    value: "interests_and_hobbies",
    description: "Passions, hobbies, and recreational activities",
    icon: <List className="w-6 h-6" />,
    color: "bg-[#F97316]",
  },
  {
    name: "School",
    value: "school",
    description: "Academic progress, studies, and learning experiences",
    icon: <FolderTree className="w-6 h-6" />,
    color: "bg-[#8B5CF6]",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <CenteredLayout>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden relative bg-black/5 backdrop-blur-xl border-black/5 rounded-[24px]">
          <CardHeader className="relative space-y-2">
            <div className="space-y-2">
              <div className="p-3 w-fit rounded-xl bg-black/5">
                <FolderTree className="w-6 h-6 text-black/70" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-black">Categories</h1>
              <p className="text-lg text-black/70 leading-relaxed font-light">
                Explore and organize your entries by category. Each category provides a unique visualization of your content.
              </p>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(`/categories/${category.value}`)}
              className="group"
            >
              <Card className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] border-0 rounded-[24px] ${category.color}/10`}>
                <div className="relative p-6 space-y-4">
                  <div className={`p-3 w-fit rounded-xl ${category.color}/20 transition-all duration-300 group-hover:scale-105`}>
                    <div className={`${category.color} rounded-lg p-2`}>
                      {category.icon}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight text-black">{category.name}</h3>
                    <p className="text-base text-black/60 font-light">
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
