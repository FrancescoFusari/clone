
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { Card, CardHeader } from "@/components/ui/card";
import { Archive, Database, FolderTree, Grid, List, LayoutGrid, LayoutList } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface CategoryCard {
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  value: string;
  entryCount?: number;
  lastUpdated?: string;
}

const categories: CategoryCard[] = [
  {
    name: "Personal",
    value: "personal",
    description: "Private thoughts, reflections, and personal experiences",
    icon: <Archive className="w-6 h-6" />,
    color: "from-purple-500/20 to-purple-600/20",
    entryCount: 24,
    lastUpdated: "2h ago"
  },
  {
    name: "Work",
    value: "work",
    description: "Professional goals, projects, and career development",
    icon: <Database className="w-6 h-6" />,
    color: "from-blue-500/20 to-blue-600/20",
    entryCount: 18,
    lastUpdated: "1h ago"
  },
  {
    name: "Social",
    value: "social",
    description: "Interactions, relationships, and social activities",
    icon: <Grid className="w-6 h-6" />,
    color: "from-pink-500/20 to-pink-600/20",
    entryCount: 12,
    lastUpdated: "3h ago"
  },
  {
    name: "Interests & Hobbies",
    value: "interests_and_hobbies",
    description: "Passions, hobbies, and recreational activities",
    icon: <List className="w-6 h-6" />,
    color: "from-green-500/20 to-green-600/20",
    entryCount: 31,
    lastUpdated: "5h ago"
  },
  {
    name: "School",
    value: "school",
    description: "Academic progress, studies, and learning experiences",
    icon: <FolderTree className="w-6 h-6" />,
    color: "from-orange-500/20 to-orange-600/20",
    entryCount: 15,
    lastUpdated: "1d ago"
  },
];

type ViewMode = "grid" | "list";

const Categories = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const handleCategoryClick = (value: string) => {
    navigate(`/categories/${value}`);
  };

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <CenteredLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <Card className="glass-morphism overflow-hidden relative">
          <CardHeader className="relative space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm">
                  <FolderTree className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Categories</h1>
                  <p className="text-lg text-white/80 leading-relaxed mt-2 font-light max-w-2xl">
                    Explore and organize your entries by category. Each category provides a unique visualization of your content.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 p-2 rounded-lg bg-background/20 backdrop-blur-sm">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <LayoutList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Categories Grid/List */}
        <motion.div 
          variants={containerAnimation}
          initial="hidden"
          animate="show"
          className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
          }
        >
          {categories.map((category) => (
            <motion.div
              key={category.name}
              variants={itemAnimation}
              onClick={() => handleCategoryClick(category.value)}
              className={`group cursor-pointer ${viewMode === "list" ? "w-full" : ""}`}
            >
              <Card className={`relative overflow-hidden card-hover border border-white/10 ${
                viewMode === "list" ? "flex items-center" : ""
              }`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-50`} />
                <div className={`relative ${viewMode === "list" ? "flex items-center w-full p-4" : "p-6"} space-y-4`}>
                  <div className={viewMode === "list" ? "flex items-center w-full gap-4" : "space-y-4"}>
                    <div className="p-3 w-fit rounded-xl bg-background/50 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      {category.icon}
                    </div>
                    <div className={`${viewMode === "list" ? "flex-1 flex items-center justify-between" : "space-y-2"}`}>
                      <div>
                        <h3 className="text-xl font-semibold">{category.name}</h3>
                        <p className="text-sm text-white/70 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                      {viewMode === "list" && (
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>{category.entryCount} entries</span>
                          <span>{category.lastUpdated}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {viewMode === "grid" && (
                    <div className="flex items-center gap-3 text-sm text-white/60">
                      <span>{category.entryCount} entries</span>
                      <span>•</span>
                      <span>{category.lastUpdated}</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </CenteredLayout>
  );
};

export default Categories;
