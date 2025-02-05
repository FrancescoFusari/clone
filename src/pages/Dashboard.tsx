import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Image, Tag, PieChart as PieChartIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Dashboard = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<any>(null);

  const { data: categoryStats, isLoading: loadingStats } = useQuery({
    queryKey: ['categoryStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('category')
        .eq('user_id', session?.user.id);

      if (error) throw error;

      const stats = data.reduce((acc: any, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(stats).map(([name, value]) => ({
        name,
        value,
      }));
    },
    enabled: !!session?.user.id,
  });

  const { data: tagStats, isLoading: loadingTags } = useQuery({
    queryKey: ['tagStats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_analytics')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user.id,
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('dashboard_preferences')
        .select('*')
        .eq('user_id', session?.user.id)
        .single();

      if (!error) {
        setPreferences(data);
      }
    };

    if (session?.user.id) {
      fetchPreferences();
    }
  }, [session?.user.id]);

  if (loadingStats || loadingTags || loadingProfile) {
    return <LoadingSkeleton />;
  }

  return (
    <CenteredLayout>
      <div className="space-y-8">
        {/* Header Card */}
        <Card className="border-none bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Personal Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{profile?.username}</h2>
                <p className="text-sm text-muted-foreground">
                  Welcome to your personal space
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Category Distribution */}
          <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryStats?.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryStats?.map((entry: any, index: number) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">
                      {entry.name}: {entry.value} entries
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Tags */}
          <Card className="border-none bg-gradient-to-br from-primary/10 to-background backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tagStats?.map((tag) => (
                  <div
                    key={tag.id}
                    className="rounded-full bg-primary/20 px-3 py-1 text-sm"
                  >
                    {tag.tag} ({tag.usage_count})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CenteredLayout>
  );
};

const LoadingSkeleton = () => (
  <CenteredLayout>
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px]" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[180px]" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </CenteredLayout>
);

export default Dashboard;