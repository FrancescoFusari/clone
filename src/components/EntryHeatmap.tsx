import React from "react";
import { format, parseISO, eachDayOfInterval, subDays, startOfWeek, addDays, getMonth } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface EntryHeatmapProps {
  entries: Array<{ created_at: string }>;
  days?: number;
}

export const EntryHeatmap = ({ entries, days = 90 }: EntryHeatmapProps) => {
  const isMobile = useIsMobile();
  const defaultDays = isMobile ? 60 : 90;
  const today = new Date();
  const startDate = subDays(today, days || defaultDays);
  
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

  // Create weeks array for calendar-like display
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let currentMonth = -1;
  const monthLabels: { month: string, index: number }[] = [];

  daysArray.forEach((date, index) => {
    // Check if we need to start a new week
    if (index === 0) {
      // Fill in days from start of week if necessary
      const weekStart = startOfWeek(date);
      let paddingDay = weekStart;
      while (paddingDay < date) {
        currentWeek.push(paddingDay);
        paddingDay = addDays(paddingDay, 1);
      }
    }

    // Track months for labels
    const month = getMonth(date);
    if (month !== currentMonth) {
      monthLabels.push({ month: format(date, 'MMM'), index: weeks.length });
      currentMonth = month;
    }

    currentWeek.push(date);

    // Start new week on Sunday or if it's the last day
    if (currentWeek.length === 7 || index === daysArray.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const dayLabels = isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full overflow-x-auto scrollbar-none">
      <div className="flex flex-col gap-1">
        {/* Month labels */}
        <div className="flex pl-6 md:pl-8">
          {monthLabels.map(({ month, index }, i) => (
            <div
              key={`${month}-${index}`}
              className="text-[10px] md:text-xs text-white/60"
              style={{
                position: 'relative',
                left: `${index * (isMobile ? 12 : 16)}px`,
                marginRight: i < monthLabels.length - 1 ? (isMobile ? '12px' : '20px') : '0'
              }}
            >
              {month}
            </div>
          ))}
        </div>

        {/* Day labels and contribution squares */}
        <div className="flex">
          {/* Day of week labels */}
          <div className="flex flex-col gap-1 pr-1 md:pr-2">
            {dayLabels.map((day) => (
              <div key={day} className="h-2 md:h-3 text-[10px] md:text-xs text-white/60 flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Contribution squares */}
          <div className="flex gap-[2px] md:gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px] md:gap-1">
                {week.map((date) => {
                  const formattedDate = format(date, 'yyyy-MM-dd');
                  const count = entriesPerDay[formattedDate] || 0;
                  
                  return (
                    <TooltipProvider key={formattedDate}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-sm ${getColor(count)} transition-colors hover:opacity-80`}
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};