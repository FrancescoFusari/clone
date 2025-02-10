
import React, { useState } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, MoreVertical, ChevronDown } from "lucide-react";
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
  const mockEntries: Partial<Entry>[] = [
    {
      id: '1',
      title: 'First Entry',
      content: 'This is a sample entry with some content that will be revealed when expanded. It contains more text to demonstrate the expansion behavior. When you drag the handle down or click the expand button, you will see all of this content.',
      category: 'personal',
      created_at: new Date().toISOString(),
      folder: 'default',
      user_id: '1',
    },
    {
      id: '2',
      title: 'Work Project Update',
      content: 'Progress update on the current project with details about implementation and next steps. This is a longer entry that contains multiple paragraphs to show how the content expands smoothly when the card is expanded. You can see more details about the project here.',
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

  const toggleExpanded = (entryId: string) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId);
  };

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
            <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
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
              <ResizablePanel defaultSize={100}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium">{entry.title}</h3>
                    <div className="flex items-center gap-3">
                      {entry.category && getCategoryIcon(entry.category)}
                      <button
                        onClick={() => toggleExpanded(entry.id!)}
                        className={`p-1 rounded-full hover:bg-white/5 transition-transform ${
                          expandedEntryId === entry.id ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`transition-all duration-300 ${
                    expandedEntryId === entry.id ? '' : 'line-clamp-2'
                  }`}>
                    <p className="text-white/70">{entry.content}</p>
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle 
                className="bg-white/10 hover:bg-white/20 transition-colors"
                onDoubleClick={() => toggleExpanded(entry.id!)}
              />
            </ResizablePanelGroup>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Test;
