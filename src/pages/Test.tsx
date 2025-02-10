
import React, { useState } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

const Test = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Temporary mock data for demonstration
  const mockEntries: Entry[] = [
    {
      id: '1',
      title: 'First Entry',
      content: 'This is a sample entry with some content that will be revealed when expanded.',
      category: 'personal',
      created_at: new Date().toISOString(),
      folder: 'default',
      user_id: '1',
    },
    {
      id: '2',
      title: 'Work Project Update',
      content: 'Progress update on the current project with details about implementation and next steps.',
      category: 'work',
      created_at: new Date().toISOString(),
      folder: 'default',
      user_id: '1',
    }
  ];

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

  const filteredEntries = selectedCategory
    ? mockEntries.filter(entry => entry.category === selectedCategory)
    : mockEntries;

  return (
    <div className="min-h-screen bg-black text-white px-4">
      <div className="flex justify-between items-start pt-6 pb-4">
        <h1 className="text-[4rem] font-light leading-[1.1]">
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

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card 
            key={entry.id}
            className="bg-zinc-900/50 border-white/10 overflow-hidden"
          >
            <ResizablePanelGroup
              direction="vertical"
              className="min-h-[100px]"
            >
              <ResizablePanel
                defaultSize={100}
                minSize={30}
                maxSize={100}
                onCollapse={() => setExpandedEntryId(null)}
                onExpand={() => setExpandedEntryId(entry.id)}
                className="transition-all duration-300"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">{entry.title}</h3>
                    {getCategoryIcon(entry.category)}
                  </div>
                  <p className="text-white/70 line-clamp-2">
                    {entry.content}
                  </p>
                  {expandedEntryId === entry.id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/90">{entry.content}</p>
                    </div>
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle className="bg-white/10 hover:bg-white/20 transition-colors" />
            </ResizablePanelGroup>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Test;
