
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, List, ThumbsUp, Bookmark, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

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

  const categories: EntryCategory[] = ["personal", "work", "social", "interests", "school"];

  const truncateContent = (content: string) => {
    return content.length > 180 ? content.substring(0, 180) + "..." : content;
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 pb-20">
      <div className="flex justify-between items-start pt-6 pb-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-light">My Entries</h1>
          <p className="text-zinc-400">Browse and manage your entries</p>
        </div>
        <List className="w-6 h-6 text-zinc-400" />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setPage(0);
            setEntries([]);
          }}
          className={`flex items-center px-4 py-1.5 rounded-full text-base transition-colors ${
            selectedCategory === null 
              ? 'bg-white text-black font-medium' 
              : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
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
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-base transition-colors ${
              selectedCategory === category
                ? 'bg-white text-black font-medium'
                : 'bg-zinc-800 text-white/70 hover:bg-zinc-700'
            }`}
          >
            {getCategoryIcon(category)}
            <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
          </button>
        ))}
      </div>

      {entries.length === 0 && !isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white/50">No entries found</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              ref={index === entries.length - 1 ? lastEntryElementRef : undefined}
              className="bg-zinc-900 rounded-xl p-6 hover:bg-zinc-800/80 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{entry.title}</h3>
                  <p className="text-sm text-white/60">
                    {format(new Date(entry.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-sm">
                  {getCategoryIcon(entry.category)}
                  {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                </span>
              </div>
              
              <p className="text-white/80 mb-4">
                {truncateContent(entry.content)}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex gap-6">
                  <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-pulse text-white/50">Loading more entries...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Test;

