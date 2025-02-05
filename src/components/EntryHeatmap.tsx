import React from "react";
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EntryHeatmapProps {
  entries: Array<{ created_at: string }>;
  days?: number;
}

export const EntryHeatmap = ({ entries, days = 365 }: EntryHeatmapProps) => {
  const today = new Date();
  const startDate = subDays(today, days);
  
  // Create array of all days in range
  const daysArray = eachDayOfInterval({ start: startDate, end: today });
  
  // Count entries per day
  const entriesPerDay = entries.reduce((acc: Record<string, number>, entry) => {
    const date = format(parseISO(entry.created_at), 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  // Helper function to get color based on count
  const getColor = (count: number) => {
    if (count === 0) return "bg-white/5";
    if (count === 1) return "bg-emerald-900/50";
    if (count <= 3) return "bg-emerald-700/50";
    if (count <= 5) return "bg-emerald-500/50";
    return "bg-emerald-300/50";
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-wrap gap-1">
        {daysArray.map((date) => {
          const formattedDate = format(date, 'yyyy-MM-dd');
          const count = entriesPerDay[formattedDate] || 0;
          
          return (
            <TooltipProvider key={formattedDate}>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`w-3 h-3 rounded-sm ${getColor(count)} transition-colors hover:opacity-80`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {format(date, 'MMM d, yyyy')}: {count} entries
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};