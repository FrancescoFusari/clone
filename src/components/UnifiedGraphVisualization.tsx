
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2, Settings2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import type { Database } from "@/integrations/supabase/types";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type NodeType = "user" | "category" | "subcategory" | "entry" | "tag";

interface Node {
  id: string;
  name: string;
  type: NodeType;
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

interface Props {
  is3D: boolean;
  setIs3D: (value: boolean) => void;
}

export const UnifiedGraphVisualization = ({ is3D, setIs3D }: Props) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<NodeType[]>(["user", "category", "subcategory", "entry", "tag"]);
  const [visibleCategories, setVisibleCategories] = useState<EntryCategory[]>(["personal", "work", "social", "interests", "school"]);

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

    // Filter nodes based on visibility settings
    const shouldShowNode = (type: NodeType, category?: EntryCategory) => {
      if (!visibleNodeTypes.includes(type)) return false;
      if (category && !visibleCategories.includes(category)) return false;
      return true;
    };

    // Add central user node if user type is visible
    if (shouldShowNode("user")) {
      graphData.nodes.push({
        id: profile.id,
        name: profile.username || "User",
        type: "user",
        val: 300
      });
    }

    const categories = new Set<EntryCategory>();
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    entries.forEach(entry => {
      if (!shouldShowNode("entry", entry.category)) return;
      
      categories.add(entry.category);
      
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 20
      });

      const categoryColor = getCategoryColor(entry.category);
      if (categoryColor && shouldShowNode("category", entry.category)) {
        graphData.links.push({
          source: entry.category,
          target: entry.id,
          color: categoryColor.link
        });
      }

      if (entry.subcategory && shouldShowNode("subcategory", entry.category)) {
        subcategories.add(entry.subcategory);
        if (categoryColor) {
          graphData.links.push({
            source: entry.id,
            target: entry.subcategory,
            color: categoryColor.link
          });
        }
      }

      if (shouldShowNode("tag", entry.category)) {
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
      }
    });

    categories.forEach(cat => {
      if (!shouldShowNode("category", cat)) return;
      graphData.nodes.push({
        id: cat,
        name: cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "category",
        val: 100
      });
      const categoryColor = getCategoryColor(cat);
      if (categoryColor && shouldShowNode("user")) {
        graphData.links.push({
          source: profile.id,
          target: cat,
          color: categoryColor.link
        });
      }
    });

    subcategories.forEach(sub => {
      if (!shouldShowNode("subcategory")) return;
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 40
      });
    });

    tags.forEach(tag => {
      if (!shouldShowNode("tag")) return;
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 5
      });
    });

    const Graph = ForceGraph3D();
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
      .linkColor(link => (link as Link).color || "#ffffff50")
      .backgroundColor("#0f1729")
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
  }, [entries, profile, visibleNodeTypes, visibleCategories]);

  if (!entries || !profile) {
    return <Skeleton className="w-screen h-screen" />;
  }

  return (
    <Card className="relative w-screen h-screen overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <div ref={graphRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-background/50 backdrop-blur-sm"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Graph Settings</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Visible Node Types</h4>
                  <ToggleGroup 
                    type="multiple" 
                    className="flex flex-wrap justify-start gap-2"
                    value={visibleNodeTypes}
                    onValueChange={(value) => {
                      if (value.length > 0) {
                        setVisibleNodeTypes(value as NodeType[]);
                      }
                    }}
                  >
                    <ToggleGroupItem value="user" aria-label="Toggle User">
                      User
                    </ToggleGroupItem>
                    <ToggleGroupItem value="category" aria-label="Toggle Categories">
                      Categories
                    </ToggleGroupItem>
                    <ToggleGroupItem value="subcategory" aria-label="Toggle Subcategories">
                      Subcategories
                    </ToggleGroupItem>
                    <ToggleGroupItem value="entry" aria-label="Toggle Entries">
                      Entries
                    </ToggleGroupItem>
                    <ToggleGroupItem value="tag" aria-label="Toggle Tags">
                      Tags
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Visible Categories</h4>
                  <ToggleGroup 
                    type="multiple" 
                    className="flex flex-wrap justify-start gap-2"
                    value={visibleCategories}
                    onValueChange={(value) => {
                      if (value.length > 0) {
                        setVisibleCategories(value as EntryCategory[]);
                      }
                    }}
                  >
                    <ToggleGroupItem value="personal" aria-label="Toggle Personal">
                      Personal
                    </ToggleGroupItem>
                    <ToggleGroupItem value="work" aria-label="Toggle Work">
                      Work
                    </ToggleGroupItem>
                    <ToggleGroupItem value="social" aria-label="Toggle Social">
                      Social
                    </ToggleGroupItem>
                    <ToggleGroupItem value="interests" aria-label="Toggle Interests">
                      Interests
                    </ToggleGroupItem>
                    <ToggleGroupItem value="school" aria-label="Toggle School">
                      School
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
      primary: "#9b87f5",    // Primary purple
      secondary: "#7E69AB",  // Secondary purple
      tertiary: "#6E59A5",   // Tertiary purple
      soft: "#E5DEFF",       // Soft purple
      link: "rgba(229, 222, 255, 0.5)" // Purple with 0.5 opacity
    },
    work: {
      primary: "#60a5fa",    // Primary blue
      secondary: "#3b82f6",  // Secondary blue
      tertiary: "#2563eb",   // Tertiary blue
      soft: "#dbeafe",       // Soft blue
      link: "rgba(219, 234, 254, 0.5)" // Blue with 0.5 opacity
    },
    social: {
      primary: "#f472b6",    // Primary pink
      secondary: "#ec4899",  // Secondary pink
      tertiary: "#db2777",   // Tertiary pink
      soft: "#fce7f3",       // Soft pink
      link: "rgba(252, 231, 243, 0.5)" // Pink with 0.5 opacity
    },
    interests: {
      primary: "#4ade80",    // Primary green
      secondary: "#22c55e",  // Secondary green
      tertiary: "#16a34a",   // Tertiary green
      soft: "#dcfce7",       // Soft green
      link: "rgba(220, 252, 231, 0.5)" // Green with 0.5 opacity
    },
    school: {
      primary: "#fb923c",    // Primary orange
      secondary: "#f97316",  // Secondary orange
      tertiary: "#ea580c",   // Tertiary orange
      soft: "#ffedd5",       // Soft orange
      link: "rgba(255, 237, 213, 0.5)" // Orange with 0.5 opacity
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
