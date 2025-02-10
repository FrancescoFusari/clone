
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic, Briefcase, User, Users, Palette, GraduationCap, HeartHandshake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

type CategoryType = "personal" | "work" | "social" | "interests_and_hobbies" | "school" | "all";

const categoryConfig = {
  personal: { color: "#9b87f5", icon: User, label: "Personal" },
  work: { color: "#0EA5E9", icon: Briefcase, label: "Work" },
  social: { color: "#D946EF", icon: Users, label: "Social" },
  interests_and_hobbies: { color: "#F97316", icon: Palette, label: "Interests" },
  school: { color: "#8B5CF6", icon: GraduationCap, label: "School" }
};

const Test = () => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  const pageSize = 10;

  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries", page, selectedCategory],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-2" onScroll={handleScroll}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-medium`}>My Notes</h1>
        <button className="rounded-full bg-zinc-900 p-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none py-1">
        <button 
          onClick={() => setSelectedCategory("all")}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full 
            ${selectedCategory === "all" ? 'bg-zinc-800 text-white' : 'bg-zinc-800/50 text-white/70'} 
            ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <HeartHandshake size={isMobile ? 14 : 16} />
          <span>All</span>
          <span className="ml-1.5 opacity-60">{entries?.length || 0}</span>
        </button>

        {Object.entries(categoryConfig).map(([key, { color, icon: Icon, label }]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as CategoryType)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors
              ${selectedCategory === key ? 'bg-opacity-20' : 'bg-opacity-10 hover:bg-opacity-15'} 
              ${isMobile ? 'text-xs' : 'text-sm'}`}
            style={{ 
              backgroundColor: color,
              color: selectedCategory === key ? color : `${color}CC`
            }}
          >
            <Icon size={isMobile ? 14 : 16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className={`columns-${isMobile ? '1' : '2'} gap-2 space-y-2`}>
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-zinc-800/50 rounded-xl p-3 animate-pulse break-inside-avoid mb-2">
              <div className="h-4 bg-zinc-700/50 rounded-full w-2/3 mb-2"></div>
              <div className="h-2.5 bg-zinc-700/50 rounded-full w-full mb-1.5"></div>
              <div className="h-2.5 bg-zinc-700/50 rounded-full w-3/4"></div>
            </Card>
          ))
        ) : entries?.map((entry, index) => {
          const categoryColor = entry.category ? categoryConfig[entry.category].color : '#FEC6A1';
          
          return (
            <Card 
              key={entry.id} 
              className={`rounded-xl ${isMobile ? 'p-3' : 'p-4'} break-inside-avoid mb-2`}
              style={{ backgroundColor: `${categoryColor}1A` }} // Using 10% opacity version of category color
            >
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <h2 className={`text-white ${isMobile ? 'text-base' : 'text-lg'} font-medium leading-tight`}>
                    {entry.title}
                  </h2>
                  <p className="text-white/60 text-[10px] mt-0.5">
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Heart className="text-white/70" size={isMobile ? 16 : 18} />
              </div>
              <div className="text-white/80">
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} leading-snug line-clamp-3`}>
                  {entry.content}
                </p>
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.tags.map((tag: string) => (
                    <span 
                      key={tag} 
                      className={`px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 ${isMobile ? 'text-[10px]' : 'text-xs'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-3">
        <button className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} bg-black rounded-full flex items-center justify-center shadow-lg`}>
          <Plus className="text-white" size={isMobile ? 20 : 24} />
        </button>
        <button className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center`}>
          <Mic className="text-white" size={isMobile ? 20 : 24} />
        </button>
      </div>
    </div>
  );
};

export default Test;
