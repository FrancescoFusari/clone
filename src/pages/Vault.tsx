
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, List, Eye, FileText, Image, Link, CloudOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { Navigation } from "@/components/Navigation";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useSyncEntries } from "@/hooks/use-sync-entries";
import { getOfflineEntries, type OfflineEntry } from "@/lib/db";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

const ENTRIES_PER_PAGE = 10;

const Test = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const { isSyncing } = useSyncEntries();
  const categories: EntryCategory[] = ["personal", "work", "social", "interests", "school"];
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [entries, setEntries] = useState<(Entry | OfflineEntry)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const observer = useRef<IntersectionObserver>();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    if (!session?.user) {
      navigate('/auth');
      return;
    }

    const fetchEntries = async () => {
      try {
        setIsLoading(true);
        let onlineEntries: Entry[] = [];
        let offlineEntries: OfflineEntry[] = [];

        // Fetch online entries if we're online
        if (isOnline) {
          let query = supabase
            .from('entries')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .range(page * ENTRIES_PER_PAGE, (page + 1) * ENTRIES_PER_PAGE - 1);
          
          if (selectedCategory) {
            query = query.eq('category', selectedCategory);
          }
          
          const { data, error } = await query;
          
          if (error) {
            console.error('Error fetching online entries:', error);
            toast({
              variant: "destructive",
              title: "Error fetching entries",
              description: "There was a problem loading your entries. Please try again.",
            });
          } else {
            onlineEntries = data || [];
          }
        }

        // Always fetch offline entries
        offlineEntries = await getOfflineEntries();
        if (selectedCategory) {
          offlineEntries = offlineEntries.filter(entry => entry.category === selectedCategory);
        }

        // Combine and sort entries
        const combinedEntries = [...onlineEntries, ...offlineEntries].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setEntries(prevEntries => {
          if (page === 0) return combinedEntries;
          return [...prevEntries, ...combinedEntries];
        });
        setHasMore(onlineEntries.length === ENTRIES_PER_PAGE);
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, [selectedCategory, page, session, navigate, toast, isOnline]);

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

  const getCategoryAccentColor = (category: EntryCategory) => {
    switch (category) {
      case "personal":
        return "text-purple-400";
      case "work":
        return "text-blue-400";
      case "social":
        return "text-pink-400";
      case "interests":
        return "text-green-400";
      case "school":
        return "text-orange-400";
      default:
        return "text-zinc-400";
    }
  };

  const getEntryTypeIcon = (entry: Entry | OfflineEntry) => {
    switch (entry.entry_type) {
      case "image":
        return <Image className="h-4 w-4 text-zinc-400" />;
      case "url":
        return <Link className="h-4 w-4 text-zinc-400" />;
      default:
        return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  const truncateContent = (content: string) => {
    return content.length > 180 ? content.substring(0, 180) + "..." : content;
  };

  if (!session) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-zinc-900 text-zinc-100 px-2 pb-24">
        <div className="flex justify-between items-start pt-6 pb-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-light text-zinc-50">My Entries</h1>
            <p className="text-zinc-400">Browse and manage your entries</p>
            {isSyncing && (
              <p className="text-sm text-yellow-400">Syncing offline entries...</p>
            )}
            {!isOnline && (
              <p className="text-sm text-orange-400 flex items-center gap-2">
                <CloudOff className="h-4 w-4" />
                Offline mode - Some features may be limited
              </p>
            )}
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
                className="bg-zinc-800/40 rounded-xl p-6 pr-16 hover:bg-zinc-800/60 transition-colors relative border border-white/10"
              >
                <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/entries/${entry.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {getEntryTypeIcon(entry)}
                  {'synced' in entry && entry.synced === 0 && (
                    <CloudOff className="h-4 w-4 text-orange-400" />
                  )}
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-medium text-zinc-100">
                      {entry.title}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {format(new Date(entry.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                
                <p className="text-zinc-300/80 mb-4 leading-relaxed">
                  {truncateContent(entry.content)}
                </p>

                <div className="flex flex-col gap-3 pt-4 border-t border-zinc-700/50">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-2 text-sm ${getCategoryAccentColor(entry.category)}`}>
                      {getCategoryIcon(entry.category)}
                      <span>{entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}</span>
                    </span>
                    {entry.subcategory && (
                      <span className="text-sm text-zinc-500">
                        {entry.subcategory}
                      </span>
                    )}
                  </div>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md text-xs bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
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
