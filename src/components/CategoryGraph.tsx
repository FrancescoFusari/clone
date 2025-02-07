
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

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

    // Add category node with increased size
    graphData.nodes.push({
      id: category,
      name: category,
      type: "category",
      val: 35 // Increased from 20
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
        val: 15 // Increased from 5
      });

      graphData.links.push({
        source: category,
        target: entry.id
      });

      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
        graphData.links.push({
          source: entry.id,
          target: entry.subcategory
        });
      }

      entry.tags?.forEach(tag => {
        tags.add(tag);
        graphData.links.push({
          source: entry.id,
          target: tag
        });
      });
    });

    // Add subcategory nodes with increased size
    subcategories.forEach(sub => {
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 25 // Increased from 10
      });
      graphData.links.push({
        source: category,
        target: sub
      });
    });

    // Add tag nodes with increased size
    tags.forEach(tag => {
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 8 // Increased from 3
      });
    });

    const Graph = ForceGraph3D()(graphRef.current)
      .graphData(graphData)
      .nodeLabel("name")
      .nodeColor(node => {
        switch ((node as Node).type) {
          case "category":
            return "#9b87f5"; // Primary purple from our palette
          case "subcategory":
            return "#7E69AB"; // Secondary purple
          case "entry":
            return "#6E59A5"; // Tertiary purple
          case "tag":
            return "#E5DEFF"; // Soft purple for contrast
          default:
            return "#F5F3F2";
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(1.5) // Slightly thicker links
      .linkLength(200) // Increased from default
      .linkColor(() => "rgba(229, 222, 255, 0.2)") // Matching our soft purple with low opacity
      .backgroundColor("#0f1729")
      .width(graphRef.current.clientWidth)
      .height(graphRef.current.clientHeight)
      .showNavInfo(false)
      .onNodeDragEnd(node => {
        const n = node as Node;
        n.fx = n.x;
        n.fy = n.y;
        n.fz = n.z;
      })
      .onNodeClick((node) => {
        const distance = 150; // Increased zoom distance
        const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

        Graph.cameraPosition(
          { 
            x: (node.x || 0) * distRatio, 
            y: (node.y || 0) * distRatio, 
            z: (node.z || 0) * distRatio 
          },
          node as { x: number, y: number, z: number },
          3000
        );
      });

    // Set camera position further back
    Graph.cameraPosition({ x: 500, y: 500, z: 800 });

    // Center the category node
    const categoryNode = graphData.nodes.find(node => node.type === "category");
    if (categoryNode) {
      Graph.d3Force('center', null);
      Graph.d3Force('charge')?.strength(-150); // Increased repulsion force
      categoryNode.fx = 0;
      categoryNode.fy = 0;
      categoryNode.fz = 0;
    }

    return () => {
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
      }
    };
  }, [entries, category]);

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
