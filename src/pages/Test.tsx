
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, MoreVertical, ThumbsUp, Bookmark, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

const SCROLL_COOLDOWN = 250; // Increased cooldown for smoother transitions
const MIN_THRESHOLD = 30;
const MAX_THRESHOLD = 50;
const MAX_VISIBLE_CARDS = 3; // Limit number of visible cards for better performance

const Test = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<EntryCategory | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [lastTouchY, setLastTouchY] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastScrollTime, setLastScrollTime] = useState(0);

  useEffect(() => {
    const fetchEntries = async () => {
      setIsLoading(true);
      let query = supabase.from('entries').select('*').order('created_at', { ascending: false });
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching entries:', error);
        return;
      }
      
      setEntries(data || []);
      setIsLoading(false);
    };

    fetchEntries();
  }, [selectedCategory]);

  const getCategoryIcon = useCallback((category: EntryCategory) => {
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
  }, []);

  const getWrappedIndex = useCallback((index: number) => {
    if (entries.length === 0) return 0;
    return ((index % entries.length) + entries.length) % entries.length;
  }, [entries.length]);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    const now = Date.now();
    if (now - lastScrollTime < SCROLL_COOLDOWN) return;
    
    setLastScrollTime(now);
    setActiveIndex(prev => getWrappedIndex(direction === 'down' ? prev + 1 : prev - 1));
  }, [lastScrollTime, getWrappedIndex]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const threshold = Math.max(MIN_THRESHOLD, Math.min(MAX_THRESHOLD, Math.abs(e.deltaY)));
    if (Math.abs(e.deltaY) >= threshold) {
      handleScroll(e.deltaY > 0 ? 'down' : 'up');
    }
  }, [handleScroll]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
    setLastTouchY(e.touches[0].clientY);
    setIsScrolling(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartY || !lastTouchY) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - lastTouchY;
    const totalDeltaY = currentY - touchStartY;

    if (Math.abs(totalDeltaY) > 15) {
      setIsScrolling(true);
    }

    if (isScrolling) {
      const sensitivity = 35;
      if (Math.abs(deltaY) > sensitivity) {
        handleScroll(deltaY < 0 ? 'down' : 'up');
        setLastTouchY(currentY);
      }
    }
    
    setLastTouchY(currentY);
  }, [touchStartY, lastTouchY, isScrolling, handleScroll]);

  const handleTouchEnd = useCallback(() => {
    setTouchStartY(null);
    setLastTouchY(null);
    setIsScrolling(false);
  }, []);

  const categories: EntryCategory[] = useMemo(() => 
    ["personal", "work", "social", "interests", "school"], 
  []);

  const cardVariants = useMemo(() => ({
    initial: { 
      scale: 0.98,
      y: 40,
      opacity: 0,
      rotateX: 2
    },
    animate: (distance: number) => ({ 
      scale: 1 - (Math.abs(distance) * 0.02),
      y: distance * 20,
      rotateX: distance * 2,
      opacity: 1 - (Math.abs(distance) * 0.2),
      zIndex: 10 - Math.abs(distance)
    }),
    exit: { 
      scale: 0.98,
      y: -40,
      opacity: 0,
      rotateX: -2
    }
  }), []);

  const springConfig = useMemo(() => ({
    type: "spring" as const,
    stiffness: 200,
    damping: 20,
    mass: 0.6,
    restDelta: 0.001
  }), []);

  const visibleEntries = useMemo(() => {
    const result = [];
    for (let i = 0; i < Math.min(MAX_VISIBLE_CARDS, entries.length); i++) {
      const index = getWrappedIndex(activeIndex - Math.floor(MAX_VISIBLE_CARDS / 2) + i);
      result.push(entries[index]);
    }
    return result;
  }, [entries, activeIndex, getWrappedIndex]);

  return (
    <div className="min-h-screen bg-black text-white px-4">
      <div className="flex justify-between items-start pt-6 pb-4">
        <h1 className="text-[4rem] font-light leading-[1.1]">
          My<br />Entries
        </h1>
        <button className="rounded-full bg-zinc-800 p-2.5 hover:bg-zinc-700 transition-colors">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none py-1">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setActiveIndex(0);
          }}
          className={`flex items-center px-4 py-1.5 rounded-full text-base transition-colors ${
            selectedCategory === null 
              ? 'bg-[#1A1F2C] text-white font-medium' 
              : 'bg-[#222222] text-white/70 hover:bg-[#2A2A2A]'
          }`}
        >
          <span>All</span>
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setActiveIndex(0);
            }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-base transition-colors ${
              selectedCategory === category
                ? 'bg-[#1A1F2C] text-white font-medium'
                : 'bg-[#222222] text-white/70 hover:bg-[#2A2A2A]'
            }`}
          >
            {getCategoryIcon(category)}
            <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-white/50">Loading entries...</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white/50">No entries found</div>
        </div>
      ) : (
        <div 
          className="relative h-[600px] overflow-hidden touch-none select-none will-change-transform"
          style={{ perspective: '1200px' }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleEntries.map((entry, index) => {
              const realIndex = getWrappedIndex(activeIndex - Math.floor(MAX_VISIBLE_CARDS / 2) + index);
              const isActive = realIndex === activeIndex;
              const distance = index - Math.floor(MAX_VISIBLE_CARDS / 2);
              
              return (
                <motion.div
                  key={entry.id}
                  className="absolute w-full"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={cardVariants}
                  custom={distance}
                  transition={springConfig}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center',
                    touchAction: 'none',
                    pointerEvents: isActive ? 'auto' : 'none',
                    willChange: 'transform, opacity'
                  }}
                >
                  <div className={`bg-[#1A1F2C] rounded-3xl p-6 transition-all duration-300 ${
                    isActive ? 'shadow-lg shadow-black/20' : ''
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{entry.title}</h3>
                        <p className="text-sm text-white/60">
                          {format(new Date(entry.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#222222] text-sm">
                        {getCategoryIcon(entry.category)}
                        {entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-white/80 line-clamp-3 mb-4">
                      {entry.content}
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Test;
