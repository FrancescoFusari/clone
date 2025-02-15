import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
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
  const [nodeSize, setNodeSize] = useState(100);
  const [linkWidth, setLinkWidth] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [showArrows, setShowArrows] = useState(false);
  const [gravity, setGravity] = useState(-250);
  const [linkStrength, setLinkStrength] = useState(1);
  const [friction, setFriction] = useState(0.8);

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
    if (profile?.graph_settings) {
      const settings = profile.graph_settings;
      setLinkOpacity(settings.linkOpacity ?? 80);
      setNodeSize(settings.nodeSize ?? 100);
      setLinkWidth(settings.linkWidth ?? 1);
      setShowLabels(settings.showLabels ?? true);
      setShowArrows(settings.showArrows ?? false);
      setGravity(settings.graphPhysics?.gravity ?? -250);
      setLinkStrength(settings.graphPhysics?.linkStrength ?? 1);
      setFriction(settings.graphPhysics?.friction ?? 0.8);
    }
  }, [profile]);

  const handleSettingChange = async (
    setting: string,
    value: number | boolean,
    category?: string
  ) => {
    if (!profile?.id) return;

    const newSettings = { ...profile.graph_settings };
    
    if (category) {
      newSettings[category] = {
        ...newSettings[category],
        [setting]: value
      };
    } else {
      newSettings[setting] = value;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ graph_settings: newSettings })
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
      .nodeVal(node => ((node as Node).val * nodeSize) / 100)
      .linkWidth(linkWidth)
      .showNavInfo(false)
      .linkDirectionalArrowLength(showArrows ? 3.5 : 0)
      .linkDirectionalArrowRelPos(1)
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
      .linkColor(link => {
        const l = link as Link;
        if (l.color) {
          const rgbaMatch = l.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
          if (rgbaMatch) {
            return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${linkOpacity / 100})`;
          }
        }
        return `rgba(255, 255, 255, ${linkOpacity / 100})`;
      })
      .nodeThreeObject(showLabels ? undefined : () => {})
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

    // Update physics settings separately
    const chargeForce = graphInstance.d3Force('charge');
    if (chargeForce) {
      chargeForce.strength(gravity);
    }

    const linkForce = graphInstance.d3Force('link');
    if (linkForce) {
      linkForce.strength(linkStrength);
    }

    // Update global simulation parameters
    const simulation = graphInstance.d3Force('simulation');
    if (simulation) {
      simulation.velocityDecay(friction);
    }

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
  }, [entries, profile, linkOpacity, nodeSize, linkWidth, showLabels, showArrows, gravity, linkStrength, friction]);

  if (!entries || !profile) {
    return <Skeleton className="w-screen h-screen" />;
  }

  return (
    <Card className="relative w-screen h-screen overflow-hidden">
      <CardContent className="p-0 w-full h-full">
        <div ref={graphRef} className="w-full h-full" />
        <div className="absolute top-4 right-4 flex gap-2">
          <Card className="p-4 bg-background/50 backdrop-blur-sm w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Node Size</label>
                <Slider
                  value={[nodeSize]}
                  onValueChange={([value]) => {
                    setNodeSize(value);
                    handleSettingChange('nodeSize', value);
                  }}
                  max={200}
                  min={50}
                  step={10}
                />
                <span className="text-xs text-muted-foreground">{nodeSize}%</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link Opacity</label>
                <Slider
                  value={[linkOpacity]}
                  onValueChange={([value]) => {
                    setLinkOpacity(value);
                    handleSettingChange('linkOpacity', value);
                  }}
                  max={100}
                  min={0}
                  step={10}
                />
                <span className="text-xs text-muted-foreground">{linkOpacity}%</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link Width</label>
                <Slider
                  value={[linkWidth]}
                  onValueChange={([value]) => {
                    setLinkWidth(value);
                    handleSettingChange('linkWidth', value);
                  }}
                  max={3}
                  min={0.5}
                  step={0.5}
                />
                <span className="text-xs text-muted-foreground">{linkWidth}</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Labels</label>
                <Switch
                  checked={showLabels}
                  onCheckedChange={(checked) => {
                    setShowLabels(checked);
                    handleSettingChange('showLabels', checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Show Arrows</label>
                <Switch
                  checked={showArrows}
                  onCheckedChange={(checked) => {
                    setShowArrows(checked);
                    handleSettingChange('showArrows', checked);
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gravity</label>
                <Slider
                  value={[Math.abs(gravity)]}
                  onValueChange={([value]) => {
                    setGravity(-value);
                    handleSettingChange('gravity', -value, 'graphPhysics');
                  }}
                  max={500}
                  min={100}
                  step={50}
                />
                <span className="text-xs text-muted-foreground">{Math.abs(gravity)}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link Strength</label>
                <Slider
                  value={[linkStrength]}
                  onValueChange={([value]) => {
                    setLinkStrength(value);
                    handleSettingChange('linkStrength', value, 'graphPhysics');
                  }}
                  max={2}
                  min={0.1}
                  step={0.1}
                />
                <span className="text-xs text-muted-foreground">{linkStrength}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Friction</label>
                <Slider
                  value={[friction]}
                  onValueChange={([value]) => {
                    setFriction(value);
                    handleSettingChange('friction', value, 'graphPhysics');
                  }}
                  max={0.9}
                  min={0.1}
                  step={0.1}
                />
                <span className="text-xs text-muted-foreground">{friction}</span>
              </div>
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
