
import React, { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic, User, Briefcase, Users, Palette, GraduationCap, MoreVertical } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

const Test = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["infinite-entries", selectedCategory],
    queryFn: async ({ pageParam = 0 }) => {
      const from = Number(pageParam) * pageSize;
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
    getNextPageParam: (lastPage, allPages) => {
      return lastPage && lastPage.length === pageSize ? allPages.length : undefined;
    },
    initialPageParam: 0
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const entries = data?.pages.flat() || [];

  const getCategoryIcon = (category: EntryCategory) => {
    switch (category) {
      case "personal":
        return <User className="h-4 w-4" />;
      case "work":
        return <Briefcase className="h-4 w-4" />;
      case "social":
        return <Users className="h-4 w-4" />;
      case "interests":
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
      case "interests":
        return "bg-green-500/10 text-green-500";
      case "school":
        return "bg-orange-500/10 text-orange-500";
    }
  };

  const categories: EntryCategory[] = ["personal", "work", "social", "interests", "school"];

  return (
    <div className="min-h-screen bg-black text-white px-4">
      <div className="flex justify-between items-start pt-6 pb-4">
        <h1 className="text-[4rem] font-medium leading-[1.1]">
          My<br />Entries
        </h1>
        <button className="rounded-full bg-zinc-800/80 p-2.5 hover:bg-zinc-700/80 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex items-center px-4 py-1.5 rounded-full text-base transition-colors border border-white/10 ${
            selectedCategory === null 
              ? 'bg-white/10 text-white font-medium' 
              : 'bg-transparent text-white/70 hover:bg-white/5'
          }`}
        >
          <span>All</span>
          <span className="ml-2 opacity-60">{entries?.length || 0}</span>
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-base transition-colors border border-white/10 ${
              selectedCategory === category
                ? 'bg-white/10 text-white font-medium'
                : 'bg-transparent text-white/70 hover:bg-white/5'
            }`}
          >
            {getCategoryIcon(category)}
            <span>{category.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}</span>
          </button>
        ))}
      </div>

      <div className={`columns-${isMobile ? '1' : '2'} gap-2 space-y-2`}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-zinc-800/50 rounded-xl p-3 animate-pulse break-inside-avoid mb-2">
              <div className="h-4 bg-zinc-700/50 rounded-full w-2/3 mb-2"></div>
              <div className="h-2.5 bg-zinc-700/50 rounded-full w-full mb-1.5"></div>
              <div className="h-2.5 bg-zinc-700/50 rounded-full w-3/4"></div>
            </Card>
          ))
        ) : entries?.map((entry: Entry) => {
          const categoryColor = getCategoryColor(entry.category).split(' ')[1];
          
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

        {isFetchingNextPage && (
          <div ref={loaderRef} className="col-span-full py-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/20"></div>
            </div>
          </div>
        )}
      </div>

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
