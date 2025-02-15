import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { Slider } from "./ui/slider";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

interface Node {
  id: string;
  name: string;
  type: "user" | "category" | "subcategory" | "entry" | "tag";
  val: number;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

interface Link {
  source: string;
  target: string;
  color?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export const UnifiedGraphVisualization = () => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [linkOpacity, setLinkOpacity] = useState(80);

  const { data: entries } = useQuery({
    queryKey: ["all-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile?.graph_settings?.linkOpacity) {
      setLinkOpacity(profile.graph_settings.linkOpacity);
    }
  }, [profile]);

  const handleOpacityChange = async (value: number) => {
    setLinkOpacity(value);
    
    if (!profile?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        graph_settings: {
          linkOpacity: value
        }
      })
      .eq('id', profile.id);

    if (error) {
      toast.error("Failed to save graph settings");
      console.error("Error saving graph settings:", error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      graphRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!entries || !graphRef.current || !profile) return;

    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    // Add central user node
    graphData.nodes.push({
      id: profile.id,
      name: profile.username || "User",
      type: "user",
      val: 300
    });

    const categories = new Set<EntryCategory>();
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    entries.forEach(entry => {
      categories.add(entry.category);
      
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 20
      });

      // Get category color before using it
      const categoryColor = getCategoryColor(entry.category);
      if (categoryColor) {
        graphData.links.push({
          source: entry.category,
          target: entry.id,
          color: categoryColor.link
        });
      }

      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
        if (categoryColor) {
          graphData.links.push({
            source: entry.id,
            target: entry.subcategory,
            color: categoryColor.link
          });
        }
      }

      entry.tags?.forEach(tag => {
        tags.add(tag);
        if (categoryColor) {
          graphData.links.push({
            source: entry.id,
            target: tag,
            color: categoryColor.link
          });
        }
      });
    });

    categories.forEach(cat => {
      graphData.nodes.push({
        id: cat,
        name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "category",
        val: 100
      });
      const categoryColor = getCategoryColor(cat);
      if (categoryColor) {
        graphData.links.push({
          source: profile.id,
          target: cat,
          color: categoryColor.link
        });
      }
    });

    subcategories.forEach(sub => {
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 40
      });
    });

    tags.forEach(tag => {
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 5
      });
    });

    const Graph = ForceGraph3D({});
    const graphInstance = Graph(graphRef.current)
      .graphData(graphData)
      .nodeLabel("name")
      .nodeColor(node => {
        const n = node as Node;
        switch (n.type) {
          case "user":
            return "#9b87f5";
          case "category":
            const catColor = getCategoryColor(n.id as EntryCategory);
            return catColor ? catColor.primary : "#F5F3F2";
          case "subcategory":
            const subCatColor = getCategoryColor(getNodeCategory(n.id, graphData) as EntryCategory);
            return subCatColor ? subCatColor.secondary : "#F5F3F2";
          case "entry":
            const entryColor = getCategoryColor(getNodeCategory(n.id, graphData) as EntryCategory);
            return entryColor ? entryColor.tertiary : "#F5F3F2";
          case "tag":
            const tagColor = getCategoryColor(getNodeCategory(n.id, graphData) as EntryCategory);
            return tagColor ? tagColor.soft : "#F5F3F2";
          default:
            return "#F5F3F2";
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(0.8)
      .linkColor(link => {
        const l = link as Link;
        if (l.color) {
          // Convert rgba color to use custom opacity
          const rgbaMatch = l.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
          if (rgbaMatch) {
            return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${linkOpacity / 100})`;
          }
        }
        return `rgba(255, 255, 255, ${linkOpacity / 100})`;
      })
      .backgroundColor("#000000")
      .width(window.innerWidth)
      .height(window.innerHeight)
      .showNavInfo(false)
      .onNodeDragEnd(node => {
        const n = node as Node;
        n.fx = n.x;
        n.fy = n.y;
        n.fz = n.z;
      })
      .onNodeClick((node) => {
        const distance = 150;
        const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

        graphInstance.cameraPosition(
          { 
            x: (node.x || 0) * distRatio, 
            y: (node.y || 0) * distRatio, 
            z: (node.z || 0) * distRatio 
          },
          node as { x: number, y: number, z: number },
          3000
        );
      });

    const handleResize = () => {
      graphInstance
        .width(window.innerWidth)
        .height(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    graphInstance.cameraPosition({ x: 500, y: 500, z: 800 });

    const userNode = graphData.nodes.find(node => node.type === "user");
    if (userNode) {
      graphInstance.d3Force('center', null);
      graphInstance.d3Force('charge')?.strength(-150);
      graphInstance.d3Force('link')?.distance(200);
      userNode.fx = 0;
      userNode.fy = 0;
      userNode.fz = 0;
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, profile, linkOpacity]);

  if (!entries || !profile) {
    return <Skeleton className="w-screen h-screen" />;
  }

  return (
    <Card className="relative w-screen h-screen overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <div ref={graphRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 flex gap-2">
          <Card className="p-4 bg-background/50 backdrop-blur-sm w-64">
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Opacity</label>
              <Slider
                value={[linkOpacity]}
                onValueChange={([value]) => handleOpacityChange(value)}
                max={100}
                min={0}
                step={25}
              />
              <span className="text-xs text-muted-foreground">{linkOpacity}%</span>
            </div>
          </Card>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/50 backdrop-blur-sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const getCategoryColor = (category: EntryCategory) => {
  const palettes = {
    personal: {
      primary: "#9b87f5",
      secondary: "#7E69AB",
      tertiary: "#6E59A5",
      soft: "#E5DEFF",
      link: "rgba(229, 222, 255, 0.8)"
    },
    work: {
      primary: "#60a5fa",
      secondary: "#3b82f6",
      tertiary: "#2563eb",
      soft: "#dbeafe",
      link: "rgba(219, 234, 254, 0.8)"
    },
    social: {
      primary: "#f472b6",
      secondary: "#ec4899",
      tertiary: "#db2777",
      soft: "#fce7f3",
      link: "rgba(252, 231, 243, 0.8)"
    },
    interests: {
      primary: "#4ade80",
      secondary: "#22c55e",
      tertiary: "#16a34a",
      soft: "#dcfce7",
      link: "rgba(220, 252, 231, 0.8)"
    },
    school: {
      primary: "#fb923c",
      secondary: "#f97316",
      tertiary: "#ea580c",
      soft: "#ffedd5",
      link: "rgba(255, 237, 213, 0.8)"
    }
  };
  
  return category ? palettes[category] : undefined;
};

const getNodeCategory = (nodeId: string, graphData: GraphData): EntryCategory | null => {
  const findCategory = (currentId: string, visited = new Set<string>()): EntryCategory | null => {
    if (visited.has(currentId)) return null;
    visited.add(currentId);

    const links = graphData.links.filter(link => 
      link.target === currentId || link.source === currentId
    );

    for (const link of links) {
      const connectedId = link.source === currentId ? link.target : link.source;
      const connectedNode = graphData.nodes.find(n => n.id === connectedId);
      
      if (connectedNode?.type === "category") {
        return connectedId as EntryCategory;
      }
      
      const result = findCategory(connectedId.toString(), visited);
      if (result) return result;
    }

    return null;
  };

  return findCategory(nodeId);
};
