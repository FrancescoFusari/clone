
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type EntryCategory = Database["public"]["Enums"]["entry_category"];

interface Node {
  id: string;
  name: string;
  type: "category" | "subcategory" | "entry" | "tag";
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
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface CategoryGraphProps {
  category: EntryCategory;
}

export const CategoryGraph = ({ category }: CategoryGraphProps) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set<string>());
  
  const { data: entries, isLoading } = useQuery({
    queryKey: ["category-entries", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("category", category);
      
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
    if (!entries || !graphRef.current) return;

    const graphData: GraphData = {
      nodes: [],
      links: []
    };

    // Add category node
    graphData.nodes.push({
      id: category,
      name: category,
      type: "category",
      val: 20
    });

    // Track unique subcategories and tags
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    // Process entries
    entries.forEach(entry => {
      graphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 5
      });

      graphData.links.push({
        source: category,
        target: entry.id
      });

      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
        const subcategoryNode = {
          id: entry.subcategory,
          name: entry.subcategory,
          type: "subcategory" as const,
          val: 10
        };
        if (!graphData.nodes.find(n => n.id === subcategoryNode.id)) {
          graphData.nodes.push(subcategoryNode);
        }
        graphData.links.push({
          source: entry.id,
          target: entry.subcategory
        });
      }

      if (expandedNodes.has(entry.id)) {
        entry.tags?.forEach(tag => {
          tags.add(tag);
          const tagNode = {
            id: tag,
            name: tag,
            type: "tag" as const,
            val: 3
          };
          if (!graphData.nodes.find(n => n.id === tagNode.id)) {
            graphData.nodes.push(tagNode);
          }
          graphData.links.push({
            source: entry.id,
            target: tag
          });
        });
      }
    });

    const Graph = ForceGraph3D()(graphRef.current)
      .graphData(graphData)
      .nodeLabel(node => {
        const n = node as Node;
        let details = `${n.name}\nType: ${n.type}`;
        if (n.type === "entry") {
          details += "\nDouble-click to show/hide tags";
        }
        if (!n.fx) {
          details += "\nRight-click to pin/unpin";
        }
        return details;
      })
      .nodeColor(node => {
        switch ((node as Node).type) {
          case "category":
            return "#E8E6E3";
          case "subcategory":
            return "#D5CEC9";
          case "entry":
            return "#C2BAB5";
          case "tag":
            return "#ADA49E";
          default:
            return "#F5F3F2";
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(1)
      .linkColor(() => "rgba(173, 164, 158, 0.2)")
      .backgroundColor("#0f1729")
      .width(graphRef.current.clientWidth)
      .height(graphRef.current.clientHeight)
      .showNavInfo(false)
      .onNodeDblClick((node) => {
        const n = node as Node;
        if (n.type === "entry") {
          setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(n.id)) {
              next.delete(n.id);
              toast.info("Collapsed tags");
            } else {
              next.add(n.id);
              toast.info("Expanded tags");
            }
            return next;
          });
        }
      })
      .onNodeRightClick((node) => {
        const n = node as Node;
        if (n.fx === null) {
          // Pin the node
          n.fx = n.x;
          n.fy = n.y;
          n.fz = n.z;
          toast.info("Node pinned");
        } else {
          // Unpin the node
          n.fx = null;
          n.fy = null;
          n.fz = null;
          toast.info("Node unpinned");
        }
      })
      .enableNodeDrag(true)
      .enableNavigationControls(true)
      .showNavInfo(true);

    // Add mini-map
    const miniMap = document.createElement('div');
    miniMap.style.position = 'absolute';
    miniMap.style.bottom = '10px';
    miniMap.style.right = '10px';
    miniMap.style.width = '200px';
    miniMap.style.height = '200px';
    miniMap.style.background = 'rgba(0,0,0,0.3)';
    miniMap.style.borderRadius = '4px';
    graphRef.current.appendChild(miniMap);

    const miniGraph = ForceGraph3D()(miniMap)
      .graphData(graphData)
      .width(200)
      .height(200)
      .backgroundColor("rgba(0,0,0,0)")
      .showNavInfo(false)
      .enableNavigationControls(false)
      .enableNodeDrag(false);

    // Sync camera position between main graph and mini-map
    Graph.onEngineStop(() => {
      const pos = Graph.cameraPosition();
      miniGraph.cameraPosition(
        { x: pos.x * 2, y: pos.y * 2, z: pos.z * 2 },
        { x: 0, y: 0, z: 0 },
        100
      );
    });

    // Set initial camera position
    Graph.cameraPosition({ x: 400, y: 400, z: 600 });

    // Center the category node
    const categoryNode = graphData.nodes.find(node => node.type === "category");
    if (categoryNode) {
      Graph.d3Force('center', null);
      Graph.d3Force('charge')?.strength(-100);
      categoryNode.fx = 0;
      categoryNode.fy = 0;
      categoryNode.fz = 0;
    }

    return () => {
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, category, expandedNodes]);

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        <div ref={graphRef} className="w-full h-[600px]" />
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </CardContent>
    </Card>
  );
};
