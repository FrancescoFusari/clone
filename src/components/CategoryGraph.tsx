import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { GraphControls } from "./graph/GraphControls";
import type { Node, Link, GraphData } from "./graph/types";
import { useDebouncedCallback } from "use-debounce";

type EntryCategory = Database["public"]["Enums"]["entry_category"];
type NodeType = "category" | "subcategory" | "entry" | "tag";

interface CategoryGraphProps {
  category: EntryCategory;
}

const getCategoryColorPalette = (category: EntryCategory) => {
  const palettes = {
    personal: {
      primary: "#9b87f5",    // Primary purple
      secondary: "#7E69AB",  // Secondary purple
      tertiary: "#6E59A5",   // Tertiary purple
      soft: "#E5DEFF",       // Soft purple
      link: "rgba(229, 222, 255, 0.2)" // Purple with low opacity
    },
    work: {
      primary: "#60a5fa",    // Primary blue
      secondary: "#3b82f6",  // Secondary blue
      tertiary: "#2563eb",   // Tertiary blue
      soft: "#dbeafe",       // Soft blue
      link: "rgba(219, 234, 254, 0.2)" // Blue with low opacity
    },
    social: {
      primary: "#f472b6",    // Primary pink
      secondary: "#ec4899",  // Secondary pink
      tertiary: "#db2777",   // Tertiary pink
      soft: "#fce7f3",       // Soft pink
      link: "rgba(252, 231, 243, 0.2)" // Pink with low opacity
    },
    interests_and_hobbies: {
      primary: "#4ade80",    // Primary green
      secondary: "#22c55e",  // Secondary green
      tertiary: "#16a34a",   // Tertiary green
      soft: "#dcfce7",       // Soft green
      link: "rgba(220, 252, 231, 0.2)" // Green with low opacity
    },
    school: {
      primary: "#fb923c",    // Primary orange
      secondary: "#f97316",  // Secondary orange
      tertiary: "#ea580c",   // Tertiary orange
      soft: "#ffedd5",       // Soft orange
      link: "rgba(255, 237, 213, 0.2)" // Orange with low opacity
    }
  };
  
  return palettes[category];
};

export const CategoryGraph = ({ category }: CategoryGraphProps) => {
  const graphRef = useRef<HTMLDivElement>(null);
  const graphInstance = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [filteredTypes, setFilteredTypes] = useState<NodeType[]>(["category", "subcategory", "entry", "tag"]);
  
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

    const newGraphData: GraphData = {
      nodes: [],
      links: []
    };

    // Add category node
    newGraphData.nodes.push({
      id: category,
      name: category,
      type: "category",
      val: 180
    });

    const subcategories = new Set<string>();
    const tags = new Set<string>();

    // Process entries
    entries.forEach(entry => {
      newGraphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 20
      });

      newGraphData.links.push({
        source: category,
        target: entry.id
      });

      if (entry.subcategory) {
        subcategories.add(entry.subcategory);
        newGraphData.links.push({
          source: entry.id,
          target: entry.subcategory
        });
      }

      entry.tags?.forEach(tag => {
        tags.add(tag);
        newGraphData.links.push({
          source: entry.id,
          target: tag
        });
      });
    });

    // Add subcategory nodes
    subcategories.forEach(sub => {
      newGraphData.nodes.push({
        id: sub,
        name: sub,
        type: "subcategory",
        val: 60
      });
      newGraphData.links.push({
        source: category,
        target: sub
      });
    });

    // Add tag nodes
    tags.forEach(tag => {
      newGraphData.nodes.push({
        id: tag,
        name: tag,
        type: "tag",
        val: 5
      });
    });

    setGraphData(newGraphData);

    const colorPalette = getCategoryColorPalette(category);

    const Graph = new ForceGraph3D()(graphRef.current)
      .graphData(newGraphData)
      .nodeLabel("name")
      .nodeColor(node => {
        switch ((node as Node).type) {
          case "category":
            return colorPalette.primary;
          case "subcategory":
            return colorPalette.secondary;
          case "entry":
            return colorPalette.tertiary;
          case "tag":
            return colorPalette.soft;
          default:
            return "#F5F3F2";
        }
      })
      .nodeVal(node => (node as Node).val)
      .linkWidth(1.5)
      .linkColor(() => colorPalette.link)
      .backgroundColor("#0f1729")
      .width(graphRef.current.clientWidth)
      .height(graphRef.current.clientHeight)
      .showNavInfo(false)
      .onNodeDragEnd(node => {
        const n = node as Node;
        n.fx = n.x;
        n.fy = n.y;
        n.fz = n.z;
      });

    graphInstance.current = Graph;

    // Set camera position and center the category node
    Graph.cameraPosition({ x: 500, y: 500, z: 800 });
    const categoryNode = newGraphData.nodes.find(node => node.type === "category");
    if (categoryNode) {
      Graph.d3Force('center', null);
      Graph.d3Force('charge')?.strength(-150);
      Graph.d3Force('link')?.distance(200);
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

  const focusNode = (node: Node) => {
    const distance = 150;
    const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    graphInstance.current?.cameraPosition(
      { 
        x: (node.x || 0) * distRatio, 
        y: (node.y || 0) * distRatio, 
        z: (node.z || 0) * distRatio 
      },
      node as { x: number, y: number, z: number },
      3000
    );
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    if (!graphInstance.current) return;

    const highlightNodes = term
      ? graphData.nodes.filter(node => 
          node.name.toLowerCase().includes(term.toLowerCase()) &&
          filteredTypes.includes(node.type as NodeType)
        )
      : [];

    const highlightLinks = term
      ? graphData.links.filter(link => {
          const sourceNode = graphData.nodes.find(n => n.id === link.source);
          const targetNode = graphData.nodes.find(n => n.id === link.target);
          return sourceNode && targetNode && 
                 highlightNodes.some(n => n.id === sourceNode.id || n.id === targetNode.id);
        })
      : [];

    const colorPalette = getCategoryColorPalette(category);

    graphInstance.current
      .nodeColor(node => {
        if (!filteredTypes.includes((node as Node).type as NodeType)) {
          return 'rgba(160, 160, 160, 0.2)';
        }
        if (term && highlightNodes.some(n => n.id === (node as Node).id)) {
          return '#fff';
        }
        switch ((node as Node).type) {
          case "category":
            return colorPalette.primary;
          case "subcategory":
            return colorPalette.secondary;
          case "entry":
            return colorPalette.tertiary;
          case "tag":
            return colorPalette.soft;
          default:
            return "#F5F3F2";
        }
      })
      .linkColor(link => {
        if (term && highlightLinks.some(l => l.source === link.source && l.target === link.target)) {
          return 'rgba(255, 255, 255, 0.8)';
        }
        return colorPalette.link;
      })
      .nodeVisibility(node => filteredTypes.includes((node as Node).type as NodeType))
      .linkVisibility(link => {
        const sourceNode = graphData.nodes.find(n => n.id === link.source);
        const targetNode = graphData.nodes.find(n => n.id === link.target);
        return sourceNode && targetNode && 
               filteredTypes.includes(sourceNode.type as NodeType) &&
               filteredTypes.includes(targetNode.type as NodeType);
      });
  }, 300);

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <div className="space-y-4">
      <GraphControls
        nodes={graphData.nodes}
        onSearch={handleSearch}
        onNodeClick={focusNode}
        onFilterChange={setFilteredTypes}
      />
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
    </div>
  );
};
