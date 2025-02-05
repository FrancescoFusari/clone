import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Tag, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { CenteredLayout } from "@/components/layouts/CenteredLayout";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["entriesTimeline"],
    queryFn: async () => {
      console.log("Fetching entries timeline...");
      const { data, error } = await supabase
        .from("entries")
        .select("*")
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const toggleEntry = (entryId: string) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <CenteredLayout>
      <div className="space-y-8 px-4 md:px-0">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gradient">Activity Timeline</h1>
          <p className="text-white/60">Your recent entries and activities</p>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="relative"
          >
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 h-full w-px bg-white/10 transform -translate-x-1/2" />

            {entries?.map((entry) => (
              <motion.div
                key={entry.id}
                variants={item}
                className="mb-8 flex flex-col md:flex-row md:justify-between group"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 md:left-1/2 w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 transition-transform duration-200 group-hover:scale-150" />

                {/* Content card */}
                <Card 
                  className="ml-6 md:ml-0 md:w-[45%] transition-all duration-300 cursor-pointer backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl group-hover:scale-[1.02]"
                  onClick={() => toggleEntry(entry.id)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="flex items-center justify-between text-lg text-white/90">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {entry.title}
                      </div>
                      {expandedEntryId === entry.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.created_at), "PPp")}
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {expandedEntryId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-white/80 mb-3">
                            {entry.content}
                          </p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag className="h-3 w-3 text-white/60" />
                              {entry.tags.map((tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-white/10 text-white/80 hover:bg-white/20 text-xs rounded-full"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/entries/${entry.id}`);
                            }}
                            className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            View Details →
                          </button>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-[45%]" />
              </motion.div>
            ))}
          </motion.div>
        </ScrollArea>
      </div>
    </CenteredLayout>
  );
};

export default Dashboard;