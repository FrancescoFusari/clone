
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic, User, Briefcase, Users, Palette, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

const Test = () => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
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

      if (selectedCategory) {
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

  const getCategoryIcon = (category: EntryCategory) => {
    switch (category) {
      case "personal":
        return <User className="h-4 w-4" />;
      case "work":
        return <Briefcase className="h-4 w-4" />;
      case "social":
        return <Users className="h-4 w-4" />;
      case "interests_and_hobbies":
        return <Palette className="h-4 w-4" />;
      case "school":
        return <GraduationCap className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: EntryCategory) => {
    switch (category) {
      case "personal":
        return "bg-purple-500/10 text-purple-500";
      case "work":
        return "bg-blue-500/10 text-blue-500";
      case "social":
        return "bg-pink-500/10 text-pink-500";
      case "interests_and_hobbies":
        return "bg-green-500/10 text-green-500";
      case "school":
        return "bg-orange-500/10 text-orange-500";
    }
  };

  const categories: EntryCategory[] = ["personal", "work", "social", "interests_and_hobbies", "school"];

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
          onClick={() => setSelectedCategory(null)}
          className={`flex items-center px-2.5 py-1 rounded-full ${
            selectedCategory === null 
              ? 'bg-white/20 text-white' 
              : 'bg-zinc-800/50 text-white/70'
          } ${isMobile ? 'text-xs' : 'text-sm'}`}
        >
          <span>All</span>
          <span className="ml-1.5 opacity-60">{entries?.length || 0}</span>
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors ${
              selectedCategory === category
                ? getCategoryColor(category)
                : 'bg-zinc-800/50 text-white/70'
            } ${isMobile ? 'text-xs' : 'text-sm'}`}
          >
            {getCategoryIcon(category)}
            <span>{category.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}</span>
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
        ) : entries?.map((entry) => {
          const categoryColor = getCategoryColor(entry.category).split(' ')[1]; // Get just the text color class
          
          return (
            <Card 
              key={entry.id} 
              className={`rounded-xl ${isMobile ? 'p-3' : 'p-4'} break-inside-avoid mb-2 bg-zinc-800/50 backdrop-blur-sm border border-white/5`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <h2 className={`text-white ${isMobile ? 'text-base' : 'text-lg'} font-medium leading-tight`}>
                    {entry.title}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`flex items-center gap-1 text-[10px] ${categoryColor}`}>
                      {getCategoryIcon(entry.category)}
                      {entry.category.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    <span className="text-white/40 text-[10px]">•</span>
                    <span className="text-white/40 text-[10px]">
                      {format(new Date(entry.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <Heart className="text-white/40 hover:text-pink-500 transition-colors cursor-pointer" 
                       size={isMobile ? 16 : 18} />
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
                      className={`px-1.5 py-0.5 rounded-full bg-white/5 text-white/60 ${isMobile ? 'text-[10px]' : 'text-xs'}`}
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
