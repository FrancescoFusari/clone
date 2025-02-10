
import React, { useState } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, MoreVertical, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

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

const Test = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);

  // Fetch entries from Supabase
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Entry[];
    },
  });

  const categories: EntryCategory[] = ["personal", "work", "social", "interests", "school"];

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
              <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-[220px] pb-20 px-4 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20" />
          </div>
        ) : (
          <div className="space-y-4">
            {entries
              .filter(entry => !selectedCategory || entry.category === selectedCategory)
              .map(entry => (
                <Card 
                  key={entry.id}
                  className="backdrop-blur-lg bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(entry.category)}
                        <h3 className="font-medium">{entry.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-white/60">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {format(new Date(entry.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-white/70">{entry.content}</p>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Test;
