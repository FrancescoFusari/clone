import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { Tag, Calendar, List, ChartBar } from "lucide-react";
import { format } from "date-fns";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: tagAnalytics, isLoading: isLoadingTags } = useQuery({
    queryKey: ["tagAnalytics"],
    queryFn: async () => {
      console.log("Fetching tag analytics...");
      const { data, error } = await supabase
        .from("tag_analytics")
        .select("*")
        .order("usage_count", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching tag analytics:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tag analytics",
        });
        throw error;
      }

      console.log("Fetched tag analytics:", data);
      return data;
    },
  });

  // Fetch entries for timeline
  const { data: entries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ["entriesTimeline"],
    queryFn: async () => {
      console.log("Fetching entries timeline...");
      const { data, error } = await supabase
        .from("entries")
        .select("created_at, category")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching entries:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load entries timeline",
        });
        throw error;
      }

      console.log("Fetched entries:", data);
      return data;
    },
  });

  // Process entries data for the timeline chart (last 30 days for mobile, 60 for desktop)
  const timelineData = entries?.reduce((acc: any[], entry) => {
    const date = format(new Date(entry.created_at), "MMM d");
    const existingDate = acc.find((item) => item.date === date);
    
    if (existingDate) {
      existingDate.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    
    return acc;
  }, []).slice(0, isMobile ? 14 : 30).reverse() || [];

  const categoryData = entries?.reduce((acc: any[], entry) => {
    const existingCategory = acc.find((item) => item.category === entry.category);
    
    if (existingCategory) {
      existingCategory.count += 1;
    } else if (entry.category) {
      acc.push({ category: entry.category, count: 1 });
    }
    
    return acc;
  }, []) || [];

  if (isLoadingTags || isLoadingEntries) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalEntries = entries?.length || 0;
  const uniqueCategories = categoryData.length;
  const uniqueTags = tagAnalytics?.length || 0;

  return (
    <CenteredLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gradient">Analytics Dashboard</h1>
          <p className="text-white/60">Track your writing patterns and insights</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-morphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white/90">
                <ChartBar className="h-4 w-4" />
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{totalEntries}</p>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white/90">
                <List className="h-4 w-4" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{uniqueCategories}</p>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-white/90">
                <Tag className="h-4 w-4" />
                Unique Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{uniqueTags}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Timeline Chart */}
          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <Calendar className="h-5 w-5" />
                Entry Timeline
              </CardTitle>
              <p className="text-sm text-white/60">
                Last {isMobile ? "14" : "30"} days of activity
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer config={{}}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={timelineData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgba(255,255,255,0.2)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="rgba(255,255,255,0.2)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval={isMobile ? 2 : 1}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? "end" : "middle"}
                        height={isMobile ? 60 : 30}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="rgba(255,255,255,0.5)"
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        strokeWidth={2}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="glass-morphism p-2 rounded-lg shadow-lg">
                              <p className="text-sm font-medium text-white/90">
                                {payload[0].payload.date}
                              </p>
                              <p className="text-sm text-white/60">
                                {payload[0].value} entries
                              </p>
                            </div>
                          );
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <Tag className="h-5 w-5" />
                Popular Tags
              </CardTitle>
              <p className="text-sm text-white/60">Most frequently used tags</p>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="hidden md:table-cell">Last Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tagAnalytics?.map((tag) => (
                      <TableRow key={tag.id}>
                        <TableCell className="text-white/80">{tag.tag}</TableCell>
                        <TableCell className="text-white/80">{tag.usage_count}</TableCell>
                        <TableCell className="hidden md:table-cell text-white/60">
                          {format(new Date(tag.last_used || ''), 'MMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="glass-morphism md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white/90">
                <List className="h-5 w-5" />
                Category Distribution
              </CardTitle>
              <p className="text-sm text-white/60">Breakdown of entries by category</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ChartContainer config={{}}>
                  <ResponsiveContainer>
                    <AreaChart
                      data={categoryData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="categoryColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="rgba(255,255,255,0.2)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="rgba(255,255,255,0.2)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="category"
                        stroke="#94a3b8"
                        fontSize={12}
                        interval={0}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? "end" : "middle"}
                        height={isMobile ? 80 : 40}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="rgba(255,255,255,0.5)"
                        fill="url(#categoryColor)"
                        fillOpacity={1}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="glass-morphism p-2 rounded-lg">
                              <p className="text-sm font-medium text-white/90">
                                {payload[0].payload.category}
                              </p>
                              <p className="text-sm text-white/60">
                                {payload[0].value} entries
                              </p>
                            </div>
                          );
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CenteredLayout>
  );
};

export default Dashboard;