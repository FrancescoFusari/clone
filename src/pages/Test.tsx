
import React from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Test = () => {
  const { data: entries, isLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-black text-white px-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-medium">My Notes</h1>
        <button className="rounded-full bg-zinc-900 p-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none py-1">
        <button className="flex items-center px-3 py-1.5 rounded-full bg-zinc-800 text-white">
          <span className="text-sm">All</span>
          <span className="ml-1.5 text-xs opacity-60">{entries?.length || 0}</span>
        </button>
        <button className="px-3 py-1.5 rounded-full bg-zinc-800/50 text-white/70 text-sm">Important</button>
        <button className="px-3 py-1.5 rounded-full bg-zinc-800/50 text-white/70 text-sm">To-do</button>
      </div>

      {/* Cards Grid */}
      <div className="columns-2 gap-2 space-y-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-zinc-800/50 rounded-2xl p-4 animate-pulse break-inside-avoid mb-2">
              <div className="h-5 bg-zinc-700/50 rounded-full w-2/3 mb-3"></div>
              <div className="h-3 bg-zinc-700/50 rounded-full w-full mb-2"></div>
              <div className="h-3 bg-zinc-700/50 rounded-full w-3/4"></div>
            </Card>
          ))
        ) : entries?.map((entry, index) => {
          const bgColors = ['#FEC6A1', '#FEF7CD', '#F5E6D3'];
          const bgColor = bgColors[index % bgColors.length];
          
          return (
            <Card 
              key={entry.id} 
              className="rounded-2xl p-4 break-inside-avoid mb-2" 
              style={{ backgroundColor: bgColor }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-black text-lg font-medium leading-tight">{entry.title}</h2>
                  <p className="text-black/60 text-xs mt-0.5">
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Heart className="text-black/70" size={18} />
              </div>
              <div className="text-black/80">
                <p className="text-sm leading-snug line-clamp-3">{entry.content}</p>
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {entry.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-black/10 text-black/70 text-xs">
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
        <button className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg">
          <Plus className="text-white" size={24} />
        </button>
        <button className="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center">
          <Mic className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};

export default Test;
