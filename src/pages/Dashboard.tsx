import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Tag, Calendar, List, ChartBar } from "lucide-react";
import { format } from "date-fns";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { toast } = useToast();

  // Fetch tag analytics
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

  // Process entries data for the timeline chart
  const timelineData = entries?.reduce((acc: any[], entry) => {
    const date = format(new Date(entry.created_at), "MMM d");
    const existingDate = acc.find((item) => item.date === date);
    
    if (existingDate) {
      existingDate.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    
    return acc;
  }, []) || [];

  // Process entries data for category distribution
  const categoryData = entries?.reduce((acc: any[], entry) => {
    const existingCategory = acc.find((item) => item.category === entry.category);
    
    if (existingCategory) {
      existingCategory.count += 1;
    } else {
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

  return (
    <CenteredLayout>
      <h1 className="text-3xl font-bold mb-8 text-white/90">Analytics Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Tags Card */}
        <Card className="backdrop-blur-lg bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Tag className="h-5 w-5" />
              Popular Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Usage Count</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tagAnalytics?.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="text-white/80">{tag.tag}</TableCell>
                      <TableCell className="text-white/80">{tag.usage_count}</TableCell>
                      <TableCell className="text-white/80">
                        {format(new Date(tag.last_used || ''), 'MMM d, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card className="backdrop-blur-lg bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90">
              <Calendar className="h-5 w-5" />
              Entry Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineData}>
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Bar
                      dataKey="count"
                      fill="rgba(255, 255, 255, 0.2)"
                      radius={[4, 4, 0, 0]}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <ChartTooltipContent>
                            <div className="text-sm font-medium text-white/90">
                              {payload[0].payload.date}
                            </div>
                            <div className="text-sm text-white/60">
                              {payload[0].value} entries
                            </div>
                          </ChartTooltipContent>
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Card */}
        <Card className="backdrop-blur-lg bg-white/5 border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white/90">
              <List className="h-5 w-5" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(value) => value.replace(/_/g, ' ')}
                    />
                    <Bar
                      dataKey="count"
                      fill="rgba(255, 255, 255, 0.2)"
                      radius={[0, 4, 4, 0]}
                    />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <ChartTooltipContent>
                            <div className="text-sm font-medium text-white/90">
                              {payload[0].payload.category.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm text-white/60">
                              {payload[0].value} entries
                            </div>
                          </ChartTooltipContent>
                        );
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </CenteredLayout>
  );
};

export default Dashboard;