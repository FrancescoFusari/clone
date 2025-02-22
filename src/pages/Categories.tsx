
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
    color: "from-[#E5DEFF]/50 to-[#E5DEFF]/30",
  },
  {
    name: "Work",
    value: "work",
    description: "Professional goals, projects, and career development",
    icon: <Database className="w-6 h-6" />,
    color: "from-[#D3E4FD]/50 to-[#D3E4FD]/30",
  },
  {
    name: "Social",
    value: "social",
    description: "Interactions, relationships, and social activities",
    icon: <Grid className="w-6 h-6" />,
    color: "from-[#FFDEE2]/50 to-[#FFDEE2]/30",
  },
  {
    name: "Interests & Hobbies",
    value: "interests_and_hobbies",
    description: "Passions, hobbies, and recreational activities",
    icon: <List className="w-6 h-6" />,
    color: "from-[#F2FCE2]/50 to-[#F2FCE2]/30",
  },
  {
    name: "School",
    value: "school",
    description: "Academic progress, studies, and learning experiences",
    icon: <FolderTree className="w-6 h-6" />,
    color: "from-[#FEC6A1]/50 to-[#FEC6A1]/30",
  },
];

const Categories = () => {
  const navigate = useNavigate();

  return (
    <CenteredLayout>
      <div className="space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden relative bg-white/10 backdrop-blur-xl border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F1F0FB]/30 to-[#F1F0FB]/10 opacity-50" />
          <CardHeader className="relative space-y-2">
            <div className="space-y-2">
              <div className="p-3 w-fit rounded-xl bg-white/10 backdrop-blur-sm">
                <FolderTree className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">Categories</h1>
              <p className="text-lg text-white/80 leading-relaxed font-light">
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
              <Card className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5 border border-white/20 bg-white/10">
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-40 transition-all duration-300 group-hover:opacity-60`} />
                <div className="relative p-6 space-y-4">
                  <div className="p-3 w-fit rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30 group-hover:scale-105">
                    {category.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold tracking-tight">{category.name}</h3>
                    <p className="text-base text-white/70 font-light">
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
