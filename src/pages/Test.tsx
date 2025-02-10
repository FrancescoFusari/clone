
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
        <h1 className="text-3xl font-bold">My Notes</h1>
        <button className="rounded-full bg-zinc-900 p-2">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-none">
        <button className="flex items-center px-4 py-2 rounded-full bg-zinc-800 text-white">
          <span className="text-base">All</span>
          <span className="ml-2 text-sm opacity-60">{entries?.length || 0}</span>
        </button>
        <button className="px-4 py-2 rounded-full bg-zinc-800/50 text-white/70 text-base">Important</button>
        <button className="px-4 py-2 rounded-full bg-zinc-800/50 text-white/70 text-base">To-do</button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 gap-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="bg-zinc-800/50 rounded-3xl p-5 animate-pulse">
              <div className="h-6 bg-zinc-700/50 rounded-full w-2/3 mb-4"></div>
              <div className="h-4 bg-zinc-700/50 rounded-full w-full mb-2"></div>
              <div className="h-4 bg-zinc-700/50 rounded-full w-3/4"></div>
            </Card>
          ))
        ) : entries?.map((entry, index) => {
          const bgColors = ['#FEC6A1', '#FEF7CD', '#F5E6D3'];
          const bgColor = bgColors[index % bgColors.length];
          
          return (
            <Card key={entry.id} className="rounded-3xl p-5" style={{ backgroundColor: bgColor }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-black text-2xl font-semibold">{entry.title}</h2>
                  <p className="text-black/60 text-base mt-1">
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Heart className="text-black" size={24} />
              </div>
              <div className="text-black/80">
                <p className="text-lg line-clamp-3">{entry.content}</p>
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  {entry.tags.map((tag: string) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-black/10 text-black/70 text-sm">
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
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4">
        <button className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-lg">
          <Plus className="text-white" size={28} />
        </button>
        <button className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center">
          <Mic className="text-white" size={28} />
        </button>
      </div>
    </div>
  );
};

export default Test;
