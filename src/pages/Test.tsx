
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Briefcase, Users, Palette, GraduationCap, MoreVertical, ThumbsUp, Bookmark, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type Entry = Database["public"]["Tables"]["entries"]["Row"];

const SCROLL_COOLDOWN = 200; // ms
const MIN_THRESHOLD = 30;
const MAX_THRESHOLD = 60;

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
    // Wrap around to the other end when reaching boundaries
    if (index < 0) return entries.length - 1;
    if (index >= entries.length) return 0;
    return index;
  }, [entries.length]);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    const now = Date.now();
    if (now - lastScrollTime < SCROLL_COOLDOWN) return;
    
    setLastScrollTime(now);
    setActiveIndex(prev => {
      const newIndex = direction === 'down' ? prev + 1 : prev - 1;
      return getWrappedIndex(newIndex);
    });
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

    if (Math.abs(totalDeltaY) > 5) {
      setIsScrolling(true);
    }

    if (isScrolling) {
      const sensitivity = Math.max(20, Math.min(40, Math.abs(deltaY) * 1.5));
      
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
      scale: 0.9,
      y: 60,
      rotateX: 10,
      opacity: 0 
    },
    animate: (distance: number) => ({ 
      scale: 1 - (Math.abs(distance) * 0.05),
      y: distance * 30,
      rotateX: distance * 5,
      opacity: 1 - (Math.abs(distance) * 0.2),
      zIndex: entries.length - Math.abs(distance)
    }),
    exit: { 
      scale: 0.9,
      y: -60,
      rotateX: -10,
      opacity: 0
    }
  }), [entries.length]);

  const springConfig = useMemo(() => ({
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 1,
    restDelta: 0.001
  }), []);

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
          onClick={() => {
            setSelectedCategory(null);
            setActiveIndex(0);
          }}
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
            onClick={() => {
              setSelectedCategory(category);
              setActiveIndex(0);
            }}
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
          className="relative h-[600px] overflow-hidden perspective touch-none select-none will-change-transform"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {entries.map((entry, index) => {
              const isActive = index === activeIndex;
              const distance = ((index - activeIndex + entries.length) % entries.length) - Math.floor(entries.length / 2);
              const adjustedDistance = distance > entries.length / 2 ? distance - entries.length : distance;
              
              return (
                <motion.div
                  key={entry.id}
                  className="absolute w-full backface-hidden"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={cardVariants}
                  custom={adjustedDistance}
                  transition={springConfig}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center',
                    touchAction: 'none',
                    pointerEvents: isActive ? 'auto' : 'none',
                    willChange: 'transform, opacity'
                  }}
                >
                  <div className={`bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 border transition-all duration-300 ${
                    isActive ? 'border-white/20 shadow-lg' : 'border-white/10'
                  }`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{entry.title}</h3>
                        <p className="text-sm text-white/60">
                          {format(new Date(entry.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
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
