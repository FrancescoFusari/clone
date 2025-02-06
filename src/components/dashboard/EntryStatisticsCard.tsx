import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export const EntryStatisticsCard = () => {
  const { session } = useAuth();

  const { data: statistics, isLoading } = useQuery({
    queryKey: ["entryStatistics", session?.user.id],
    queryFn: async () => {
      // Get total entries count
      const { count: totalEntries, error: countError } = await supabase
        .from("entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session?.user.id);

      if (countError) throw countError;

      // Get entries for the last 6 months
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from("entries")
        .select("created_at")
        .eq("user_id", session?.user.id)
        .gte("created_at", sixMonthsAgo.toISOString())
        .lte("created_at", now.toISOString());

      if (monthlyError) throw monthlyError;

      // Process monthly data
      const monthlyStats = Array.from({ length: 6 }, (_, i) => {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const entriesInMonth = monthlyData?.filter(
          entry => {
            const entryDate = new Date(entry.created_at);
            return entryDate >= monthStart && entryDate <= monthEnd;
          }
        ).length || 0;

        return {
          month: format(monthDate, "MMM"),
          entries: entriesInMonth,
        };
      }).reverse();

      // Calculate average entries per week
      const totalWeeks = 24; // 6 months * 4 weeks
      const avgEntriesPerWeek = 
        monthlyStats.reduce((acc, curr) => acc + curr.entries, 0) / totalWeeks;

      return {
        totalEntries: totalEntries || 0,
        monthlyStats,
        avgEntriesPerWeek: Math.round(avgEntriesPerWeek * 10) / 10,
      };
    },
    enabled: !!session?.user.id,
  });

  if (isLoading) {
    return (
      <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Entry Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-primary/5 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Entry Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Entries</p>
            <p className="text-2xl font-bold">{statistics?.totalEntries}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg. Weekly Entries</p>
            <p className="text-2xl font-bold">{statistics?.avgEntriesPerWeek}</p>
          </div>
        </div>

        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statistics?.monthlyStats}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="entries" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};