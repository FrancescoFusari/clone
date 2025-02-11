
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { Navigation } from "@/components/Navigation";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

const ENTRIES_PER_PAGE = 10;

const Test = () => {
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver>();

  const lastEntryElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      let query = supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * ENTRIES_PER_PAGE, (page + 1) * ENTRIES_PER_PAGE - 1);
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }
      
      if (data) {
        setEntries(prevEntries => {
          if (page === 0) return data;
          return [...prevEntries, ...data];
        });
        setHasMore(data.length === ENTRIES_PER_PAGE);
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [selectedCategory, page]);

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

  const getCategoryGradient = (category: EntryCategory) => {
    switch (category) {
      case "personal":
        return "from-purple-400/20 to-purple-500/10";
      case "work":
        return "from-blue-400/20 to-blue-500/10";
      case "social":
        return "from-pink-400/20 to-pink-500/10";
      case "interests":
        return "from-green-400/20 to-green-500/10";
      case "school":
        return "from-orange-400/20 to-orange-500/10";
      default:
        return "from-zinc-700/40 to-zinc-800/30";
    }
  };

  const categories: EntryCategory[] = ["personal", "work", "social", "interests", "school"];

  const truncateContent = (content: string) => {
    return content.length > 180 ? content.substring(0, 180) + "..." : content;
  };

  return (
    <>
      <div className="min-h-screen bg-zinc-900 text-zinc-100 px-4 pb-24">
        <div className="flex justify-between items-start pt-6 pb-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-light text-zinc-50">My Entries</h1>
            <p className="text-zinc-400">Browse and manage your entries</p>
          </div>
          <List className="w-6 h-6 text-zinc-400" />
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 no-scrollbar touch-pan-x">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setPage(0);
              setEntries([]);
            }}
            className={`flex items-center px-4 py-1.5 rounded-full text-base transition-colors shrink-0 ${
              selectedCategory === null 
                ? 'bg-zinc-100 text-zinc-900 font-medium' 
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80'
            }`}
          >
            <span>All</span>
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setPage(0);
                setEntries([]);
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-base transition-colors shrink-0 ${
                selectedCategory === category
                  ? 'bg-zinc-100 text-zinc-900 font-medium'
                  : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80'
              }`}
            >
              {getCategoryIcon(category)}
              <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
            </button>
          ))}
        </div>

        {entries.length === 0 && !isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-zinc-500">No entries found</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                ref={index === entries.length - 1 ? lastEntryElementRef : undefined}
                className={`bg-gradient-to-br ${getCategoryGradient(entry.category)} rounded-xl p-6 hover:bg-opacity-90 transition-all duration-200 backdrop-blur-sm border border-zinc-700/30`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1 text-zinc-100">{entry.title}</h3>
                    <p className="text-sm text-zinc-400">
                      {format(new Date(entry.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                <p className="text-zinc-300 mb-4">
                  {truncateContent(entry.content)}
                </p>

                <div className="flex flex-col gap-3 pt-4 border-t border-zinc-700/30">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-zinc-400">
                      {getCategoryIcon(entry.category)}
                      <span className="capitalize">{entry.category.replace(/_/g, " ")}</span>
                    </span>
                    {entry.subcategory && (
                      <span className="text-sm text-zinc-400">
                        {entry.subcategory}
                      </span>
                    )}
                  </div>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-full bg-zinc-800/60 text-xs text-zinc-300 border border-zinc-700/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-pulse text-zinc-500">Loading more entries...</div>
              </div>
            )}
          </div>
        )}
      </div>
      <Navigation />
    </>
  );
};

export default Test;

