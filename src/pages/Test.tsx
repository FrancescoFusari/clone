
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Heart, Plus, Mic, Folder } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const Test = () => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const pageSize = 10;

  const { data: entries, isLoading, fetchNextPage, hasNextPage } = useQuery({
    queryKey: ["entries", page, selectedFolder],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from("entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedFolder !== "all") {
        query = query.eq("folder", selectedFolder);
      }

      const { data, error } = await query.range(from, to);

      if (error) throw error;
      return data;
    },
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoading && hasNextPage) {
      setPage(prev => prev + 1);
    }
  };

  const folders = [
    { id: "all", label: "All Notes", color: "bg-zinc-800" },
    { id: "design", label: "Design", color: "bg-blue-500/20 text-blue-400" },
    { id: "minimal", label: "Minimal", color: "bg-purple-500/20 text-purple-400" },
    { id: "sleek", label: "Sleek", color: "bg-emerald-500/20 text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-black text-white px-2" onScroll={handleScroll}>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-medium`}>My Notes</h1>
          <span className="text-zinc-400">·</span>
          <span className="text-zinc-400 capitalize">{selectedFolder}</span>
        </div>
        <button className="rounded-full bg-zinc-900 p-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Folder Selection */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none py-1">
        {folders.map(folder => (
          <button
            key={folder.id}
            onClick={() => setSelectedFolder(folder.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors
              ${folder.id === selectedFolder ? folder.color : 'bg-zinc-800/50 text-white/70'}
              ${isMobile ? 'text-xs' : 'text-sm'}`}
          >
            {folder.id === "all" ? (
              <span>{folder.label}</span>
            ) : (
              <>
                <Folder className="w-3.5 h-3.5" />
                <span>{folder.label}</span>
              </>
            )}
            {folder.id === "all" && (
              <span className="ml-1.5 opacity-60">{entries?.length || 0}</span>
            )}
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
          const bgColors = {
            design: ['#FEC6A1', '#FEF7CD', '#F5E6D3'],
            minimal: ['#E6E6E6', '#F0F0F0', '#F5F5F5'],
            sleek: ['#D4F0E2', '#E2F0EA', '#E8F5F0']
          };
          const folderColors = bgColors[entry.folder as keyof typeof bgColors] || bgColors.design;
          const bgColor = folderColors[index % folderColors.length];
          
          return (
            <Card 
              key={entry.id} 
              className={`rounded-xl ${isMobile ? 'p-2.5' : 'p-3.5'} break-inside-avoid mb-2`}
              style={{ backgroundColor: bgColor }}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div>
                  <h2 className={`text-black ${isMobile ? 'text-sm' : 'text-base'} font-medium leading-tight`}>
                    {entry.title}
                  </h2>
                  <p className="text-black/60 text-[10px] mt-0.5">
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <Heart className="text-black/70" size={isMobile ? 14 : 16} />
              </div>
              <div className="text-black/80">
                <p className={`${isMobile ? 'text-xs leading-relaxed' : 'text-sm'} line-clamp-3`}>
                  {entry.content}
                </p>
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {entry.tags.map((tag: string) => (
                    <span 
                      key={tag} 
                      className={`px-1.5 py-0.5 rounded-full bg-black/10 text-black/70 ${isMobile ? 'text-[10px]' : 'text-xs'}`}
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
        <button className={`${isMobile ? 'w-11 h-11' : 'w-14 h-14'} bg-black rounded-full flex items-center justify-center shadow-lg`}>
          <Plus className="text-white" size={isMobile ? 18 : 24} />
        </button>
        <button className={`${isMobile ? 'w-11 h-11' : 'w-14 h-14'} bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center`}>
          <Mic className="text-white" size={isMobile ? 18 : 24} />
        </button>
      </div>
    </div>
  );
};

export default Test;
