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
  // Add fixed position properties for TypeScript
  fx?: number;
  fy?: number;
  fz?: number;
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
  const [isInteracting, setIsInteracting] = useState(false);
  
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

    // Add subcategory nodes
    subcategories.forEach(sub => {
      graphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 10
      });
      graphData.links.push({
        source: category,
        target: sub
      });
    });

    // Add tag nodes
    tags.forEach(tag => {
      graphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 3
      });
    });

    // Initialize the 3D force graph
    const Graph = ForceGraph3D()(graphRef.current)
      .graphData(graphData)
      .nodeLabel("name")
      .nodeColor(node => {
        switch ((node as Node).type) {
          case "category":
            return "#E8E6E3"; // Lightest beige for main category
          case "subcategory":
            return "#D5CEC9"; // Medium warm gray for subcategories
          case "entry":
            return "#C2BAB5"; // Darker warm gray for entries
          case "tag":
            return "#ADA49E"; // Darkest warm gray for tags
          default:
            return "#F5F3F2"; // Fallback to very light warm gray
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(1)
      .linkColor(() => "rgba(173, 164, 158, 0.2)") // Matching the tag color with low opacity
      .backgroundColor("#0f1729")
      .width(graphRef.current.clientWidth)
      .height(graphRef.current.clientHeight)
      .showNavInfo(false)
      // Add interaction handlers
      .onNodeDrag(() => setIsInteracting(true))
      .onNodeDragEnd(() => setIsInteracting(false))
      .onEngineStop(() => setIsInteracting(false));

    // Set initial camera position further back and at an angle
    Graph.cameraPosition({ x: 300, y: 150, z: 400 });

    // Center the category node
    const categoryNode = graphData.nodes.find(node => node.type === "category");
    if (categoryNode) {
      Graph.d3Force('center', null);
      Graph.d3Force('charge')?.strength(-100);
      categoryNode.fx = 0;
      categoryNode.fy = 0;
      categoryNode.fz = 0;
    }

    // Add smooth camera orbit animation
    let angle = 0;
    const orbitRadius = 400;
    const orbitSpeed = 0.0005;
    const orbitHeight = 150;

    const animate = () => {
      if (!isInteracting) {
        angle += orbitSpeed;
        const x = orbitRadius * Math.cos(angle);
        const z = orbitRadius * Math.sin(angle);
        Graph.cameraPosition({
          x,
          y: orbitHeight,
          z,
        });
      }
      requestAnimationFrame(animate);
    };

    // Start the animation
    const animationFrame = requestAnimationFrame(animate);

    // Add mouse interaction handlers to the container
    const handleMouseDown = () => setIsInteracting(true);
    const handleMouseUp = () => setIsInteracting(false);
    const handleMouseLeave = () => setIsInteracting(false);

    graphRef.current.addEventListener('mousedown', handleMouseDown);
    graphRef.current.addEventListener('mouseup', handleMouseUp);
    graphRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrame);
      if (graphRef.current) {
        graphRef.current.innerHTML = "";
        graphRef.current.removeEventListener('mousedown', handleMouseDown);
        graphRef.current.removeEventListener('mouseup', handleMouseUp);
        graphRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [entries, category, isInteracting]);

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