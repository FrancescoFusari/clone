
import { useEffect, useRef, useState } from "react";
import ForceGraph3D from "3d-force-graph";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Maximize2, Minimize2, Search } from "lucide-react";
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
  highlighted?: boolean;
}

interface Link {
  source: string;
  target: string;
  highlighted?: boolean;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  
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

  // Search and highlight functionality
  useEffect(() => {
    if (!searchTerm) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      return;
    }

    const searchRegex = new RegExp(searchTerm, 'i');
    const matchedNodes = new Set<string>();
    const matchedLinks = new Set<string>();

    graphData.nodes.forEach(node => {
      if (searchRegex.test(node.name)) {
        matchedNodes.add(node.id);
        // Find connected nodes and links
        graphData.links.forEach(link => {
          if (link.source === node.id || link.target === node.id) {
            matchedNodes.add(typeof link.source === 'string' ? link.source : link.source.id);
            matchedNodes.add(typeof link.target === 'string' ? link.target : link.target.id);
            matchedLinks.add(`${link.source}-${link.target}`);
          }
        });
      }
    });

    setHighlightNodes(matchedNodes);
    setHighlightLinks(matchedLinks);
  }, [searchTerm, graphData]);

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
      val: 20
    });

    // Track unique subcategories and tags
    const subcategories = new Set<string>();
    const tags = new Set<string>();

    // Process entries
    entries.forEach(entry => {
      newGraphData.nodes.push({
        id: entry.id,
        name: entry.title,
        type: "entry",
        val: 5
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
        val: 10
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
        val: 3
      });
    });

    setGraphData(newGraphData);

    // Initialize ForceGraph
    const Graph = ForceGraph3D()(graphRef.current)
      .graphData(newGraphData)
      .nodeLabel("name")
      .nodeColor(node => {
        const n = node as Node;
        if (highlightNodes.size && !highlightNodes.has(n.id)) {
          return "#2A2A2A";
        }
        switch (n.type) {
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
      .linkWidth(link => highlightLinks.has(`${link.source}-${link.target}`) ? 2 : 1)
      .linkColor(link => 
        highlightLinks.has(`${link.source}-${link.target}`) 
          ? "rgba(255, 255, 255, 0.5)" 
          : "rgba(173, 164, 158, 0.2)"
      )
      .backgroundColor("#0f1729")
      .width(graphRef.current.clientWidth)
      .height(graphRef.current.clientHeight)
      .showNavInfo(false)
      .onNodeClick((node) => {
        const n = node as Node;
        if (n.type === "entry") {
          // Navigate to entry details
          window.location.href = `/entries/${n.id}`;
        } else if (n.type === "tag") {
          toast.info(`Showing entries tagged with "${n.name}"`);
          // Highlight connected nodes
          const connectedNodes = new Set<string>();
          const connectedLinks = new Set<string>();
          graphData.links.forEach(link => {
            if (link.source === n.id || link.target === n.id) {
              connectedNodes.add(typeof link.source === 'string' ? link.source : link.source.id);
              connectedNodes.add(typeof link.target === 'string' ? link.target : link.target.id);
              connectedLinks.add(`${link.source}-${link.target}`);
            }
          });
          setHighlightNodes(connectedNodes);
          setHighlightLinks(connectedLinks);
        }

        // Camera animation
        const distance = 120;
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

    // Set initial camera position
    Graph.cameraPosition({ x: 400, y: 400, z: 600 });

    // Center the category node
    const categoryNode = newGraphData.nodes.find(node => node.type === "category");
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
  }, [entries, category, highlightNodes, highlightLinks]);

  if (isLoading) {
    return <Skeleton className="w-full h-[600px]" />;
  }

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-0">
        <div className="absolute top-4 left-4 right-16 z-10 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-background/50 backdrop-blur-sm"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/50 backdrop-blur-sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
        <div ref={graphRef} className="w-full h-[600px]" />
      </CardContent>
    </Card>
  );
};
