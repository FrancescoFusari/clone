
import React, { useState } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

interface EntryWindowProps {
  entry: {
    id: string;
    title: string;
    content: string;
    category: EntryCategory;
    position?: { x: number; y: number };
  };
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
}

const EntryWindow = ({ entry, onDragEnd }: EntryWindowProps) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={entry.position || { x: 0, y: 0 }}
      animate={{ scale: isDragging ? 1.02 : 1 }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDragEnd(entry.id, { x: info.point.x, y: info.point.y });
      }}
      className="absolute"
      style={{ position: 'absolute', ...entry.position }}
    >
      <Card className="w-[300px] neo-blur overflow-hidden cursor-move">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(entry.category)}
            <h3 className="font-medium text-sm">{entry.title}</h3>
          </div>
          <button className="rounded-full hover:bg-white/5 p-1 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-white/70">{entry.content}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Test = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [entries] = useState([
    {
      id: '1',
      title: 'First Entry',
      content: 'This is a sample entry that you can drag around the canvas.',
      category: 'personal' as EntryCategory,
      position: { x: 100, y: 100 },
    },
    {
      id: '2',
      title: 'Work Notes',
      content: 'Important meeting notes and tasks to follow up on.',
      category: 'work' as EntryCategory,
      position: { x: 450, y: 150 },
    },
    {
      id: '3',
      title: 'Project Ideas',
      content: 'Brainstorming new features and improvements.',
      category: 'interests' as EntryCategory,
      position: { x: 200, y: 300 },
    },
  ]);

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

  const handleDragEnd = (id: string, position: { x: number; y: number }) => {
    // In a real app, you would update the entry position in your state management system
    console.log(`Entry ${id} moved to:`, position);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-0 left-0 right-0 z-10 px-4 bg-black/80 backdrop-blur-lg border-b border-white/10">
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
      </div>

      <div className="pt-[220px] min-h-screen w-full relative">
        {entries
          .filter(entry => !selectedCategory || entry.category === selectedCategory)
          .map(entry => (
            <EntryWindow
              key={entry.id}
              entry={entry}
              onDragEnd={handleDragEnd}
            />
          ))}
      </div>
    </div>
  );
};

export default Test;
